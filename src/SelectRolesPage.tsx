// src/SelectRolesPage.tsx
// Rewritten from backup code with form persistence added + fixes:
// - keep snake_case prefixes on DB write (no stripping)
// - legacy suffix fallback when hydrating booleans from DB
// - shouldUnregister:false so hidden/conditionally rendered fields persist
// - requestId-scoped localStorage draft autosave/restore
// - FIXED: Copy user access workflow support

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Calculator } from 'lucide-react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { toast } from 'sonner';
import { SecurityRoleSelection } from './types';
import Header from './components/Header';
import MultiSelect from './components/MultiSelect';
import { businessUnits } from './lib/businessUnitData';

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

      // Optional JSON snapshot (handy for troubleshooting)
      role_selection_json: {
        ...(data as any),
        _parsed_multi: {
          ap1Depts,
          ap2Depts,
          ap3Depts,
          arCreditBUs,
          arWriteoffBUs,
          kkAppropriation,
          kkTransfer,
          kkExpense,
          kkRevenue,
          amBUs,
          amDept,
          glSources,
          poApproverRoute,
        },
      },
    };
  };

  // Daily Receipts toggle helper
  const setDailyReceipts = (answer: 'yes' | 'no') => {
    if (answer === 'yes') {
      setValue('needsDailyReceiptsYes' as any, true, { shouldDirty: true });
      setValue('needsDailyReceiptsNo' as any, false, { shouldDirty: true });
    } else {
      setValue('needsDailyReceiptsYes' as any, false, { shouldDirty: true });
      setValue('needsDailyReceiptsNo' as any, true, { shouldDirty: true });
    }
  };

  const rcInputClasses =
    'w-56 h-10 px-3 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm placeholder:text-gray-400';
  const inputStd =
    'h-10 px-3 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm placeholder:text-gray-400';

  // --- state & form ---------------------------------------------------------

  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditingCopiedRoles, setIsEditingCopiedRoles] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { id: idParam } = useParams<{ id: string }>(); // ✅ prefer URL param as the single source of truth

  const [saving, setSaving] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState<any>(null);
  const [loadingExistingData, setLoadingExistingData] = useState(false);
  const [availableBusinessUnits, setAvailableBusinessUnits] = useState<any[]>([]);
  const [hasExistingDbSelections, setHasExistingDbSelections] = useState(false);
  const [restoredFromLocalStorage, setRestoredFromLocalStorage] = useState(false);
  const homeBusinessUnitRef = useRef<HTMLDivElement | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    clearErrors,
    getValues,
    formState: { errors },
  } = useForm<SecurityRoleSelection>({
    defaultValues: {
      homeBusinessUnit: [] as any, // array (TEXT[]) mode
      otherBusinessUnits: '' as any,
    } as any,
    shouldUnregister: false, // ✅ keep hidden/unmounted field values
  });

  // Watchers (watch the whole form for autosave)
  const selectedRoles = watch();

  const hasSelectedRoles = React.useMemo(() => {
    return Object.entries(selectedRoles || {}).some(
      ([, value]) => typeof value === 'boolean' && value === true
    );
  }, [selectedRoles]);

  // BU options
  const businessUnitOptions = React.useMemo(() => {
    const agencyCode = requestDetails?.agency_code;
    if (!agencyCode) {
      return businessUnits.map((unit) => ({
        value: unit.businessUnit,
        label: `${unit.description} (${unit.businessUnit})`,
      }));
    }
    const filteredUnits = businessUnits.filter((unit) => unit.businessUnit.startsWith(agencyCode));
    return filteredUnits.map((unit) => ({
      value: unit.businessUnit,
      label: `${unit.description} (${unit.businessUnit})`,
    }));
  }, [requestDetails?.agency_code]);

  // BU change
  const handleBusinessUnitChange = (selectedCodes: string[]) => {
    setValue('homeBusinessUnit' as any, selectedCodes, {
      shouldValidate: true,
      shouldDirty: true,
    });
    clearErrors('homeBusinessUnit' as any);
  };

  // --- data fetching --------------------------------------------------------

  // Fetch request details and return them so we can compute keys immediately
  const fetchRequestDetails = async (
    id: string
  ): Promise<{ employee_name?: string; agency_name?: string; agency_code?: string } | null> => {
    try {
      const { data, error } = await supabase
        .from('security_role_requests')
        .select('employee_name, agency_name, agency_code')
        .eq('id', id);
  
      if (error) throw error;
      const first = Array.isArray(data) ? data[0] : data;
      setRequestDetails(first || null);
  
      if (first?.agency_code) {
        await fetchBusinessUnitsForAgency(first.agency_code);
      }
  
      return first || null;
    } catch (error) {
      console.error('Error fetching request details:', error);
      toast.error('Failed to load request details');
      return null;
    }
  };

  // Fetch BUs by agency
  const fetchBusinessUnitsForAgency = async (agencyCode: string) => {
    try {
      const { data, error } = await supabase
        .from('agency_business_units')
        .select('business_unit_code, business_unit_name')
        .eq('agency_code', agencyCode)
        .order('business_unit_name');

      if (error) throw error;

      setAvailableBusinessUnits(data || []);
    } catch (error) {
      console.error('Error fetching business units for agency:', error);
      const fallbackUnits = businessUnits
        .filter((unit) => unit.businessUnit.startsWith(agencyCode))
        .map((unit) => ({
          business_unit_code: unit.businessUnit,
          business_unit_name: unit.description,
        }));
      setAvailableBusinessUnits(fallbackUnits);
    }
  };

  // Fetch existing saved selections and hydrate the form (for Edit flow)
  const fetchExistingSelections = async (id: string) => {
    try {
      // Renamed to be more specific about what it does
      const { data, error } = await supabase
        .from('security_role_selections')
        .select('*')
        .eq('request_id', id)
        .maybeSingle();

      if (error) throw error;

      if (data) {        
        console.log('📡 Found existing selections in database:', data);

        // Mark that we found existing selections in the database
        setHasExistingDbSelections(true);
        
        for (const [k, v] of Object.entries(data)) {
          if (['id', 'request_id', 'created_at', 'updated_at', 'role_selection_json'].includes(k)) continue;
        
          // Arrays from DB (TEXT[]) → comma list for textareas
          if (Array.isArray(v)) {
            const camel = snakeToCamel(k); // e.g., ap_voucher_approver_1_route_controls -> apVoucherApprover1RouteControls
            setValue(camel as any, v.join(', '), { shouldDirty: false });
            continue;
          }
        
          if (typeof v === 'boolean') {
            // Only set truthy flags – mirrors how you write to DB (true-only)
            if (v === true) {
              const camel = snakeToCamel(k);        // e.g., sc_contract_administrator -> scContractAdministrator
              setValue(camel as any, true as any, { shouldDirty: false });
        
              // Legacy fallback: if DB used a two-letter prefix, also set the suffix-mapped key just in case
              const suffixCamel = snakeToCamel(strip2(k)); // e.g., contract_administrator -> contractAdministrator
              if (suffixCamel !== camel) {
                setValue(suffixCamel as any, true as any, { shouldDirty: false });
              }
            }
            continue;
          }
        
          // Strings / nullable
          const camel = snakeToCamel(k);
          setValue(camel as any, (v ?? '') as any, { shouldDirty: false });
        }
        
        // Special handling for home_business_unit → MultiSelect array
        const hbu = (data as any).home_business_unit;
        if (hbu !== undefined) {
          const asArray = Array.isArray(hbu)
            ? hbu
            : typeof hbu === 'string' && hbu
            ? hbu.split(',').map((s) => s.trim()).filter(Boolean)
            : [];
          setValue('homeBusinessUnit' as any, asArray as any, { shouldDirty: false });
          clearErrors('homeBusinessUnit' as any);
        }
        
        // 👇 Force RHF to broadcast the loaded values to any inputs that only read once at mount
        setTimeout(() => {
          const snap = getValues();
          reset(snap);
          console.log('🔁 Synced form state to UI with reset() after DB hydrate:', snap);
          console.log('📡 Loaded selections from database:', data);
        }, 0);
      }
    } catch (err) {
      console.error('Failed to fetch existing role selections from database:', err);
    }
  };

  // --- local draft persistence (so Back -> return keeps selections) ---------

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

  // Save a local draft (debounced)
  useEffect(() => {
    if (!requestId) return;
    const handle = setTimeout(() => {
      try {
        const payload = { ts: Date.now(), data: getValues() };
        localStorage.setItem(draftKey(requestId), JSON.stringify(payload));
      } catch {}
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, selectedRoles]); // watch the whole form

  // Also save on pagehide as a fallback
  useEffect(() => {
    if (!requestId) return;
    const saveOnHide = () => {
      try {
        const payload = { ts: Date.now(), data: getValues() };
        localStorage.setItem(draftKey(requestId), JSON.stringify(payload));
      } catch {}
    };
    window.addEventListener('pagehide', saveOnHide);
    return () => window.removeEventListener('pagehide', saveOnHide);
  }, [requestId, getValues]);

  useEffect(() => {
    if (!requestDetails || isHydratingRef.current) return; // 👈 don't autosave while hydrating
    const timeoutId = setTimeout(() => {
      const formData = watch();
      if (!formData || Object.keys(formData).length === 0) return;
      const sk = stableStorageKey();
      if (!sk) return;
      localStorage.setItem(sk, JSON.stringify(formData));
      console.log('💾 Auto-saving Select Roles form data:', { storageKey: sk, formData });
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [watch(), requestDetails]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Handle saving form data when navigating back (explicit click)
  const handleBackToMainForm = () => {
    if (requestId) {
      const currentFormData = getValues();
      localStorage.setItem(
        draftKey(requestId),
        JSON.stringify({ ts: Date.now(), data: currentFormData })
      );
      console.log('💾 Saving role selections before navigation (local draft):', {
        key: draftKey(requestId),
        currentFormData,
      });
      const sk = stableStorageKey();
      if (sk) {
        localStorage.setItem(sk, JSON.stringify(currentFormData));
        console.log('💾 Saving role selections (stable key):', { key: sk, currentFormData });
      }
    } else {
      console.log('🚫 Not saving role selections (no requestId)');
    }
  };

  // --- mount flow -----------------------------------------------------------
  
  // FIXED: Check for copy flow FIRST, before any requestId validation
  useEffect(() => {
    const isCopyFlow = localStorage.getItem('editingCopiedRoles') === 'true';

    if (isCopyFlow) {
      console.log('🔄 Copy flow detected in SelectRolesPage');
      const pendingFormData = localStorage.getItem('pendingFormData');
      const copiedRoleSelections = localStorage.getItem('copiedRoleSelections');
      const copiedUserDetails = localStorage.getItem('copiedUserDetails');

      if (pendingFormData && copiedRoleSelections && copiedUserDetails) {
        setIsEditingCopiedRoles(true);
        try {
          const formData: CopyFlowForm = JSON.parse(pendingFormData);
          const roleData = JSON.parse(copiedRoleSelections);
          
          console.log('🔄 Loading copy flow data:', { formData, roleData });
          
          setRequestDetails({ 
            employee_name: formData.employeeName, 
            agency_name: formData.agencyName, 
            agency_code: formData.agencyCode 
          });

          // Map copied role data to form fields
          if (roleData) {
            Object.entries(roleData).forEach(([key, value]) => {
              if (typeof value === 'boolean' && value === true) {
                // Convert snake_case to camelCase for form fields
                const camelKey = snakeToCamel(key);
                setValue(camelKey as any, value, { shouldDirty: false });
              } else if (typeof value === 'string' && value.trim()) {
                const camelKey = snakeToCamel(key);
                setValue(camelKey as any, value, { shouldDirty: false });
              } else if (Array.isArray(value) && value.length > 0) {
                const camelKey = snakeToCamel(key);
                setValue(camelKey as any, value.join(', '), { shouldDirty: false });
              }
            });

            // Handle home_business_unit specially for MultiSelect
            if (roleData.home_business_unit) {
              const homeBU = Array.isArray(roleData.home_business_unit) 
                ? roleData.home_business_unit 
                : [roleData.home_business_unit];
              setValue('homeBusinessUnit' as any, homeBU, { shouldDirty: false });
            }
          }

          // Mark hydration as complete
          setTimeout(() => {
            isHydratingRef.current = false;
          }, 100);

          console.log('✅ Copy flow data loaded successfully');
        } catch (e) {
          console.error('Error loading copy-flow data:', e);
          toast.error('Error loading copied user data');
          // Clean up and redirect
          localStorage.removeItem('editingCopiedRoles');
          localStorage.removeItem('pendingFormData');
          localStorage.removeItem('copiedRoleSelections');
          localStorage.removeItem('copiedUserDetails');
          navigate('/');
        }
      } else {
        // Missing copy flow data, clean up and redirect
        console.error('Copy flow data is incomplete:', { 
          hasPendingFormData: !!pendingFormData,
          hasCopiedRoleSelections: !!copiedRoleSelections,
          hasCopiedUserDetails: !!copiedUserDetails
        });
        localStorage.removeItem('editingCopiedRoles');
        localStorage.removeItem('pendingFormData');
        localStorage.removeItem('copiedRoleSelections');
        localStorage.removeItem('copiedUserDetails');
        toast.error('Copy flow data is incomplete. Please try again.');
        navigate('/');
      }
      return; // Exit early for copy flow
    }

    // Normal flow: check for requestId
    (async () => {
      const stateRequestId = (location as any)?.state?.requestId;
      const effectiveId = stateRequestId || (idParam as string | null);
  
      if (!effectiveId) {
        toast.error('Please complete the main form first before selecting roles.');
        navigate('/');
        return;
      }
  
      setRequestId(effectiveId);
  
      // 1) Load header details and capture them immediately
      const details = await fetchRequestDetails(effectiveId);
  
      // 2) Try restoring from a stable, person+agency local draft USING those details
      const restoredStable = restoreFromStableDraftFor(details);
  
      // 3) If nothing to restore locally, hydrate from DB
      if (!restoredStable) {
        await fetchExistingSelections(effectiveId);
      }
  
      // 4) Always overlay any legacy id-scoped local draft for backwards compatibility
      restoreFromLocalDraft(effectiveId);
  
      // 5) Sync RHF defaults to the UI and open autosave gate
      setTimeout(() => {
        const snap = getValues();
        reset(snap);
        isHydratingRef.current = false; // 👈 now autosave may run
        console.log('🔁 Final sync after all hydration layers; autosave enabled:', snap);
      }, 0);
    })();
  }, [location.state, idParam, navigate, reset, setValue, getValues, clearErrors]);

  // Submit
  const onSubmit = async (data: SecurityRoleSelection) => {
    // Handle copy flow submission
    if (isEditingCopiedRoles) {
      const pendingFormData = localStorage.getItem('pendingFormData');
      if (!pendingFormData) {
        toast.error('No pending form data found');
        return;
      }

      setSaving(true);
      try {
        const formData: CopyFlowForm = JSON.parse(pendingFormData);
        const d: CopyFlowForm = JSON.parse(pendingFormData);
        if (!d) throw new Error('Invalid pending form data');
        
        const pocUser = localStorage.getItem('pocUserName');

        // Create new request
        const requestPayload = {
          start_date: d.startDate || new Date().toISOString().split('T')[0],
          employee_name: d.employeeName,
          employee_id: d.employeeId || null,
          is_non_employee: !!d.isNonEmployee,
          work_location: d.workLocation || null,
          work_phone: d.workPhone ? d.workPhone.replace(/\D/g, '') : null,
          email: d.email || 'placeholder@example.com',
          agency_name: d.agencyName,
          agency_code: d.agencyCode,
          justification: d.justification || null,
          submitter_name: d.submitterName || 'Unknown Submitter',
          submitter_email: d.submitterEmail || 'submitter@example.com',
          supervisor_name: d.supervisorName || 'Unknown Supervisor',
          supervisor_email: d.supervisorUsername || 'supervisor@example.com',
          security_admin_name: d.securityAdminName || 'Unknown Security Admin',
          security_admin_email: d.securityAdminUsername || 'security@example.com',
          status: 'pending',
          poc_user: pocUser,
        };

        const { data: newRequest, error: requestError } = await supabase
          .from('security_role_requests')
          .insert(requestPayload)
          .select()
          .single();

        if (requestError) throw requestError;

        // Create security area
        const { error: areasError } = await supabase
          .from('security_areas')
          .insert({
            request_id: newRequest.id,
            area_type: 'accounting_procurement',
            director_name: formData.accountingDirector || null,
            director_email: formData.accountingDirectorUsername || null,
          });

        if (areasError) throw areasError;

        // Build and save role selections
        const roleSelectionPayload = buildRoleSelectionData(newRequest.id, data, {
          homeBusinessUnitIsArray: HOME_BU_IS_ARRAY,
        });

        const cleaned = coerceBooleansDeep(roleSelectionPayload);
        const normalized = normalizeRoleFlagsTrueOnly(cleaned);

        const { error: selectionsError } = await supabase
          .from('security_role_selections')
          .insert(normalized);

        if (selectionsError) throw selectionsError;

        // Clean up copy flow data
        localStorage.removeItem('pendingFormData');
        localStorage.removeItem('editingCopiedRoles');
        localStorage.removeItem('copiedRoleSelections');
        localStorage.removeItem('copiedUserDetails');

        toast.success('Role selections saved successfully!');
        navigate('/success', { state: { requestId: newRequest.id } });
      } catch (error: any) {
        console.error('Error saving copy flow role selections:', error);
        toast.error(`Failed to save role selections: ${error?.message || 'Unknown error'}`);
      } finally {
        setSaving(false);
      }
      return;
    }

    // Normal flow validation
    // Require at least one BU
    const homeVal: any = (data as any).homeBusinessUnit;
    if (!homeVal || (Array.isArray(homeVal) && homeVal.length === 0)) {
      setError('homeBusinessUnit' as any, {
        type: 'manual',
        message: 'Home Business Unit is required. Please select at least one business unit.',
      });
      toast.error('Please select at least one Home Business Unit.');
      homeBusinessUnitRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Require at least one role selected
    const anyRole = Object.entries((data as any) || {}).some(
      ([, value]) => typeof value === 'boolean' && value === true
    );
    if (!anyRole) {
      toast.error('Please select at least one role.');
      return;
    }

    if (!requestId) {
      navigate('/');
      return;
    }

    setSaving(true);

    try {
      // Build payload with arrays parsed for TEXT[] columns
      const rawPayload = buildRoleSelectionData(requestId, data, {
        homeBusinessUnitIsArray: HOME_BU_IS_ARRAY,
      });

      // Coerce any sneaky "on"/["on","on"] values → booleans
      const cleaned = coerceBooleansDeep(rawPayload);
      const normalized = normalizeRoleFlagsTrueOnly(cleaned);

      const { error } = await supabase
        .from('security_role_selections')
        .upsert(normalized, { onConflict: 'request_id' });

      if (error) throw error;

      // ✅ Clear local draft on successful save
      try {
        localStorage.removeItem(draftKey(requestId));
      } catch {}

      toast.success('Role selections saved successfully!');
      navigate('/success', { state: { requestId } });
    } catch (error: any) {
      console.error('Error saving role selections:', error);
      const errorMessage = error?.message || 'Unknown error occurred';

      if (
        error instanceof Error &&
        error.message.includes('home_business_unit') &&
        (error.message.includes('not-null') || error.message.includes('null value'))
      ) {
        setError('homeBusinessUnit' as any, {
          type: 'manual',
          message: 'Home Business Unit is required. Please select at least one business unit.',
        });
      } else {
        toast.error(`Failed to save role selections: ${errorMessage}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const ssTemplateRows = ['Business unit template', 'Department template', 'Personal template'];
  const ssActions = ['Create', 'Update', 'Delete'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Accounting / Procurement Role Selection"
        subtitle="Select specific roles and permissions for accounting and procurement access"
      />

      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link
              to="/"
              onClick={handleBackToMainForm}
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
                      Request for: <strong>{requestDetails?.employee_name}</strong> at{' '}
                      <strong>{requestDetails?.agency_name}</strong>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
              {/* Business Unit Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Business Unit Information
                </h3>

                <div ref={homeBusinessUnitRef}>
                  <MultiSelect
                    options={businessUnitOptions}
                    value={watch('homeBusinessUnit' as any) || []}
                    onChange={handleBusinessUnitChange}
                    placeholder="Select business units..."
                    label="Home Business Unit"
                    required
                    error={(errors as any).homeBusinessUnit?.message}
                    searchPlaceholder="Search business units..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Selected Business Units:
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {(() => {
                      const watchedValue: any = watch('homeBusinessUnit' as any);
                      const businessUnitsArray = Array.isArray(watchedValue)
                        ? watchedValue
                        : watchedValue
                        ? [watchedValue]
                        : [];
                      return (
                        businessUnitsArray
                          .map((code: string) => {
                            const unit = businessUnits.find((u) => u.businessUnit === code);
                            return unit ? `${unit.description} (${unit.businessUnit})` : code;
                          })
                          .join(', ') || 'None selected'
                      );
                    })()}
                  </p>
                </div>
              </div>

              {/* Accounts Payable — unified single table */}
              <div className="space-y-6">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    {/* Top blue header */}
                    <thead style={{ backgroundColor: '#003865' }}>
                      <tr>
                        <th
                          scope="col"
                          colSpan={2}
                          className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                        >
                          ACCOUNTS PAYABLE (AP)
                          <br />
                          <span className="normal-case font-normal">
                            (See also Vendor and Purchasing below)
                          </span>
                        </th>
                      </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                      {/* AP basic role checkboxes */}
                      <tr>
                        <td className="px-6 py-4" colSpan={2}>
                          <div className="grid grid-cols-2 gap-6">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                {...register('voucherEntry' as any)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">Voucher Entry</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                {...register('maintenanceVoucherBuildErrors' as any)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                Maintenance of Voucher Build Errors
                              </span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                {...register('matchOverride' as any)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">Match Override</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                {...register('apInquiryOnly' as any)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">Accounts Payable Inquiry Only</span>
                            </label>
                          </div>
                        </td>
                      </tr>

                      {/* In-table blue subheader for Workflow Roles */}
                      <tr>
                        <th
                          colSpan={2}
                          className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                          style={{ backgroundColor: '#003865' }}
                        >
                          WORKFLOW ROLES
                        </th>
                      </tr>

                      {/* Workflow header row */}
                      <tr>
                        <td className="px-4 py-2 bg-gray-100 font-medium text-sm w-56 whitespace-nowrap">
                          Role
                        </td>
                        <td className="px-4 py-2 bg-gray-100 font-medium text-sm">
                          Route Controls: Financial Department ID(s)
                          <div className="text-xs italic text-gray-600 mt-1">
                            (8 characters each; separate with commas || new lines)
                          </div>
                        </td>
                      </tr>

                      {/* Voucher Approver 1 */}
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('apVoucherApprover1' as any)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            Voucher Approver 1
                          </label>
                        </td>
                        <td className="px-4 py-3">
                          <textarea
                            rows={2}
                            {...register('apVoucherApprover1RouteControls' as any, {
                              setValueAs: (v: string) =>
                                (v ?? '')
                                  .split(/[,\s]+/)
                                  .map(s => s.trim().toUpperCase())
                                  .filter(Boolean)
                                  .join(','),
                            })}
                            placeholder="e.g. 12345678, 23456789 (or one per line)"
                            className="w-full md:w-3/4 rounded-md border border-gray-300 bg-gray-50 text-sm text-gray-700 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </td>
                      </tr>

                      {/* Voucher Approver 2 */}
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('apVoucherApprover2' as any)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            Voucher Approver 2
                          </label>
                        </td>
                        <td className="px-4 py-3">
                          <textarea
                            rows={2}
                            {...register('apVoucherApprover2RouteControls' as any, {
                              setValueAs: (v: string) =>
                                (v ?? '')
                                  .split(/[,\s]+/)
                                  .map(s => s.trim().toUpperCase())
                                  .filter(Boolean)
                                  .join(','),
                            })}
                            placeholder="e.g. 12345678, 23456789 (or one per line)"
                            className="w-full md:w-3/4 rounded-md border border-gray-300 bg-gray-50 text-sm text-gray-700 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </td>
                      </tr>

                      {/* Voucher Approver 3 */}
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('apVoucherApprover3' as any)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            Voucher Approver 3
                          </label>
                        </td>
                        <td className="px-4 py-3">
                          <textarea
                            rows={2}
                            {...register('apVoucherApprover3RouteControls' as any, {
                              setValueAs: (v: string) =>
                                (v ?? '')
                                  .split(/[,\s]+/)
                                  .map(s => s.trim().toUpperCase())
                                  .filter(Boolean)
                                  .join(','),
                            })}
                            placeholder="e.g. 12345678, 23456789 (or one per line)"
                            className="w-full md:w-3/4 rounded-md border border-gray-300 bg-gray-50 text-sm text-gray-700 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Accounts Receivable (AR) and Cash Management (CM) */}
              <div className="space-y-6">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead style={{ backgroundColor: '#003865' }}>
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                          colSpan={3}
                        >
                          ACCOUNTS RECEIVABLE (AR) AND CASH MANAGEMENT (CM)
                          <br />
                          <span className="normal-case font-normal">
                            (See also General Ledger below for nVision reporting.)
                          </span>
                        </th>
                      </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                      {/* Row 1 */}
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('cashMaintenance' as any)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2">
                              Cash Maintenance
                              <br />
                              <em className="text-gray-600">(Payment Processing)</em>
                            </span>
                          </label>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('receivableSpecialist' as any)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2">
                              <em>Receivable Specialist</em>
                              <br />
                              <em className="text-gray-600">(Account Maintenance)</em>
                            </span>
                          </label>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-900">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('receivableSupervisor' as any)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2">Receivable Supervisor*</span>
                          </label>
                        </td>
                      </tr>

                      {/* Row 2 */}
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('billingCreate' as any)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2">Billing Create</span>
                          </label>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('billingSpecialist' as any)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2">
                              <em>Billing Specialist</em>
                            </span>
                          </label>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-900">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('billingSupervisor' as any)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2">
                              <em>Billing Supervisor*</em>
                            </span>
                          </label>
                        </td>
                      </tr>

                      {/* Row 3 */}
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('customerMaintenanceSpecialist' as any)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2">
                              Customer Maintenance
                              <br />
                              Specialist
                            </span>
                          </label>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('arBillingSetup' as any)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2">AR/Billing Setup</span>
                          </label>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-900">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('arBillingInquiryOnly' as any)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2">Receivable &amp; Billing Inquiry Only</span>
                          </label>
                        </td>
                      </tr>

                      {/* Row 4 - Cash Management Inquiry Only spans all columns */}
                      <tr>
                        <td colSpan={3} className="px-6 py-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('cashManagementInquiryOnly' as any)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2">
                              <em>Cash Management Inquiry Only</em>
                            </span>
                          </label>
                        </td>
                      </tr>

                      {/* Supervisor note */}
                      <tr>
                        <td colSpan={3} className="px-6 py-4">
                          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                            <p className="text-sm text-blue-800">
                              <strong>
                                * One type of approval power is available with each supervisor role. If approval power is needed, complete the applicable row(s) in Workflow section below.
                              </strong>
                            </p>
                          </div>
                        </td>
                      </tr>

                      {/* Workflow subheader */}
                      <tr>
                        <th
                          colSpan={3}
                          className="px-6 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider"
                          style={{ backgroundColor: '#003865' }}
                        >
                          Workflow for the supervisor roles
                        </th>
                      </tr>

                      {/* Single header row */}
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 w-64 whitespace-nowrap">
                          Role
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700" colSpan={2}>
                          Route Controls: Business unit(s)
                          <div className="text-xs italic text-gray-600 mt-1">
                            (5 characters each; separate with commas || new lines)
                          </div>
                        </th>
                      </tr>

                      {/* Billing Supervisor row with checkbox + BU textarea */}
                      <tr>
                        <td className="px-4 py-3 border-r border-gray-200">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('billingSupervisor' as any)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            <span className="text-sm text-gray-700 whitespace-nowrap">
                              <em>Billing Supervisor:</em> Credit invoice approval
                            </span>
                          </label>
                        </td>
                        <td className="px-4 py-3" colSpan={2}>
                          <textarea
                            {...register('creditInvoiceApprovalBusinessUnits' as any)}
                            rows={2}
                            placeholder="e.g. 12345, 23456 (or one per line)"
                            className="w-80 px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                          />
                        </td>
                      </tr>

                      {/* Receivable Supervisor row with checkbox + BU textarea */}
                      <tr>
                        <td className="px-4 py-3 border-r border-gray-200">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('receivableSupervisor' as any)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            <span className="text-sm text-gray-700 whitespace-nowrap">
                              <em>Receivable Supervisor:</em> Write-off approval
                            </span>
                          </label>
                        </td>
                        <td className="px-4 py-3" colSpan={2}>
                          <textarea
                            {...register('writeoffApprovalBusinessUnits' as any)}
                            rows={2}
                            placeholder="e.g. 12345, 23456 (or one per line)"
                            className="w-80 px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Budgets/Commitment Control & Appropriation Maintenance */}
              <div className="space-y-6">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead style={{ backgroundColor: '#003865' }}>
                      <tr>
                        <th
                          colSpan={6}
                          className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                        >
                          BUDGETS/COMMITMENT CONTROL (KK) &amp; APPROPRIATION MAINTENANCE APPLICATION "(A)"
                          <br />
                          <span className="normal-case font-normal">
                            "(A)" denotes roles that provide access to Appropriation Maintenance Application.
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        {/* span the full table width */}
                        <td className="px-6 py-4" colSpan={6}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 w-full">
                            {[
                              ['budgetJournalEntryOnline', 'Budget Journal Entry Online (A)'],
                              ['budgetJournalLoad', 'Budget Journal Load'],
                              ['journalApproverAppr', 'Journal Approver — Appropriation (A) *'],
                              ['journalApproverExp',  'Journal Approver — Expense Budget *'],
                              ['journalApproverRev',  'Journal Approver — Revenue Budget *'],
                              ['budgetTransferEntryOnline', 'Budget Transfer Entry Online'],
                              ['transferApprover', 'Transfer Approver *'],
                              ['budgetInquiryOnly', 'Budget Inquiry Only'],
                            ].map(([key, label]) => (
                              <label key={key} className="flex items-center w-full">
                                <input
                                  type="checkbox"
                                  {...register(key as any)}
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">{label}</span>
                              </label>
                            ))}
                          </div>
                        </td>
                      </tr>

                      {/* Callout above Workflow for the approver roles */}
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900" colSpan={6}>
                          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                            <p className="text-sm text-blue-800">
                              <strong>* If selecting either approver role, complete the applicable row(s) in the Workflow section below.</strong>
                            </p>
                          </div>
                        </td>
                      </tr>

                      {/* WORKFLOW FOR THE APPROVER ROLES */}
                      <tr>
                        <th
                          colSpan={6}
                          className="px-6 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider"
                          style={{ backgroundColor: '#0f2f54' }}
                        >
                          WORKFLOW FOR THE APPROVER ROLES
                        </th>
                      </tr>

                      {/* Column headers */}
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 w-64">
                          Role
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700" colSpan={5}>
                          Route Controls: Business unit(s)
                        </th>
                      </tr>

                      {/* Helper text row */}
                      <tr className="bg-gray-100">
                        <td className="px-4 py-1" />
                        <td className="px-4 py-1 text-left text-xs text-gray-600 italic" colSpan={5}>
                          (5 characters each; separate with commas || new lines)
                        </td>
                      </tr>

                      {/* Journal Approver – Appropriation (A) */}
                      <tr>
                        <td className="px-4 py-3 text-[15px] text-gray-800">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('journalApproverAppr' as any)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            <span className="whitespace-nowrap">Journal Approver – Appropriation (A)</span>
                          </label>
                        </td>
                        <td className="px-4 py-3" colSpan={5}>
                          <textarea
                            {...register('journalApprovalA' as any)}
                            placeholder="e.g. 12345, 23456 (or one per line)"
                            className={`w-full min-h-[40px] ${inputStd} resize-y`}
                          />
                        </td>
                      </tr>

                      {/* Transfer Approver */}
                      <tr>
                        <td className="px-4 py-3 text-[15px] text-gray-800">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('transferApprover' as any)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            <span className="whitespace-nowrap">Transfer Approver – Appropriation</span>
                          </label>
                        </td>
                        <td className="px-4 py-3" colSpan={5}>
                          <textarea
                            {...register('transferApproval' as any)}
                            placeholder="e.g. 12345, 23456 (or one per line)"
                            className={`w-full min-h-[40px] ${inputStd} resize-y`}
                          />
                        </td>
                      </tr>

                      {/* Journal Approver – Expense Budget */}
                      <tr>
                        <td className="px-4 py-3 text-[15px] text-gray-800">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('journalApproverExp' as any)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            <span className="whitespace-nowrap">Journal Approver – Expense Budget</span>
                          </label>
                        </td>
                        <td className="px-4 py-3" colSpan={5}>
                          <textarea
                            {...register('journalApprovalExpense' as any)}
                            placeholder="e.g. 12345, 23456 (or one per line)"
                            className={`w-full min-h-[40px] ${inputStd} resize-y`}
                          />
                        </td>
                      </tr>

                      {/* Journal Approver – Revenue Budget */}
                      <tr>
                        <td className="px-4 py-3 text-[15px] text-gray-800">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('journalApproverRev' as any)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            <span className="whitespace-nowrap">Journal Approver – Revenue Budget</span>
                          </label>
                        </td>
                        <td className="px-4 py-3" colSpan={5}>
                          <textarea
                            {...register('journalApprovalRevenue' as any)}
                            placeholder="e.g. 12345, 23456 (or one per line)"
                            className={`w-full min-h-[40px] ${inputStd} resize-y`}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* General Ledger (GL) and nVision Reporting */}
              <div className="space-y-6">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    {/* Top blue header */}
                    <thead style={{ backgroundColor: '#003865' }}>
                      <tr>
                        <th
                          colSpan={3}
                          className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                        >
                          GENERAL LEDGER (GL) AND NVISION REPORTING
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {/* Row 1 */}
                      <tr>
                        <td className="px-4 py-3">
                          <label className="inline-flex items-center">
                            <input type="checkbox" {...register('journalEntryOnline' as any)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="ml-2 text-sm text-gray-800">Journal Entry Online</span>
                          </label>
                        </td>
                        <td className="px-4 py-3">
                          <label className="inline-flex items-center">
                            <input type="checkbox" {...register('journalLoad' as any)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="ml-2 text-sm text-gray-800">Journal Load</span>
                          </label>
                        </td>
                        <td className="px-4 py-3">
                          <label className="inline-flex items-center">
                            <input type="checkbox" {...register('agencyChartfieldMaintenance' as any)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="ml-2 text-sm text-gray-800">Agency Chartfield Maintenance</span>
                          </label>
                        </td>
                      </tr>

                      {/* Row 2 */}
                      <tr>
                        <td className="px-4 py-3">
                          <label className="inline-flex items-start">
                            <input type="checkbox" {...register('glAgencyApprover' as any)} className="mt-0.5 h-4 w-4  rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="ml-2 text-sm text-gray-800">
                              GL Agency Approver
                              <span className="block text-gray-600">(complete Workflow section below)</span>
                            </span>
                          </label>
                        </td>
                        <td className="px-4 py-3">
                          <label className="inline-flex items-center">
                            <input type="checkbox" {...register('generalLedgerInquiryOnly' as any)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="ml-2 text-sm text-gray-800">General Ledger Inquiry Only</span>
                          </label>
                        </td>
                        <td className="px-4 py-3" />
                      </tr>

                      {/* Row 3 – nVision + Daily Receipts Yes/No */}
                      <tr>
                        <td className="px-4 py-3">
                          <label className="inline-flex items-center">
                            <input type="checkbox" {...register('nvisionReportingAgencyUser' as any)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="ml-2 text-sm text-gray-800">nVision Reporting Agency User</span>
                          </label>
                        </td>
                        <td colSpan={2} className="px-4 py-3">
                          <div className="flex items-center flex-wrap gap-3 text-sm text-gray-800">
                            <span>Does the user need to run the Daily Receipts Report?</span>
                            <label className="inline-flex items-center">
                              <input
                                type="checkbox"
                                {...register('needsDailyReceiptsYes' as any, {
                                  onChange: () => setDailyReceipts('yes'),
                                })}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2">Yes</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="checkbox"
                                {...register('needsDailyReceiptsNo' as any, {
                                  onChange: () => setDailyReceipts('no'),
                                })}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2">No</span>
                            </label>
                          </div>
                        </td>
                      </tr>

                      {/* Workflow subheader */}
                      <tr>
                        <th
                          colSpan={3}
                          className="px-6 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider"
                          style={{ backgroundColor: '#003865' }}
                        >
                          WORKFLOW
                        </th>
                      </tr>

                      {/* Workflow row: GL Agency Approver + Route Controls (Sources) */}
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Role</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700" colSpan={2}>
                          Route Controls: Agency code(s) (3 characters each)
                          <br />
                          <span className="text-xs italic text-gray-500">
                            e.g. ABC, XYZ (or one per line)
                          </span>
                        </th>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              {...register('glAgencyApprover' as any)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-800">GL Agency Approver</span>
                          </label>
                        </td>
                        <td colSpan={2} className="px-4 py-3">
                          <textarea
                            {...register('glAgencyApproverSources' as any)}
                            rows={2}
                            placeholder="e.g. ABC, XYZ (or one per line)"
                            className="w-80 px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Grants */}
              <div className="space-y-6">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead style={{ backgroundColor: '#003865' }}>
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider" colSpan="3">
                          GRANTS (GM)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('awardDataEntry')}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            Award Data Entry
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('grantFiscalManager')}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            Grant Fiscal Manager
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('programManager')}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            Program Manager
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('gmAgencySetup')}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            GM Agency Setup
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('grantsInquiryOnly')}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            Grants Inquiry Only
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {/* Empty cell to maintain 3-column layout */}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Project Costing */}
              <div className="space-y-6">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead style={{ backgroundColor: '#003865' }}>
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                          colSpan={3}
                        >
                          PROJECT COSTING (PR)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('federalProjectInitiator')}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            <span className="text-sm text-gray-900">Federal Project Initiator</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('oimInitiator')}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            <span className="text-sm text-gray-900">OIM Initiator</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('projectInitiator')}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            <span className="text-sm text-gray-900">
                              Project Initiator <br />(MNDOT Project Manager)
                            </span>
                          </div>
                        </td>
                      </tr>
              
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('projectManager')}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            <span className="text-sm text-gray-900">Project Manager</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('capitalProgramsOffice')}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            <span className="text-sm text-gray-900">Capital Programs Office</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('projectCostAccountant')}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            <span className="text-sm text-gray-900">Project Cost Accountant</span>
                          </div>
                        </td>
                      </tr>
              
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('projectFixedAsset')}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            <span className="text-sm text-gray-900">Project Fixed Asset</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('categorySubcategoryManager')}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            <span className="text-sm text-gray-900">Category and Subcategory Manager</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('projectControlDates')}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            <span className="text-sm text-gray-900">Project Control Dates</span>
                          </div>
                        </td>
                      </tr>
              
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('projectAccountingSystems')}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            <span className="text-sm text-gray-900">Project Accounting Systems</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('mndotProjectsInquiry')}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            <span className="text-sm text-gray-900">MNDOT Projects Inquiry</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('projectsInquiryOnly')}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            <span className="text-sm text-gray-900">Projects Inquiry Only</span>
                          </div>
                        </td>
                      </tr>
              
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900" colSpan={3}>
                          <div className="flex items-center space-x-6">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                {...register('mndotProjectApprover')}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                              />
                              <span className="text-sm text-gray-900">MNDOT Project Approver</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-sm text-gray-700">Route Control:</span>
                              <input
                                type="text"
                                {...register('routeControl')}
                                className="px-3 py-1 border border-gray-300 rounded text-sm w-36"
                                placeholder="Route Control"
                              />
                            </div>
                            <span className="text-sm text-gray-700">Business Unit: BUT7901.</span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cost Allocation */}
              <div className="space-y-6">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead style={{ backgroundColor: '#003865' }}>
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          COST ALLOCATION ROLES
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4">
                          <label className="flex items-center">
                            <input type="checkbox" {...register('costAllocationInquiryOnly')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="ml-2 text-sm text-gray-700">Cost Allocation Inquiry Only</span>
                          </label>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Asset Management */}
              <div className="space-y-6">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead style={{ backgroundColor: '#003865' }}>
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider" colSpan="2">
                          ASSET MANAGEMENT (AM)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900" colSpan="2">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('financialAccountantAssets')}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            Financial Accountant - Assets
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900" colSpan="2">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('assetManagementInquiryOnly')}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            Asset Management Inquiry Only
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900" colSpan="2">
                          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                            <p className="text-sm text-blue-800">
                              <strong>* If approvals are needed also fill out the Workflow section below.</strong>
                            </p>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider" colSpan="2" style={{ backgroundColor: '#003865' }}>
                          Workflow roles
                        </th>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 bg-gray-100 font-medium text-sm border-r border-gray-300 w-1/2">Role</td>
                        <td className="px-4 py-2 bg-gray-100 font-medium text-sm w-1/2">Route Controls</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 border-r border-gray-300 text-sm text-gray-900">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('physicalInventoryApproval1')}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            Physical Inventory Approval 1
                          </div>
                        </td>
                        {/* Physical Inventory Approval 1 – Business Units (multi) */}
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div>
                            <span className="text-sm text-gray-700">Route Controls: Business unit(s)</span>
                            <p className="mt-1 text-xs italic text-gray-500">
                              (5 characters each; separate with commas || new lines)
                            </p>
                            <textarea
                              {...register('physicalInventoryBusinessUnits')}
                              rows={2}
                              placeholder="e.g. 12345, 23456 (or one per line)"
                              className="w-full h-16 px-3 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                            />
                          </div>
                        </td>

                      </tr>
                      <tr>
                        <td className="px-4 py-3 border-r border-gray-300 text-sm text-gray-900">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              {...register('physicalInventoryApproval2')}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                            />
                            Physical Inventory Approval 2 (department transfers)
                          </div>
                        </td>
                        {/* Physical Inventory Approval 2 – Department IDs (multi) */}
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div>
                            <span className="text-sm text-gray-700">Route Controls: Department ID(s)</span>
                            <p className="mt-1 text-xs italic text-gray-500">
                              (8 characters each; separate with commas || new lines)
                            </p>
                            <textarea
                              {...register('physicalInventoryDepartmentIds')}
                              rows={2}
                              placeholder="e.g. 12345678, 23456789 (or one per line)"
                              className="w-full h-16 px-3 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                            />
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Procurement header */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Procurement Role Selections</h3>
              </div>

              {/* Vendor Section */}
              <div className="space-y-6">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-green-600">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">VENDOR (VND)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4">
                          <div className="grid grid-cols-2 gap-6">
                            <label className="flex items-center">
                              <input type="checkbox" {...register('vendorRequestAddUpdate')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                              <span className="ml-2 text-sm text-gray-700">Vendor Request Add/Update</span>
                            </label>
                            <label className="flex items-center">
                              <input type="checkbox" {...register('vendorInquiryOnly')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                              <span className="ml-2 text-sm text-gray-700">Vendor Inquiry Only</span>
                            </label>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Combined PO/ePRO + Workflow Role Table */}
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg mb-6">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-green-600">
                    <tr>
                      <th colSpan={2} className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        PURCHASING (PO) & ePROCUREMENT (ePRO) (See also Accounts Payable above)
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td colSpan={2} className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <label className="flex items-start">
                              <input type="checkbox" {...register('poEproBuyer')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1" />
                              <span className="ml-3 text-sm text-gray-700">PO/ePRO Buyer</span>
                            </label>

                            <label className="flex items-start">
                              <input type="checkbox" {...register('contractEncumbrance')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1" />
                              <span className="ml-3 text-sm text-gray-700">Contract Encumbrance</span>
                            </label>
                          </div>

                          <div className="bg-gray-50 p-4 rounded">
                            <div className="text-sm text-gray-700 mb-3">
                              <strong>Defaults:</strong> <em>Location is required; all others optional.</em>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <label className="text-sm text-gray-700">Location Code (required):</label>
                                <input type="text" {...register('poLocationCode')} className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm w-32" />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-sm text-gray-700">Ship To</label>
                                  <input type="text" {...register('poShipTo')} className="block w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1" />
                                </div>
                                <div>
                                  <label className="text-sm text-gray-700">Origin (3 characters)</label>
                                  <input type="text" {...register('poOrigin')} maxLength={3} className="block w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-6">
                          <label className="flex items-start">
                            <input type="checkbox" {...register('purchaseOrderDataEntry')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1" />
                            <span className="ml-3 text-sm text-gray-700">Purchase Order Data Entry Only</span>
                          </label>

                          <div className="bg-gray-50 p-4 rounded">
                            <div className="text-sm text-gray-700 mb-3">
                              <strong>Defaults:</strong> <em>Location is required; all others optional.</em>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <label className="text-sm text-gray-700">Location Code (required)</label>
                                <input type="text" {...register('poDataEntryLocationCode')} className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm w-32" />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-sm text-gray-700">Ship To</label>
                                  <input type="text" {...register('poDataEntryShipTo')} className="block w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1" />
                                </div>
                                <div>
                                  <label className="text-sm text-gray-700">Origin (3 characters)</label>
                                  <input type="text" {...register('poDataEntryOrigin')} maxLength={3} className="block w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={2} className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-6">
                          <label className="flex items-start">
                            <input type="checkbox" {...register('eproRequisitionRequester')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1" />
                            <span className="ml-3 text-sm text-gray-700">ePRO Requisition Requester</span>
                          </label>

                          <div className="bg-gray-50 p-4 rounded">
                            <div className="text-sm text-gray-700 mb-3">
                              <strong>Default chartfield values:</strong>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <label className="text-[13px] text-gray-700">Fund</label>
                                <input type="text" {...register('eproFund')} className="block w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1" />
                              </div>
                              <div>
                                <label className="text-[13px] text-gray-700">Fin. Department ID (8 characters; 4th char must be 3, 4, || 5)</label>
                                <input type="text" {...register('eproFinDepartmentId')} maxLength={8} className="block w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1" />
                              </div>
                              <div>
                                <label className="text-[13px] text-gray-700">Appropriation ID (7 characters)</label>
                                <input type="text" {...register('eproAppropriationId')} maxLength={7} className="block w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1" />
                              </div>
                              <div>
                                <label className="text-xs text-gray-700">Agency Cost</label>
                                <input type="text" {...register('eproAgencyCost1')} className="block w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Additional procurement roles */}
                    <tr>
                      <td colSpan={2} className="px-6 py-4">
                        <div className="grid grid-cols-3 gap-6">
                          <label className="flex items-center">
                            <input type="checkbox" {...register('poAccountingCoordinator')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="ml-2 text-sm text-gray-700">PO Accounting Coordinator</span>
                          </label>
                          <label className="flex items-center">
                            <input type="checkbox" {...register('coreOrderReceiver')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="ml-2 text-sm text-gray-700">CORE Order Receiver</span>
                          </label>
                          <label className="flex items-center">
                            <input type="checkbox" {...register('poInquiryOnly')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="ml-2 text-sm text-gray-700">PO Inquiry Only</span>
                          </label>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={2} className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-6">
                          <label className="flex items-center">
                            <input type="checkbox" {...register('eproRequisitionInquiryOnly')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="ml-2 text-sm text-gray-700">ePRO Requisition Inquiry Only</span>
                          </label>
                        </div>
                      </td>
                    </tr>

                    {/* Workflow subheader */}
                    <tr>
                      <th colSpan={2} className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider bg-green-700">
                        Workflow Roles
                      </th>
                    </tr>

                    {/* PO Approver workflow */}
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-700 w-1/3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('poApprover')}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                          />
                          PO Approver
                        </label>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <label className="text-sm text-gray-700">
                            Route Controls: Financial Department ID(s) (8 characters each)
                          </label>
                          <input
                            type="text"
                            {...register('poApproverRouteControls')}
                            className="mt-1 block w-full px-3 py-1 border border-gray-300 rounded text-sm"
                            placeholder="e.g. 123A5678, 234B5678 345C5678"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Tip: You can paste multiple IDs. We'll clean & split them for you.
                          </p>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Purchasing Cards (PO) */}
              <div className="space-y-6">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300 border">
                    <thead className="bg-green-600">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Purchasing Cards (PO)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[
                        ['pCardAgencyAdministrator', 'PCard Agency Administrator (includes all PCard Reconciler and Reviewer permissions plus user and agency setup power)'],
                        ['pCardApprover', 'PCard Approver (includes PCard Reconciler and Reviewer permissions plus approval power)'],
                        ['pCardReconciler', 'PCard Reconciler (includes PCard Reviewer permissions plus update power)'],
                        ['pCardReviewer', 'PCard Reviewer (inquiry role; user can add comments and attachments)'],
                      ].map(([key, label]) => (
                        <tr key={key}>
                          <td className="px-6 py-4">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                {...register(key as any)}
                                className="h-4 w-4 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">{label}</span>
                            </label>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Strategic Sourcing (SS) + Catalog Management (CG) */}
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg mb-6">
                <table className="min-w-full border border-gray-300 border-collapse">
                  <thead>
                    <tr>
                      <th
                        colSpan={2}
                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider bg-green-600"
                      >
                        STRATEGIC SOURCING (SS)
                      </th>
                    </tr>
                  </thead>
              
                  <tbody className="bg-white divide-y divide-gray-300">
                    {/* Row 1 */}
                    <tr>
                      {/* Event Creator/Buyer */}
                      <td className="px-6 py-4 border-r border-gray-300">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('ssEventCreatorBuyer')}
                            className="h-4 w-4 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="text-sm text-gray-700 font-medium">Event Creator/Buyer</span>
                          </div>
                        </label>
                        <div className="pl-6 text-sm text-gray-600">
                          Also complete the entire Specific authorizations section below. Every buyer also needs the Event Approver role below.
                        </div>
                      </td>
              
                      {/* Create Vendor Response */}
                      <td className="px-6 py-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('ssCreateVendorResponse')}
                            className="h-4 w-4 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="text-sm text-gray-700 font-medium">Create a Vendor Response (RESPOND)</span>
                          </div>
                        </label>
                      </td>
                    </tr>
              
                    {/* Row 2: three roles */}
                    <tr>
                      <td colSpan={2} className="px-0 py-0">
                        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-300">
                          {/* Event Approver */}
                          <div className="px-6 py-4">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                {...register('ssEventApprover')}
                                className="h-4 w-4 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div>
                                <span className="text-sm text-gray-700 font-medium">Event Approver</span>
                                <div className="text-sm text-gray-600">(Buyer and Ad Hoc)</div>
                              </div>
                            </label>
                          </div>
              
                          {/* Event Collaborator */}
                          <div className="px-6 py-4">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                {...register('ssEventCollaborator')}
                                className="h-4 w-4 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div>
                                <span className="text-sm text-gray-700 font-medium">Event Collaborator</span>
                              </div>
                            </label>
                          </div>
              
                          {/* Event Inquiry Only */}
                          <div className="px-6 py-4">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                {...register('ssEventInquiryOnly')}
                                className="h-4 w-4 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div>
                                <span className="text-sm text-gray-700 font-medium">Event Inquiry Only</span>
                              </div>
                            </label>
                          </div>
                        </div>
                      </td>
                    </tr>
              
                    {/* Specific authorizations header */}
                    <tr>
                      <td colSpan={2} className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider bg-green-600">
                        Specific authorizations: required for all Strategic Sourcing roles.
                      </td>
                    </tr>
              
                    {/* Business units */}
                    <tr>
                      <td colSpan={2} className="px-6 py-4">
                        <label className="flex items-center text-sm text-gray-700">
                          <span className="mr-3">Business unit(s) (5 characters)</span>
                          <input
                            type="text"
                            {...register('ssBusinessUnits')}
                            maxLength={5}
                            className={`${rcInputClasses} w-32`}
                          />
                        </label>
                      </td>
                    </tr>
              
                    {/* Origins */}
                    <tr>
                      <td className="px-6 py-4 border-r border-gray-300">
                        <label className="flex items-center text-sm text-gray-700">
                          <span className="mr-3">Origins: Check here for all origins within the business unit(s)</span>
                          <input
                            type="checkbox"
                            {...register('ssAllOrigins')}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </label>
                      </td>
                      <td className="px-6 py-4">
                        <label className="block text-sm text-gray-700 mb-2">
                          Or enter selected origins (3 characters)
                        </label>
                        <input
                          type="text"
                          {...register('ssSelectedOrigins')}
                          maxLength={3}
                          className={`${rcInputClasses} w-24`}
                        />
                      </td>
                    </tr>
              
                    {/* Defaults */}
                    <tr>
                      <td className="px-6 py-4 border-r border-gray-300">
                        <label className="flex items-center text-sm text-gray-700">
                          <span className="mr-3">Default business unit (optional)</span>
                          <input
                            type="text"
                            {...register('ssDefaultBusinessUnit')}
                            className={`${rcInputClasses} w-32`}
                          />
                        </label>
                      </td>
                      <td className="px-6 py-4">
                        <label className="flex items-center text-sm text-gray-700">
                          <span className="mr-3">Default origin (optional)</span>
                          <input
                            type="text"
                            {...register('ssDefaultOrigin')}
                            className={`${rcInputClasses} w-24`}
                          />
                        </label>
                      </td>
                    </tr>
              
                    {/* Authorized template types */}
                    <tr>
                      <td colSpan={2} className="px-6 py-4">
                        <div className="overflow-x-auto">
                          <table className="min-w-full border border-gray-300 border-collapse divide-y divide-gray-300">
                            <thead>
                              <tr>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                                  Authorized template types for Creator/Buyer role only
                                </th>
                                <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Create?</th>
                                <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Update?</th>
                                <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Delete?</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-300">
                              {ssTemplateRows.map((tmpl) => {
                                const keyBase = tmpl.replace(/\s+/g, '').toLowerCase();
                                return (
                                  <tr key={tmpl}>
                                    <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-300">{tmpl}</td>
                                    {ssActions.map((act) => {
                                      const yesKey = `ss${act}${keyBase}Yes`;
                                      const noKey = `ss${act}${keyBase}No`;
                                      return (
                                        <td key={act} className="px-4 py-2 text-center">
                                          <label className="inline-flex items-center mr-2">
                                            <input
                                              type="checkbox"
                                              {...register(yesKey as any)}
                                              className="h-4 w-4 mr-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            Y
                                          </label>
                                          <label className="inline-flex items-center">
                                            <input
                                              type="checkbox"
                                              {...register(noKey as any)}
                                              className="h-4 w-4 mr-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            N
                                          </label>
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
              
                    {/* Workflow roles */}
                    <tr>
                      <td colSpan={2} className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider bg-green-600">
                        Workflow roles for professional and technical events (routing based on BU(s) and origin(s) above)
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="px-6 py-4 space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('ssTechCoordApprover')}
                            className="h-4 w-4 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="text-sm text-gray-700 font-medium">
                              Professional || Technical Coordinator Approver
                            </span>
                            <div className="text-sm text-gray-600">(first level)</div>
                          </div>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('ssTechStateApprover')}
                            className="h-4 w-4 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="text-sm text-gray-700 font-medium">
                              Professional || Technical State Agency Approver
                            </span>
                            <div className="text-sm text-gray-600">(second level)</div>
                          </div>
                        </label>
                      </td>
                    </tr>
              
                    {/* Grant events */}
                    <tr>
                      <td colSpan={2} className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider bg-green-600">
                        Workflow role for grant events (routing based on BU(s) and origin(s) above)
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="px-6 py-4">
                        <label className="flex items-center">
                          <input 
                            type="checkbox"
                            {...register('ssGrantCoordApprover')}
                            className="h-4 w-4 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="text-sm text-gray-700 font-medium">Grant Coordinator Approver</span>
                            <div className="text-sm text-gray-600">(first level)</div>
                          </div>
                        </label>
                      </td>
                    </tr>
              
                    {/* Catalog Management (CG) */}
                    <tr>
                      <td colSpan={2} className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider bg-green-600">
                        CATALOG MANAGEMENT (CG)
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 border-r border-gray-300">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('cgCatalogOwner')}
                            className="h-4 w-4 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="text-sm text-gray-700 font-medium">Catalog Owner</span>
                          </div>
                        </label>
                      </td>
                      <td className="px-6 py-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('cgInquiryOnly')}
                            className="h-4 w-4 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="text-sm text-gray-700 font-medium">Catalog Management Inquiry Only</span>
                          </div>
                        </label>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Supplier Contracts (SC) */}
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg mb-6">
                <table className="min-w-full border border-gray-300 border-collapse">
                  <thead>
                    <tr>
                      <th
                        colSpan={2}
                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider bg-green-600"
                      >
                        SUPPLIER CONTRACTS (SC)
                      </th>
                    </tr>
                  </thead>
              
                  <tbody className="bg-white divide-y divide-gray-300">
                    {/* Row 1 */}
                    <tr>
                      <td className="px-6 py-4 border-r border-gray-300 space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('scContractAdministrator')}
                            className="h-4 w-4 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Contract Administrator</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('scDocumentAdministrator')}
                            className="h-4 w-4 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Document Administrator</span>
                        </label>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        This user needs to update contracts || documents created by the users listed below.
                        The default is no power to update items created by other users.
                      </td>
                    </tr>
              
                    {/* Supplier Preferences with Upload button */}
                    <tr className="bg-gray-100">
                      <td className="px-4 py-2 font-medium text-sm text-gray-700 border-r border-gray-300">
                        Supplier Contract Preferences
                      </td>
                      <td className="px-4 py-2 flex items-center justify-between">
                        <span className="text-sm text-gray-600">Enter details below || upload.</span>
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Upload Preferences
                        </button>
                      </td>
                    </tr>
              
                    {/* Employee IDs */}
                    <tr>
                      <td className="px-6 py-4 border-r border-gray-300 text-sm text-gray-700">
                        Employee IDs of other users
                      </td>
                      <td className="px-6 py-4">
                        <textarea
                          {...register('scOtherEmployeeIds')}
                          rows={2}
                          className="block w-full rounded-md border-gray-300 bg-gray-50 text-sm text-gray-700 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </td>
                    </tr>
              
                    {/* Names */}
                    <tr>
                      <td className="px-6 py-4 border-r border-gray-300 text-sm text-gray-700">
                        Names of the users
                      </td>
                      <td className="px-6 py-4">
                        <textarea
                          {...register('scOtherEmployeeNames')}
                          rows={2}
                          className="block w-full rounded-md border-gray-300 bg-gray-50 text-sm text-gray-700 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </td>
                    </tr>
              
                    {/* Thin gray separator row */}
                    <tr>
                      <td colSpan={2} className="bg-gray-100 h-2 p-0"></td>
                    </tr>
              
                    {/* Collaborator + right-side roles */}
                    <tr>
                      <td className="px-6 py-4 border-r border-gray-300 whitespace-nowrap">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('scDocumentCollaborator')}
                            className="h-4 w-4 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Document Collaborator</span>
                        </label>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-6">
                          <label className="flex items-center whitespace-nowrap">
                            <input
                              type="checkbox"
                              {...register('scAgreementManager')}
                              className="h-4 w-4 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Agreement (Compliance) Manager</span>
                          </label>
                          <label className="flex items-center whitespace-nowrap pl-6 border-l border-gray-300">
                            <input
                              type="checkbox"
                              {...register('scAgencyLibraryManager')}
                              className="h-4 w-4 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Agency Library Manager</span>
                          </label>
                        </div>
                      </td>
                    </tr>
              
                    {/* Inquiry / Approver */}
                    <tr>
                      <td className="px-6 py-4 border-r border-gray-300">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('scContractInquiryOnly')}
                            className="h-4 w-4 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Contract Inquiry Only</span>
                        </label>
                      </td>
                      <td className="px-6 py-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('scContractualApprover')}
                            className="h-4 w-4 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Contractual (Document) Approver</span>
                        </label>
                      </td>
                    </tr>
              
                    {/* Electronic docs question */}
                    <tr>
                      <td className="px-6 py-4 border-r border-gray-300 text-sm text-gray-700">
                        Does the agency create electronic documents in SWIFT and route for electronic signatures
                      </td>
                      <td className="px-6 py-4 space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('scElectronicDocsYes')}
                            className="h-4 w-4 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">YES. SWIFT DocuSign Account Needed</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('scElectronicDocsNo')}
                            className="h-4 w-4 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">NO. Routes for Signature outside of SWIFT</span>
                        </label>
                      </td>
                    </tr>
              
                    {/* Workflow roles */}
                    <tr>
                      <td
                        colSpan={2}
                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider bg-green-600"
                      >
                        Workflow roles
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 bg-gray-100 font-medium text-sm border-r border-gray-300 w-1/2">
                        Role
                      </td>
                      <td className="px-4 py-2 bg-gray-100 font-medium text-sm w-1/2">
                        Route Controls
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 border-r border-gray-300 text-sm text-gray-900">
                        <label