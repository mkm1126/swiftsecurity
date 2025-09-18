```typescript
import { SecurityRoleSelection } from '../types';

export interface AccountingProcurementRole {
  id: keyof SecurityRoleSelection;
  formDescription: string;
  roleName: string; // The technical role name for the security team
  category: string;
  description?: string; // Optional detailed description for UI
}

export const accountingProcurementRoles: AccountingProcurementRole[] = [
  // Accounts Payable
  {
    id: 'voucherEntry',
    formDescription: 'Voucher Entry',
    roleName: 'M_AP_VOUCHER_ENTRY',
    category: 'Accounts Payable',
    description: 'Allows users to create and enter vouchers into the system.'
  },
  {
    id: 'voucherApprover1',
    formDescription: 'Voucher Approver 1',
    roleName: 'M_AP_VOUCHER_APPR_01',
    category: 'Accounts Payable',
    description: 'First level approval for vouchers.'
  },
  {
    id: 'voucherApprover2',
    formDescription: 'Voucher Approver 2',
    roleName: 'M_AP_VOUCHER_APPR_02',
    category: 'Accounts Payable',
    description: 'Second level approval for vouchers.'
  },
  {
    id: 'voucherApprover3',
    formDescription: 'Voucher Approver 3',
    roleName: 'M_AP_VOUCHER_APPR_03',
    category: 'Accounts Payable',
    description: 'Third level approval for vouchers.'
  },
  {
    id: 'maintenanceVoucherBuildErrors',
    formDescription: 'Maintenance Voucher Build Errors',
    roleName: 'M_AP_MAINT_VOUCHER_ERR',
    category: 'Accounts Payable',
    description: 'Access to resolve errors in voucher building processes.'
  },
  {
    id: 'matchOverride',
    formDescription: 'Match Override',
    roleName: 'M_AP_MATCH_OVERRIDE',
    category: 'Accounts Payable',
    description: 'Permission to override matching discrepancies in accounts payable.'
  },
  {
    id: 'apInquiryOnly',
    formDescription: 'AP Inquiry Only',
    roleName: 'M_AP_INQUIRY_ONLY',
    category: 'Accounts Payable',
    description: 'View-only access to Accounts Payable information.'
  },
  {
    id: 'apWorkflowApprover',
    formDescription: 'AP Workflow Approver',
    roleName: 'M_AP_WORKFLOW_APPR',
    category: 'Accounts Payable',
    description: 'Approver role within the Accounts Payable workflow.'
  },
  {
    id: 'apWorkflowRouteControls',
    formDescription: 'AP Workflow Route Controls',
    roleName: 'M_AP_WORKFLOW_ROUTE_CTRL',
    category: 'Accounts Payable',
    description: 'Manages routing controls for AP workflows.'
  },
  {
    id: 'ap_voucher_approver_1',
    formDescription: 'AP Voucher Approver 1',
    roleName: 'M_AP_VOUCHER_APPR_01_NEW',
    category: 'Accounts Payable',
    description: 'New first level AP voucher approver.'
  },
  {
    id: 'ap_voucher_approver_2',
    formDescription: 'AP Voucher Approver 2',
    roleName: 'M_AP_VOUCHER_APPR_02_NEW',
    category: 'Accounts Payable',
    description: 'New second level AP voucher approver.'
  },
  {
    id: 'ap_voucher_approver_3',
    formDescription: 'AP Voucher Approver 3',
    roleName: 'M_AP_VOUCHER_APPR_03_NEW',
    category: 'Accounts Payable',
    description: 'New third level AP voucher approver.'
  },
  {
    id: 'ap_voucher_approver_1_route_controls',
    formDescription: 'AP Voucher Approver 1 Route Controls',
    roleName: 'M_AP_VOUCHER_APPR_01_ROUTE',
    category: 'Accounts Payable',
    description: 'Manages route controls for first level AP voucher approver.'
  },
  {
    id: 'ap_voucher_approver_2_route_controls',
    formDescription: 'AP Voucher Approver 2 Route Controls',
    roleName: 'M_AP_VOUCHER_APPR_02_ROUTE',
    category: 'Accounts Payable',
    description: 'Manages route controls for second level AP voucher approver.'
  },
  {
    id: 'ap_voucher_approver_3_route_controls',
    formDescription: 'AP Voucher Approver 3 Route Controls',
    roleName: 'M_AP_VOUCHER_APPR_03_ROUTE',
    category: 'Accounts Payable',
    description: 'Manages route controls for third level AP voucher approver.'
  },

  // Accounts Receivable and Cash Management
  {
    id: 'cashMaintenance',
    formDescription: 'Cash Maintenance',
    roleName: 'M_AR_CASH_MAINT',
    category: 'Accounts Receivable and Cash Management',
    description: 'Manages cash-related transactions and records.'
  },
  {
    id: 'receivableSpecialist',
    formDescription: 'Receivable Specialist',
    roleName: 'M_AR_RECEIVABLE_SPEC',
    category: 'Accounts Receivable and Cash Management',
    description: 'Specialist role for managing accounts receivable.'
  },
  {
    id: 'receivableSupervisor',
    formDescription: 'Receivable Supervisor',
    roleName: 'M_AR_RECEIVABLE_SUP',
    category: 'Accounts Receivable and Cash Management',
    description: 'Supervisory role for accounts receivable operations.'
  },
  {
    id: 'writeoffApprovalBusinessUnits',
    formDescription: 'Write-off Approval Business Units',
    roleName: 'M_AR_WRITEOFF_APPR_BU',
    category: 'Accounts Receivable and Cash Management',
    description: 'Approves write-offs for specific business units.'
  },
  {
    id: 'billingCreate',
    formDescription: 'Billing Create',
    roleName: 'M_AR_BILLING_CREATE',
    category: 'Accounts Receivable and Cash Management',
    description: 'Creates new billing entries.'
  },
  {
    id: 'billingSpecialist',
    formDescription: 'Billing Specialist',
    roleName: 'M_AR_BILLING_SPEC',
    category: 'Accounts Receivable and Cash Management',
    description: 'Specialist role for billing processes.'
  },
  {
    id: 'billingSupervisor',
    formDescription: 'Billing Supervisor',
    roleName: 'M_AR_BILLING_SUP',
    category: 'Accounts Receivable and Cash Management',
    description: 'Supervisory role for billing operations.'
  },
  {
    id: 'creditInvoiceApprovalBusinessUnits',
    formDescription: 'Credit Invoice Approval Business Units',
    roleName: 'M_AR_CREDIT_INV_APPR_BU',
    category: 'Accounts Receivable and Cash Management',
    description: 'Approves credit invoices for specific business units.'
  },
  {
    id: 'customerMaintenanceSpecialist',
    formDescription: 'Customer Maintenance Specialist',
    roleName: 'M_AR_CUST_MAINT_SPEC',
    category: 'Accounts Receivable and Cash Management',
    description: 'Manages customer records and data.'
  },
  {
    id: 'arBillingSetup',
    formDescription: 'AR Billing Setup',
    roleName: 'M_AR_BILLING_SETUP',
    category: 'Accounts Receivable and Cash Management',
    description: 'Configures Accounts Receivable billing settings.'
  },
  {
    id: 'arBillingInquiryOnly',
    formDescription: 'AR Billing Inquiry Only',
    roleName: 'M_AR_BILLING_INQUIRY',
    category: 'Accounts Receivable and Cash Management',
    description: 'View-only access to Accounts Receivable billing information.'
  },
  {
    id: 'cashManagementInquiryOnly',
    formDescription: 'Cash Management Inquiry Only',
    roleName: 'M_AR_CASH_MGMT_INQUIRY',
    category: 'Accounts Receivable and Cash Management',
    description: 'View-only access to cash management details.'
  },

  // Budgets/Commitment Control & Appropriation Maintenance
  {
    id: 'budgetJournalEntryOnline',
    formDescription: 'Budget Journal Entry Online',
    roleName: 'M_BUD_JRNL_ENTRY_ONLINE',
    category: 'Budgets/Commitment Control & Appropriation Maintenance',
    description: 'Allows online entry of budget journals.'
  },
  {
    id: 'budgetJournalLoad',
    formDescription: 'Budget Journal Load',
    roleName: 'M_BUD_JRNL_LOAD',
    category: 'Budgets/Commitment Control & Appropriation Maintenance',
    description: 'Loads budget journals into the system.'
  },
  {
    id: 'journalApprover',
    formDescription: 'Journal Approver',
    roleName: 'M_BUD_JRNL_APPR',
    category: 'Budgets/Commitment Control & Appropriation Maintenance',
    description: 'Approves budget journals.'
  },
  {
    id: 'appropriationSources',
    formDescription: 'Appropriation Sources',
    roleName: 'M_BUD_APPROP_SRC',
    category: 'Budgets/Commitment Control & Appropriation Maintenance',
    description: 'Manages sources of appropriations.'
  },
  {
    id: 'expenseBudgetSource',
    formDescription: 'Expense Budget Source',
    roleName: 'M_BUD_EXP_SRC',
    category: 'Budgets/Commitment Control & Appropriation Maintenance',
    description: 'Manages sources for expense budgets.'
  },
  {
    id: 'revenueBudgetSource',
    formDescription: 'Revenue Budget Source',
    roleName: 'M_BUD_REV_SRC',
    category: 'Budgets/Commitment Control & Appropriation Maintenance',
    description: 'Manages sources for revenue budgets.'
  },
  {
    id: 'budgetTransferEntryOnline',
    formDescription: 'Budget Transfer Entry Online',
    roleName: 'M_BUD_TRANS_ENTRY_ONLINE',
    category: 'Budgets/Commitment Control & Appropriation Maintenance',
    description: 'Allows online entry of budget transfers.'
  },
  {
    id: 'transferApprover',
    formDescription: 'Transfer Approver',
    roleName: 'M_BUD_TRANS_APPR',
    category: 'Budgets/Commitment Control & Appropriation Maintenance',
    description: 'Approves budget transfers.'
  },
  {
    id: 'transferAppropriationSources',
    formDescription: 'Transfer Appropriation Sources',
    roleName: 'M_BUD_TRANS_APPROP_SRC',
    category: 'Budgets/Commitment Control & Appropriation Maintenance',
    description: 'Manages appropriation sources for transfers.'
  },
  {
    id: 'budgetInquiryOnly',
    formDescription: 'Budget Inquiry Only',
    roleName: 'M_BUD_INQUIRY_ONLY',
    category: 'Budgets/Commitment Control & Appropriation Maintenance',
    description: 'View-only access to budget information.'
  },

  // General Ledger and NVISION Reporting
  {
    id: 'journalEntryOnline',
    formDescription: 'Journal Entry Online',
    roleName: 'M_GL_JRNL_ENTRY_ONLINE',
    category: 'General Ledger and NVISION Reporting',
    description: 'Allows online entry of general ledger journals.'
  },
  {
    id: 'journalLoad',
    formDescription: 'Journal Load',
    roleName: 'M_GL_JRNL_LOAD',
    category: 'General Ledger and NVISION Reporting',
    description: 'Loads general ledger journals into the system.'
  },
  {
    id: 'agencyChartfieldMaintenance',
    formDescription: 'Agency Chartfield Maintenance',
    roleName: 'M_GL_AGENCY_CHART_MAINT',
    category: 'General Ledger and NVISION Reporting',
    description: 'Maintains chartfield data for agencies.'
  },
  {
    id: 'glAgencyApprover',
    formDescription: 'GL Agency Approver',
    roleName: 'M_GL_AGENCY_APPR',
    category: 'General Ledger and NVISION Reporting',
    description: 'Approves general ledger entries for agencies.'
  },
  {
    id: 'glAgencyApproverSources',
    formDescription: 'GL Agency Approver Sources',
    roleName: 'M_GL_AGENCY_APPR_SRC',
    category: 'General Ledger and NVISION Reporting',
    description: 'Manages sources for GL agency approvers.'
  },
  {
    id: 'generalLedgerInquiryOnly',
    formDescription: 'General Ledger Inquiry Only',
    roleName: 'M_GL_INQUIRY_ONLY',
    category: 'General Ledger and NVISION Reporting',
    description: 'View-only access to General Ledger information.'
  },
  {
    id: 'nvisionReportingAgencyUser',
    formDescription: 'NVISION Reporting Agency User',
    roleName: 'M_GL_NVISION_AGENCY_USER',
    category: 'General Ledger and NVISION Reporting',
    description: 'User role for NVISION reporting within an agency.'
  },
  {
    id: 'needsDailyReceiptsReport',
    formDescription: 'Needs Daily Receipts Report',
    roleName: 'M_GL_DAILY_RECEIPTS_RPT',
    category: 'General Ledger and NVISION Reporting',
    description: 'Requires access to daily receipts reports.'
  },

  // Grants
  {
    id: 'awardDataEntry',
    formDescription: 'Award Data Entry',
    roleName: 'M_GM_AWARD_DATA_ENTRY',
    category: 'Grants',
    description: 'Allows entry of award-related data for grants.'
  },
  {
    id: 'grantFiscalManager',
    formDescription: 'Grant Fiscal Manager',
    roleName: 'M_GM_FISCAL_MANAGER',
    category: 'Grants',
    description: 'Manages financial aspects of grants.'
  },
  {
    id: 'programManager',
    formDescription: 'Program Manager',
    roleName: 'M_GM_PROGRAM_MANAGER',
    category: 'Grants',
    description: 'Manages grant programs.'
  },
  {
    id: 'gmAgencySetup',
    formDescription: 'GM Agency Setup',
    roleName: 'M_GM_AGENCY_SETUP',
    category: 'Grants',
    description: 'Configures agency-specific settings for grants management.'
  },
  {
    id: 'grantsInquiryOnly',
    formDescription: 'Grants Inquiry Only',
    roleName: 'M_GM_INQUIRY_ONLY',
    category: 'Grants',
    description: 'View-only access to grants information.'
  },

  // Project Costing
  {
    id: 'federalProjectInitiator',
    formDescription: 'Federal Project Initiator',
    roleName: 'M_PC_FED_PROJ_INIT',
    category: 'Project Costing',
    description: 'Initiates federal projects.'
  },
  {
    id: 'oimInitiator',
    formDescription: 'OIM Initiator',
    roleName: 'M_PC_OIM_INIT',
    category: 'Project Costing',
    description: 'Initiates OIM (Other Information Management) projects.'
  },
  {
    id: 'projectInitiator',
    formDescription: 'Project Initiator',
    roleName: 'M_PC_PROJ_INIT',
    category: 'Project Costing',
    description: 'Initiates new projects.'
  },
  {
    id: 'projectManager',
    formDescription: 'Project Manager',
    roleName: 'M_PC_PROJ_MANAGER',
    category: 'Project Costing',
    description: 'Manages project lifecycle and resources.'
  },
  {
    id: 'capitalProgramsOffice',
    formDescription: 'Capital Programs Office',
    roleName: 'M_PC_CAP_PROG_OFFICE',
    category: 'Project Costing',
    description: 'Access related to capital programs office functions.'
  },
  {
    id: 'projectCostAccountant',
    formDescription: 'Project Cost Accountant',
    roleName: 'M_PC_COST_ACCOUNTANT',
    category: 'Project Costing',
    description: 'Manages project costs and accounting.'
  },
  {
    id: 'projectFixedAsset',
    formDescription: 'Project Fixed Asset',
    roleName: 'M_PC_FIXED_ASSET',
    category: 'Project Costing',
    description: 'Manages fixed assets related to projects.'
  },
  {
    id: 'categorySubcategoryManager',
    formDescription: 'Category Subcategory Manager',
    roleName: 'M_PC_CAT_SUBCAT_MANAGER',
    category: 'Project Costing',
    description: 'Manages project categories and subcategories.'
  },
  {
    id: 'projectControlDates',
    formDescription: 'Project Control Dates',
    roleName: 'M_PC_CTRL_DATES',
    category: 'Project Costing',
    description: 'Manages control dates for projects.'
  },
  {
    id: 'projectAccountingSystems',
    formDescription: 'Project Accounting Systems',
    roleName: 'M_PC_ACCT_SYSTEMS',
    category: 'Project Costing',
    description: 'Access to project accounting systems.'
  },
  {
    id: 'mndotProjectsInquiry',
    formDescription: 'MNDOT Projects Inquiry',
    roleName: 'M_PC_MNDOT_PROJ_INQUIRY',
    category: 'Project Costing',
    description: 'View-only access to MNDOT projects.'
  },
  {
    id: 'projectsInquiryOnly',
    formDescription: 'Projects Inquiry Only',
    roleName: 'M_PC_INQUIRY_ONLY',
    category: 'Project Costing',
    description: 'View-only access to general project information.'
  },
  {
    id: 'mndotProjectApprover',
    formDescription: 'MNDOT Project Approver',
    roleName: 'M_PC_MNDOT_PROJ_APPR',
    category: 'Project Costing',
    description: 'Approves MNDOT projects.'
  },
  {
    id: 'routeControl',
    formDescription: 'Route Control',
    roleName: 'M_PC_ROUTE_CTRL',
    category: 'Project Costing',
    description: 'Manages routing controls for project processes.'
  },

  // Cost Allocation
  {
    id: 'costAllocationInquiryOnly',
    formDescription: 'Cost Allocation Inquiry Only',
    roleName: 'M_CA_INQUIRY_ONLY',
    category: 'Cost Allocation',
    description: 'View-only access to cost allocation information.'
  },

  // Asset Management
  {
    id: 'financialAccountantAssets',
    formDescription: 'Financial Accountant Assets',
    roleName: 'M_AM_FIN_ACCT_ASSETS',
    category: 'Asset Management',
    description: 'Manages financial accounting for assets.'
  },
  {
    id: 'assetManagementInquiryOnly',
    formDescription: 'Asset Management Inquiry Only',
    roleName: 'M_AM_INQUIRY_ONLY',
    category: 'Asset Management',
    description: 'View-only access to asset management information.'
  },
  {
    id: 'physicalInventoryApproval1',
    formDescription: 'Physical Inventory Approval 1',
    roleName: 'M_AM_PHYS_INV_APPR_01',
    category: 'Asset Management',
    description: 'First level approval for physical inventory.'
  },
  {
    id: 'physicalInventoryBusinessUnits',
    formDescription: 'Physical Inventory Business Units',
    roleName: 'M_AM_PHYS_INV_BU',
    category: 'Asset Management',
    description: 'Manages physical inventory for specific business units.'
  },
  {
    id: 'physicalInventoryApproval2',
    formDescription: 'Physical Inventory Approval 2',
    roleName: 'M_AM_PHYS_INV_APPR_02',
    category: 'Asset Management',
    description: 'Second level approval for physical inventory.'
  },
  {
    id: 'physicalInventoryDepartmentIds',
    formDescription: 'Physical Inventory Department IDs',
    roleName: 'M_AM_PHYS_INV_DEPT_ID',
    category: 'Asset Management',
    description: 'Manages physical inventory for specific department IDs.'
  },

  // PO Approver fields
  {
    id: 'po_approver',
    formDescription: 'PO Approver',
    roleName: 'M_PO_APPR',
    category: 'Purchase Order Approvals',
    description: 'Approves purchase orders.'
  },
  {
    id: 'po_approver_2',
    formDescription: 'PO Approver 2',
    roleName: 'M_PO_APPR_02',
    category: 'Purchase Order Approvals',
    description: 'Second level purchase order approver.'
  },
  {
    id: 'po_approver_3',
    formDescription: 'PO Approver 3',
    roleName: 'M_PO_APPR_03',
    category: 'Purchase Order Approvals',
    description: 'Third level purchase order approver.'
  },
  {
    id: 'po_approver_limit_1',
    formDescription: 'PO Approver Limit 1',
    roleName: 'M_PO_APPR_LIMIT_01',
    category: 'Purchase Order Approvals',
    description: 'Purchase order approver with limit 1.'
  },
  {
    id: 'po_approver_limit_2',
    formDescription: 'PO Approver Limit 2',
    roleName: 'M_PO_APPR_LIMIT_02',
    category: 'Purchase Order Approvals',
    description: 'Purchase order approver with limit 2.'
  },
  {
    id: 'po_approver_limit_3',
    formDescription: 'PO Approver Limit 3',
    roleName: 'M_PO_APPR_LIMIT_03',
    category: 'Purchase Order Approvals',
    description: 'Purchase order approver with limit 3.'
  },
  {
    id: 'po_approver_route_controls',
    formDescription: 'PO Approver Route Controls',
    roleName: 'M_PO_APPR_ROUTE_CTRL',
    category: 'Purchase Order Approvals',
    description: 'Manages routing controls for PO approvals.'
  },
];
```