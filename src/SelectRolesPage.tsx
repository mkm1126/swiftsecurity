// src/SelectRolesPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  Save,
  AlertTriangle,
  Calculator,
  DollarSign,
  FileText,
  TrendingUp,
  Package,
  ShoppingCart,
  Users,
  Building,
  Clipboard,
  Settings,
  Database,
  Shield,
  CheckCircle,
  Info,
  Copy,
  Edit,
} from 'lucide-react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { toast } from 'sonner';
import Header from './components/Header';
import MultiSelect from './components/MultiSelect';
import UserSelect from './components/UserSelect';
import { businessUnits } from './lib/businessUnitData';

// Form data interface matching the database schema
interface SecurityRoleSelection {
  // Business Unit Details
  homeBusinessUnit: string | string[];
  otherBusinessUnits: string[];

  // Accounts Payable
  voucherEntry: boolean;
  voucherApprover1: string[];
  voucherApprover2: string[];
  voucherApprover3: string[];
  maintenanceVoucherBuildErrors: boolean;
  matchOverride: boolean;
  apInquiryOnly: boolean;
  apWorkflowApprover: boolean;
  apWorkflowRouteControls: string[];

  // New AP fields
  apVoucherApprover1: boolean;
  apVoucherApprover2: boolean;
  apVoucherApprover3: boolean;
  apVoucherApprover1RouteControls: string[];
  apVoucherApprover2RouteControls: string[];
  apVoucherApprover3RouteControls: string[];

  // Accounts Receivable and Cash Management
  cashMaintenance: boolean;
  receivableSpecialist: boolean;
  receivableSupervisor: boolean;
  writeoffApprovalBusinessUnits: string[];
  billingCreate: boolean;
  billingSpecialist: boolean;
  billingSupervisor: boolean;
  creditInvoiceApprovalBusinessUnits: string[];
  customerMaintenanceSpecialist: boolean;
  arBillingSetup: boolean;
  arBillingInquiryOnly: boolean;
  cashManagementInquiryOnly: boolean;

  // Budgets/Commitment Control & Appropriation Maintenance
  budgetJournalEntryOnline: boolean;
  budgetJournalLoad: boolean;
  journalApprover: boolean;
  appropriationSources: string[];
  expenseBudgetSource: string[];
  revenueBudgetSource: string[];
  budgetTransferEntryOnline: boolean;
  transferApprover: boolean;
  transferAppropriationSources: string[];
  budgetInquiryOnly: boolean;

  // General Ledger and NVISION Reporting
  journalEntryOnline: boolean;
  journalLoad: boolean;
  agencyChartfieldMaintenance: boolean;
  glAgencyApprover: boolean;
  glAgencyApproverSources: string[];
  generalLedgerInquiryOnly: boolean;
  nvisionReportingAgencyUser: boolean;
  needsDailyReceiptsReport: boolean;

  // Grants
  awardDataEntry: boolean;
  grantFiscalManager: boolean;
  programManager: boolean;
  gmAgencySetup: boolean;
  grantsInquiryOnly: boolean;

  // Project Costing
  federalProjectInitiator: boolean;
  oimInitiator: boolean;
  projectInitiator: boolean;
  projectManager: boolean;
  capitalProgramsOffice: boolean;
  projectCostAccountant: boolean;
  projectFixedAsset: boolean;
  categorySubcategoryManager: boolean;
  projectControlDates: boolean;
  projectAccountingSystems: boolean;
  mndotProjectsInquiry: boolean;
  projectsInquiryOnly: boolean;
  mndotProjectApprover: boolean;
  routeControl: string[];

  // Cost Allocation
  costAllocationInquiryOnly: boolean;

  // Asset Management
  financialAccountantAssets: boolean;
  assetManagementInquiryOnly: boolean;
  physicalInventoryApproval1: boolean;
  physicalInventoryBusinessUnits: string[];
  physicalInventoryApproval2: boolean;
  physicalInventoryDepartmentIds: string[];

  // Inventory (IN)
  inventoryExpressIssue: boolean;
  inventoryAdjustmentApprover: boolean;
  inventoryReplenishmentBuyer: boolean;
  inventoryControlWorker: boolean;
  inventoryExpressPutaway: boolean;
  inventoryFulfillmentSpecialist: boolean;
  inventoryPoReceiver: boolean;
  inventoryReturnsReceiver: boolean;
  inventoryCostAdjustment: boolean;
  inventoryMaterialsManager: boolean;
  inventoryDelivery: boolean;
  inventoryInquiryOnly: boolean;
  inventoryConfigurationAgency: boolean;
  inventoryPickPlanReportDistribution: boolean;
  shipToLocation: string[];
  inventoryBusinessUnits: string[];

  // Purchase Orders (PO)
  poApprover: boolean;
  poApprover2: boolean;
  poApprover3: boolean;
  poApproverLimit1: string[];
  poApproverLimit2: string[];
  poApproverLimit3: string[];
  poApproverRouteControls: string[];
  poDataEntry: boolean;
  poDataEntryOrigin: string[];
  poDataEntryShipTo: string[];
  poInquiryOnly: boolean;
  poLocationCode: string[];
  poOrigin: string[];
  poShipTo: string[];
  poEproBuyer: boolean;
  eproFund: string[];
  eproAgencyCost1: string[];
  eproAppropriationId: string[];
  eproFinDepartmentId: string[];

  // Vendor Management
  vendorInquiryOnly: boolean;
  vendorMaintenance: boolean;
  vendorApproval: boolean;
  vendorSetup: boolean;

  // Strategic Sourcing (SS)
  ssEventCreatorBuyer: boolean;
  ssEventCollaborator: boolean;
  ssEventApprover: boolean;
  ssEventInquiryOnly: boolean;
  ssTechCoordApprover: boolean;
  ssTechStateApprover: boolean;
  ssBusinessUnits: string[];
  ssSelectedOrigins: string[];
  ssDefaultOrigin: string[];
  ssAllOrigins: boolean;

  // Contract Management
  contractEncumbrance: boolean;
  scAgreementManager: boolean;
  scDocApproverOrigin: string[];
  scElectronicDocsYes: boolean;
  scElectronicDocsNo: boolean;
  scOtherEmployeeIds: string[];

  // Procurement Cards (P-Card)
  pCardApprover: boolean;
  pCardReviewer: boolean;
  pCardReconciler: boolean;

  // Central Goods (CG)
  cgCatalogOwner: boolean;
  cgInquiryOnly: boolean;
  coreOrderReceiver: boolean;

  // Additional fields
  addAccessType: string;
  agencyCodes: string[];
  departmentId: string[];
  prohibitedDepartmentIds: string[];
  deleteAccessCodes: string[];

  // Role justification
  roleJustification: string;

  // Approval acknowledgment
  supervisorApproval: boolean;
}

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

// Business unit options for MultiSelect
const businessUnitOptions = businessUnits.map(unit => ({
  value: unit.businessUnit,
  label: `${unit.description} (${unit.businessUnit})`
}));

// Helper function to check if we're in copy flow mode
const isCopyFlowMode = () => {
  const editingCopiedRoles = localStorage.getItem('editingCopiedRoles') === 'true';
  const pendingFormData = localStorage.getItem('pendingFormData');
  const copiedRoleSelections = localStorage.getItem('copiedRoleSelections');
  
  return editingCopiedRoles && pendingFormData && copiedRoleSelections;
};

// Helper function to clear copy flow data
const clearCopyFlowData = () => {
  localStorage.removeItem('editingCopiedRoles');
  localStorage.removeItem('pendingFormData');
  localStorage.removeItem('copiedRoleSelections');
  localStorage.removeItem('copiedUserDetails');
};

function SelectRolesPage() {
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
    formState: { errors },
  } = useForm<SecurityRoleSelection>({
    defaultValues: {
      homeBusinessUnit: '',
      otherBusinessUnits: [],
      
      // Accounts Payable defaults
      voucherEntry: false,
      voucherApprover1: [],
      voucherApprover2: [],
      voucherApprover3: [],
      maintenanceVoucherBuildErrors: false,
      matchOverride: false,
      apInquiryOnly: false,
      apWorkflowApprover: false,
      apWorkflowRouteControls: [],
      
      // New AP fields
      apVoucherApprover1: false,
      apVoucherApprover2: false,
      apVoucherApprover3: false,
      apVoucherApprover1RouteControls: [],
      apVoucherApprover2RouteControls: [],
      apVoucherApprover3RouteControls: [],

      // Accounts Receivable defaults
      cashMaintenance: false,
      receivableSpecialist: false,
      receivableSupervisor: false,
      writeoffApprovalBusinessUnits: [],
      billingCreate: false,
      billingSpecialist: false,
      billingSupervisor: false,
      creditInvoiceApprovalBusinessUnits: [],
      customerMaintenanceSpecialist: false,
      arBillingSetup: false,
      arBillingInquiryOnly: false,
      cashManagementInquiryOnly: false,

      // Budget defaults
      budgetJournalEntryOnline: false,
      budgetJournalLoad: false,
      journalApprover: false,
      appropriationSources: [],
      expenseBudgetSource: [],
      revenueBudgetSource: [],
      budgetTransferEntryOnline: false,
      transferApprover: false,
      transferAppropriationSources: [],
      budgetInquiryOnly: false,

      // General Ledger defaults
      journalEntryOnline: false,
      journalLoad: false,
      agencyChartfieldMaintenance: false,
      glAgencyApprover: false,
      glAgencyApproverSources: [],
      generalLedgerInquiryOnly: false,
      nvisionReportingAgencyUser: false,
      needsDailyReceiptsReport: false,

      // Grants defaults
      awardDataEntry: false,
      grantFiscalManager: false,
      programManager: false,
      gmAgencySetup: false,
      grantsInquiryOnly: false,

      // Project Costing defaults
      federalProjectInitiator: false,
      oimInitiator: false,
      projectInitiator: false,
      projectManager: false,
      capitalProgramsOffice: false,
      projectCostAccountant: false,
      projectFixedAsset: false,
      categorySubcategoryManager: false,
      projectControlDates: false,
      projectAccountingSystems: false,
      mndotProjectsInquiry: false,
      projectsInquiryOnly: false,
      mndotProjectApprover: false,
      routeControl: [],

      // Cost Allocation defaults
      costAllocationInquiryOnly: false,

      // Asset Management defaults
      financialAccountantAssets: false,
      assetManagementInquiryOnly: false,
      physicalInventoryApproval1: false,
      physicalInventoryBusinessUnits: [],
      physicalInventoryApproval2: false,
      physicalInventoryDepartmentIds: [],

      // Inventory defaults
      inventoryExpressIssue: false,
      inventoryAdjustmentApprover: false,
      inventoryReplenishmentBuyer: false,
      inventoryControlWorker: false,
      inventoryExpressPutaway: false,
      inventoryFulfillmentSpecialist: false,
      inventoryPoReceiver: false,
      inventoryReturnsReceiver: false,
      inventoryCostAdjustment: false,
      inventoryMaterialsManager: false,
      inventoryDelivery: false,
      inventoryInquiryOnly: false,
      inventoryConfigurationAgency: false,
      inventoryPickPlanReportDistribution: false,
      shipToLocation: [],
      inventoryBusinessUnits: [],

      // Purchase Orders defaults
      poApprover: false,
      poApprover2: false,
      poApprover3: false,
      poApproverLimit1: [],
      poApproverLimit2: [],
      poApproverLimit3: [],
      poApproverRouteControls: [],
      poDataEntry: false,
      poDataEntryOrigin: [],
      poDataEntryShipTo: [],
      poInquiryOnly: false,
      poLocationCode: [],
      poOrigin: [],
      poShipTo: [],
      poEproBuyer: false,
      eproFund: [],
      eproAgencyCost1: [],
      eproAppropriationId: [],
      eproFinDepartmentId: [],

      // Vendor Management defaults
      vendorInquiryOnly: false,
      vendorMaintenance: false,
      vendorApproval: false,
      vendorSetup: false,

      // Strategic Sourcing defaults
      ssEventCreatorBuyer: false,
      ssEventCollaborator: false,
      ssEventApprover: false,
      ssEventInquiryOnly: false,
      ssTechCoordApprover: false,
      ssTechStateApprover: false,
      ssBusinessUnits: [],
      ssSelectedOrigins: [],
      ssDefaultOrigin: [],
      ssAllOrigins: false,

      // Contract Management defaults
      contractEncumbrance: false,
      scAgreementManager: false,
      scDocApproverOrigin: [],
      scElectronicDocsYes: false,
      scElectronicDocsNo: false,
      scOtherEmployeeIds: [],

      // P-Card defaults
      pCardApprover: false,
      pCardReviewer: false,
      pCardReconciler: false,

      // Central Goods defaults
      cgCatalogOwner: false,
      cgInquiryOnly: false,
      coreOrderReceiver: false,

      // Additional fields defaults
      addAccessType: '',
      agencyCodes: [],
      departmentId: [],
      prohibitedDepartmentIds: [],
      deleteAccessCodes: [],

      // Role justification
      roleJustification: '',

      // Approval
      supervisorApproval: false,
    },
  });

  const selectedRoles = watch();

  // Check if any roles are selected
  const hasSelectedRoles = useMemo(() => {
    const values = watch();
    return Object.entries(values).some(([key, value]) => {
      if (key === 'supervisorApproval' || key === 'roleJustification') return false;
      if (typeof value === 'boolean') return value;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim() !== '';
      return false;
    });
  }, [watch]);

  // Auto-save form data when it changes (but not during copy flow)
  useEffect(() => {
    if (!requestDetails || isCopyFlowMode()) return;

    const timeoutId = setTimeout(() => {
      const formData = watch();
      if (Object.keys(formData).length === 0) return;

      const storageKey = `selectRoles_${requestDetails.employee_name}_${requestDetails.agency_name}`.replace(/[^a-zA-Z0-9]/g, '_');
      localStorage.setItem(storageKey, JSON.stringify(formData));
      console.log('💾 Auto-saving Select Roles form data:', { storageKey, formData });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watch(), requestDetails]);

  useEffect(() => {
    // Check if we're in copy flow mode
    if (isCopyFlowMode()) {
      console.log('🔧 Copy flow detected');
      setIsEditingCopiedRoles(true);
      
      try {
        const pendingFormData = localStorage.getItem('pendingFormData');
        const copiedRoleSelections = localStorage.getItem('copiedRoleSelections');
        
        if (pendingFormData && copiedRoleSelections) {
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
              } else if (Array.isArray(value) && value.length > 0) {
                setValue(key as keyof SecurityRoleSelection, value as any, { shouldDirty: false });
              } else if (typeof value === 'string' && value.trim()) {
                setValue(key as keyof SecurityRoleSelection, value as any, { shouldDirty: false });
              }
            });
          }
        }
      } catch (e) {
        console.error('Error loading copy-flow data:', e);
        toast.error('Error loading copied user data');
        clearCopyFlowData();
        navigate('/');
      }
    } else {
      // Normal flow - get request ID and load data
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
    if (!requestDetails || isCopyFlowMode()) return;

    const storageKey = `selectRoles_${requestDetails.employee_name}_${requestDetails.agency_name}`.replace(/[^a-zA-Z0-9]/g, '_');
    const savedData = localStorage.getItem(storageKey);
    
    console.log('🔍 Checking for saved Select Roles form data:', { storageKey, hasSavedData: !!savedData });

    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        console.log('📥 Restoring saved Select Roles form data:', parsedData);
        
        Object.entries(parsedData).forEach(([key, value]) => {
          setValue(key as keyof SecurityRoleSelection, value as any, { shouldDirty: false });
        });
        
        toast.success('Previous selections restored');
      } catch (e) {
        console.error('Error parsing saved data:', e);
        localStorage.removeItem(storageKey);
      }
    } else {
      console.log('📡 No saved data found, fetching existing selections from Supabase');
      if (requestId) {
        fetchExistingSelections(requestId);
      }
    }
  }, [requestDetails, setValue, requestId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
    } catch (error) {
      console.error('Error fetching request details:', error);
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
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'id' || key === 'request_id' || key === 'created_at' || key === 'updated_at') return;
        
        try {
          setValue(key as keyof SecurityRoleSelection, value as any, { shouldDirty: false });
        } catch (e) {
          console.warn(`Could not set form field ${key}:`, e);
        }
      });
    } catch (e) {
      console.error('Failed to fetch existing role selections:', e);
    }
  }

  const onSubmit = async (form: SecurityRoleSelection) => {
    if (!hasSelectedRoles) {
      toast.error('Please select at least one role or mark "Supervisor Approval" to acknowledge no roles are needed.');
      return;
    }

    setSaving(true);
    
    try {
      if (isEditingCopiedRoles) {
        console.log('🔧 Copy flow - processing submission');
        
        const pendingFormData = localStorage.getItem('pendingFormData');
        const roleData = JSON.parse(localStorage.getItem('copiedRoleSelections') || '{}');
        
        if (!pendingFormData) {
          throw new Error('No pending form data found');
        }

        console.log('🔧 Copy flow - pendingFormData:', JSON.parse(pendingFormData));
        console.log('🔧 Copy flow - roleData:', roleData);

        const d: CopyFlowForm = JSON.parse(pendingFormData);
        const pocUser = localStorage.getItem('pocUserName');

        // Create the complete request payload
        const requiredFields = {
          start_date: d.startDate,
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

        console.log('🔧 Copy flow - creating request with data:', requiredFields);

        // Create the new request
        const { data: newReq, error: requestError } = await supabase
          .from('security_role_requests')
          .insert(requiredFields)
          .select()
          .single();

        if (requestError) throw requestError;

        // Create security area
        const { error: areasError } = await supabase.from('security_areas').insert({
          request_id: newReq.id,
          area_type: 'accounting_procurement',
          director_name: d.accountingDirector || null,
          director_email: d.accountingDirectorUsername || null,
        });

        if (areasError) throw areasError;

        // Create role selections
        const selections = buildSelections(newReq.id, d.agencyCode, form);
        const { error: selectionsError } = await supabase
          .from('security_role_selections')
          .insert(selections);

        if (selectionsError) throw selectionsError;

        // Clean up copy flow data
        clearCopyFlowData();

        toast.success('Role selections saved successfully!');
        navigate('/success', { state: { requestId: newReq.id } });
      } else {
        // Normal flow - update existing request
        if (!requestId) {
          toast.error('No request found. Please start from the main form.');
          navigate('/');
          return;
        }

        const selections = buildSelections(requestId, requestDetails?.agency_code, form);
        const { error } = await supabase
          .from('security_role_selections')
          .upsert(selections, { onConflict: 'request_id' });

        if (error) throw error;

        // Save to localStorage for future visits
        if (requestDetails) {
          const storageKey = `selectRoles_${requestDetails.employee_name}_${requestDetails.agency_name}`.replace(/[^a-zA-Z0-9]/g, '_');
          localStorage.setItem(storageKey, JSON.stringify(form));
          console.log('💾 Saving Select Roles form data for future visits:', { storageKey, form });
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

  // Build selections payload for database
  function buildSelections(
    requestId: string,
    agencyCode: string | undefined,
    form: SecurityRoleSelection
  ) {
    const homeBU = Array.isArray(form.homeBusinessUnit) 
      ? form.homeBusinessUnit 
      : form.homeBusinessUnit 
        ? [form.homeBusinessUnit] 
        : [(agencyCode?.padEnd(5, '0') || '00000').substring(0, 5)];

    return {
      request_id: requestId,
      home_business_unit: homeBU,
      other_business_units: form.otherBusinessUnits?.length ? form.otherBusinessUnits : null,
      
      // Accounts Payable
      voucher_entry: form.voucherEntry,
      voucher_approver_1: form.voucherApprover1?.length ? form.voucherApprover1 : null,
      voucher_approver_2: form.voucherApprover2?.length ? form.voucherApprover2 : null,
      voucher_approver_3: form.voucherApprover3?.length ? form.voucherApprover3 : null,
      maintenance_voucher_build_errors: form.maintenanceVoucherBuildErrors,
      match_override: form.matchOverride,
      ap_inquiry_only: form.apInquiryOnly,
      ap_workflow_approver: form.apWorkflowApprover,
      ap_workflow_route_controls: form.apWorkflowRouteControls?.length ? form.apWorkflowRouteControls : null,
      
      // New AP fields
      ap_voucher_approver_1: form.apVoucherApprover1,
      ap_voucher_approver_2: form.apVoucherApprover2,
      ap_voucher_approver_3: form.apVoucherApprover3,
      ap_voucher_approver_1_route_controls: form.apVoucherApprover1RouteControls?.length ? form.apVoucherApprover1RouteControls : null,
      ap_voucher_approver_2_route_controls: form.apVoucherApprover2RouteControls?.length ? form.apVoucherApprover2RouteControls : null,
      ap_voucher_approver_3_route_controls: form.apVoucherApprover3RouteControls?.length ? form.apVoucherApprover3RouteControls : null,

      // Accounts Receivable
      cash_maintenance: form.cashMaintenance,
      receivable_specialist: form.receivableSpecialist,
      receivable_supervisor: form.receivableSupervisor,
      writeoff_approval_business_units: form.writeoffApprovalBusinessUnits?.length ? form.writeoffApprovalBusinessUnits : null,
      billing_create: form.billingCreate,
      billing_specialist: form.billingSpecialist,
      billing_supervisor: form.billingSupervisor,
      credit_invoice_approval_business_units: form.creditInvoiceApprovalBusinessUnits?.length ? form.creditInvoiceApprovalBusinessUnits : null,
      customer_maintenance_specialist: form.customerMaintenanceSpecialist,
      ar_billing_setup: form.arBillingSetup,
      ar_billing_inquiry_only: form.arBillingInquiryOnly,
      cash_management_inquiry_only: form.cashManagementInquiryOnly,

      // Budget Control
      budget_journal_entry_online: form.budgetJournalEntryOnline,
      budget_journal_load: form.budgetJournalLoad,
      journal_approver: form.journalApprover,
      appropriation_sources: form.appropriationSources?.length ? form.appropriationSources : null,
      expense_budget_source: form.expenseBudgetSource?.length ? form.expenseBudgetSource : null,
      revenue_budget_source: form.revenueBudgetSource?.length ? form.revenueBudgetSource : null,
      budget_transfer_entry_online: form.budgetTransferEntryOnline,
      transfer_approver: form.transferApprover,
      transfer_appropriation_sources: form.transferAppropriationSources?.length ? form.transferAppropriationSources : null,
      budget_inquiry_only: form.budgetInquiryOnly,

      // General Ledger
      journal_entry_online: form.journalEntryOnline,
      journal_load: form.journalLoad,
      agency_chartfield_maintenance: form.agencyChartfieldMaintenance,
      gl_agency_approver: form.glAgencyApprover,
      gl_agency_approver_sources: form.glAgencyApproverSources?.length ? form.glAgencyApproverSources : null,
      general_ledger_inquiry_only: form.generalLedgerInquiryOnly,
      nvision_reporting_agency_user: form.nvisionReportingAgencyUser,
      needs_daily_receipts_report: form.needsDailyReceiptsReport,

      // Grants
      award_data_entry: form.awardDataEntry,
      grant_fiscal_manager: form.grantFiscalManager,
      program_manager: form.programManager,
      gm_agency_setup: form.gmAgencySetup,
      grants_inquiry_only: form.grantsInquiryOnly,

      // Project Costing
      federal_project_initiator: form.federalProjectInitiator,
      oim_initiator: form.oimInitiator,
      project_initiator: form.projectInitiator,
      project_manager: form.projectManager,
      capital_programs_office: form.capitalProgramsOffice,
      project_cost_accountant: form.projectCostAccountant,
      project_fixed_asset: form.projectFixedAsset,
      category_subcategory_manager: form.categorySubcategoryManager,
      project_control_dates: form.projectControlDates,
      project_accounting_systems: form.projectAccountingSystems,
      mndot_projects_inquiry: form.mndotProjectsInquiry,
      projects_inquiry_only: form.projectsInquiryOnly,
      mndot_project_approver: form.mndotProjectApprover,
      route_control: form.routeControl?.length ? form.routeControl : null,

      // Cost Allocation
      cost_allocation_inquiry_only: form.costAllocationInquiryOnly,

      // Asset Management
      financial_accountant_assets: form.financialAccountantAssets,
      asset_management_inquiry_only: form.assetManagementInquiryOnly,
      physical_inventory_approval_1: form.physicalInventoryApproval1,
      physical_inventory_business_units: form.physicalInventoryBusinessUnits?.length ? form.physicalInventoryBusinessUnits : null,
      physical_inventory_approval_2: form.physicalInventoryApproval2,
      physical_inventory_department_ids: form.physicalInventoryDepartmentIds?.length ? form.physicalInventoryDepartmentIds : null,

      // Inventory
      inventory_express_issue: form.inventoryExpressIssue,
      inventory_adjustment_approver: form.inventoryAdjustmentApprover,
      inventory_replenishment_buyer: form.inventoryReplenishmentBuyer,
      inventory_control_worker: form.inventoryControlWorker,
      inventory_express_putaway: form.inventoryExpressPutaway,
      inventory_fulfillment_specialist: form.inventoryFulfillmentSpecialist,
      inventory_po_receiver: form.inventoryPoReceiver,
      inventory_returns_receiver: form.inventoryReturnsReceiver,
      inventory_cost_adjustment: form.inventoryCostAdjustment,
      inventory_materials_manager: form.inventoryMaterialsManager,
      inventory_delivery: form.inventoryDelivery,
      inventory_inquiry_only: form.inventoryInquiryOnly,
      inventory_configuration_agency: form.inventoryConfigurationAgency,
      inventory_pick_plan_report_distribution: form.inventoryPickPlanReportDistribution,
      ship_to_location: form.shipToLocation?.length ? form.shipToLocation : null,
      inventory_business_units: form.inventoryBusinessUnits?.length ? form.inventoryBusinessUnits : null,

      // Purchase Orders
      po_approver: form.poApprover,
      po_approver_2: form.poApprover2,
      po_approver_3: form.poApprover3,
      po_approver_limit_1: form.poApproverLimit1?.length ? form.poApproverLimit1 : null,
      po_approver_limit_2: form.poApproverLimit2?.length ? form.poApproverLimit2 : null,
      po_approver_limit_3: form.poApproverLimit3?.length ? form.poApproverLimit3 : null,
      po_approver_route_controls: form.poApproverRouteControls?.length ? form.poApproverRouteControls : null,
      po_data_entry: form.poDataEntry,
      po_data_entry_origin: form.poDataEntryOrigin?.length ? form.poDataEntryOrigin : null,
      po_data_entry_ship_to: form.poDataEntryShipTo?.length ? form.poDataEntryShipTo : null,
      po_inquiry_only: form.poInquiryOnly,
      po_location_code: form.poLocationCode?.length ? form.poLocationCode : null,
      po_origin: form.poOrigin?.length ? form.poOrigin : null,
      po_ship_to: form.poShipTo?.length ? form.poShipTo : null,
      po_epro_buyer: form.poEproBuyer,
      epro_fund: form.eproFund?.length ? form.eproFund : null,
      epro_agency_cost_1: form.eproAgencyCost1?.length ? form.eproAgencyCost1 : null,
      epro_appropriation_id: form.eproAppropriationId?.length ? form.eproAppropriationId : null,
      epro_fin_department_id: form.eproFinDepartmentId?.length ? form.eproFinDepartmentId : null,

      // Vendor Management
      vendor_inquiry_only: form.vendorInquiryOnly,
      vendor_maintenance: form.vendorMaintenance,
      vendor_approval: form.vendorApproval,
      vendor_setup: form.vendorSetup,

      // Strategic Sourcing
      ss_event_creator_buyer: form.ssEventCreatorBuyer,
      ss_event_collaborator: form.ssEventCollaborator,
      ss_event_approver: form.ssEventApprover,
      ss_event_inquiry_only: form.ssEventInquiryOnly,
      ss_tech_coord_approver: form.ssTechCoordApprover,
      ss_tech_state_approver: form.ssTechStateApprover,
      ss_business_units: form.ssBusinessUnits?.length ? form.ssBusinessUnits : null,
      ss_selected_origins: form.ssSelectedOrigins?.length ? form.ssSelectedOrigins : null,
      ss_default_origin: form.ssDefaultOrigin?.length ? form.ssDefaultOrigin : null,
      ss_all_origins: form.ssAllOrigins,

      // Contract Management
      contract_encumbrance: form.contractEncumbrance,
      sc_agreement_manager: form.scAgreementManager,
      sc_doc_approver_origin: form.scDocApproverOrigin?.length ? form.scDocApproverOrigin : null,
      sc_electronic_docs_yes: form.scElectronicDocsYes,
      sc_electronic_docs_no: form.scElectronicDocsNo,
      sc_other_employee_ids: form.scOtherEmployeeIds?.length ? form.scOtherEmployeeIds : null,

      // P-Card
      p_card_approver: form.pCardApprover,
      p_card_reviewer: form.pCardReviewer,
      p_card_reconciler: form.pCardReconciler,

      // Central Goods
      cg_catalog_owner: form.cgCatalogOwner,
      cg_inquiry_only: form.cgInquiryOnly,
      core_order_receiver: form.coreOrderReceiver,

      // Additional fields
      add_access_type: form.addAccessType || null,
      agency_codes: form.agencyCodes?.length ? form.agencyCodes : null,
      department_id: form.departmentId?.length ? form.departmentId : null,
      prohibited_department_ids: form.prohibitedDepartmentIds?.length ? form.prohibitedDepartmentIds : null,
      delete_access_codes: form.deleteAccessCodes?.length ? form.deleteAccessCodes : null,

      // Role justification and approval
      role_justification: form.roleJustification?.trim() || null,
      supervisor_approval: form.supervisorApproval,

      // Store the complete form data as JSON for future reference
      role_selection_json: form,
    };

    return selections;
  }

  const handleUserChange = (user: User | null) => {
    console.log('🔧 SelectRolesPage handleUserChange called with:', user);
    setSelectedUser(user);
  };

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

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-12">
              {/* Copy User Section */}
              {!isEditingCopiedRoles && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg">
                  <div className="flex items-start">
                    <Copy className="h-6 w-6 text-blue-600 mr-3 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-blue-800 mb-4">
                        Copy Access from Existing User (Optional)
                      </h3>
                      <p className="text-sm text-blue-700 mb-4">
                        You can copy role selections from an existing user who has similar job responsibilities.
                        This will pre-populate the form with their current access permissions, which you can then modify as needed.
                      </p>
                      <UserSelect
                        selectedUser={selectedUser}
                        onUserChange={handleUserChange}
                        currentUser={localStorage.getItem('pocUserName')}
                        currentRequestId={requestId}
                        formData={{
                          startDate: new Date().toISOString().split('T')[0],
                          employeeName: requestDetails?.employee_name || '',
                          agencyName: requestDetails?.agency_name || '',
                          agencyCode: requestDetails?.agency_code || '',
                          submitterName: localStorage.getItem('pocUserName') || '',
                          submitterEmail: `${localStorage.getItem('pocUserName') || 'user'}@example.com`,
                          supervisorName: 'Test Supervisor',
                          supervisorUsername: 'supervisor@example.com',
                          securityAdminName: 'Test Security Admin',
                          securityAdminUsername: 'security@example.com',
                          accountingDirector: 'Test Accounting Director',
                          accountingDirectorUsername: 'accounting@example.com',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Business Unit Selection */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Building className="h-5 w-5 text-blue-600 mr-2" />
                    Business Unit Information
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Select your home business unit and any additional business units you need access to.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div>
                    <MultiSelect
                      options={businessUnitOptions}
                      value={selectedRoles.homeBusinessUnit || ''}
                      onChange={(values) => setValue('homeBusinessUnit', values.length === 1 ? values[0] : values)}
                      placeholder="Select home business unit..."
                      label="Home Business Unit"
                      required
                      error={errors.homeBusinessUnit?.message}
                      searchPlaceholder="Search business units..."
                    />
                  </div>

                  <div>
                    <MultiSelect
                      options={businessUnitOptions}
                      value={selectedRoles.otherBusinessUnits || []}
                      onChange={(values) => setValue('otherBusinessUnits', values)}
                      placeholder="Select additional business units..."
                      label="Other Business Units (Optional)"
                      searchPlaceholder="Search business units..."
                    />
                  </div>
                </div>
              </div>

              {/* Accounts Payable Section */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                    Accounts Payable
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Select roles related to voucher processing, approvals, and accounts payable management.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Basic AP Roles */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Basic Roles</h4>
                    
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('voucherEntry')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Voucher Entry</span>
                        <p className="text-xs text-gray-500">Create and enter vouchers into the system</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('maintenanceVoucherBuildErrors')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Maintenance Voucher Build Errors</span>
                        <p className="text-xs text-gray-500">Resolve errors in voucher building processes</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('matchOverride')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Match Override</span>
                        <p className="text-xs text-gray-500">Override matching discrepancies in accounts payable</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('apInquiryOnly')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">AP Inquiry Only</span>
                        <p className="text-xs text-gray-500">View-only access to Accounts Payable information</p>
                      </div>
                    </label>
                  </div>

                  {/* Workflow Roles */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Workflow Roles</h4>
                    
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('apWorkflowApprover')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">AP Workflow Approver</span>
                        <p className="text-xs text-gray-500">Approver role within the Accounts Payable workflow</p>
                      </div>
                    </label>

                    {selectedRoles.apWorkflowApprover && (
                      <div className="ml-6">
                        <MultiSelect
                          options={[]}
                          value={selectedRoles.apWorkflowRouteControls || []}
                          onChange={(values) => setValue('apWorkflowRouteControls', values)}
                          placeholder="Enter route control values..."
                          label="AP Workflow Route Controls"
                          allowCustom
                          searchPlaceholder="Add route control..."
                        />
                      </div>
                    )}
                  </div>

                  {/* New AP Voucher Approvers */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Voucher Approvers</h4>
                    
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('apVoucherApprover1')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">AP Voucher Approver 1</span>
                        <p className="text-xs text-gray-500">First level AP voucher approver</p>
                      </div>
                    </label>

                    {selectedRoles.apVoucherApprover1 && (
                      <div className="ml-6">
                        <MultiSelect
                          options={[]}
                          value={selectedRoles.apVoucherApprover1RouteControls || []}
                          onChange={(values) => setValue('apVoucherApprover1RouteControls', values)}
                          placeholder="Enter department IDs..."
                          label="Route Controls: Financial Department ID(s)"
                          allowCustom
                          searchPlaceholder="Add department ID..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Enter 5-digit department IDs (e.g., 12345, 67890)
                        </p>
                      </div>
                    )}

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('apVoucherApprover2')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">AP Voucher Approver 2</span>
                        <p className="text-xs text-gray-500">Second level AP voucher approver</p>
                      </div>
                    </label>

                    {selectedRoles.apVoucherApprover2 && (
                      <div className="ml-6">
                        <MultiSelect
                          options={[]}
                          value={selectedRoles.apVoucherApprover2RouteControls || []}
                          onChange={(values) => setValue('apVoucherApprover2RouteControls', values)}
                          placeholder="Enter department IDs..."
                          label="Route Controls: Financial Department ID(s)"
                          allowCustom
                          searchPlaceholder="Add department ID..."
                        />
                      </div>
                    )}

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('apVoucherApprover3')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">AP Voucher Approver 3</span>
                        <p className="text-xs text-gray-500">Third level AP voucher approver</p>
                      </div>
                    </label>

                    {selectedRoles.apVoucherApprover3 && (
                      <div className="ml-6">
                        <MultiSelect
                          options={[]}
                          value={selectedRoles.apVoucherApprover3RouteControls || []}
                          onChange={(values) => setValue('apVoucherApprover3RouteControls', values)}
                          placeholder="Enter department IDs..."
                          label="Route Controls: Financial Department ID(s)"
                          allowCustom
                          searchPlaceholder="Add department ID..."
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Legacy Voucher Approvers */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Legacy Voucher Approvers (Email-based)</h4>
                  <p className="text-sm text-gray-600">
                    These are the original voucher approver roles that use email addresses for routing.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div>
                      <MultiSelect
                        options={[]}
                        value={selectedRoles.voucherApprover1 || []}
                        onChange={(values) => setValue('voucherApprover1', values)}
                        placeholder="Enter email addresses..."
                        label="Voucher Approver 1 (Email)"
                        allowCustom
                        searchPlaceholder="Add email address..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        First level approval for vouchers
                      </p>
                    </div>

                    <div>
                      <MultiSelect
                        options={[]}
                        value={selectedRoles.voucherApprover2 || []}
                        onChange={(values) => setValue('voucherApprover2', values)}
                        placeholder="Enter email addresses..."
                        label="Voucher Approver 2 (Email)"
                        allowCustom
                        searchPlaceholder="Add email address..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Second level approval for vouchers
                      </p>
                    </div>

                    <div>
                      <MultiSelect
                        options={[]}
                        value={selectedRoles.voucherApprover3 || []}
                        onChange={(values) => setValue('voucherApprover3', values)}
                        placeholder="Enter email addresses..."
                        label="Voucher Approver 3 (Email)"
                        allowCustom
                        searchPlaceholder="Add email address..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Third level approval for vouchers
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Accounts Receivable and Cash Management Section */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                    Accounts Receivable and Cash Management
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage customer billing, cash receipts, and accounts receivable processes.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Cash Management */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Cash Management</h4>
                    
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('cashMaintenance')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Cash Maintenance</span>
                        <p className="text-xs text-gray-500">Manage cash-related transactions and records</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('cashManagementInquiryOnly')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Cash Management Inquiry Only</span>
                        <p className="text-xs text-gray-500">View-only access to cash management details</p>
                      </div>
                    </label>
                  </div>

                  {/* Receivables */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Receivables</h4>
                    
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('receivableSpecialist')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Receivable Specialist</span>
                        <p className="text-xs text-gray-500">Specialist role for managing accounts receivable</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('receivableSupervisor')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Receivable Supervisor</span>
                        <p className="text-xs text-gray-500">Supervisory role for accounts receivable operations</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('customerMaintenanceSpecialist')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Customer Maintenance Specialist</span>
                        <p className="text-xs text-gray-500">Manage customer records and data</p>
                      </div>
                    </label>
                  </div>

                  {/* Billing */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Billing</h4>
                    
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('billingCreate')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Billing Create</span>
                        <p className="text-xs text-gray-500">Create new billing entries</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('billingSpecialist')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Billing Specialist</span>
                        <p className="text-xs text-gray-500">Specialist role for billing processes</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('billingSupervisor')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Billing Supervisor</span>
                        <p className="text-xs text-gray-500">Supervisory role for billing operations</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('arBillingSetup')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">AR Billing Setup</span>
                        <p className="text-xs text-gray-500">Configure Accounts Receivable billing settings</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('arBillingInquiryOnly')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">AR Billing Inquiry Only</span>
                        <p className="text-xs text-gray-500">View-only access to AR billing information</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Business Unit Specific Controls */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Business Unit Specific Controls</h4>
                  
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div>
                      <MultiSelect
                        options={businessUnitOptions}
                        value={selectedRoles.writeoffApprovalBusinessUnits || []}
                        onChange={(values) => setValue('writeoffApprovalBusinessUnits', values)}
                        placeholder="Select business units for write-off approval..."
                        label="Write-off Approval Business Units"
                        searchPlaceholder="Search business units..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Business units where you can approve write-offs
                      </p>
                    </div>

                    <div>
                      <MultiSelect
                        options={businessUnitOptions}
                        value={selectedRoles.creditInvoiceApprovalBusinessUnits || []}
                        onChange={(values) => setValue('creditInvoiceApprovalBusinessUnits', values)}
                        placeholder="Select business units for credit invoice approval..."
                        label="Credit Invoice Approval Business Units"
                        searchPlaceholder="Search business units..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Business units where you can approve credit invoices
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Budgets/Commitment Control & Appropriation Maintenance Section */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 text-purple-600 mr-2" />
                    Budgets/Commitment Control & Appropriation Maintenance
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage budget journals, transfers, and appropriation maintenance.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Journal Entry */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Journal Entry</h4>
                    
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('budgetJournalEntryOnline')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Budget Journal Entry Online</span>
                        <p className="text-xs text-gray-500">Online entry of budget journals</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('budgetJournalLoad')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Budget Journal Load</span>
                        <p className="text-xs text-gray-500">Load budget journals into the system</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('journalApprover')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Journal Approver</span>
                        <p className="text-xs text-gray-500">Approve budget journals</p>
                      </div>
                    </label>
                  </div>

                  {/* Budget Sources */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Budget Sources</h4>
                    
                    <div>
                      <MultiSelect
                        options={[]}
                        value={selectedRoles.appropriationSources || []}
                        onChange={(values) => setValue('appropriationSources', values)}
                        placeholder="Enter appropriation sources..."
                        label="Appropriation Sources"
                        allowCustom
                        searchPlaceholder="Add appropriation source..."
                      />
                    </div>

                    <div>
                      <MultiSelect
                        options={[]}
                        value={selectedRoles.expenseBudgetSource || []}
                        onChange={(values) => setValue('expenseBudgetSource', values)}
                        placeholder="Enter expense budget sources..."
                        label="Expense Budget Source"
                        allowCustom
                        searchPlaceholder="Add expense source..."
                      />
                    </div>

                    <div>
                      <MultiSelect
                        options={[]}
                        value={selectedRoles.revenueBudgetSource || []}
                        onChange={(values) => setValue('revenueBudgetSource', values)}
                        placeholder="Enter revenue budget sources..."
                        label="Revenue Budget Source"
                        allowCustom
                        searchPlaceholder="Add revenue source..."
                      />
                    </div>
                  </div>

                  {/* Transfers */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Budget Transfers</h4>
                    
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('budgetTransferEntryOnline')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Budget Transfer Entry Online</span>
                        <p className="text-xs text-gray-500">Online entry of budget transfers</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('transferApprover')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Transfer Approver</span>
                        <p className="text-xs text-gray-500">Approve budget transfers</p>
                      </div>
                    </label>

                    <div>
                      <MultiSelect
                        options={[]}
                        value={selectedRoles.transferAppropriationSources || []}
                        onChange={(values) => setValue('transferAppropriationSources', values)}
                        placeholder="Enter transfer appropriation sources..."
                        label="Transfer Appropriation Sources"
                        allowCustom
                        searchPlaceholder="Add appropriation source..."
                      />
                    </div>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('budgetInquiryOnly')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Budget Inquiry Only</span>
                        <p className="text-xs text-gray-500">View-only access to budget information</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* General Ledger and NVISION Reporting Section */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Database className="h-5 w-5 text-indigo-600 mr-2" />
                    General Ledger and NVISION Reporting
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage general ledger entries, chartfield maintenance, and reporting access.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Journal Management */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Journal Management</h4>
                    
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('journalEntryOnline')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Journal Entry Online</span>
                        <p className="text-xs text-gray-500">Online entry of general ledger journals</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('journalLoad')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Journal Load</span>
                        <p className="text-xs text-gray-500">Load general ledger journals into the system</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('agencyChartfieldMaintenance')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Agency Chartfield Maintenance</span>
                        <p className="text-xs text-gray-500">Maintain chartfield data for agencies</p>
                      </div>
                    </label>
                  </div>

                  {/* Approvals */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Approvals</h4>
                    
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('glAgencyApprover')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">GL Agency Approver</span>
                        <p className="text-xs text-gray-500">Approve general ledger entries for agencies</p>
                      </div>
                    </label>

                    {selectedRoles.glAgencyApprover && (
                      <div className="ml-6">
                        <MultiSelect
                          options={[]}
                          value={selectedRoles.glAgencyApproverSources || []}
                          onChange={(values) => setValue('glAgencyApproverSources', values)}
                          placeholder="Enter GL agency approver sources..."
                          label="GL Agency Approver Sources"
                          allowCustom
                          searchPlaceholder="Add source..."
                        />
                      </div>
                    )}
                  </div>

                  {/* Reporting */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Reporting</h4>
                    
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('generalLedgerInquiryOnly')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">General Ledger Inquiry Only</span>
                        <p className="text-xs text-gray-500">View-only access to General Ledger information</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('nvisionReportingAgencyUser')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">NVISION Reporting Agency User</span>
                        <p className="text-xs text-gray-500">User role for NVISION reporting within an agency</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('needsDailyReceiptsReport')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Needs Daily Receipts Report</span>
                        <p className="text-xs text-gray-500">Access to daily receipts reports</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Grants Section */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 text-orange-600 mr-2" />
                    Grants
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage grant awards, fiscal responsibilities, and program administration.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      {...register('awardDataEntry')}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Award Data Entry</span>
                      <p className="text-xs text-gray-500">Enter award-related data for grants</p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      {...register('grantFiscalManager')}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Grant Fiscal Manager</span>
                      <p className="text-xs text-gray-500">Manage financial aspects of grants</p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      {...register('programManager')}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Program Manager</span>
                      <p className="text-xs text-gray-500">Manage grant programs</p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      {...register('gmAgencySetup')}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">GM Agency Setup</span>
                      <p className="text-xs text-gray-500">Configure agency-specific settings for grants management</p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      {...register('grantsInquiryOnly')}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Grants Inquiry Only</span>
                      <p className="text-xs text-gray-500">View-only access to grants information</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Project Costing Section */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Clipboard className="h-5 w-5 text-red-600 mr-2" />
                    Project Costing
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage project initiation, costing, and financial tracking.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Project Initiation */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Project Initiation</h4>
                    
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('federalProjectInitiator')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Federal Project Initiator</span>
                        <p className="text-xs text-gray-500">Initiate federal projects</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('oimInitiator')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">OIM Initiator</span>
                        <p className="text-xs text-gray-500">Initiate OIM (Other Information Management) projects</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('projectInitiator')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Project Initiator</span>
                        <p className="text-xs text-gray-500">Initiate new projects</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('projectManager')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Project Manager</span>
                        <p className="text-xs text-gray-500">Manage project lifecycle and resources</p>
                      </div>
                    </label>
                  </div>

                  {/* Project Administration */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Project Administration</h4>
                    
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('capitalProgramsOffice')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Capital Programs Office</span>
                        <p className="text-xs text-gray-500">Access related to capital programs office functions</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('projectCostAccountant')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Project Cost Accountant</span>
                        <p className="text-xs text-gray-500">Manage project costs and accounting</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('projectFixedAsset')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Project Fixed Asset</span>
                        <p className="text-xs text-gray-500">Manage fixed assets related to projects</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('categorySubcategoryManager')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Category Subcategory Manager</span>
                        <p className="text-xs text-gray-500">Manage project categories and subcategories</p>
                      </div>
                    </label>
                  </div>

                  {/* Project Controls */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Project Controls</h4>
                    
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('projectControlDates')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Project Control Dates</span>
                        <p className="text-xs text-gray-500">Manage control dates for projects</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('projectAccountingSystems')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Project Accounting Systems</span>
                        <p className="text-xs text-gray-500">Access to project accounting systems</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('mndotProjectsInquiry')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">MNDOT Projects Inquiry</span>
                        <p className="text-xs text-gray-500">View-only access to MNDOT projects</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('projectsInquiryOnly')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Projects Inquiry Only</span>
                        <p className="text-xs text-gray-500">View-only access to general project information</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('mndotProjectApprover')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">MNDOT Project Approver</span>
                        <p className="text-xs text-gray-500">Approve MNDOT projects</p>
                      </div>
                    </label>

                    {(selectedRoles.mndotProjectApprover || selectedRoles.projectManager) && (
                      <div>
                        <MultiSelect
                          options={[]}
                          value={selectedRoles.routeControl || []}
                          onChange={(values) => setValue('routeControl', values)}
                          placeholder="Enter route control values..."
                          label="Route Control"
                          allowCustom
                          searchPlaceholder="Add route control..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Manage routing controls for project processes
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Cost Allocation Section */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <TrendingUp className="h-5 w-5 text-yellow-600 mr-2" />
                    Cost Allocation
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Access to cost allocation information and processes.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      {...register('costAllocationInquiryOnly')}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Cost Allocation Inquiry Only</span>
                      <p className="text-xs text-gray-500">View-only access to cost allocation information</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Asset Management Section */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Shield className="h-5 w-5 text-gray-600 mr-2" />
                    Asset Management
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage fixed assets, physical inventory, and asset accounting.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Asset Accounting */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Asset Accounting</h4>
                    
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('financialAccountantAssets')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Financial Accountant Assets</span>
                        <p className="text-xs text-gray-500">Manage financial accounting for assets</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('assetManagementInquiryOnly')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Asset Management Inquiry Only</span>
                        <p className="text-xs text-gray-500">View-only access to asset management information</p>
                      </div>
                    </label>
                  </div>

                  {/* Physical Inventory */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Physical Inventory</h4>
                    
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('physicalInventoryApproval1')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Physical Inventory Approval 1</span>
                        <p className="text-xs text-gray-500">First level approval for physical inventory</p>
                      </div>
                    </label>

                    {selectedRoles.physicalInventoryApproval1 && (
                      <div className="ml-6">
                        <MultiSelect
                          options={businessUnitOptions}
                          value={selectedRoles.physicalInventoryBusinessUnits || []}
                          onChange={(values) => setValue('physicalInventoryBusinessUnits', values)}
                          placeholder="Select business units..."
                          label="Physical Inventory Business Units"
                          searchPlaceholder="Search business units..."
                        />
                      </div>
                    )}

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('physicalInventoryApproval2')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Physical Inventory Approval 2</span>
                        <p className="text-xs text-gray-500">Second level approval for physical inventory</p>
                      </div>
                    </label>

                    {selectedRoles.physicalInventoryApproval2 && (
                      <div className="ml-6">
                        <MultiSelect
                          options={[]}
                          value={selectedRoles.physicalInventoryDepartmentIds || []}
                          onChange={(values) => setValue('physicalInventoryDepartmentIds', values)}
                          placeholder="Enter department IDs..."
                          label="Physical Inventory Department IDs"
                          allowCustom
                          searchPlaceholder="Add department ID..."
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Inventory (IN) Section */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Package className="h-5 w-5 text-blue-600 mr-2" />
                    Inventory (IN)
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage inventory operations, receiving, and distribution.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Inventory Operations */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Operations</h4>
                    
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('inventoryExpressIssue')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Express Issue</span>
                        <p className="text-xs text-gray-500">Quick inventory issue processing</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('inventoryExpressPutaway')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Express Putaway</span>
                        <p className="text-xs text-gray-500">Quick inventory putaway processing</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('inventoryDelivery')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Delivery</span>
                        <p className="text-xs text-gray-500">Manage inventory delivery operations</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('inventoryInquiryOnly')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Inquiry Only</span>
                        <p className="text-xs text-gray-500">View-only access to inventory information</p>
                      </div>
                    </label>
                  </div>

                  {/* Inventory Management */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Management</h4>
                    
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('inventoryAdjustmentApprover')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Adjustment Approver</span>
                        <p className="text-xs text-gray-500">Approve inventory adjustments</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('inventoryReplenishmentBuyer')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Replenishment Buyer</span>
                        <p className="text-xs text-gray-500">Manage inventory replenishment purchasing</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('inventoryControlWorker')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Control Worker</span>
                        <p className="text-xs text-gray-500">Inventory control and management tasks</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('inventoryMaterialsManager')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Materials Manager</span>
                        <p className="text-xs text-gray-500">Manage inventory materials and supplies</p>
                      </div>
                    </label>
                  </div>

                  {/* Inventory Receiving */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Receiving</h4>
                    
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('inventoryFulfillmentSpecialist')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Fulfillment Specialist</span>
                        <p className="text-xs text-gray-500">Manage inventory fulfillment processes</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('inventoryPoReceiver')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">PO Receiver</span>
                        <p className="text-xs text-gray-500">Receive purchase order deliveries</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('inventoryReturnsReceiver')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Returns Receiver</span>
                        <p className="text-xs text-gray-500">Process inventory returns</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('inventoryCostAdjustment')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Cost Adjustment</span>
                        <p className="text-xs text-gray-500">Adjust inventory costs</p>
                      </div>
                    </label>
                  </div>

                  {/* Configuration */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Configuration</h4>
                    
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('inventoryConfigurationAgency')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Configuration Agency</span>
                        <p className="text-xs text-gray-500">Configure agency-specific inventory settings</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('inventoryPickPlanReportDistribution')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Pick Plan Report Distribution</span>
                        <p className="text-xs text-gray-500">Distribute pick plan reports</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Inventory Location Controls */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Location Controls</h4>
                  
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div>
                      <MultiSelect
                        options={[]}
                        value={selectedRoles.shipToLocation || []}
                        onChange={(values) => setValue('shipToLocation', values)}
                        placeholder="Enter ship-to locations..."
                        label="Ship To Location"
                        allowCustom
                        searchPlaceholder="Add location..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Locations where inventory can be shipped
                      </p>
                    </div>

                    <div>
                      <MultiSelect
                        options={businessUnitOptions}
                        value={selectedRoles.inventoryBusinessUnits || []}
                        onChange={(values) => setValue('inventoryBusinessUnits', values)}
                        placeholder="Select inventory business units..."
                        label="Inventory Business Units"
                        searchPlaceholder="Search business units..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Business units for inventory access
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchase Orders (PO) Section */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <ShoppingCart className="h-5 w-5 text-green-600 mr-2" />
                    Purchase Orders (PO)
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage purchase order creation, approval, and processing.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {/* PO Approvers */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">PO Approvers</h4>
                    
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('poApprover')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">PO Approver</span>
                        <p className="text-xs text-gray-500">Approve purchase orders</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('poApprover2')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">PO Approver 2</span>
                        <p className="text-xs text-gray-500">Second level purchase order approver</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('poApprover3')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">PO Approver 3</span>
                        <p className="text-xs text-gray-500">Third level purchase order approver</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('poInquiryOnly')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">PO Inquiry Only</span>
                        <p className="text-xs text-gray-500">View-only access to purchase orders</p>
                      </div>
                    </label>
                  </div>

                  {/* PO Data Entry */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Data Entry</h4>
                    
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('poDataEntry')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">PO Data Entry</span>
                        <p className="text-xs text-gray-500">Create and modify purchase orders</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('poEproBuyer')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">ePro Buyer</span>
                        <p className="text-xs text-gray-500">Electronic procurement buyer access</p>
                      </div>
                    </label>
                  </div>

                  {/* PO Controls */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Controls</h4>
                    
                    <div>
                      <MultiSelect
                        options={[]}
                        value={selectedRoles.poApproverRouteControls || []}
                        onChange={(values) => setValue('poApproverRouteControls', values)}
                        placeholder="Enter route controls..."
                        label="PO Approver Route Controls"
                        allowCustom
                        searchPlaceholder="Add route control..."
                      />
                    </div>

                    <div>
                      <MultiSelect
                        options={[]}
                        value={selectedRoles.poLocationCode || []}
                        onChange={(values) => setValue('poLocationCode', values)}
                        placeholder="Enter location codes..."
                        label="PO Location Code"
                        allowCustom
                        searchPlaceholder="Add location code..."
                      />
                    </div>
                  </div>
                </div>

                {/* PO Limits and Origins */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Approval Limits and Origins</h4>
                  
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div>
                      <MultiSelect
                        options={[]}
                        value={selectedRoles.poApproverLimit1 || []}
                        onChange={(values) => setValue('poApproverLimit1', values)}
                        placeholder="Enter approval limits..."
                        label="PO Approver Limit 1"
                        allowCustom
                        searchPlaceholder="Add limit..."
                      />
                    </div>

                    <div>
                      <MultiSelect
                        options={[]}
                        value={selectedRoles.poApproverLimit2 || []}
                        onChange={(values) => setValue('poApproverLimit2', values)}
                        placeholder="Enter approval limits..."
                        label="PO Approver Limit 2"
                        allowCustom
                        searchPlaceholder="Add limit..."
                      />
                    </div>

                    <div>
                      <MultiSelect
                        options={[]}
                        value={selectedRoles.poApproverLimit3 || []}
                        onChange={(values) => setValue('poApproverLimit3', values)}
                        placeholder="Enter approval limits..."
                        label="PO Approver Limit 3"
                        allowCustom
                        searchPlaceholder="Add limit..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div>
                      <MultiSelect
                        options={[]}
                        value={selectedRoles.poDataEntryOrigin || []}
                        onChange={(values) => setValue('poDataEntryOrigin', values)}
                        placeholder="Enter data entry origins..."
                        label="PO Data Entry Origin"
                        allowCustom
                        searchPlaceholder="Add origin..."
                      />
                    </div>

                    <div>
                      <MultiSelect
                        options={[]}
                        value={selectedRoles.poDataEntryShipTo || []}
                        onChange={(values) => setValue('poDataEntryShipTo', values)}
                        placeholder="Enter ship-to locations..."
                        label="PO Data Entry Ship To"
                        allowCustom
                        searchPlaceholder="Add ship-to location..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div>
                      <MultiSelect
                        options={[]}
                        value={selectedRoles.poOrigin || []}
                        onChange={(values) => setValue('poOrigin', values)}
                        placeholder="Enter PO origins..."
                        label="PO Origin"
                        allowCustom
                        searchPlaceholder="Add origin..."
                      />
                    </div>

                    <div>
                      <MultiSelect
                        options={[]}
                        value={selectedRoles.poShipTo || []}
                        onChange={(values) => setValue('poShipTo', values)}
                        placeholder="Enter ship-to locations..."
                        label="PO Ship To"
                        allowCustom
                        searchPlaceholder="Add ship-to location..."
                      />
                    </div>
                  </div>
                </div>

                {/* ePro Fields */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Electronic Procurement (ePro)</h4>
                  
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div>
                      <MultiSelect
                        options={[]}
                        value={selectedRoles.eproFund || []}
                        onChange={(values) => setValue('eproFund', values)}
                        placeholder="Enter ePro fund codes..."
                        label="ePro Fund"
                        allowCustom
                        searchPlaceholder="Add fund code..."
                      />
                    </div>

                    <div>
                      <MultiSelect
                        options={[]}
                        value={selectedRoles.eproAgencyCost1 || []}
                        onChange={(values) => setValue('eproAgencyCost1', values)}
                        placeholder="Enter agency cost centers..."
                        label="ePro Agency Cost 1"
                        allowCustom
                        searchPlaceholder="Add cost center..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div>
                      <MultiSelect
                        options={[]}
                        value={selectedRoles.eproAppropriationId || []}
                        onChange={(values) => setValue('eproAppropriationId', values)}
                        placeholder="Enter appropriation IDs..."
                        label="ePro Appropriation ID"
                        allowCustom
                        searchPlaceholder="Add appropriation ID..."
                      />
                    </div>

                    <div>
                      <MultiSelect
                        options={[]}
                        value={selectedRoles.eproFinDepartmentId || []}
                        onChange={(values) => setValue('eproFinDepartmentId', values)}
                        placeholder="Enter financial department IDs..."
                        label="ePro Financial Department ID"
                        allowCustom
                        searchPlaceholder="Add department ID..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Vendor Management Section */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Users className="h-5 w-5 text-teal-600 mr-2" />
                    Vendor Management
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage vendor information, setup, and approval processes.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      {...register('vendorInquiryOnly')}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Vendor Inquiry Only</span>
                      <p className="text-xs text-gray-500">View-only access to vendor information</p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      {...register('vendorMaintenance')}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Vendor Maintenance</span>
                      <p className="text-xs text-gray-500">Maintain vendor records and information</p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      {...register('vendorApproval')}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Vendor Approval</span>
                      <p className="text-xs text-gray-500">Approve new vendors and vendor changes</p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      {...register('vendorSetup')}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Vendor Setup</span>
                      <p className="text-xs text-gray-500">Set up new vendor accounts</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Strategic Sourcing (SS) Section */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Settings className="h-5 w-5 text-purple-600 mr-2" />
                    Strategic Sourcing (SS)
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage strategic sourcing events, collaboration, and approvals.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Event Management */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Event Management</h4>
                    
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('ssEventCreatorBuyer')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Event Creator/Buyer</span>
                        <p className="text-xs text-gray-500">Create and manage sourcing events</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('ssEventCollaborator')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Event Collaborator</span>
                        <p className="text-xs text-gray-500">Collaborate on sourcing events</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('ssEventApprover')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Event Approver</span>
                        <p className="text-xs text-gray-500">Approve sourcing events</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('ssEventInquiryOnly')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Event Inquiry Only</span>
                        <p className="text-xs text-gray-500">View-only access to sourcing events</p>
                      </div>
                    </label>
                  </div>

                  {/* Technical Coordination */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Technical Coordination</h4>
                    
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('ssTechCoordApprover')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Tech Coord Approver</span>
                        <p className="text-xs text-gray-500">Technical coordination approver</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('ssTechStateApprover')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Tech State Approver</span>
                        <p className="text-xs text-gray-500">State-level technical approver</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('ssAllOrigins')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">All Origins</span>
                        <p className="text-xs text-gray-500">Access to all origin locations</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Strategic Sourcing Controls */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Strategic Sourcing Controls</h4>
                  
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div>
                      <MultiSelect
                        options={businessUnitOptions}
                        value={selectedRoles.ssBusinessUnits || []}
                        onChange={(values) => setValue('ssBusinessUnits', values)}
                        placeholder="Select business units..."
                        label="SS Business Units"
                        searchPlaceholder="Search business units..."
                      />
                    </div>

                    <div>
                      <MultiSelect
                        options={[]}
                        value={selectedRoles.ssSelectedOrigins || []}
                        onChange={(values) => setValue('ssSelectedOrigins', values)}
                        placeholder="Enter selected origins..."
                        label="SS Selected Origins"
                        allowCustom
                        searchPlaceholder="Add origin..."
                      />
                    </div>

                    <div>
                      <MultiSelect
                        options={[]}
                        value={selectedRoles.ssDefaultOrigin || []}
                        onChange={(values) => setValue('ssDefaultOrigin', values)}
                        placeholder="Enter default origin..."
                        label="SS Default Origin"
                        allowCustom
                        searchPlaceholder="Add default origin..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contract Management Section */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 text-indigo-600 mr-2" />
                    Contract Management
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage contracts, agreements, and encumbrances.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Contract Roles */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Contract Roles</h4>
                    
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('contractEncumbrance')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Contract Encumbrance</span>
                        <p className="text-xs text-gray-500">Manage contract encumbrances</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('scAgreementManager')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">SC Agreement Manager</span>
                        <p className="text-xs text-gray-500">Manage service contracts and agreements</p>
                      </div>
                    </label>
                  </div>

                  {/* Document Management */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Document Management</h4>
                    
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('scElectronicDocsYes')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">SC Electronic Docs - Yes</span>
                        <p className="text-xs text-gray-500">Access to electronic documents</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('scElectronicDocsNo')}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">SC Electronic Docs - No</span>
                        <p className="text-xs text-gray-500">No access to electronic documents</p>
                      </div>
                    </label>
                  </div>

                  {/* Contract Controls */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Contract Controls</h4>
                    
                    <div>
                      <MultiSelect
                        options={[]}
                        value={selectedRoles.scDocApproverOrigin || []}
                        onChange={(values) => setValue('scDocApproverOrigin', values)}
                        placeholder="Enter document approver origins..."
                        label="SC Doc Approver Origin"
                        allowCustom
                        searchPlaceholder="Add origin..."
                      />
                    </div>

                    <div>
                      <MultiSelect
                        options={[]}
                        value={selectedRoles.scOtherEmployeeIds || []}
                        onChange={(values) => setValue('scOtherEmployeeIds', values)}
                        placeholder="Enter employee IDs..."
                        label="SC Other Employee IDs"
                        allowCustom
                        searchPlaceholder="Add employee ID..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Procurement Cards (P-Card) Section */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                    Procurement Cards (P-Card)
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage procurement card approvals, reviews, and reconciliation.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      {...register('pCardApprover')}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">P-Card Approver</span>
                      <p className="text-xs text-gray-500">Approve procurement card transactions</p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      {...register('pCardReviewer')}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">P-Card Reviewer</span>
                      <p className="text-xs text-gray-500">Review procurement card transactions</p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      {...register('pCardReconciler')}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">P-Card Reconciler</span>
                      <p className="text-xs text-gray-500">Reconcile procurement card statements</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Central Goods (CG) Section */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Package className="h-5 w-5 text-orange-600 mr-2" />
                    Central Goods (CG)
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage central goods catalog and order processing.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      {...register('cgCatalogOwner')}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">CG Catalog Owner</span>
                      <p className="text-xs text-gray-500">Own and manage catalog items</p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      {...register('cgInquiryOnly')}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">CG Inquiry Only</span>
                      <p className="text-xs text-gray-500">View-only access to central goods</p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      {...register('coreOrderReceiver')}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Core Order Receiver</span>
                      <p className="text-xs text-gray-500">Receive core orders from central goods</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Additional Access Controls Section */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Settings className="h-5 w-5 text-gray-600 mr-2" />
                    Additional Access Controls
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Configure additional access parameters and restrictions.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Access Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add Access Type
                    </label>
                    <select
                      {...register('addAccessType')}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Select access type...</option>
                      <option value="agency">Agency</option>
                      <option value="department">Department</option>
                      <option value="statewide">Statewide</option>
                    </select>
                  </div>

                  {/* Access Controls */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div>
                      <MultiSelect
                        options={[]}
                        value={selectedRoles.agencyCodes || []}
                        onChange={(values) => setValue('agencyCodes', values)}
                        placeholder="Enter agency codes..."
                        label="Agency Codes"
                        allowCustom
                        searchPlaceholder="Add agency code..."
                      />
                    </div>

                    <div>
                      <MultiSelect
                        options={[]}
                        value={selectedRoles.departmentId || []}
                        onChange={(values) => setValue('departmentId', values)}
                        placeholder="Enter department IDs..."
                        label="Department ID"
                        allowCustom
                        searchPlaceholder="Add department ID..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div>
                      <MultiSelect
                        options={[]}
                        value={selectedRoles.prohibitedDepartmentIds || []}
                        onChange={(values) => setValue('prohibitedDepartmentIds', values)}
                        placeholder="Enter prohibited department IDs..."
                        label="Prohibited Department IDs"
                        allowCustom
                        searchPlaceholder="Add prohibited ID..."
                      />
                    </div>

                    <div>
                      <MultiSelect
                        options={[]}
                        value={selectedRoles.deleteAccessCodes || []}
                        onChange={(values) => setValue('deleteAccessCodes', values)}
                        placeholder="Enter access codes to delete..."
                        label="Delete Access Codes"
                        allowCustom
                        searchPlaceholder="Add access code..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Role Justification Section */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Role Justification</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Provide justification for the selected roles and access levels.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role Justification
                    {hasSelectedRoles && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <textarea
                    {...register('roleJustification', {
                      required: hasSelectedRoles ? 'Please provide justification for the requested roles' : false,
                    })}
                    rows={4}
                    placeholder="Please explain why these specific roles are necessary for the employee's job responsibilities. Include details about their duties, the systems they need to access, and how these roles will be used in their daily work..."
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.roleJustification && (
                    <p className="mt-1 text-sm text-red-600">{errors.roleJustification.message}</p>
                  )}
                </div>
              </div>

              {/* Supervisor Approval Section */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Supervisor Approval</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Supervisor acknowledgment of role selections.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      {...register('supervisorApproval', {
                        required: !hasSelectedRoles ? 'Supervisor approval is required when no roles are selected' : false,
                      })}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-blue-800">
                        Supervisor Approval
                        {!hasSelectedRoles && <span className="text-red-500 ml-1">*</span>}
                      </span>
                      <p className="text-xs text-blue-700 mt-1">
                        I acknowledge that I have reviewed the role selections above and confirm they are appropriate for this employee's job responsibilities.
                        {!hasSelectedRoles && ' (Required when no specific roles are selected)'}
                      </p>
                    </div>
                  </label>
                  {errors.supervisorApproval && (
                    <p className="mt-2 text-sm text-red-600">{errors.supervisorApproval.message}</p>
                  )}
                </div>
              </div>

              {/* Submit Section */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  {hasSelectedRoles ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Roles selected - justification required
                    </div>
                  ) : (
                    <div className="flex items-center text-yellow-600">
                      <Info className="h-4 w-4 mr-1" />
                      No roles selected - supervisor approval required
                    </div>
                  )}
                </div>

                <div className="flex space-x-4">
                  <Link
                    to="/"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={saving || (!hasSelectedRoles && !selectedRoles.supervisorApproval)}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      saving || (!hasSelectedRoles && !selectedRoles.supervisorApproval)
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    }`}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Submit Role Selections'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SelectRolesPage;