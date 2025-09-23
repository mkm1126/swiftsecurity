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

      // KK approver workflow
      appropriation_sources: toOrNull(kkAppropriation),
      transfer_appropriation_sources: toOrNull(kkTransfer),
      expense_budget_source: toOrNull(kkExpense),
      revenue_budget_source: toOrNull(kkRevenue),

      // AM workflow
      physical_inventory_business_units: toOrNull(amBUs),
      physical_inventory_department_ids: toOrNull(amDept),

      // GL workflow
      gl_agency_approver_sources: toOrNull(glSources),

      // PO Approver route controls
      po_approver_route_controls: toOrNull(poApproverRoute),

      // ===== Inventory fields =====
      ship_to_location: (data as any).shipToLocation || null,
      inventory_business_units: (data as any).inventoryBusinessUnits || null,

      // ===== Store the full form payload as JSON for future-proofing =====
      role_selection_json: data,
    };
  };

  // --- state ----------------------------------------------------------------
  const navigate = useNavigate();
  const location = useLocation() as { state?: { requestId?: string } };
  const { id: idParam } = useParams();

  const [saving, setSaving] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState<{
    employee_name?: string;
    agency_name?: string;
    agency_code?: string;
  } | null>(null);
  const [isEditingCopiedRoles, setIsEditingCopiedRoles] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<SecurityRoleSelection>({
    defaultValues: {
      homeBusinessUnit: [],
      otherBusinessUnits: '',
      voucherEntry: false,
      maintenanceVoucherBuildErrors: false,
      matchOverride: false,
      apInquiryOnly: false,
      supervisorApproval: false,
    },
  });

  const formData = watch();

  // Simple form persistence - save form data when it changes (but not during copy flow or hydration)
  useEffect(() => {
    if (isHydratingRef.current || isEditingCopiedRoles || !requestDetails) return;

    const timeoutId = setTimeout(() => {
      const currentFormData = watch();
      if (Object.keys(currentFormData).length === 0) return;

      const storageKey = stableStorageKey();
      if (!storageKey) return;

      localStorage.setItem(storageKey, JSON.stringify(currentFormData));
      console.log('💾 Auto-saving Select Roles form data:', { storageKey, formData: currentFormData });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watch(), requestDetails, isEditingCopiedRoles]);

  useEffect(() => {
    // Check if this is a copy flow by looking for all required pieces
    const pendingFormData = localStorage.getItem('pendingFormData');
    const copiedRoleSelections = localStorage.getItem('copiedRoleSelections');
    const editingCopiedRoles = localStorage.getItem('editingCopiedRoles');
    
    const isCopyFlow = !!(pendingFormData && copiedRoleSelections && editingCopiedRoles === 'true');

    if (isCopyFlow) {
      console.log('🔧 Copy flow detected');
      setIsEditingCopiedRoles(true);
      
      try {
        const formData: CopyFlowForm = JSON.parse(pendingFormData);
        const roleData = JSON.parse(copiedRoleSelections);
        
        setRequestDetails({ 
          employee_name: formData.employeeName, 
          agency_name: formData.agencyName, 
          agency_code: formData.agencyCode 
        });
        
        // Map copied role data to form fields
        if (roleData) {
          Object.entries(roleData).forEach(([key, value]) => {
            if (typeof value === 'boolean') {
              setValue(key as keyof SecurityRoleSelection, value as any, { shouldDirty: false });
            } else if (typeof value === 'string' && value.trim()) {
              setValue(key as keyof SecurityRoleSelection, value as any, { shouldDirty: false });
            } else if (Array.isArray(value)) {
              setValue(key as keyof SecurityRoleSelection, value as any, { shouldDirty: false });
            }
          });
        }
        
        isHydratingRef.current = false;
      } catch (e) {
        console.error('Error loading copy-flow data:', e);
        toast.error('Error loading copied user data');
        // Clean up invalid copy flow data
        localStorage.removeItem('editingCopiedRoles');
        localStorage.removeItem('pendingFormData');
        localStorage.removeItem('copiedRoleSelections');
        navigate('/');
      }
    } else {
      console.log('🔧 Normal flow detected');
      const stateRequestId = location.state?.requestId;
      const effectiveId = stateRequestId || idParam;
      
      if (!effectiveId) {
        toast.error('Please complete the main form first before selecting roles.');
        navigate('/');
        return;
      }
      
      setRequestId(effectiveId);
      fetchRequestDetails(effectiveId);
    }
  }, [location.state, navigate, idParam, setValue]);

  // Try to restore saved form data after request details are loaded (but not during copy flow)
  useEffect(() => {
    if (isEditingCopiedRoles || !requestDetails) return;

    const restored = restoreFromStableDraft();
    if (!restored) {
      console.log('📡 No saved data found, fetching existing selections from Supabase');
      if (requestId) {
        fetchExistingSelections(requestId);
      }
    }
    
    isHydratingRef.current = false;
  }, [requestDetails, requestId, isEditingCopiedRoles]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);

  async function fetchRequestDetails(id: string) {
    try {
      const { data, error } = await supabase
        .from('security_role_requests')
        .select('employee_name, agency_name, agency_code')
        .eq('id', id)
        .single();

      if (error) throw error;
      console.log('📋 Request details fetched:', data);
      setRequestDetails(data || null);
    } catch (err) {
      console.error('Error fetching request details:', err);
      toast.error('Failed to load request details');
    }
  }

  async function fetchExistingSelections(id: string) {
    try {
      const { data, error } = await supabase
        .from('security_role_selections')
        .select('*')
        .eq('request_id', id)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return;

      console.log('📋 Existing selections fetched from Supabase:', data);
      
      // Map database fields to form fields
      const mappings: Record<string, keyof SecurityRoleSelection> = {
        voucher_entry: 'voucherEntry',
        maintenance_voucher_build_errors: 'maintenanceVoucherBuildErrors',
        match_override: 'matchOverride',
        ap_inquiry_only: 'apInquiryOnly',
        cash_maintenance: 'cashMaintenance',
        receivable_specialist: 'receivableSpecialist',
        receivable_supervisor: 'receivableSupervisor',
        billing_create: 'billingCreate',
        billing_specialist: 'billingSpecialist',
        billing_supervisor: 'billingSupervisor',
        customer_maintenance_specialist: 'customerMaintenanceSpecialist',
        ar_billing_setup: 'arBillingSetup',
        ar_billing_inquiry_only: 'arBillingInquiryOnly',
        cash_management_inquiry_only: 'cashManagementInquiryOnly',
        budget_journal_entry_online: 'budgetJournalEntryOnline',
        budget_journal_load: 'budgetJournalLoad',
        journal_approver: 'journalApprover',
        budget_transfer_entry_online: 'budgetTransferEntryOnline',
        transfer_approver: 'transferApprover',
        budget_inquiry_only: 'budgetInquiryOnly',
        journal_entry_online: 'journalEntryOnline',
        journal_load: 'journalLoad',
        agency_chartfield_maintenance: 'agencyChartfieldMaintenance',
        gl_agency_approver: 'glAgencyApprover',
        general_ledger_inquiry_only: 'generalLedgerInquiryOnly',
        nvision_reporting_agency_user: 'nvisionReportingAgencyUser',
        needs_daily_receipts_report: 'needsDailyReceiptsReport',
        award_data_entry: 'awardDataEntry',
        grant_fiscal_manager: 'grantFiscalManager',
        program_manager: 'programManager',
        gm_agency_setup: 'gmAgencySetup',
        grants_inquiry_only: 'grantsInquiryOnly',
        federal_project_initiator: 'federalProjectInitiator',
        oim_initiator: 'oimInitiator',
        project_initiator: 'projectInitiator',
        project_manager: 'projectManager',
        capital_programs_office: 'capitalProgramsOffice',
        project_cost_accountant: 'projectCostAccountant',
        project_fixed_asset: 'projectFixedAsset',
        category_subcategory_manager: 'categorySubcategoryManager',
        project_control_dates: 'projectControlDates',
        project_accounting_systems: 'projectAccountingSystems',
        mndot_projects_inquiry: 'mndotProjectsInquiry',
        projects_inquiry_only: 'projectsInquiryOnly',
        mndot_project_approver: 'mndotProjectApprover',
        route_control: 'routeControl',
        cost_allocation_inquiry_only: 'costAllocationInquiryOnly',
        financial_accountant_assets: 'financialAccountantAssets',
        asset_management_inquiry_only: 'assetManagementInquiryOnly',
        physical_inventory_approval_1: 'physicalInventoryApproval1',
        physical_inventory_approval_2: 'physicalInventoryApproval2',
        inventory_express_issue: 'inventoryExpressIssue',
        inventory_adjustment_approver: 'inventoryAdjustmentApprover',
        inventory_replenishment_buyer: 'inventoryReplenishmentBuyer',
        inventory_control_worker: 'inventoryControlWorker',
        inventory_express_putaway: 'inventoryExpressPutaway',
        inventory_fulfillment_specialist: 'inventoryFulfillmentSpecialist',
        inventory_po_receiver: 'inventoryPoReceiver',
        inventory_returns_receiver: 'inventoryReturnsReceiver',
        inventory_cost_adjustment: 'inventoryCostAdjustment',
        inventory_materials_manager: 'inventoryMaterialsManager',
        inventory_delivery: 'inventoryDelivery',
        inventory_inquiry_only: 'inventoryInquiryOnly',
        inventory_configuration_agency: 'inventoryConfigurationAgency',
        inventory_pick_plan_distribution_release: 'inventoryPickPlanDistributionRelease',
        ship_to_location: 'shipToLocation',
        inventory_business_units: 'inventoryBusinessUnits',
        role_justification: 'roleJustification'
      };

      // Handle home_business_unit (could be array or string)
      if (data.home_business_unit) {
        const homeBU = Array.isArray(data.home_business_unit) 
          ? data.home_business_unit 
          : [data.home_business_unit];
        setValue('homeBusinessUnit', homeBU, { shouldDirty: false });
      }

      // Handle other_business_units
      if (data.other_business_units) {
        const otherBUs = Array.isArray(data.other_business_units)
          ? data.other_business_units.join(', ')
          : data.other_business_units;
        setValue('otherBusinessUnits', otherBUs, { shouldDirty: false });
      }

      // Map other fields
      Object.entries(mappings).forEach(([dbField, formField]) => {
        if (data[dbField] !== undefined) {
          setValue(formField, data[dbField], { shouldDirty: false });
        }
      });

      // Handle array fields that need special processing
      if (data.ap_voucher_approver_1_route_controls) {
        const routeControls = Array.isArray(data.ap_voucher_approver_1_route_controls)
          ? data.ap_voucher_approver_1_route_controls.join(', ')
          : data.ap_voucher_approver_1_route_controls;
        setValue('apVoucherApprover1RouteControls', routeControls, { shouldDirty: false });
      }

      if (data.ap_voucher_approver_2_route_controls) {
        const routeControls = Array.isArray(data.ap_voucher_approver_2_route_controls)
          ? data.ap_voucher_approver_2_route_controls.join(', ')
          : data.ap_voucher_approver_2_route_controls;
        setValue('apVoucherApprover2RouteControls', routeControls, { shouldDirty: false });
      }

      if (data.ap_voucher_approver_3_route_controls) {
        const routeControls = Array.isArray(data.ap_voucher_approver_3_route_controls)
          ? data.ap_voucher_approver_3_route_controls.join(', ')
          : data.ap_voucher_approver_3_route_controls;
        setValue('apVoucherApprover3RouteControls', routeControls, { shouldDirty: false });
      }

    } catch (e) {
      console.error('Failed to fetch existing role selections:', e);
    }
  }

  const onSubmit = async (data: SecurityRoleSelection) => {
    setSaving(true);
    try {
      if (isEditingCopiedRoles) {
        console.log('🔧 Copy flow - processing submission');
        
        const pendingFormData = localStorage.getItem('pendingFormData');
        const copiedRoleSelections = localStorage.getItem('copiedRoleSelections');
        
        if (!pendingFormData) {
          throw new Error('No pending form data found');
        }

        console.log('🔧 Copy flow - pendingFormData:', JSON.parse(pendingFormData));
        
        const roleData = copiedRoleSelections ? JSON.parse(copiedRoleSelections) : {};
        console.log('🔧 Copy flow - roleData:', roleData);

        const d: CopyFlowForm = JSON.parse(pendingFormData);
        const pocUser = localStorage.getItem('pocUserName');

        // Build complete request payload with all required fields
        const requiredFields = {
          start_date: d.startDate || new Date().toISOString().split('T')[0],
          employee_name: d.employeeName || '',
          employee_id: d.employeeId || null,
          is_non_employee: !!d.isNonEmployee,
          work_location: d.workLocation || null,
          work_phone: d.workPhone ? d.workPhone.replace(/\D/g, '') : null,
          email: d.email || '',
          agency_name: d.agencyName || '',
          agency_code: d.agencyCode || '',
          justification: d.justification || null,
          submitter_name: d.submitterName || 'Default Submitter',
          submitter_email: d.submitterEmail || 'submitter@example.com',
          supervisor_name: d.supervisorName || 'Default Supervisor',
          supervisor_email: d.supervisorUsername || 'supervisor@example.com',
          security_admin_name: d.securityAdminName || 'Default Security Admin',
          security_admin_email: d.securityAdminUsername || 'security@example.com',
          status: 'pending',
          poc_user: pocUser,
        };

        console.log('🔧 Copy flow - creating request with data:', requiredFields);

        const { data: newRequest, error: requestError } = await supabase
          .from('security_role_requests')
          .insert(requiredFields)
          .select()
          .single();

        if (requestError) throw requestError;

        // Create security area
        const { error: areasError } = await supabase.from('security_areas').insert({
          request_id: newRequest.id,
          area_type: 'accounting_procurement',
          director_name: d.accountingDirector || null,
          director_email: d.accountingDirectorUsername || null,
        });

        if (areasError) throw areasError;

        // Save role selections
        const selections = buildRoleSelectionData(newRequest.id, data, { homeBusinessUnitIsArray: HOME_BU_IS_ARRAY });
        const { error: selectionsError } = await supabase
          .from('security_role_selections')
          .insert(selections);

        if (selectionsError) throw selectionsError;

        // Clean up copy flow data
        localStorage.removeItem('pendingFormData');
        localStorage.removeItem('editingCopiedRoles');
        localStorage.removeItem('copiedRoleSelections');
        localStorage.removeItem('copiedUserDetails');

        toast.success('Role selections saved successfully!');
        navigate('/success', { state: { requestId: newRequest.id } });
      } else {
        if (!requestId) {
          toast.error('No request found. Please start from the main form.');
          navigate('/');
          return;
        }

        const selections = buildRoleSelectionData(requestId, data, { homeBusinessUnitIsArray: HOME_BU_IS_ARRAY });
        const { error } = await supabase
          .from('security_role_selections')
          .upsert(selections, { onConflict: 'request_id' });

        if (error) throw error;

        // Save to localStorage for future visits
        if (requestDetails) {
          const storageKey = stableStorageKey();
          if (storageKey) {
            localStorage.setItem(storageKey, JSON.stringify(data));
            console.log('💾 Saving Select Roles form data for future visits:', { storageKey, data });
          }
        }

        toast.success('Role selections saved successfully!');
        navigate('/success', { state: { requestId } });
      }
    } catch (err: any) {
      console.error('Error saving role selections:', err);
      toast.error('Failed to save role selections. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Convert business units to options format for MultiSelect
  const businessUnitOptions = businessUnits.map(unit => ({
    value: unit.businessUnit,
    label: `${unit.description} (${unit.businessUnit})`
  }));

  const hasSelectedRoles = Object.values(formData).some(value => 
    typeof value === 'boolean' && value === true
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Accounting / Procurement Role Selection"
        subtitle="Select specific roles and permissions for accounting and procurement access"
      />

      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Main Form
            </Link>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <div className="flex items-center">
                <Calculator className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Accounting / Procurement Role Selection
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Select specific roles and permissions for accounting and procurement access
                  </p>
                  {requestDetails && (
                    <p className="mt-2 text-sm text-blue-600">
                      Request for: <strong>{requestDetails.employee_name}</strong> at{' '}
                      <strong>{requestDetails.agency_name}</strong>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
              {/* Copy User Section */}
              {!isEditingCopiedRoles && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Copy className="h-6 w-6 text-blue-600 mr-3" />
                    <div>
                      <h3 className="text-lg font-medium text-blue-900">Copy User Access (Optional)</h3>
                      <p className="text-sm text-blue-700">
                        Copy role selections from an existing user to speed up the process
                      </p>
                    </div>
                  </div>
                  
                  <UserSelect
                    selectedUser={selectedUser}
                    onUserChange={setSelectedUser}
                    formData={formData}
                  />
                </div>
              )}

              {/* Business Unit Selection */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Business Unit Information</h3>
                
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <MultiSelect
                      options={businessUnitOptions}
                      value={formData.homeBusinessUnit || []}
                      onChange={(values) => setValue('homeBusinessUnit', values)}
                      placeholder="Select home business units..."
                      label="Home Business Unit(s)"
                      required={true}
                      error={errors.homeBusinessUnit?.message}
                      searchPlaceholder="Search business units..."
                      allowCustom={true}
                      ariaLabel="Select home business units"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Select the primary business unit(s) for this user's access
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Other Business Units
                    </label>
                    <textarea
                      {...register('otherBusinessUnits')}
                      rows={3}
                      placeholder="Enter additional business unit codes, separated by commas or new lines..."
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Optional: List any additional business units that require access
                    </p>
                  </div>
                </div>
              </div>

              {/* Accounts Payable */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Accounts Payable</h3>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

                {/* AP Voucher Approvers with Route Controls */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-800">AP Voucher Approvers</h4>
                  
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <label className="flex items-center mb-3">
                        <input
                          type="checkbox"
                          {...register('apVoucherApprover1')}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">AP Voucher Approver 1</span>
                      </label>
                      
                      {formData.apVoucherApprover1 && (
                        <div className="ml-6">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Route Controls: Financial Department ID(s)
                          </label>
                          <textarea
                            {...register('apVoucherApprover1RouteControls')}
                            rows={2}
                            placeholder="Enter 8-character Financial Department IDs, separated by commas or new lines..."
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            8 characters each; separate with commas or new lines
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <label className="flex items-center mb-3">
                        <input
                          type="checkbox"
                          {...register('apVoucherApprover2')}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">AP Voucher Approver 2</span>
                      </label>
                      
                      {formData.apVoucherApprover2 && (
                        <div className="ml-6">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Route Controls: Financial Department ID(s)
                          </label>
                          <textarea
                            {...register('apVoucherApprover2RouteControls')}
                            rows={2}
                            placeholder="Enter 8-character Financial Department IDs, separated by commas or new lines..."
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            8 characters each; separate with commas or new lines
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <label className="flex items-center mb-3">
                        <input
                          type="checkbox"
                          {...register('apVoucherApprover3')}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">AP Voucher Approver 3</span>
                      </label>
                      
                      {formData.apVoucherApprover3 && (
                        <div className="ml-6">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Route Controls: Financial Department ID(s)
                          </label>
                          <textarea
                            {...register('apVoucherApprover3RouteControls')}
                            rows={2}
                            placeholder="Enter 8-character Financial Department IDs, separated by commas or new lines..."
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            8 characters each; separate with commas or new lines
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Accounts Receivable and Cash Management */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Accounts Receivable and Cash Management</h3>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('receivableSupervisor')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Receivable Supervisor</span>
                  </label>

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

                {/* AR Supervisor Route Controls */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-800">AR Supervisor Route Controls</h4>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Write-off Approval Business Units
                      </label>
                      <textarea
                        {...register('writeoffApprovalBusinessUnits')}
                        rows={2}
                        placeholder="Enter 5-character business unit codes..."
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        5 characters each; separate with commas or new lines
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Credit Invoice Approval Business Units
                      </label>
                      <textarea
                        {...register('creditInvoiceApprovalBusinessUnits')}
                        rows={2}
                        placeholder="Enter 5-character business unit codes..."
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        5 characters each; separate with commas or new lines
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Budgets/Commitment Control & Appropriation Maintenance */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Budgets/Commitment Control & Appropriation Maintenance
                </h3>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('budgetTransferEntryOnline')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Budget Transfer Entry Online</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('transferApprover')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Transfer Approver</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('budgetInquiryOnly')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Budget Inquiry Only</span>
                  </label>
                </div>

                {/* Journal Approver Types */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-800">Journal Approver Types</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('journalApproverAppr')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Journal Approver (Appropriation)</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('journalApproverExp')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Journal Approver (Expense)</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('journalApproverRev')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Journal Approver (Revenue)</span>
                    </label>
                  </div>
                </div>

                {/* Budget Route Controls */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-800">Budget Route Controls</h4>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Appropriation Sources
                      </label>
                      <textarea
                        {...register('appropriationSources')}
                        rows={2}
                        placeholder="Enter 5-character business unit codes..."
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transfer Appropriation Sources
                      </label>
                      <textarea
                        {...register('transferAppropriationSources')}
                        rows={2}
                        placeholder="Enter 5-character business unit codes..."
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expense Budget Source
                      </label>
                      <textarea
                        {...register('expenseBudgetSource')}
                        rows={2}
                        placeholder="Enter 5-character business unit codes..."
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Revenue Budget Source
                      </label>
                      <textarea
                        {...register('revenueBudgetSource')}
                        rows={2}
                        placeholder="Enter 5-character business unit codes..."
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* General Ledger and NVISION Reporting */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  General Ledger and NVISION Reporting
                </h3>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('agencyChartfieldMaintenance')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Agency Chartfield Maintenance</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('glAgencyApprover')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">GL Agency Approver</span>
                  </label>

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
                    <span className="ml-2 text-sm text-gray-700">NVISION Reporting Agency User</span>
                  </label>
                </div>

                {/* GL Agency Approver Route Controls */}
                {formData.glAgencyApprover && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GL Agency Approver Sources
                    </label>
                    <textarea
                      {...register('glAgencyApproverSources')}
                      rows={2}
                      placeholder="Enter 3-character agency codes..."
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      3 characters each; separate with commas or new lines
                    </p>
                  </div>
                )}

                {/* Daily Receipts Report */}
                <div className="space-y-3">
                  <h4 className="text-md font-medium text-gray-800">Daily Receipts Report</h4>
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        {...register('needsDailyReceiptsYes')}
                        value="true"
                        className="border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        {...register('needsDailyReceiptsNo')}
                        value="true"
                        className="border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Grants */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Grants</h3>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

              {/* Project Costing */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Project Costing</h3>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                    <span className="ml-2 text-sm text-gray-700">Category Subcategory Manager</span>
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
                    <span className="ml-2 text-sm text-gray-700">MNDOT Projects Inquiry</span>
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
                    <span className="ml-2 text-sm text-gray-700">MNDOT Project Approver</span>
                  </label>
                </div>

                {/* Route Control */}
                {formData.mndotProjectApprover && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Route Control
                    </label>
                    <input
                      type="text"
                      {...register('routeControl')}
                      placeholder="Enter route control information..."
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Cost Allocation */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Cost Allocation</h3>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Asset Management</h3>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('financialAccountantAssets')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Financial Accountant Assets</span>
                  </label>

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
                      {...register('physicalInventoryApproval1')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Physical Inventory Approval 1</span>
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

                {/* Physical Inventory Route Controls */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-800">Physical Inventory Route Controls</h4>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Physical Inventory Business Units
                      </label>
                      <textarea
                        {...register('physicalInventoryBusinessUnits')}
                        rows={2}
                        placeholder="Enter 5-character business unit codes..."
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Physical Inventory Department IDs
                      </label>
                      <textarea
                        {...register('physicalInventoryDepartmentIds')}
                        rows={2}
                        placeholder="Enter 8-character department IDs..."
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Inventory (IN) */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Inventory (IN)</h3>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

                {/* Inventory Additional Fields */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ship To Location
                    </label>
                    <input
                      type="text"
                      {...register('shipToLocation')}
                      placeholder="Enter ship to location..."
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Inventory Business Units
                    </label>
                    <textarea
                      {...register('inventoryBusinessUnits')}
                      rows={2}
                      placeholder="Enter business unit codes..."
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Purchase Order Management */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Purchase Order Management</h3>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('poApprover')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">PO Approver</span>
                  </label>
                </div>

                {/* PO Approver Route Controls */}
                {formData.poApprover && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PO Approver Route Controls
                    </label>
                    <textarea
                      {...register('poApproverRouteControls')}
                      rows={2}
                      placeholder="Enter 8-character Financial Department IDs..."
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      8 characters each; separate with commas or new lines
                    </p>
                  </div>
                )}
              </div>

              {/* Vendor Management */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Vendor Management</h3>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
              </div>

              {/* Strategic Sourcing */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Strategic Sourcing</h3>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

              {/* Catalog Management */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Catalog Management</h3>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('cgCatalogOwner')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">CG Catalog Owner</span>
                  </label>

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

              {/* Contract Management */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contract Management</h3>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('scDocContractCoordinator')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">SC Doc Contract Coordinator</span>
                  </label>
                </div>

                {/* Electronic Documents */}
                <div className="space-y-3">
                  <h4 className="text-md font-medium text-gray-800">Electronic Documents</h4>
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        {...register('scElectronicDocsYes')}
                        value="true"
                        className="border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        {...register('scElectronicDocsNo')}
                        value="true"
                        className="border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Role Justification */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Justification</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role Justification</label>
                  <textarea
                    {...register('roleJustification')}
                    rows={4}
                    placeholder="Please explain why these accounting and procurement roles are necessary for your job responsibilities..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Supervisor Approval */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Approval</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      {...register('supervisorApproval', {
                        required: 'Supervisor approval is required to submit this request'
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mt-1"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      <strong>Supervisor Approval:</strong> I certify that the user needs the roles and agencies 
                      indicated on this form in order to carry out the responsibilities of his/her job.
                    </span>
                  </label>
                  {errors.supervisorApproval && (
                    <p className="mt-1 text-sm text-red-600">{errors.supervisorApproval.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving || !hasSelectedRoles}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    saving || !hasSelectedRoles
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Submit Role Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SelectRolesPage;