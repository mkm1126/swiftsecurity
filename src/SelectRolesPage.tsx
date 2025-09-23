// src/SelectRolesPage.tsx
// Complete version with all role selection tables and copy user functionality

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Calculator, Copy } from 'lucide-react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { toast } from 'sonner';
import { SecurityRoleSelection } from './types';
import Header from './components/Header';
import MultiSelect from './components/MultiSelect';
import UserSelect from './components/UserSelect';
import { businessUnits } from './lib/businessUnitData';

interface User {
  employee_name: string;
  employee_id: string;
  email: string;
  request_id?: string;
}

type CopyFlowForm = {
  startDate: string;
  employeeName: string;
  employeeId?: string;
  isNonEmployee?: boolean;
  workLocation?: string;
  workPhone?: string;
  email: string;
  agencyName: string;
  agencyCode: string;
  justification?: string;
  submitterName: string;
  submitterEmail: string;
  supervisorName: string;
  supervisorUsername: string;
  securityAdminName: string;
  securityAdminUsername: string;
  accountingDirector?: string;
  accountingDirectorUsername?: string;
};

function SelectRolesPage() {
  // --- config ---------------------------------------------------------------
  // Flip to true because you migrated `home_business_unit` to TEXT[]
  const HOME_BU_IS_ARRAY = true;

  // --- helpers --------------------------------------------------------------

  // Gate autosave until all hydration layers (stable local, DB, id-scoped local) finish
  const isHydratingRef = useRef(true);

  // Helper: snake_case <-> camelCase (hoisted function declarations for safe use anywhere)
  function snakeToCamel(s: string) {
    return s.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase());
  }
  function camelToSnake(s: string) {
    return s.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
  }

  // Draft storage key (stable per request)
  const draftKey = (id: string) => `selectRoles_draft_${id}`;
  
  // Stable localStorage key based on person + agency (so drafts survive new request IDs)
  const stableStorageKey = (
    details?: { employee_name?: string; agency_name?: string } | null
  ) => {
    const d = details ?? requestDetails;
    if (!d?.employee_name || !d?.agency_name) return null;
    return `selectRoles_${d.employee_name}_${d.agency_name}`.replace(/[^a-zA-Z0-9]/g, '_');
  };

  // Try to restore from the stable local draft (returns true if applied)
  const restoreFromStableDraft = (): boolean => {
    const sk = stableStorageKey();
    if (!sk) return false;
    const localJson = localStorage.getItem(sk);
    console.log('🔍 Checking for saved Select Roles form data:', { storageKey: sk, hasSavedData: !!localJson });
    if (!localJson) return false;
    try {
      const data = JSON.parse(localJson);
      for (const [k, v] of Object.entries(data)) {
        const isText = /Justification$/.test(k);
        const typed: any = isText ? String((v as any) ?? '') : v;
        // RHF will store unregistered field values until the input registers
        setValue(k as any, typed as any, { shouldDirty: false });
      }

      console.log('📥 Restored Select Roles from saved data (stable key).');
      toast.success('Previous selections restored');
      return true;
    } catch (e) {
      console.error('Error parsing saved Select Roles data (stable key):', e);
      localStorage.removeItem(sk);
      return false;
    }
  };

  // Try to restore from the stable local draft using explicit details (avoids waiting for React state)
  const restoreFromStableDraftFor = (
    details: { employee_name?: string; agency_name?: string } | null
  ): boolean => {
    const sk = stableStorageKey(details);
    if (!sk) return false;
    const localJson = localStorage.getItem(sk);
    console.log('🔍 Checking for saved Select Roles form data (explicit):', { storageKey: sk, hasSavedData: !!localJson });
    if (!localJson) return false;
    try {
      const data = JSON.parse(localJson);
      for (const [k, v] of Object.entries(data)) {
        const isText = /Justification$/.test(k);
        const typed: any = isText ? String((v as any) ?? '') : v;
        setValue(k as any, typed as any, { shouldDirty: false });
      }
      console.log('📥 Restored Select Roles from saved data (stable key, explicit details).');
      toast.success('Previous selections restored');
      return true;
    } catch (e) {
      console.error('Error parsing saved Select Roles data (stable key explicit):', e);
      localStorage.removeItem(sk);
      return false;
    }
  };

  // Apply a local draft (if present) on top of whatever we already loaded
  const restoreFromLocalDraft = (id: string) => {
    try {
      const raw = localStorage.getItem(draftKey(id));
      if (!raw) return;

      const parsed = JSON.parse(raw) as { ts: number; data: Record<string, any> };
      if (!parsed || !parsed.data) return;

      const entries = Object.entries(parsed.data);
      
      entries.forEach(([k, v]) => {
        if (k === 'homeBusinessUnit') {
          const asArray = Array.isArray(v) ? v : v ? [v] : [];
          setValue('homeBusinessUnit' as any, asArray as any, { shouldDirty: true });
        } else {
          setValue(k as any, v as any, { shouldDirty: true });
        }
      });
      
      // 👇 Ensure UI mirrors id-scoped draft values
      setTimeout(() => {
        const snap = getValues();
        reset(snap);
        console.log('🔁 Synced (id-scoped draft) values to UI with reset():', snap);
      }, 0);
      
      console.log('🧩 Restored local draft for', id, parsed);
      toast.message('Restored unsaved role selections from this device.');

    } catch (e) {
      console.warn('Could not restore local draft:', e);
    }
  };

  // Deep-coerce "on"/"off" and arrays like ["on","on"] to booleans.
  // If an array maps entirely to booleans, collapse to a single boolean (any true).
  const coerceBooleansDeep = (value: any): any => {
    if (value === 'on') return true;
    if (value === 'off') return false;

    if (Array.isArray(value)) {
      const mapped = value.map(coerceBooleansDeep);
      if (mapped.length > 0 && mapped.every((v) => typeof v === 'boolean')) {
        return mapped.some(Boolean);
      }
      return mapped;
    }

    if (value && typeof value === 'object') {
      const out: any = {};
      for (const [k, v] of Object.entries(value)) out[k] = coerceBooleansDeep(v);
      return out;
    }

    return value;
  };

  // Strip leading two-letter prefixes (e.g., "ss_", "sc_") — used only for legacy fallback mapping
  const strip2 = (k: string) => k.replace(/^[a-z]{2}_/, '');

  // ✅ Normalize for DB write:
  // - Keep original snake_case keys (including 2-letter prefixes) for boolean flags
  // - Only persist TRUE flags; drop false/unknown
  // - Preserve non-boolean fields as-is
  function normalizeRoleFlagsTrueOnly<T extends Record<string, any>>(flags: T) {
    const out: Record<string, any> = {};
    for (const [key, val] of Object.entries(flags)) {
      if (typeof val === 'boolean') {
        if (val === true) out[key] = true; // keep exact key name (prefix preserved)
      } else {
        out[key] = val; // keep non-boolean fields (strings/arrays/nulls)
      }
    }
    return out as T;
  }

  // Parse multi-entry text -> array of fixed-length codes (uppercased, A-Z0-9)
  const splitCodes = (val: string | null | undefined, codeLen: number) => {
    if (!val) return [] as string[];
    return String(val)
      .split(/[\s,;\n\r]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.toUpperCase())
      .map((s) => s.replace(/[^A-Z0-9]/g, ''))
      .filter((s) => s.length === codeLen);
  };

  // Build a single payload that matches your updated schema (TEXT[] where applicable)
  const buildRoleSelectionData = (
    request_id: string,
    data: SecurityRoleSelection,
    options?: { homeBusinessUnitIsArray?: boolean }
  ) => {
    // Other BUs (5-char codes) now TEXT[]
    const otherBUs = splitCodes((data as any).otherBusinessUnits, 5);

    // AP workflow (8-char Financial Dept IDs)
    const ap1Depts = splitCodes((data as any).apVoucherApprover1RouteControls, 8);
    const ap2Depts = splitCodes((data as any).apVoucherApprover2RouteControls, 8);
    const ap3Depts = splitCodes((data as any).apVoucherApprover3RouteControls, 8);

    // AR supervisors (5-char BUs)
    const arCreditBUs = splitCodes((data as any).creditInvoiceApprovalBusinessUnits, 5);
    const arWriteoffBUs = splitCodes((data as any).writeoffApprovalBusinessUnits, 5);

    // KK approver workflow (5-char BUs)
    const kkAppropriation = splitCodes((data as any).journalApprovalA, 5);
    const kkTransfer = splitCodes((data as any).transferApproval, 5);
    const kkExpense = splitCodes((data as any).journalApprovalExpense, 5);
    const kkRevenue = splitCodes((data as any).journalApprovalRevenue, 5);

    // AM workflow
    const amBUs = splitCodes((data as any).physicalInventoryBusinessUnits, 5);
    const amDept = splitCodes((data as any).physicalInventoryDepartmentIds, 8);

    // GL workflow (3-char agency codes)
    const glSources = splitCodes((data as any).glAgencyApproverSources, 3);

    // PO Approver (8-char Financial Dept IDs)
    const poApproverRoute = splitCodes((data as any).poApproverRouteControls, 8);

    // GL Daily Receipts derived boolean (Yes/No checkboxes)
    const needsDailyReceiptsReport =
      (data as any).needsDailyReceiptsYes ? true : (data as any).needsDailyReceiptsNo ? false : false;

    // If you migrated home_business_unit to TEXT[], send an array; else keep comma string
    const isArray = !!options?.homeBusinessUnitIsArray;
    const homeBUInput: any = (data as any).homeBusinessUnit;
    const homeBUValue = Array.isArray(homeBUInput)
      ? isArray
        ? homeBUInput
        : homeBUInput.join(',')
      : isArray
      ? homeBUInput
        ? [homeBUInput]
        : []
      : homeBUInput || '';

    const toOrNull = (arr: string[]) => (arr.length ? arr : null);

    // Auto-generated: persist additional Accounting/Procurement checkbox flags
    const EXTRA_ACCOUNTING_PROCUREMENT_FLAGS = {
      needs_daily_receipts_yes: (data as any).needsDailyReceiptsYes || false,
      needs_daily_receipts_no: (data as any).needsDailyReceiptsNo || false,

      physical_inventory_approval_1: (data as any).physicalInventoryApproval1 || false,
      physical_inventory_approval_2: (data as any).physicalInventoryApproval2 || false,

      vendor_request_add_update: (data as any).vendorRequestAddUpdate || false,
      vendor_inquiry_only: (data as any).vendorInquiryOnly || false,

      po_epro_buyer: (data as any).poEproBuyer || false,
      contract_encumbrance: (data as any).contractEncumbrance || false,
      purchase_order_data_entry: (data as any).purchaseOrderDataEntry || false,
      epro_requisition_requester: (data as any).eproRequisitionRequester || false,
      po_accounting_coordinator: (data as any).poAccountingCoordinator || false,
      core_order_receiver: (data as any).coreOrderReceiver || false,
      po_inquiry_only: (data as any).poInquiryOnly || false,
      epro_requisition_inquiry_only: (data as any).eproRequisitionInquiryOnly || false,
      po_approver: (data as any).poApprover || false,

      ss_event_creator_buyer: (data as any).ssEventCreatorBuyer || false,
      ss_create_vendor_response: (data as any).ssCreateVendorResponse || false,
      ss_event_approver: (data as any).ssEventApprover || false,
      ss_event_collaborator: (data as any).ssEventCollaborator || false,
      ss_event_inquiry_only: (data as any).ssEventInquiryOnly || false,
      ss_all_origins: (data as any).ssAllOrigins || false,
      ss_tech_coord_approver: (data as any).ssTechCoordApprover || false,
      ss_tech_state_approver: (data as any).ssTechStateApprover || false,
      ss_grant_coord_approver: (data as any).ssGrantCoordApprover || false,

      cg_catalog_owner: (data as any).cgCatalogOwner || false,
      cg_inquiry_only: (data as any).cgInquiryOnly || false,

      sc_contract_administrator: (data as any).scContractAdministrator || false,
      sc_document_administrator: (data as any).scDocumentAdministrator || false,
      sc_document_collaborator: (data as any).scDocumentCollaborator || false,
      sc_agreement_manager: (data as any).scAgreementManager || false,
      sc_agency_library_manager: (data as any).scAgencyLibraryManager || false,
      sc_contract_inquiry_only: (data as any).scContractInquiryOnly || false,
      sc_contractual_approver: (data as any).scContractualApprover || false,
      sc_electronic_docs_yes: (data as any).scElectronicDocsYes || false,
      sc_electronic_docs_no: (data as any).scElectronicDocsNo || false,
      sc_doc_contract_coordinator: (data as any).scDocContractCoordinator || false,

      inventory_express_issue: (data as any).inventoryExpressIssue || false,
      inventory_adjustment_approver: (data as any).inventoryAdjustmentApprover || false,
      inventory_replenishment_buyer: (data as any).inventoryReplenishmentBuyer || false,
      inventory_control_worker: (data as any).inventoryControlWorker || false,
      inventory_express_putaway: (data as any).inventoryExpressPutaway || false,
      inventory_fulfillment_specialist: (data as any).inventoryFulfillmentSpecialist || false,
      inventory_po_receiver: (data as any).inventoryPoReceiver || false,
      inventory_returns_receiver: (data as any).inventoryReturnsReceiver || false,
      inventory_cost_adjustment: (data as any).inventoryCostAdjustment || false,
      inventory_materials_manager: (data as any).inventoryMaterialsManager || false,
      inventory_delivery: (data as any).inventoryDelivery || false,
      inventory_inquiry_only: (data as any).inventoryInquiryOnly || false,
      inventory_configuration_agency: (data as any).inventoryConfigurationAgency || false,
      inventory_pick_plan_distribution_release: (data as any).inventoryPickPlanDistributionRelease || false,
    } as const;

    return {
      request_id,

      // If TEXT[] now, this should be an array; otherwise a comma string
      home_business_unit: homeBUValue,

      // If you migrated this to TEXT[] too, store as array; otherwise change to join(',')
      other_business_units: toOrNull(otherBUs),

      ...EXTRA_ACCOUNTING_PROCUREMENT_FLAGS,

      // ===== Plain booleans/text (unchanged types) =====
      voucher_entry: (data as any).voucherEntry || false,
      maintenance_voucher_build_errors: (data as any).maintenanceVoucherBuildErrors || false,
      match_override: (data as any).matchOverride || false,
      ap_inquiry_only: (data as any).apInquiryOnly || false,

      cash_maintenance: (data as any).cashMaintenance || false,
      receivable_specialist: (data as any).receivableSpecialist || false,
      receivable_supervisor: (data as any).receivableSupervisor || false,
      billing_create: (data as any).billingCreate || false,
      billing_specialist: (data as any).billingSpecialist || false,
      billing_supervisor: (data as any).billingSupervisor || false,
      customer_maintenance_specialist: (data as any).customerMaintenanceSpecialist || false,
      ar_billing_setup: (data as any).arBillingSetup || false,
      ar_billing_inquiry_only: (data as any).arBillingInquiryOnly || false,
      cash_management_inquiry_only: (data as any).cashManagementInquiryOnly || false,

      budget_journal_entry_online: (data as any).budgetJournalEntryOnline || false,
      budget_journal_load: (data as any).budgetJournalLoad || false,

      // ✅ three distinct journal approver booleans
      journal_approver_appr: (data as any).journalApproverAppr || false,
      journal_approver_exp: (data as any).journalApproverExp || false,
      journal_approver_rev: (data as any).journalApproverRev || false,

      budget_transfer_entry_online: (data as any).budgetTransferEntryOnline || false,
      transfer_approver: (data as any).transferApprover || false,
      budget_inquiry_only: (data as any).budgetInquiryOnly || false,

      journal_entry_online: (data as any).journalEntryOnline || false,
      journal_load: (data as any).journalLoad || false,
      agency_chartfield_maintenance: (data as any).agencyChartfieldMaintenance || false,
      gl_agency_approver: (data as any).glAgencyApprover || false,
      general_ledger_inquiry_only: (data as any).generalLedgerInquiryOnly || false,
      nvision_reporting_agency_user: (data as any).nvisionReportingAgencyUser || false,

      // ✅ derived from Yes/No UI
      needs_daily_receipts_report: needsDailyReceiptsReport,

      award_data_entry: (data as any).awardDataEntry || false,
      grant_fiscal_manager: (data as any).grantFiscalManager || false,
      program_manager: (data as any).programManager || false,
      gm_agency_setup: (data as any).gmAgencySetup || false,
      grants_inquiry_only: (data as any).grantsInquiryOnly || false,

      federal_project_initiator: (data as any).federalProjectInitiator || false,
      oim_initiator: (data as any).oimInitiator || false,
      project_initiator: (data as any).projectInitiator || false,
      project_manager: (data as any).projectManager || false,
      capital_programs_office: (data as any).capitalProgramsOffice || false,
      project_cost_accountant: (data as any).projectCostAccountant || false,
      project_fixed_asset: (data as any).projectFixedAsset || false,
      category_subcategory_manager: (data as any).categorySubcategoryManager || false,
      project_control_dates: (data as any).projectControlDates || false,
      project_accounting_systems: (data as any).projectAccountingSystems || false,
      mndot_projects_inquiry: (data as any).mndotProjectsInquiry || false,
      projects_inquiry_only: (data as any).projectsInquiryOnly || false,
      mndot_project_approver: (data as any).mndotProjectApprover || false,
      route_control: (data as any).routeControl || null,

      cost_allocation_inquiry_only: (data as any).costAllocationInquiryOnly || false,

      financial_accountant_assets: (data as any).financialAccountantAssets || false,
      asset_management_inquiry_only: (data as any).assetManagementInquiryOnly || false,

      role_justification: (data as any).roleJustification || null,

      // ===== ARRAY columns (TEXT[]) =====
      // AP route controls
      ap_voucher_approver_1: (data as any).apVoucherApprover1 || false,
      ap_voucher_approver_2: (data as any).apVoucherApprover2 || false,
      ap_voucher_approver_3: (data as any).apVoucherApprover3 || false,
      ap_voucher_approver_1_route_controls: toOrNull(ap1Depts),
      ap_voucher_approver_2_route_controls: toOrNull(ap2Depts),
      ap_voucher_approver_3_route_controls: toOrNull(ap3Depts),

      // AR/CM supervisors route controls
      credit_invoice_approval_business_units: toOrNull(arCreditBUs),
      writeoff_approval_business_units: toOrNull(arWriteoffBUs),

      // KK workflow route controls
      appropriation_sources: toOrNull(kkAppropriation),
      transfer_appropriation_sources: toOrNull(kkTransfer),
      expense_budget_source: toOrNull(kkExpense),
      revenue_budget_source: toOrNull(kkRevenue),

      // AM workflow
      physical_inventory_business_units: toOrNull(amBUs),
      physical_inventory_department_ids: toOrNull(amDept),

      // GL workflow
      gl_agency_approver_sources: toOrNull(glSources),

      // PO Approver route controls (TEXT[])
      po_appro
    }
  }
}