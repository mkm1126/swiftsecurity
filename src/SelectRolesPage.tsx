// src/SelectRolesPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  Save,
  AlertTriangle,
  DollarSign,
  FileText,
  BarChart3,
  Package,
  Building2,
  Calculator,
  TrendingUp,
  Briefcase,
  Shield,
  Users,
  Copy,
  Check,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { toast } from 'sonner';
import { businessUnits } from './lib/businessUnitData';
import Header from './components/Header';
import MultiSelect from './components/MultiSelect';
import UserSelect from './components/UserSelect';

interface SecurityRoleSelection {
  // Business Unit Details
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

  // Inventory (IN) - Updated field names for clarity
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
  
  // New inventory fields
  shipToLocation?: string;
  inventoryBusinessUnits?: string;

  // Approval acknowledgment
  supervisorApproval: boolean;

  // Role justification
  roleJustification?: string;

  // Copy user functionality
  copyFromUser: boolean;
  copyUserName?: string;
  copyUserEmployeeId?: string;
  copyUserSema4Id?: string;
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

// Role definitions with categories and icons
const roleCategories = [
  {
    id: 'accounts_payable',
    title: 'Accounts Payable',
    icon: DollarSign,
    description: 'Manage vouchers, approvals, and payment processing',
    roles: [
      { id: 'voucherEntry', title: 'Voucher Entry', description: 'Create and enter vouchers into the system' },
      { id: 'voucherApprover1', title: 'Voucher Approver 1', description: 'First level approval for vouchers', requiresRouteControl: true },
      { id: 'voucherApprover2', title: 'Voucher Approver 2', description: 'Second level approval for vouchers', requiresRouteControl: true },
      { id: 'voucherApprover3', title: 'Voucher Approver 3', description: 'Third level approval for vouchers', requiresRouteControl: true },
      { id: 'maintenanceVoucherBuildErrors', title: 'Maintenance Voucher Build Errors', description: 'Resolve errors in voucher building processes' },
      { id: 'matchOverride', title: 'Match Override', description: 'Override matching discrepancies in accounts payable' },
      { id: 'apInquiryOnly', title: 'AP Inquiry Only', description: 'View-only access to Accounts Payable information' },
      { id: 'apWorkflowApprover', title: 'AP Workflow Approver', description: 'Approver role within the Accounts Payable workflow' },
      { id: 'apWorkflowRouteControls', title: 'AP Workflow Route Controls', description: 'Manage routing controls for AP workflows' },
    ]
  },
  {
    id: 'accounts_receivable',
    title: 'Accounts Receivable and Cash Management',
    icon: TrendingUp,
    description: 'Manage receivables, billing, and cash operations',
    roles: [
      { id: 'cashMaintenance', title: 'Cash Maintenance', description: 'Manage cash-related transactions and records' },
      { id: 'receivableSpecialist', title: 'Receivable Specialist', description: 'Specialist role for managing accounts receivable' },
      { id: 'receivableSupervisor', title: 'Receivable Supervisor', description: 'Supervisory role for accounts receivable operations' },
      { id: 'writeoffApprovalBusinessUnits', title: 'Write-off Approval Business Units', description: 'Approve write-offs for specific business units', requiresInput: true },
      { id: 'billingCreate', title: 'Billing Create', description: 'Create new billing entries' },
      { id: 'billingSpecialist', title: 'Billing Specialist', description: 'Specialist role for billing processes' },
      { id: 'billingSupervisor', title: 'Billing Supervisor', description: 'Supervisory role for billing operations' },
      { id: 'creditInvoiceApprovalBusinessUnits', title: 'Credit Invoice Approval Business Units', description: 'Approve credit invoices for specific business units', requiresInput: true },
      { id: 'customerMaintenanceSpecialist', title: 'Customer Maintenance Specialist', description: 'Manage customer records and data' },
      { id: 'arBillingSetup', title: 'AR Billing Setup', description: 'Configure Accounts Receivable billing settings' },
      { id: 'arBillingInquiryOnly', title: 'AR Billing Inquiry Only', description: 'View-only access to Accounts Receivable billing information' },
      { id: 'cashManagementInquiryOnly', title: 'Cash Management Inquiry Only', description: 'View-only access to cash management details' },
    ]
  },
  {
    id: 'budgets',
    title: 'Budgets/Commitment Control & Appropriation Maintenance',
    icon: Calculator,
    description: 'Manage budgets, appropriations, and financial controls',
    roles: [
      { id: 'budgetJournalEntryOnline', title: 'Budget Journal Entry Online', description: 'Enter budget journals online' },
      { id: 'budgetJournalLoad', title: 'Budget Journal Load', description: 'Load budget journals into the system' },
      { id: 'journalApprover', title: 'Journal Approver', description: 'Approve budget journals' },
      { id: 'appropriationSources', title: 'Appropriation Sources', description: 'Manage sources of appropriations', requiresInput: true },
      { id: 'expenseBudgetSource', title: 'Expense Budget Source', description: 'Manage sources for expense budgets', requiresInput: true },
      { id: 'revenueBudgetSource', title: 'Revenue Budget Source', description: 'Manage sources for revenue budgets', requiresInput: true },
      { id: 'budgetTransferEntryOnline', title: 'Budget Transfer Entry Online', description: 'Enter budget transfers online' },
      { id: 'transferApprover', title: 'Transfer Approver', description: 'Approve budget transfers' },
      { id: 'transferAppropriationSources', title: 'Transfer Appropriation Sources', description: 'Manage appropriation sources for transfers', requiresInput: true },
      { id: 'budgetInquiryOnly', title: 'Budget Inquiry Only', description: 'View-only access to budget information' },
    ]
  },
  {
    id: 'general_ledger',
    title: 'General Ledger and NVISION Reporting',
    icon: FileText,
    description: 'Manage general ledger entries and reporting',
    roles: [
      { id: 'journalEntryOnline', title: 'Journal Entry Online', description: 'Enter general ledger journals online' },
      { id: 'journalLoad', title: 'Journal Load', description: 'Load general ledger journals into the system' },
      { id: 'agencyChartfieldMaintenance', title: 'Agency Chartfield Maintenance', description: 'Maintain chartfield data for agencies' },
      { id: 'glAgencyApprover', title: 'GL Agency Approver', description: 'Approve general ledger entries for agencies' },
      { id: 'glAgencyApproverSources', title: 'GL Agency Approver Sources', description: 'Manage sources for GL agency approvers', requiresInput: true },
      { id: 'generalLedgerInquiryOnly', title: 'General Ledger Inquiry Only', description: 'View-only access to General Ledger information' },
      { id: 'nvisionReportingAgencyUser', title: 'NVISION Reporting Agency User', description: 'User role for NVISION reporting within an agency' },
      { id: 'needsDailyReceiptsReport', title: 'Needs Daily Receipts Report', description: 'Access to daily receipts reports' },
    ]
  },
  {
    id: 'grants',
    title: 'Grants',
    icon: BarChart3,
    description: 'Manage grant programs and fiscal operations',
    roles: [
      { id: 'awardDataEntry', title: 'Award Data Entry', description: 'Enter award-related data for grants' },
      { id: 'grantFiscalManager', title: 'Grant Fiscal Manager', description: 'Manage financial aspects of grants' },
      { id: 'programManager', title: 'Program Manager', description: 'Manage grant programs' },
      { id: 'gmAgencySetup', title: 'GM Agency Setup', description: 'Configure agency-specific settings for grants management' },
      { id: 'grantsInquiryOnly', title: 'Grants Inquiry Only', description: 'View-only access to grants information' },
    ]
  },
  {
    id: 'project_costing',
    title: 'Project Costing',
    icon: Briefcase,
    description: 'Manage project costs and accounting',
    roles: [
      { id: 'federalProjectInitiator', title: 'Federal Project Initiator', description: 'Initiate federal projects' },
      { id: 'oimInitiator', title: 'OIM Initiator', description: 'Initiate OIM (Other Information Management) projects' },
      { id: 'projectInitiator', title: 'Project Initiator', description: 'Initiate new projects' },
      { id: 'projectManager', title: 'Project Manager', description: 'Manage project lifecycle and resources' },
      { id: 'capitalProgramsOffice', title: 'Capital Programs Office', description: 'Access related to capital programs office functions' },
      { id: 'projectCostAccountant', title: 'Project Cost Accountant', description: 'Manage project costs and accounting' },
      { id: 'projectFixedAsset', title: 'Project Fixed Asset', description: 'Manage fixed assets related to projects' },
      { id: 'categorySubcategoryManager', title: 'Category Subcategory Manager', description: 'Manage project categories and subcategories' },
      { id: 'projectControlDates', title: 'Project Control Dates', description: 'Manage control dates for projects' },
      { id: 'projectAccountingSystems', title: 'Project Accounting Systems', description: 'Access to project accounting systems' },
      { id: 'mndotProjectsInquiry', title: 'MNDOT Projects Inquiry', description: 'View-only access to MNDOT projects' },
      { id: 'projectsInquiryOnly', title: 'Projects Inquiry Only', description: 'View-only access to general project information' },
      { id: 'mndotProjectApprover', title: 'MNDOT Project Approver', description: 'Approve MNDOT projects' },
      { id: 'routeControl', title: 'Route Control', description: 'Manage routing controls for project processes', requiresInput: true },
    ]
  },
  {
    id: 'cost_allocation',
    title: 'Cost Allocation',
    icon: Calculator,
    description: 'View cost allocation information',
    roles: [
      { id: 'costAllocationInquiryOnly', title: 'Cost Allocation Inquiry Only', description: 'View-only access to cost allocation information' },
    ]
  },
  {
    id: 'asset_management',
    title: 'Asset Management',
    icon: Building2,
    description: 'Manage assets and physical inventory',
    roles: [
      { id: 'financialAccountantAssets', title: 'Financial Accountant Assets', description: 'Manage financial accounting for assets' },
      { id: 'assetManagementInquiryOnly', title: 'Asset Management Inquiry Only', description: 'View-only access to asset management information' },
      { id: 'physicalInventoryApproval1', title: 'Physical Inventory Approval 1', description: 'First level approval for physical inventory' },
      { id: 'physicalInventoryBusinessUnits', title: 'Physical Inventory Business Units', description: 'Manage physical inventory for specific business units', requiresInput: true },
      { id: 'physicalInventoryApproval2', title: 'Physical Inventory Approval 2', description: 'Second level approval for physical inventory' },
      { id: 'physicalInventoryDepartmentIds', title: 'Physical Inventory Department IDs', description: 'Manage physical inventory for specific department IDs', requiresInput: true },
    ]
  },
  {
    id: 'inventory',
    title: 'Inventory (IN)',
    icon: Package,
    description: 'Manage inventory operations and controls',
    roles: [
      { id: 'inventoryExpressIssue', title: 'Inventory Express Issue', description: 'Process express inventory issues' },
      { id: 'inventoryAdjustmentApprover', title: 'Inventory Adjustment Approver', description: 'Approve inventory adjustments' },
      { id: 'inventoryReplenishmentBuyer', title: 'Inventory Replenishment Buyer', description: 'Manage inventory replenishment purchasing' },
      { id: 'inventoryControlWorker', title: 'Inventory Control Worker', description: 'Perform inventory control operations' },
      { id: 'inventoryExpressPutaway', title: 'Inventory Express Putaway', description: 'Process express inventory putaway' },
      { id: 'inventoryFulfillmentSpecialist', title: 'Inventory Fulfillment Specialist', description: 'Manage inventory fulfillment processes' },
      { id: 'inventoryPoReceiver', title: 'Inventory PO Receiver', description: 'Receive purchase orders for inventory' },
      { id: 'inventoryReturnsReceiver', title: 'Inventory Returns Receiver', description: 'Process inventory returns' },
      { id: 'inventoryCostAdjustment', title: 'Inventory Cost Adjustment', description: 'Adjust inventory costs' },
      { id: 'inventoryMaterialsManager', title: 'Inventory Materials Manager', description: 'Manage inventory materials' },
      { id: 'inventoryDelivery', title: 'Inventory Delivery', description: 'Manage inventory delivery operations' },
      { id: 'inventoryInquiryOnly', title: 'Inventory Inquiry Only', description: 'View-only access to inventory information' },
      { id: 'inventoryConfigurationAgency', title: 'Inventory Configuration Agency', description: 'Configure agency-specific inventory settings' },
      { id: 'inventoryPickPlanReportDistribution', title: 'Inventory Pick Plan Report Distribution', description: 'Manage pick plan report distribution' },
      { id: 'shipToLocation', title: 'Ship To Location', description: 'Specify shipping locations for inventory', requiresInput: true },
      { id: 'inventoryBusinessUnits', title: 'Inventory Business Units', description: 'Specify business units for inventory access', requiresInput: true },
    ]
  }
];

// Convert business units to options format for MultiSelect
const businessUnitOptions = businessUnits.map(unit => ({
  value: unit.businessUnit,
  label: `${unit.description} (${unit.businessUnit})`
}));

function SelectRolesPage() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { requestId?: string } };
  const { id: idParam } = useParams();

  const [saving, setSaving] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState<{ employee_name?: string; agency_name?: string; agency_code?: string } | null>(null);
  const [isEditingCopiedRoles, setIsEditingCopiedRoles] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['accounts_payable']));
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SecurityRoleSelection>({
    defaultValues: {
      copyFromUser: false,
      supervisorApproval: false,
      homeBusinessUnit: '',
      otherBusinessUnits: '',
      // Initialize all boolean fields to false
      voucherEntry: false,
      maintenanceVoucherBuildErrors: false,
      matchOverride: false,
      apInquiryOnly: false,
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
    }
  });

  const selectedRoles = watch();
  const copyFromUser = watch('copyFromUser');
  const homeBusinessUnit = watch('homeBusinessUnit');

  // Check if any roles are selected
  const hasSelectedRoles = useMemo(() => {
    return roleCategories.some(category =>
      category.roles.some(role => !!selectedRoles[role.id as keyof SecurityRoleSelection])
    );
  }, [selectedRoles]);

  // Simple form persistence - save form data when it changes
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
        // Missing copy flow data, clean up and redirect
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
  }, [location.state, navigate, setValue, idParam]);

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
      fetchExistingSelections(requestId!);
    }
  }, [requestDetails, setValue, requestId]);

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

      if (data?.agency_code) {
        setValue('homeBusinessUnit', data.agency_code);
      }
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
        if (key === 'home_business_unit') {
          setValue('homeBusinessUnit', value as any, { shouldDirty: false });
        } else if (key === 'other_business_units') {
          setValue('otherBusinessUnits', value as any, { shouldDirty: false });
        } else if (key === 'voucher_approver_1') {
          setValue('voucherApprover1', value as any, { shouldDirty: false });
        } else if (key === 'voucher_approver_2') {
          setValue('voucherApprover2', value as any, { shouldDirty: false });
        } else if (key === 'voucher_approver_3') {
          setValue('voucherApprover3', value as any, { shouldDirty: false });
        } else if (key === 'voucher_entry') {
          setValue('voucherEntry', value as any, { shouldDirty: false });
        } else if (key === 'maintenance_voucher_build_errors') {
          setValue('maintenanceVoucherBuildErrors', value as any, { shouldDirty: false });
        } else if (key === 'match_override') {
          setValue('matchOverride', value as any, { shouldDirty: false });
        } else if (key === 'ap_inquiry_only') {
          setValue('apInquiryOnly', value as any, { shouldDirty: false });
        } else if (key === 'cash_maintenance') {
          setValue('cashMaintenance', value as any, { shouldDirty: false });
        } else if (key === 'receivable_specialist') {
          setValue('receivableSpecialist', value as any, { shouldDirty: false });
        } else if (key === 'receivable_supervisor') {
          setValue('receivableSupervisor', value as any, { shouldDirty: false });
        } else if (key === 'billing_create') {
          setValue('billingCreate', value as any, { shouldDirty: false });
        } else if (key === 'billing_specialist') {
          setValue('billingSpecialist', value as any, { shouldDirty: false });
        } else if (key === 'billing_supervisor') {
          setValue('billingSupervisor', value as any, { shouldDirty: false });
        } else if (key === 'customer_maintenance_specialist') {
          setValue('customerMaintenanceSpecialist', value as any, { shouldDirty: false });
        } else if (key === 'ar_billing_setup') {
          setValue('arBillingSetup', value as any, { shouldDirty: false });
        } else if (key === 'ar_billing_inquiry_only') {
          setValue('arBillingInquiryOnly', value as any, { shouldDirty: false });
        } else if (key === 'cash_management_inquiry_only') {
          setValue('cashManagementInquiryOnly', value as any, { shouldDirty: false });
        } else if (key === 'budget_journal_entry_online') {
          setValue('budgetJournalEntryOnline', value as any, { shouldDirty: false });
        } else if (key === 'budget_journal_load') {
          setValue('budgetJournalLoad', value as any, { shouldDirty: false });
        } else if (key === 'journal_approver') {
          setValue('journalApprover', value as any, { shouldDirty: false });
        } else if (key === 'budget_transfer_entry_online') {
          setValue('budgetTransferEntryOnline', value as any, { shouldDirty: false });
        } else if (key === 'transfer_approver') {
          setValue('transferApprover', value as any, { shouldDirty: false });
        } else if (key === 'budget_inquiry_only') {
          setValue('budgetInquiryOnly', value as any, { shouldDirty: false });
        } else if (key === 'journal_entry_online') {
          setValue('journalEntryOnline', value as any, { shouldDirty: false });
        } else if (key === 'journal_load') {
          setValue('journalLoad', value as any, { shouldDirty: false });
        } else if (key === 'agency_chartfield_maintenance') {
          setValue('agencyChartfieldMaintenance', value as any, { shouldDirty: false });
        } else if (key === 'gl_agency_approver') {
          setValue('glAgencyApprover', value as any, { shouldDirty: false });
        } else if (key === 'general_ledger_inquiry_only') {
          setValue('generalLedgerInquiryOnly', value as any, { shouldDirty: false });
        } else if (key === 'nvision_reporting_agency_user') {
          setValue('nvisionReportingAgencyUser', value as any, { shouldDirty: false });
        } else if (key === 'award_data_entry') {
          setValue('awardDataEntry', value as any, { shouldDirty: false });
        } else if (key === 'grant_fiscal_manager') {
          setValue('grantFiscalManager', value as any, { shouldDirty: false });
        } else if (key === 'program_manager') {
          setValue('programManager', value as any, { shouldDirty: false });
        } else if (key === 'gm_agency_setup') {
          setValue('gmAgencySetup', value as any, { shouldDirty: false });
        } else if (key === 'grants_inquiry_only') {
          setValue('grantsInquiryOnly', value as any, { shouldDirty: false });
        } else if (key === 'federal_project_initiator') {
          setValue('federalProjectInitiator', value as any, { shouldDirty: false });
        } else if (key === 'oim_initiator') {
          setValue('oimInitiator', value as any, { shouldDirty: false });
        } else if (key === 'project_initiator') {
          setValue('projectInitiator', value as any, { shouldDirty: false });
        } else if (key === 'project_manager') {
          setValue('projectManager', value as any, { shouldDirty: false });
        } else if (key === 'capital_programs_office') {
          setValue('capitalProgramsOffice', value as any, { shouldDirty: false });
        } else if (key === 'project_cost_accountant') {
          setValue('projectCostAccountant', value as any, { shouldDirty: false });
        } else if (key === 'project_fixed_asset') {
          setValue('projectFixedAsset', value as any, { shouldDirty: false });
        } else if (key === 'category_subcategory_manager') {
          setValue('categorySubcategoryManager', value as any, { shouldDirty: false });
        } else if (key === 'project_control_dates') {
          setValue('projectControlDates', value as any, { shouldDirty: false });
        } else if (key === 'project_accounting_systems') {
          setValue('projectAccountingSystems', value as any, { shouldDirty: false });
        } else if (key === 'mndot_projects_inquiry') {
          setValue('mndotProjectsInquiry', value as any, { shouldDirty: false });
        } else if (key === 'projects_inquiry_only') {
          setValue('projectsInquiryOnly', value as any, { shouldDirty: false });
        } else if (key === 'mndot_project_approver') {
          setValue('mndotProjectApprover', value as any, { shouldDirty: false });
        } else if (key === 'cost_allocation_inquiry_only') {
          setValue('costAllocationInquiryOnly', value as any, { shouldDirty: false });
        } else if (key === 'financial_accountant_assets') {
          setValue('financialAccountantAssets', value as any, { shouldDirty: false });
        } else if (key === 'asset_management_inquiry_only') {
          setValue('assetManagementInquiryOnly', value as any, { shouldDirty: false });
        } else if (key === 'physical_inventory_approval_1') {
          setValue('physicalInventoryApproval1', value as any, { shouldDirty: false });
        } else if (key === 'physical_inventory_approval_2') {
          setValue('physicalInventoryApproval2', value as any, { shouldDirty: false });
        } else if (key === 'inventory_express_issue') {
          setValue('inventoryExpressIssue', value as any, { shouldDirty: false });
        } else if (key === 'inventory_adjustment_approver') {
          setValue('inventoryAdjustmentApprover', value as any, { shouldDirty: false });
        } else if (key === 'inventory_replenishment_buyer') {
          setValue('inventoryReplenishmentBuyer', value as any, { shouldDirty: false });
        } else if (key === 'inventory_control_worker') {
          setValue('inventoryControlWorker', value as any, { shouldDirty: false });
        } else if (key === 'inventory_express_putaway') {
          setValue('inventoryExpressPutaway', value as any, { shouldDirty: false });
        } else if (key === 'inventory_fulfillment_specialist') {
          setValue('inventoryFulfillmentSpecialist', value as any, { shouldDirty: false });
        } else if (key === 'inventory_po_receiver') {
          setValue('inventoryPoReceiver', value as any, { shouldDirty: false });
        } else if (key === 'inventory_returns_receiver') {
          setValue('inventoryReturnsReceiver', value as any, { shouldDirty: false });
        } else if (key === 'inventory_cost_adjustment') {
          setValue('inventoryCostAdjustment', value as any, { shouldDirty: false });
        } else if (key === 'inventory_materials_manager') {
          setValue('inventoryMaterialsManager', value as any, { shouldDirty: false });
        } else if (key === 'inventory_delivery') {
          setValue('inventoryDelivery', value as any, { shouldDirty: false });
        } else if (key === 'inventory_inquiry_only') {
          setValue('inventoryInquiryOnly', value as any, { shouldDirty: false });
        } else if (key === 'inventory_configuration_agency') {
          setValue('inventoryConfigurationAgency', value as any, { shouldDirty: false });
        } else if (key === 'inventory_pick_plan_report_distribution') {
          setValue('inventoryPickPlanReportDistribution', value as any, { shouldDirty: false });
        } else if (key === 'role_justification') {
          setValue('roleJustification', value as any, { shouldDirty: false });
        } else if (key === 'supervisor_approval') {
          setValue('supervisorApproval', value as any, { shouldDirty: false });
        }
        // Handle string fields for route controls and business units
        else if (typeof value === 'string' && value.trim()) {
          setValue(key as keyof SecurityRoleSelection, value as any, { shouldDirty: false });
        }
      });
    } catch (e) {
      console.error('Failed to fetch existing role selections:', e);
    }
  }

  const handleUserChange = (user: User | null) => {
    console.log('🔧 SelectRolesPage handleUserChange called with:', user);
    setSelectedUser(user);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const onSubmit = async (data: SecurityRoleSelection) => {
    if (!hasSelectedRoles && !copyFromUser) {
      toast.error('Please select at least one role or choose to copy from an existing user.');
      return;
    }

    if (copyFromUser && !selectedUser) {
      toast.error('Please select a user to copy roles from.');
      return;
    }

    setSaving(true);
    try {
      if (isEditingCopiedRoles) {
        // Copy flow: create a new request with copied roles
        const pendingFormData = localStorage.getItem('pendingFormData');
        console.log('🔧 Copy flow - pendingFormData:', pendingFormData ? JSON.parse(pendingFormData) : null);
        
        const roleData = JSON.parse(localStorage.getItem('copiedRoleSelections') || '{}');
        console.log('🔧 Copy flow - roleData:', roleData);

        if (!pendingFormData) {
          throw new Error('No pending form data found');
        }

        const d: CopyFlowForm = JSON.parse(pendingFormData);
        const pocUser = localStorage.getItem('pocUserName');

        // Create required fields object with proper fallbacks
        const requiredFields = {
          start_date: d.startDate || new Date().toISOString().split('T')[0],
          employee_name: d.employeeName || 'Unknown Employee',
          employee_id: d.employeeId || null,
          is_non_employee: !!d.isNonEmployee,
          work_location: d.workLocation || null,
          work_phone: d.workPhone ? d.workPhone.replace(/\D/g, '') : null,
          email: d.email || `${(d.employeeName || 'unknown').toLowerCase().replace(/\s+/g, '.')}@example.com`,
          agency_name: d.agencyName || 'Unknown Agency',
          agency_code: d.agencyCode || 'UNK',
          justification: d.justification || null,
          submitter_name: d.submitterName || pocUser || 'Copy Flow User',
          submitter_email: d.submitterEmail || d.email || `${(d.employeeName || 'unknown').toLowerCase().replace(/\s+/g, '.')}@example.com`,
          supervisor_name: d.supervisorName || 'Copy Flow Supervisor',
          supervisor_email: d.supervisorUsername || 'supervisor@example.com',
          security_admin_name: d.securityAdminName || 'Copy Flow Security Admin',
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
        const { error: areasError } = await supabase
          .from('security_areas')
          .insert({
            request_id: newRequest.id,
            area_type: 'accounting_procurement',
            director_name: d.accountingDirector || null,
            director_email: d.accountingDirectorUsername || null,
          });

        if (areasError) throw areasError;

        // Create role selections with copied data
        const selections = buildSelections(newRequest.id, d.agencyCode, data, roleData);
        const { error: selectionsError } = await supabase
          .from('security_role_selections')
          .insert(selections);

        if (selectionsError) throw selectionsError;

        // Save to localStorage for future visits
        if (requestDetails) {
          const storageKey = `selectRoles_${requestDetails.employee_name}_${requestDetails.agency_name}`.replace(/[^a-zA-Z0-9]/g, '_');
          localStorage.setItem(storageKey, JSON.stringify(data));
          console.log('💾 Saving Select Roles form data for future visits:', { storageKey, data });
        }

        // Clean up copy flow data
        localStorage.removeItem('pendingFormData');
        localStorage.removeItem('editingCopiedRoles');
        localStorage.removeItem('copiedRoleSelections');
        localStorage.removeItem('copiedUserDetails');

        toast.success('Role selections saved successfully!');
        navigate('/success', { state: { requestId: newRequest.id } });
      } else {
        // Normal flow: update existing request
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
    } catch (error: any) {
      console.error('Error saving role selections:', error);
      toast.error(`Failed to save role selections: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  // Build the selections object for database insertion
  function buildSelections(requestId: string, agencyCode: string | undefined, data: SecurityRoleSelection, copiedData?: any) {
    // Convert agency code to business unit format (pad to 5 characters)
    const homeBusinessUnitCode = Array.isArray(data.homeBusinessUnit) 
      ? data.homeBusinessUnit 
      : data.homeBusinessUnit 
        ? [data.homeBusinessUnit] 
        : agencyCode 
          ? [(agencyCode.padEnd(5, '0')).substring(0, 5)]
          : ['00000'];

    const baseSelections = {
      request_id: requestId,
      home_business_unit: homeBusinessUnitCode,
      other_business_units: data.otherBusinessUnits ? [data.otherBusinessUnits] : null,
      
      // Accounts Payable
      voucher_entry: data.voucherEntry,
      voucher_approver_1: data.voucherApprover1 ? [data.voucherApprover1] : null,
      voucher_approver_2: data.voucherApprover2 ? [data.voucherApprover2] : null,
      voucher_approver_3: data.voucherApprover3 ? [data.voucherApprover3] : null,
      maintenance_voucher_build_errors: data.maintenanceVoucherBuildErrors,
      match_override: data.matchOverride,
      ap_inquiry_only: data.apInquiryOnly,

      // Accounts Receivable and Cash Management
      cash_maintenance: data.cashMaintenance,
      receivable_specialist: data.receivableSpecialist,
      receivable_supervisor: data.receivableSupervisor,
      writeoff_approval_business_units: data.writeoffApprovalBusinessUnits || null,
      billing_create: data.billingCreate,
      billing_specialist: data.billingSpecialist,
      billing_supervisor: data.billingSupervisor,
      credit_invoice_approval_business_units: data.creditInvoiceApprovalBusinessUnits || null,
      customer_maintenance_specialist: data.customerMaintenanceSpecialist,
      ar_billing_setup: data.arBillingSetup,
      ar_billing_inquiry_only: data.arBillingInquiryOnly,
      cash_management_inquiry_only: data.cashManagementInquiryOnly,

      // Budgets/Commitment Control & Appropriation Maintenance
      budget_journal_entry_online: data.budgetJournalEntryOnline,
      budget_journal_load: data.budgetJournalLoad,
      journal_approver: data.journalApprover,
      appropriation_sources: data.appropriationSources || null,
      expense_budget_source: data.expenseBudgetSource || null,
      revenue_budget_source: data.revenueBudgetSource || null,
      budget_transfer_entry_online: data.budgetTransferEntryOnline,
      transfer_approver: data.transferApprover,
      transfer_appropriation_sources: data.transferAppropriationSources || null,
      budget_inquiry_only: data.budgetInquiryOnly,

      // General Ledger and NVISION Reporting
      journal_entry_online: data.journalEntryOnline,
      journal_load: data.journalLoad,
      agency_chartfield_maintenance: data.agencyChartfieldMaintenance,
      gl_agency_approver: data.glAgencyApprover,
      gl_agency_approver_sources: data.glAgencyApproverSources || null,
      general_ledger_inquiry_only: data.generalLedgerInquiryOnly,
      nvision_reporting_agency_user: data.nvisionReportingAgencyUser,
      needs_daily_receipts_report: data.needsDailyReceiptsReport || false,

      // Grants
      award_data_entry: data.awardDataEntry,
      grant_fiscal_manager: data.grantFiscalManager,
      program_manager: data.programManager,
      gm_agency_setup: data.gmAgencySetup,
      grants_inquiry_only: data.grantsInquiryOnly,

      // Project Costing
      federal_project_initiator: data.federalProjectInitiator,
      oim_initiator: data.oimInitiator,
      project_initiator: data.projectInitiator,
      project_manager: data.projectManager,
      capital_programs_office: data.capitalProgramsOffice,
      project_cost_accountant: data.projectCostAccountant,
      project_fixed_asset: data.projectFixedAsset,
      category_subcategory_manager: data.categorySubcategoryManager,
      project_control_dates: data.projectControlDates,
      project_accounting_systems: data.projectAccountingSystems,
      mndot_projects_inquiry: data.mndotProjectsInquiry,
      projects_inquiry_only: data.projectsInquiryOnly,
      mndot_project_approver: data.mndotProjectApprover,
      route_control: data.routeControl || null,

      // Cost Allocation
      cost_allocation_inquiry_only: data.costAllocationInquiryOnly,

      // Asset Management
      financial_accountant_assets: data.financialAccountantAssets,
      asset_management_inquiry_only: data.assetManagementInquiryOnly,
      physical_inventory_approval_1: data.physicalInventoryApproval1,
      physical_inventory_business_units: data.physicalInventoryBusinessUnits || null,
      physical_inventory_approval_2: data.physicalInventoryApproval2,
      physical_inventory_department_ids: data.physicalInventoryDepartmentIds || null,

      // Inventory (IN)
      inventory_express_issue: data.inventoryExpressIssue,
      inventory_adjustment_approver: data.inventoryAdjustmentApprover,
      inventory_replenishment_buyer: data.inventoryReplenishmentBuyer,
      inventory_control_worker: data.inventoryControlWorker,
      inventory_express_putaway: data.inventoryExpressPutaway,
      inventory_fulfillment_specialist: data.inventoryFulfillmentSpecialist,
      inventory_po_receiver: data.inventoryPoReceiver,
      inventory_returns_receiver: data.inventoryReturnsReceiver,
      inventory_cost_adjustment: data.inventoryCostAdjustment,
      inventory_materials_manager: data.inventoryMaterialsManager,
      inventory_delivery: data.inventoryDelivery,
      inventory_inquiry_only: data.inventoryInquiryOnly,
      inventory_configuration_agency: data.inventoryConfigurationAgency,
      inventory_pick_plan_report_distribution: data.inventoryPickPlanReportDistribution,
      ship_to_location: data.shipToLocation || null,
      inventory_business_units: data.inventoryBusinessUnits || null,

      // Approval acknowledgment
      supervisor_approval: data.supervisorApproval,

      // Role justification
      role_justification: data.roleJustification || null,

      // Store the complete form data as JSON for future reference
      role_selection_json: {
        ...data,
        ...(copiedData || {}) // Include copied data if available
      }
    };

    return baseSelections;
  }

  const handleUserSessionChange = (userName: string | null) => {
    setCurrentUser(userName);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Accounting / Procurement Role Selection"
        subtitle="Select specific roles and permissions for accounting and procurement access"
        onUserChange={handleUserSessionChange}
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
                <DollarSign className="h-8 w-8 text-blue-600 mr-3" />
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
                        You can copy role selections from an existing user who already has the access you need.
                        This will pre-populate the form with their current role selections.
                      </p>
                    </div>
                    <div className="mt-4">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          {...register('copyFromUser')}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-blue-800 font-medium">
                          Copy roles from an existing user
                        </span>
                      </label>
                    </div>
                    
                    {copyFromUser && (
                      <div className="mt-4">
                        <UserSelect
                          selectedUser={selectedUser}
                          onUserChange={handleUserChange}
                          currentUser={currentUser}
                          currentRequestId={requestId}
                          formData={{
                            startDate: requestDetails?.employee_name ? new Date().toISOString().split('T')[0] : '',
                            employeeName: requestDetails?.employee_name || '',
                            agencyName: requestDetails?.agency_name || '',
                            agencyCode: requestDetails?.agency_code || '',
                            submitterName: currentUser || '',
                            submitterEmail: `${(currentUser || 'user').toLowerCase().replace(/\s+/g, '.')}@example.com`,
                            supervisorName: 'Supervisor Name',
                            supervisorUsername: 'supervisor@example.com',
                            securityAdminName: 'Security Admin',
                            securityAdminUsername: 'security@example.com',
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Business Unit Selection */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Business Unit Information
                </h3>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Home Business Unit <span className="text-red-500">*</span>
                    </label>
                    <MultiSelect
                      options={businessUnitOptions}
                      value={homeBusinessUnit}
                      onChange={(values) => setValue('homeBusinessUnit', values)}
                      placeholder="Select your primary business unit..."
                      searchPlaceholder="Search business units..."
                      ariaLabel="Home Business Unit"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Select your primary business unit. This determines your default access scope.
                    </p>
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
                    <p className="mt-1 text-xs text-gray-500">
                      List any additional business units you need access to (optional).
                    </p>
                  </div>
                </div>
              </div>

              {/* Role Categories */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Security Role Selection
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setExpandedCategories(new Set(roleCategories.map(c => c.id)))}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Expand All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => setExpandedCategories(new Set())}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Collapse All
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600">
                  Select the roles that match your job responsibilities. Each category contains related
                  permissions and access levels.
                </p>

                <div className="space-y-4">
                  {roleCategories.map(category => {
                    const IconComponent = category.icon;
                    const isExpanded = expandedCategories.has(category.id);
                    const categoryRoles = category.roles || [];
                    const selectedInCategory = categoryRoles.filter(role => 
                      !!selectedRoles[role.id as keyof SecurityRoleSelection]
                    ).length;

                    return (
                      <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleCategory(category.id)}
                          className="w-full px-4 py-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <div className="flex items-center">
                            <IconComponent className="h-6 w-6 text-blue-600 mr-3" />
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">{category.title}</h4>
                              <p className="text-sm text-gray-600">{category.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {selectedInCategory > 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {selectedInCategory} selected
                              </span>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="p-4 space-y-4 bg-white">
                            <div className="grid grid-cols-1 gap-4">
                              {categoryRoles.map(role => {
                                const checked = !!selectedRoles[role.id as keyof SecurityRoleSelection];
                                return (
                                  <div
                                    key={role.id}
                                    className={`border rounded-lg p-4 ${
                                      checked ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    <div className="flex items-start">
                                      <div className="flex items-center h-5">
                                        <input
                                          type="checkbox"
                                          {...register(role.id as keyof SecurityRoleSelection)}
                                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                      </div>
                                      <div className="ml-3 flex-1">
                                        <label className="text-sm font-medium text-gray-900">
                                          {role.title}
                                          {role.requiresRouteControl && (
                                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                              Requires Route Control
                                            </span>
                                          )}
                                        </label>
                                        <p className="mt-1 text-sm text-gray-600">{role.description}</p>
                                        
                                        {/* Route Control Input Fields */}
                                        {checked && role.requiresRouteControl && (
                                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                              Route Control Information
                                            </label>
                                            <input
                                              type="text"
                                              {...register(`${role.id}RouteControl` as keyof SecurityRoleSelection)}
                                              placeholder="Enter route control details..."
                                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                              Specify the route control parameters for this role.
                                            </p>
                                          </div>
                                        )}

                                        {/* Additional Input Fields */}
                                        {checked && role.requiresInput && (
                                          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                              {role.title} Details
                                            </label>
                                            <textarea
                                              {...register(role.id as keyof SecurityRoleSelection)}
                                              rows={2}
                                              placeholder={`Enter details for ${role.title}...`}
                                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

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
                    placeholder="Please explain why these roles are necessary for your job responsibilities. Include specific tasks, responsibilities, and how these roles will be used..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.roleJustification && (
                    <p className="mt-1 text-sm text-red-600">{errors.roleJustification.message}</p>
                  )}
                </div>
              </div>

              {/* Supervisor Approval */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Supervisor Approval Required
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Your supervisor must approve this request before it can be processed. Please ensure
                        they are aware of this request and the roles you are requesting.
                      </p>
                    </div>
                    <div className="mt-4">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          {...register('supervisorApproval', {
                            required: 'Supervisor approval acknowledgment is required',
                          })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-yellow-800 font-medium">
                          I acknowledge that supervisor approval is required for this request
                        </span>
                      </label>
                      {errors.supervisorApproval && (
                        <p className="mt-1 text-sm text-red-600">{errors.supervisorApproval.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving || (!hasSelectedRoles && !copyFromUser)}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    saving || (!hasSelectedRoles && !copyFromUser)
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