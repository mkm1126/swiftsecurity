// src/SelectRolesPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, AlertTriangle, Users, Copy } from 'lucide-react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { toast } from 'sonner';
import Header from './components/Header';
import MultiSelect from './components/MultiSelect';
import UserSelect from './components/UserSelect';
import { businessUnits } from './lib/businessUnitData';
import { accountingProcurementRoles } from './lib/accountingProcurementRoleDefinitions';

interface SecurityRoleSelection {
  homeBusinessUnit: string | string[];
  otherBusinessUnits?: string;

  // Accounts Payable
  voucherEntry: boolean;
  voucherApprover1?: string;
  voucherApprover2?: string;
  voucherApprover3?: string;
  maintenanceVoucherBuildErrors: boolean;
  matchOverride: boolean;
  apInquiryOnly: boolean;
  apWorkflowApprover?: boolean;
  apWorkflowRouteControls?: string;

  // Accounts Receivable and Cash Management
  cashMaintenance: boolean;
  receivableSpecialist: boolean;
  receivableSupervisor: boolean;
  writeoffApprovalBusinessUnits?: string;
  billingCreate: boolean;
  billingSpecialist: boolean;
  billingSupervisor: boolean;
  creditInvoiceApprovalBusinessUnits?: string;
  customerMaintenanceSpecialist: boolean;
  arBillingSetup: boolean;
  arBillingInquiryOnly: boolean;
  cashManagementInquiryOnly: boolean;

  // Budgets/Commitment Control & Appropriation Maintenance
  budgetJournalEntryOnline: boolean;
  budgetJournalLoad: boolean;
  journalApprover: boolean;
  appropriationSources?: string;
  expenseBudgetSource?: string;
  revenueBudgetSource?: string;
  budgetTransferEntryOnline: boolean;
  transferApprover: boolean;
  transferAppropriationSources?: string;
  budgetInquiryOnly: boolean;

  // General Ledger and NVISION Reporting
  journalEntryOnline: boolean;
  journalLoad: boolean;
  agencyChartfieldMaintenance: boolean;
  glAgencyApprover: boolean;
  glAgencyApproverSources?: string;
  generalLedgerInquiryOnly: boolean;
  nvisionReportingAgencyUser: boolean;
  needsDailyReceiptsReport?: boolean;

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
  routeControl?: string;

  // Cost Allocation
  costAllocationInquiryOnly: boolean;

  // Asset Management
  financialAccountantAssets: boolean;
  assetManagementInquiryOnly: boolean;
  physicalInventoryApproval1: boolean;
  physicalInventoryBusinessUnits?: string;
  physicalInventoryApproval2: boolean;
  physicalInventoryDepartmentIds?: string;

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
  shipToLocation?: string;
  inventoryBusinessUnits?: string;

  // PO Approver fields
  poApprover: boolean;
  poApprover2: boolean;
  poApprover3: boolean;
  poApproverLimit1?: string;
  poApproverLimit2?: string;
  poApproverLimit3?: string;
  poApproverRouteControls?: string;

  // AP fields
  apVoucherApprover1: boolean;
  apVoucherApprover2: boolean;
  apVoucherApprover3: boolean;
  apVoucherApprover1RouteControls?: string;
  apVoucherApprover2RouteControls?: string;
  apVoucherApprover3RouteControls?: string;

  // Approval acknowledgment
  supervisorApproval: boolean;

  // Role justification
  roleJustification?: string;
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

interface User {
  employee_name: string;
  employee_id: string;
  email: string;
  request_id?: string;
}

// Group roles by category for better organization
const rolesByCategory = accountingProcurementRoles.reduce((acc, role) => {
  if (!acc[role.category]) {
    acc[role.category] = [];
  }
  acc[role.category].push(role);
  return acc;
}, {} as Record<string, typeof accountingProcurementRoles>);

// Simple form persistence - save form data when it changes
const useFormPersistence = (requestDetails: any, watch: any) => {
  useEffect(() => {
    if (!requestDetails) return;

    const timeoutId = setTimeout(() => {
      const formData = watch();
      if (Object.keys(formData).length === 0) return;

      const storageKey = `selectRoles_${requestDetails.employee_name}_${requestDetails.agency_name}`.replace(/[^a-zA-Z0-9]/g, '_');
      localStorage.setItem(storageKey, JSON.stringify(formData));
      console.log('💾 Auto-saving Select Roles form data:', { storageKey, formData });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watch(), requestDetails]);
};

function SelectRolesPage() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { requestId?: string } };
  const { id: idParam } = useParams();

  const [saving, setSaving] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState<{ employee_name?: string; agency_name?: string; agency_code?: string } | null>(null);
  const [isEditingCopiedRoles, setIsEditingCopiedRoles] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [availableBusinessUnits, setAvailableBusinessUnits] = useState<Array<{ business_unit_code: string; business_unit_name: string }>>([]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SecurityRoleSelection>({
    defaultValues: {
      homeBusinessUnit: '',
      otherBusinessUnits: '',
      voucherEntry: false,
      maintenanceVoucherBuildErrors: false,
      matchOverride: false,
      apInquiryOnly: false,
      apWorkflowApprover: false,
      cashMaintenance: false,
      receivableSpecialist: false,
      receivableSupervisor: false,
      billingCreate: false,
      billingSpecialist: false,
      billingSupervisor: false,
      customerMaintenanceSpecialist: false,
      arBillingSetup: false,
      arBillingInquiryOnly: false,
      cashManagementInquiryOnly: false,
      budgetJournalEntryOnline: false,
      budgetJournalLoad: false,
      journalApprover: false,
      budgetTransferEntryOnline: false,
      transferApprover: false,
      budgetInquiryOnly: false,
      journalEntryOnline: false,
      journalLoad: false,
      agencyChartfieldMaintenance: false,
      glAgencyApprover: false,
      generalLedgerInquiryOnly: false,
      nvisionReportingAgencyUser: false,
      awardDataEntry: false,
      grantFiscalManager: false,
      programManager: false,
      gmAgencySetup: false,
      grantsInquiryOnly: false,
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
      costAllocationInquiryOnly: false,
      financialAccountantAssets: false,
      assetManagementInquiryOnly: false,
      physicalInventoryApproval1: false,
      physicalInventoryApproval2: false,
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
      poApprover: false,
      poApprover2: false,
      poApprover3: false,
      apVoucherApprover1: false,
      apVoucherApprover2: false,
      apVoucherApprover3: false,
      supervisorApproval: false,
    }
  });

  // Use form persistence hook
  useFormPersistence(requestDetails, watch);

  const selectedRoles = watch();
  const hasSelectedRoles = Object.values(selectedRoles).some(value => value === true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const isCopyFlow = localStorage.getItem('editingCopiedRoles') === 'true';

    if (isCopyFlow) {
      const pendingFormData = localStorage.getItem('pendingFormData');
      const copiedRoleSelections = localStorage.getItem('copiedRoleSelections');
      const copiedUserDetails = localStorage.getItem('copiedUserDetails');

      if (pendingFormData && copiedRoleSelections && copiedUserDetails) {
        setIsEditingCopiedRoles(true);
        try {
          const formData: CopyFlowForm = JSON.parse(pendingFormData);
          const roleData = JSON.parse(copiedRoleSelections);
          setRequestDetails({ employee_name: formData.employeeName, agency_name: formData.agencyName, agency_code: formData.agencyCode });
          
          // Map copied role data to form fields
          if (roleData) {
            Object.entries(roleData).forEach(([key, value]) => {
              if (typeof value === 'boolean' && value === true) {
                setValue(key as keyof SecurityRoleSelection, value as any, { shouldDirty: false });
              } else if (typeof value === 'string' && value.trim()) {
                setValue(key as keyof SecurityRoleSelection, value as any, { shouldDirty: false });
              }
            });
          }
        } catch (e) {
          console.error('Error loading copy-flow data:', e);
          toast.error('Error loading copied user data');
        }
      } else {
        localStorage.removeItem('editingCopiedRoles');
        toast.error('Copy flow data is incomplete. Please try again.');
        navigate('/');
      }
    } else {
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

  // Try to restore saved form data after request details are loaded
  useEffect(() => {
    if (!requestDetails) return;

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
    fetchBusinessUnits();
  }, []);

  async function fetchBusinessUnits() {
    try {
      const { data, error } = await supabase
        .from('agency_business_units')
        .select('business_unit_code, business_unit_name')
        .order('business_unit_name');

      if (error) throw error;
      setAvailableBusinessUnits(data || []);
    } catch (error) {
      console.error('Error fetching business units:', error);
      setAvailableBusinessUnits(businessUnits.map(bu => ({
        business_unit_code: bu.businessUnit,
        business_unit_name: bu.description
      })));
    }
  }

  async function fetchRequestDetails(id: string) {
    try {
      const { data, error } = await supabase
        .from('security_role_requests')
        .select('employee_name, agency_name, agency_code')
        .eq('id', id)
        .single();

      if (error) throw error;
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
        if (typeof value === 'boolean') {
          setValue(key as keyof SecurityRoleSelection, value as any, { shouldDirty: false });
        } else if (typeof value === 'string' && value.trim()) {
          setValue(key as keyof SecurityRoleSelection, value as any, { shouldDirty: false });
        }
      });
    } catch (e) {
      console.error('Failed to fetch existing role selections:', e);
    }
  }

  const onSubmit = async (data: SecurityRoleSelection) => {
    if (!hasSelectedRoles) {
      toast.error('Please select at least one role.');
      return;
    }

    setSaving(true);
    try {
      if (isEditingCopiedRoles) {
        const pendingFormData = localStorage.getItem('pendingFormData');
        if (!pendingFormData) throw new Error('No pending form data found');

        const d: CopyFlowForm = JSON.parse(pendingFormData);
        const pocUser = localStorage.getItem('pocUserName');

        const requestPayload = {
          start_date: d.startDate,
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

        const { error: areasError } = await supabase
          .from('security_areas')
          .insert({
            request_id: newRequest.id,
            area_type: 'accounting_procurement',
            director_name: d.accountingDirector || null,
            director_email: d.accountingDirectorUsername || null,
          });

        if (areasError) throw areasError;

        const selections = buildSelections(newRequest.id, d.agencyCode, data);
        const { error: selectionsError } = await supabase
          .from('security_role_selections')
          .insert(selections);

        if (selectionsError) throw selectionsError;

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

        const selections = buildSelections(requestId, requestDetails?.agency_code, data);
        const { error } = await supabase
          .from('security_role_selections')
          .upsert(selections, { onConflict: 'request_id' });

        if (error) throw error;

        // Save to localStorage for future visits
        if (requestDetails) {
          const storageKey = `selectRoles_${requestDetails.employee_name}_${requestDetails.agency_name}`.replace(/[^a-zA-Z0-9]/g, '_');
          localStorage.setItem(storageKey, JSON.stringify(data));
          console.log('💾 Saving Select Roles form data for future visits:', { storageKey, data });
        }

        toast.success('Role selections saved successfully!');
        navigate('/success', { state: { requestId } });
      }
    } catch (err: any) {
      console.error('Error saving copy flow role selections:', err);
      toast.error('Failed to save role selections. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  function buildSelections(requestId: string, agencyCode: string | undefined, formData: SecurityRoleSelection) {
    const homeBusinessUnit = Array.isArray(formData.homeBusinessUnit) 
      ? formData.homeBusinessUnit 
      : formData.homeBusinessUnit 
        ? [formData.homeBusinessUnit] 
        : [(agencyCode?.padEnd(5, '0') || '00000').substring(0, 5)];

    return {
      request_id: requestId,
      home_business_unit: homeBusinessUnit,
      other_business_units: formData.otherBusinessUnits || null,
      
      // Accounts Payable
      voucher_entry: formData.voucherEntry,
      voucher_approver_1: formData.voucherApprover1 ? [formData.voucherApprover1] : null,
      voucher_approver_2: formData.voucherApprover2 ? [formData.voucherApprover2] : null,
      voucher_approver_3: formData.voucherApprover3 ? [formData.voucherApprover3] : null,
      maintenance_voucher_build_errors: formData.maintenanceVoucherBuildErrors,
      match_override: formData.matchOverride,
      ap_inquiry_only: formData.apInquiryOnly,
      ap_workflow_approver: formData.apWorkflowApprover || false,
      ap_workflow_route_controls: formData.apWorkflowRouteControls || null,

      // Accounts Receivable and Cash Management
      cash_maintenance: formData.cashMaintenance,
      receivable_specialist: formData.receivableSpecialist,
      receivable_supervisor: formData.receivableSupervisor,
      writeoff_approval_business_units: formData.writeoffApprovalBusinessUnits || null,
      billing_create: formData.billingCreate,
      billing_specialist: formData.billingSpecialist,
      billing_supervisor: formData.billingSupervisor,
      credit_invoice_approval_business_units: formData.creditInvoiceApprovalBusinessUnits || null,
      customer_maintenance_specialist: formData.customerMaintenanceSpecialist,
      ar_billing_setup: formData.arBillingSetup,
      ar_billing_inquiry_only: formData.arBillingInquiryOnly,
      cash_management_inquiry_only: formData.cashManagementInquiryOnly,

      // Budgets/Commitment Control & Appropriation Maintenance
      budget_journal_entry_online: formData.budgetJournalEntryOnline,
      budget_journal_load: formData.budgetJournalLoad,
      journal_approver: formData.journalApprover,
      appropriation_sources: formData.appropriationSources || null,
      expense_budget_source: formData.expenseBudgetSource || null,
      revenue_budget_source: formData.revenueBudgetSource || null,
      budget_transfer_entry_online: formData.budgetTransferEntryOnline,
      transfer_approver: formData.transferApprover,
      transfer_appropriation_sources: formData.transferAppropriationSources || null,
      budget_inquiry_only: formData.budgetInquiryOnly,

      // General Ledger and NVISION Reporting
      journal_entry_online: formData.journalEntryOnline,
      journal_load: formData.journalLoad,
      agency_chartfield_maintenance: formData.agencyChartfieldMaintenance,
      gl_agency_approver: formData.glAgencyApprover,
      gl_agency_approver_sources: formData.glAgencyApproverSources || null,
      general_ledger_inquiry_only: formData.generalLedgerInquiryOnly,
      nvision_reporting_agency_user: formData.nvisionReportingAgencyUser,
      needs_daily_receipts_report: formData.needsDailyReceiptsReport || false,

      // Grants
      award_data_entry: formData.awardDataEntry,
      grant_fiscal_manager: formData.grantFiscalManager,
      program_manager: formData.programManager,
      gm_agency_setup: formData.gmAgencySetup,
      grants_inquiry_only: formData.grantsInquiryOnly,

      // Project Costing
      federal_project_initiator: formData.federalProjectInitiator,
      oim_initiator: formData.oimInitiator,
      project_initiator: formData.projectInitiator,
      project_manager: formData.projectManager,
      capital_programs_office: formData.capitalProgramsOffice,
      project_cost_accountant: formData.projectCostAccountant,
      project_fixed_asset: formData.projectFixedAsset,
      category_subcategory_manager: formData.categorySubcategoryManager,
      project_control_dates: formData.projectControlDates,
      project_accounting_systems: formData.projectAccountingSystems,
      mndot_projects_inquiry: formData.mndotProjectsInquiry,
      projects_inquiry_only: formData.projectsInquiryOnly,
      mndot_project_approver: formData.mndotProjectApprover,
      route_control: formData.routeControl || null,

      // Cost Allocation
      cost_allocation_inquiry_only: formData.costAllocationInquiryOnly,

      // Asset Management
      financial_accountant_assets: formData.financialAccountantAssets,
      asset_management_inquiry_only: formData.assetManagementInquiryOnly,
      physical_inventory_approval_1: formData.physicalInventoryApproval1,
      physical_inventory_business_units: formData.physicalInventoryBusinessUnits || null,
      physical_inventory_approval_2: formData.physicalInventoryApproval2,
      physical_inventory_department_ids: formData.physicalInventoryDepartmentIds || null,

      // Inventory
      inventory_express_issue: formData.inventoryExpressIssue,
      inventory_adjustment_approver: formData.inventoryAdjustmentApprover,
      inventory_replenishment_buyer: formData.inventoryReplenishmentBuyer,
      inventory_control_worker: formData.inventoryControlWorker,
      inventory_express_putaway: formData.inventoryExpressPutaway,
      inventory_fulfillment_specialist: formData.inventoryFulfillmentSpecialist,
      inventory_po_receiver: formData.inventoryPoReceiver,
      inventory_returns_receiver: formData.inventoryReturnsReceiver,
      inventory_cost_adjustment: formData.inventoryCostAdjustment,
      inventory_materials_manager: formData.inventoryMaterialsManager,
      inventory_delivery: formData.inventoryDelivery,
      inventory_inquiry_only: formData.inventoryInquiryOnly,
      inventory_configuration_agency: formData.inventoryConfigurationAgency,
      inventory_pick_plan_report_distribution: formData.inventoryPickPlanReportDistribution,
      ship_to_location: formData.shipToLocation || null,
      inventory_business_units: formData.inventoryBusinessUnits || null,

      // PO Approver fields
      po_approver: formData.poApprover,
      po_approver_2: formData.poApprover2,
      po_approver_3: formData.poApprover3,
      po_approver_limit_1: formData.poApproverLimit1 || null,
      po_approver_limit_2: formData.poApproverLimit2 || null,
      po_approver_limit_3: formData.poApproverLimit3 || null,
      po_approver_route_controls: formData.poApproverRouteControls || null,

      // AP fields
      ap_voucher_approver_1: formData.apVoucherApprover1,
      ap_voucher_approver_2: formData.apVoucherApprover2,
      ap_voucher_approver_3: formData.apVoucherApprover3,
      ap_voucher_approver_1_route_controls: formData.apVoucherApprover1RouteControls || null,
      ap_voucher_approver_2_route_controls: formData.apVoucherApprover2RouteControls || null,
      ap_voucher_approver_3_route_controls: formData.apVoucherApprover3RouteControls || null,

      // Approval acknowledgment
      supervisor_approval: formData.supervisorApproval,

      // Role justification
      role_justification: formData.roleJustification || null,
    };
  }

  const businessUnitOptions = availableBusinessUnits.map(unit => ({
    value: unit.business_unit_code,
    label: `${unit.business_unit_name} (${unit.business_unit_code})`
  }));

  const handleUserChange = (user: User | null) => {
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
                <Users className="h-8 w-8 text-blue-600 mr-3" />
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
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Copy className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-blue-800">
                      Copy Existing User Access (Optional)
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        You can copy role selections from an existing user who has similar job responsibilities.
                        This will pre-populate the form with their current access permissions.
                      </p>
                    </div>
                    <div className="mt-4">
                      <UserSelect
                        selectedUser={selectedUser}
                        onUserChange={handleUserChange}
                        formData={watch()}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Unit Selection */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Business Unit Information</h3>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Home Business Unit <span className="text-red-500">*</span>
                    </label>
                    <MultiSelect
                      options={businessUnitOptions}
                      value={watch('homeBusinessUnit') || []}
                      onChange={(values) => setValue('homeBusinessUnit', values)}
                      placeholder="Select business units..."
                      searchPlaceholder="Search business units..."
                      allowCustom={true}
                      ariaLabel="Home Business Unit selection"
                    />
                    {errors.homeBusinessUnit && (
                      <p className="mt-1 text-sm text-red-600">{errors.homeBusinessUnit.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Other Business Units
                    </label>
                    <textarea
                      {...register('otherBusinessUnits')}
                      rows={3}
                      placeholder="Enter additional business unit codes if needed..."
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Optional: List any additional business units that require access
                    </p>
                  </div>
                </div>
              </div>

              {/* Role Selection Tables */}
              {Object.entries(rolesByCategory).map(([category, roles]) => (
                <div key={category} className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">{category}</h3>
                  
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Technical Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {roles.map((role) => (
                          <tr key={role.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  {...register(role.id)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm font-medium text-gray-900">
                                  {role.formDescription}
                                </span>
                              </label>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                              {role.roleName}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {role.description}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {/* Role Justification */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Justification</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Role Justification <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('roleJustification', {
                      required: 'Please provide justification for the requested roles',
                    })}
                    rows={4}
                    placeholder="Please explain why these roles are necessary for your job responsibilities..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.roleJustification && (
                    <p className="mt-1 text-sm text-red-600">{errors.roleJustification.message}</p>
                  )}
                </div>
              </div>

              {/* Supervisor Approval */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Approval</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Supervisor Approval Required</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Your supervisor must approve this request before it can be processed. Please ensure
                          they are aware of this request and the roles you are requesting.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('supervisorApproval', {
                        required: 'Supervisor approval acknowledgment is required',
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      I acknowledge that my supervisor must approve this request
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