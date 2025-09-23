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
      po_approver_route_controls: toOrNull(poApproverRoute),
    };
  };

  // --- state ----------------------------------------------------------------

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [requestDetails, setRequestDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [pocUser, setPocUser] = useState<string | null>(null);

  // Copy flow state
  const [showCopyFlow, setShowCopyFlow] = useState(false);
  const [copyUsers, setCopyUsers] = useState<User[]>([]);
  const [selectedCopyUser, setSelectedCopyUser] = useState<User | null>(null);
  const [pendingFormData, setPendingFormData] = useState<CopyFlowForm | null>(null);

  // React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors, isDirty },
  } = useForm<SecurityRoleSelection>({
    defaultValues: {
      homeBusinessUnit: [],
    },
  });

  // Watch all form values for autosave
  const watchedValues = watch();

  // --- effects --------------------------------------------------------------

  // Fetch request details and role data
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch request details
        const { data: request, error: requestError } = await supabase
          .from('security_role_requests')
          .select('*')
          .eq('id', id)
          .single();

        if (requestError) throw requestError;

        setRequestDetails(request);
        setPocUser(request.poc_user);

        // Try to restore from stable draft first (before DB data)
        const restoredFromStable = restoreFromStableDraftFor({
          employee_name: request.employee_name,
          agency_name: request.agency_name,
        });

        // Fetch existing role selections
        const { data: roleData, error: roleError } = await supabase
          .from('security_role_selections')
          .select('*')
          .eq('request_id', id)
          .maybeSingle();

        if (roleError && roleError.code !== 'PGRST116') {
          throw roleError;
        }

        // If we didn't restore from stable draft, apply DB data
        if (!restoredFromStable && roleData) {
          console.log('📊 Applying DB role data:', roleData);

          // Convert snake_case DB fields to camelCase form fields
          const formData: any = {};

          // Handle home_business_unit (could be TEXT[] or comma string)
          if (roleData.home_business_unit) {
            const hbu = roleData.home_business_unit;
            formData.homeBusinessUnit = Array.isArray(hbu) ? hbu : hbu.split(',').filter(Boolean);
          }

          // Handle other_business_units (TEXT[])
          if (roleData.other_business_units) {
            formData.otherBusinessUnits = Array.isArray(roleData.other_business_units)
              ? roleData.other_business_units.join('\n')
              : roleData.other_business_units;
          }

          // Convert all other snake_case fields to camelCase
          for (const [dbKey, value] of Object.entries(roleData)) {
            if (dbKey === 'id' || dbKey === 'request_id' || dbKey === 'created_at' || dbKey === 'updated_at') {
              continue;
            }

            if (dbKey === 'home_business_unit' || dbKey === 'other_business_units') {
              continue; // Already handled above
            }

            const camelKey = snakeToCamel(dbKey);

            // Handle array fields that should become textarea strings
            if (Array.isArray(value)) {
              formData[camelKey] = value.join('\n');
            } else {
              formData[camelKey] = value;
            }
          }

          // Apply to form
          reset(formData);
          console.log('📊 Applied DB data to form:', formData);
        }

        // Apply any id-scoped local draft on top
        restoreFromLocalDraft(id);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load request details');
      } finally {
        setIsLoading(false);
        // Mark hydration as complete
        setTimeout(() => {
          isHydratingRef.current = false;
          console.log('🏁 Hydration complete, autosave enabled');
        }, 100);
      }
    };

    fetchData();
  }, [id, reset, setValue]);

  // Autosave effect
  useEffect(() => {
    if (!id || isHydratingRef.current || !isDirty) return;

    const timeoutId = setTimeout(() => {
      const currentValues = getValues();
      const draftData = {
        ts: Date.now(),
        data: currentValues,
      };

      localStorage.setItem(draftKey(id), JSON.stringify(draftData));
      console.log('💾 Autosaved draft for', id);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [watchedValues, id, isDirty, getValues]);

  // Stable draft autosave effect
  useEffect(() => {
    if (!requestDetails || isHydratingRef.current || !isDirty) return;

    const sk = stableStorageKey();
    if (!sk) return;

    const timeoutId = setTimeout(() => {
      const currentValues = getValues();
      localStorage.setItem(sk, JSON.stringify(currentValues));
      console.log('💾 Autosaved stable draft:', sk);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [watchedValues, requestDetails, isDirty, getValues]);

  // --- handlers -------------------------------------------------------------

  const handleSave = async (data: SecurityRoleSelection) => {
    if (!id) return;

    try {
      setIsSaving(true);

      // Build the role selection data
      const roleSelectionData = buildRoleSelectionData(id, data, {
        homeBusinessUnitIsArray: HOME_BU_IS_ARRAY,
      });

      console.log('💾 Saving role selection data:', roleSelectionData);

      // Check if record exists
      const { data: existing } = await supabase
        .from('security_role_selections')
        .select('id')
        .eq('request_id', id)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('security_role_selections')
          .update(roleSelectionData)
          .eq('request_id', id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('security_role_selections')
          .insert(roleSelectionData);

        if (error) throw error;
      }

      // Clear drafts after successful save
      localStorage.removeItem(draftKey(id));
      const sk = stableStorageKey();
      if (sk) localStorage.removeItem(sk);

      toast.success('Role selections saved successfully');
      
      // Reset form dirty state
      reset(data);

    } catch (error) {
      console.error('Error saving role selections:', error);
      toast.error('Failed to save role selections');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCalculate = async () => {
    if (!id) return;

    try {
      setIsCalculating(true);

      const { data, error } = await supabase.functions.invoke('calculate-roles', {
        body: { requestId: id },
      });

      if (error) throw error;

      toast.success('Role calculations completed');
      
      // Optionally refresh the page or update state
      window.location.reload();

    } catch (error) {
      console.error('Error calculating roles:', error);
      toast.error('Failed to calculate roles');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCopyFromUser = async () => {
    try {
      // Fetch users from the same agency
      const { data: users, error } = await supabase
        .from('security_role_requests')
        .select('employee_name, employee_id, email, id')
        .eq('agency_name', requestDetails?.agency_name)
        .neq('id', id)
        .order('employee_name');

      if (error) throw error;

      const formattedUsers = users.map(user => ({
        employee_name: user.employee_name,
        employee_id: user.employee_id || '',
        email: user.email,
        request_id: user.id,
      }));

      setCopyUsers(formattedUsers);
      setShowCopyFlow(true);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users for copying');
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedCopyUser(user);
  };

  const handleCopyConfirm = async () => {
    if (!selectedCopyUser?.request_id) return;

    try {
      // Fetch the selected user's role selections
      const { data: roleData, error } = await supabase
        .from('security_role_selections')
        .select('*')
        .eq('request_id', selectedCopyUser.request_id)
        .single();

      if (error) throw error;

      if (roleData) {
        // Convert DB data to form format
        const formData: any = {};

        // Handle home_business_unit
        if (roleData.home_business_unit) {
          const hbu = roleData.home_business_unit;
          formData.homeBusinessUnit = Array.isArray(hbu) ? hbu : hbu.split(',').filter(Boolean);
        }

        // Handle other_business_units
        if (roleData.other_business_units) {
          formData.otherBusinessUnits = Array.isArray(roleData.other_business_units)
            ? roleData.other_business_units.join('\n')
            : roleData.other_business_units;
        }

        // Convert all other fields
        for (const [dbKey, value] of Object.entries(roleData)) {
          if (dbKey === 'id' || dbKey === 'request_id' || dbKey === 'created_at' || dbKey === 'updated_at') {
            continue;
          }

          if (dbKey === 'home_business_unit' || dbKey === 'other_business_units') {
            continue;
          }

          const camelKey = snakeToCamel(dbKey);

          if (Array.isArray(value)) {
            formData[camelKey] = value.join('\n');
          } else {
            formData[camelKey] = value;
          }
        }

        // Apply to form
        reset(formData);
        
        toast.success(`Copied role selections from ${selectedCopyUser.employee_name}`);
      }

      setShowCopyFlow(false);
      setSelectedCopyUser(null);
    } catch (error) {
      console.error('Error copying user roles:', error);
      toast.error('Failed to copy user roles');
    }
  };

  const handleNewRequestFromCopy = async (formData: CopyFlowForm) => {
    if (!selectedCopyUser?.request_id) return;

    try {
      const startDate = formData.startDate;
      
      // Fetch the selected user's role selections
      const { data: roleData, error: roleError } = await supabase
        .from('security_role_selections')
        .select('*')
        .eq('request_id', selectedCopyUser.request_id)
        .single();

      if (roleError) throw roleError;

      if (roleData) {
        const d = formData;
        console.log('🔧 Copy flow - pendingFormData:', d);
        
        console.log('🔧 Copy flow - creating request with data:', {
          startDate,
          employeeName: d.employeeName,
          submitterName: d.submitterName,
          submitterEmail: d.submitterEmail,
          email: d.email,
          hasStartDate: !!startDate
        });
        
        const requestPayload = {
          start_date: startDate,
          employee_name: d.employeeName,
          employee_id: d.employeeId || null,
          is_non_employee: !!d.isNonEmployee,
          work_location: d.workLocation || null,
          work_phone: d.workPhone ? d.workPhone.replace(/\D/g, '') : null,
          email: d.email,
          agency_name: d.agencyName,
          agency_code: d.agencyCode,
          justification: d.justification || null,
          submitter_name: d.submitterName,
          submitter_email: d.submitterEmail,
          supervisor_name: d.supervisorName,
          supervisor_email: d.supervisorUsername,
          security_admin_name: d.securityAdminName,
          security_admin_email: d.securityAdminUsername,
          status: 'pending',
          poc_user: pocUser,
        };
        
        const { data: newRequest, error: requestError } = await supabase
          .from('security_role_requests')
          .insert(requestPayload)
          .select()
          .single();

        if (requestError) throw requestError;

        // Copy role selections to new request
        const newRoleData = {
          ...roleData,
          id: undefined,
          request_id: newRequest.id,
          created_at: undefined,
          updated_at: undefined,
        };

        const { error: roleInsertError } = await supabase
          .from('security_role_selections')
          .insert(newRoleData);

        if (roleInsertError) throw roleInsertError;

        toast.success(`New request created for ${d.employeeName}`);
        
        // Navigate to the new request
        navigate(`/select-roles/${newRequest.id}`);
      }

      setShowCopyFlow(false);
      setSelectedCopyUser(null);
      setPendingFormData(null);
    } catch (error) {
      console.error('Error creating new request from copy:', error);
      toast.error('Failed to create new request');
    }
  };

  // --- render ---------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading request details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!requestDetails) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600">Request not found</p>
            <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Select Security Roles
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Employee:</span>
                <p className="text-gray-900">{requestDetails.employee_name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Agency:</span>
                <p className="text-gray-900">{requestDetails.agency_name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Start Date:</span>
                <p className="text-gray-900">
                  {requestDetails.start_date ? new Date(requestDetails.start_date).toLocaleDateString() : 'Not specified'}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  requestDetails.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  requestDetails.status === 'approved' ? 'bg-green-100 text-green-800' :
                  requestDetails.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {requestDetails.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={handleSubmit(handleSave)}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Selections'}
          </button>
          
          <button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Calculator className="h-4 w-4" />
            {isCalculating ? 'Calculating...' : 'Calculate Roles'}
          </button>
          
          <button
            onClick={handleCopyFromUser}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Copy className="h-4 w-4" />
            Copy from User
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleSave)} className="space-y-8">
          {/* Home Business Unit */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Home Business Unit</h2>
            <MultiSelect
              label="Select Home Business Units"
              options={businessUnits.map(bu => ({ value: bu.code, label: `${bu.code} - ${bu.name}` }))}
              value={watch('homeBusinessUnit') || []}
              onChange={(values) => setValue('homeBusinessUnit', values, { shouldDirty: true })}
              placeholder="Select business units..."
            />
          </div>

          {/* Other Business Units */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Other Business Units</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Unit Codes (one per line)
              </label>
              <textarea
                {...register('otherBusinessUnits')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter 5-character business unit codes, one per line..."
              />
            </div>
          </div>

          {/* Accounts Payable */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Accounts Payable</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('voucherEntry')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Voucher Entry</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('maintenanceVoucherBuildErrors')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Maintenance Voucher Build Errors</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('matchOverride')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Match Override</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('apInquiryOnly')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">AP Inquiry Only</span>
                </label>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      {...register('apVoucherApprover1')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">AP Voucher Approver 1</span>
                  </label>
                  {watch('apVoucherApprover1') && (
                    <textarea
                      {...register('apVoucherApprover1RouteControls')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter 8-character Financial Dept IDs, one per line..."
                    />
                  )}
                </div>
                
                <div>
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      {...register('apVoucherApprover2')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">AP Voucher Approver 2</span>
                  </label>
                  {watch('apVoucherApprover2') && (
                    <textarea
                      {...register('apVoucherApprover2RouteControls')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter 8-character Financial Dept IDs, one per line..."
                    />
                  )}
                </div>
                
                <div>
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      {...register('apVoucherApprover3')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">AP Voucher Approver 3</span>
                  </label>
                  {watch('apVoucherApprover3') && (
                    <textarea
                      {...register('apVoucherApprover3RouteControls')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter 8-character Financial Dept IDs, one per line..."
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Accounts Receivable / Cash Management */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Accounts Receivable / Cash Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('cashMaintenance')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Cash Maintenance</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('receivableSpecialist')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Receivable Specialist</span>
                </label>
                
                <div>
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      {...register('receivableSupervisor')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Receivable Supervisor</span>
                  </label>
                  {watch('receivableSupervisor') && (
                    <div className="ml-6 space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Credit Invoice Approval Business Units
                        </label>
                        <textarea
                          {...register('creditInvoiceApprovalBusinessUnits')}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter 5-character business unit codes, one per line..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Writeoff Approval Business Units
                        </label>
                        <textarea
                          {...register('writeoffApprovalBusinessUnits')}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter 5-character business unit codes, one per line..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('billingCreate')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Billing Create</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('billingSpecialist')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Billing Specialist</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('billingSupervisor')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Billing Supervisor</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('customerMaintenanceSpecialist')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Customer Maintenance Specialist</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('arBillingSetup')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">AR Billing Setup</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('arBillingInquiryOnly')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">AR Billing Inquiry Only</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('cashManagementInquiryOnly')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Cash Management Inquiry Only</span>
                </label>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Budget</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('budgetJournalEntryOnline')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Budget Journal Entry Online</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('budgetJournalLoad')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Budget Journal Load</span>
                </label>
                
                <div>
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      {...register('journalApproverAppr')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Journal Approver (Appropriation)</span>
                  </label>
                  {watch('journalApproverAppr') && (
                    <textarea
                      {...register('journalApprovalA')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter 5-character business unit codes, one per line..."
                    />
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('budgetTransferEntryOnline')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Budget Transfer Entry Online</span>
                </label>
                
                <div>
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      {...register('transferApprover')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Transfer Approver</span>
                  </label>
                  {watch('transferApprover') && (
                    <textarea
                      {...register('transferApproval')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter 5-character business unit codes, one per line..."
                    />
                  )}
                </div>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('budgetInquiryOnly')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Budget Inquiry Only</span>
                </label>
              </div>
            </div>
          </div>

          {/* General Ledger */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">General Ledger</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('journalEntryOnline')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Journal Entry Online</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('journalLoad')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Journal Load</span>
                </label>
                
                <div>
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      {...register('journalApproverExp')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Journal Approver (Expense)</span>
                  </label>
                  {watch('journalApproverExp') && (
                    <textarea
                      {...register('journalApprovalExpense')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter 5-character business unit codes, one per line..."
                    />
                  )}
                </div>
                
                <div>
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      {...register('journalApproverRev')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Journal Approver (Revenue)</span>
                  </label>
                  {watch('journalApproverRev') && (
                    <textarea
                      {...register('journalApprovalRevenue')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter 5-character business unit codes, one per line..."
                    />
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('agencyChartfieldMaintenance')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Agency Chartfield Maintenance</span>
                </label>
                
                <div>
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      {...register('glAgencyApprover')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">GL Agency Approver</span>
                  </label>
                  {watch('glAgencyApprover') && (
                    <textarea
                      {...register('glAgencyApproverSources')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter 3-character agency codes, one per line..."
                    />
                  )}
                </div>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('generalLedgerInquiryOnly')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">General Ledger Inquiry Only</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('nvisionReportingAgencyUser')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">nVision Reporting Agency User</span>
                </label>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Needs Daily Receipts Report?
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('needsDailyReceiptsYes')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('needsDailyReceiptsNo')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grants Management */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Grants Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('awardDataEntry')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Award Data Entry</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('grantFiscalManager')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Grant Fiscal Manager</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('programManager')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Program Manager</span>
                </label>
              </div>
              
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('gmAgencySetup')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">GM Agency Setup</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('grantsInquiryOnly')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Grants Inquiry Only</span>
                </label>
              </div>
            </div>
          </div>

          {/* Projects */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('federalProjectInitiator')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Federal Project Initiator</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('oimInitiator')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">OIM Initiator</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('projectInitiator')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Project Initiator</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('projectManager')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Project Manager</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('capitalProgramsOffice')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Capital Programs Office</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('projectCostAccountant')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Project Cost Accountant</span>
                </label>
              </div>
              
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('projectFixedAsset')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Project Fixed Asset</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('categorySubcategoryManager')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Category/Subcategory Manager</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('projectControlDates')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Project Control Dates</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('projectAccountingSystems')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Project Accounting Systems</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('mndotProjectsInquiry')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">MnDOT Projects Inquiry</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('projectsInquiryOnly')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Projects Inquiry Only</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('mndotProjectApprover')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">MnDOT Project Approver</span>
                </label>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Route Control
                  </label>
                  <input
                    type="text"
                    {...register('routeControl')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter route control..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cost Allocation */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cost Allocation</h2>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('costAllocationInquiryOnly')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Cost Allocation Inquiry Only</span>
              </label>
            </div>
          </div>

          {/* Asset Management */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Asset Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('financialAccountantAssets')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Financial Accountant Assets</span>
                </label>
                
                <div>
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      {...register('physicalInventoryApproval1')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Physical Inventory Approval 1</span>
                  </label>
                  {watch('physicalInventoryApproval1') && (
                    <div className="ml-6 space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Business Units
                        </label>
                        <textarea
                          {...register('physicalInventoryBusinessUnits')}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter 5-character business unit codes, one per line..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Department IDs
                        </label>
                        <textarea
                          {...register('physicalInventoryDepartmentIds')}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter 8-character department IDs, one per line..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('assetManagementInquiryOnly')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Asset Management Inquiry Only</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('physicalInventoryApproval2')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Physical Inventory Approval 2</span>
                </label>
              </div>
            </div>
          </div>

          {/* Procurement */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Procurement</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Vendor Management */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Vendor Management</h3>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('vendorRequestAddUpdate')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Vendor Request Add/Update</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('vendorInquiryOnly')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Vendor Inquiry Only</span>
                </label>
              </div>

              {/* Purchase Orders */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Purchase Orders</h3>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('poEproBuyer')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">PO ePro Buyer</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('contractEncumbrance')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Contract Encumbrance</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('purchaseOrderDataEntry')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Purchase Order Data Entry</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('eproRequisitionRequester')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">ePro Requisition Requester</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('poAccountingCoordinator')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">PO Accounting Coordinator</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('coreOrderReceiver')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Core Order Receiver</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('poInquiryOnly')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">PO Inquiry Only</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('eproRequisitionInquiryOnly')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">ePro Requisition Inquiry Only</span>
                </label>
                
                <div>
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      {...register('poApprover')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">PO Approver</span>
                  </label>
                  {watch('poApprover') && (
                    <textarea
                      {...register('poApproverRouteControls')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter 8-character Financial Dept IDs, one per line..."
                    />
                  )}
                </div>
              </div>

              {/* Strategic Sourcing */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Strategic Sourcing</h3>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('ssEventCreatorBuyer')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">SS Event Creator/Buyer</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('ssCreateVendorResponse')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">SS Create Vendor Response</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('ssEventApprover')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">SS Event Approver</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('ssEventCollaborator')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">SS Event Collaborator</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('ssEventInquiryOnly')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">SS Event Inquiry Only</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('ssAllOrigins')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">SS All Origins</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('ssTechCoordApprover')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">SS Tech Coord Approver</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('ssTechStateApprover')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">SS Tech State Approver</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('ssGrantCoordApprover')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">SS Grant Coord Approver</span>
                </label>
              </div>
            </div>

            {/* Catalog */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-4">Catalog</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('cgCatalogOwner')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">CG Catalog Owner</span>
                  </label>
                </div>
                
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('cgInquiryOnly')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">CG Inquiry Only</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Contracts */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-4">Contracts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('scContractAdministrator')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">SC Contract Administrator</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('scDocumentAdministrator')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">SC Document Administrator</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('scDocumentCollaborator')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">SC Document Collaborator</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('scAgreementManager')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">SC Agreement Manager</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('scAgencyLibraryManager')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">SC Agency Library Manager</span>
                  </label>
                </div>
                
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('scContractInquiryOnly')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">SC Contract Inquiry Only</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('scContractualApprover')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">SC Contractual Approver</span>
                  </label>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Electronic Documents?
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          {...register('scElectronicDocsYes')}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          {...register('scElectronicDocsNo')}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">No</span>
                      </label>
                    </div>
                  </div>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('scDocContractCoordinator')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">SC Doc Contract Coordinator</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('inventoryExpressIssue')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Inventory Express Issue</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('inventoryAdjustmentApprover')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Inventory Adjustment Approver</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('inventoryReplenishmentBuyer')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Inventory Replenishment Buyer</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('inventoryControlWorker')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Inventory Control Worker</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('inventoryExpressPutaway')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Inventory Express Putaway</span>
                </label>
              </div>
              
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('inventoryFulfillmentSpecialist')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Inventory Fulfillment Specialist</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('inventoryPoReceiver')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Inventory PO Receiver</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('inventoryReturnsReceiver')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Inventory Returns Receiver</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('inventoryCostAdjustment')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Inventory Cost Adjustment</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('inventoryMaterialsManager')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Inventory Materials Manager</span>
                </label>
              </div>
              
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('inventoryDelivery')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Inventory Delivery</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('inventoryInquiryOnly')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Inventory Inquiry Only</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('inventoryConfigurationAgency')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Inventory Configuration Agency</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('inventoryPickPlanDistributionRelease')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Inventory Pick Plan Distribution Release</span>
                </label>
              </div>
            </div>
          </div>

          {/* Role Justification */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Role Justification</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please provide justification for the selected roles
              </label>
              <textarea
                {...register('roleJustification')}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Explain why these roles are needed for this position..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Role Selections'}
            </button>
          </div>
        </form>
      </div>

      {/* Copy Flow Modal */}
      {showCopyFlow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Copy Roles from User
              </h2>
              
              <UserSelect
                users={copyUsers}
                selectedUser={selectedCopyUser}
                onUserSelect={handleUserSelect}
                onCopyConfirm={handleCopyConfirm}
                onNewRequest={handleNewRequestFromCopy}
                onCancel={() => {
                  setShowCopyFlow(false);
                  setSelectedCopyUser(null);
                  setPendingFormData(null);
                }}
                currentRequestDetails={requestDetails}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SelectRolesPage;