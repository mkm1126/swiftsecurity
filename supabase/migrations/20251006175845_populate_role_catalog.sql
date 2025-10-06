/*
  # Populate Role Catalog with All Security Roles

  1. Role Definitions
    - Insert all security role definitions into role_catalog
    - Each role includes flag_key (database column name), role_code (SWIFT code), and metadata
    - Covers all security areas: AP, AR, GL, Budgets, Grants, Projects, Assets, Inventory
    
  2. Data Structure
    - flag_key: Database column name in snake_case (e.g., 'voucher_entry')
    - role_code: SWIFT security role code (e.g., 'M_AP_VOUCHER_ENTRY')
    - name: Display name for the role
    - domain: Security domain grouping (accounting_procurement, hr_payroll, etc.)
    - is_active: Whether the role is currently available for selection
    
  3. Notes
    - Uses INSERT with ON CONFLICT to safely populate without duplicates
    - All roles are set to active by default
    - Display order organizes roles within their categories
*/

-- Insert Accounts Payable roles
INSERT INTO public.role_catalog (flag_key, role_code, name, form_name, description, domain, display_order, active, is_active) VALUES
('voucher_entry', 'M_AP_VOUCHER_ENTRY', 'Voucher Entry', 'voucherEntry', 'Allows users to create and enter vouchers into the system.', 'accounting_procurement', 10, true, true),
('voucher_approver_1', 'M_AP_VOUCHER_APPR_01', 'Voucher Approver 1', 'voucherApprover1', 'First level approval for vouchers.', 'accounting_procurement', 11, true, true),
('voucher_approver_2', 'M_AP_VOUCHER_APPR_02', 'Voucher Approver 2', 'voucherApprover2', 'Second level approval for vouchers.', 'accounting_procurement', 12, true, true),
('voucher_approver_3', 'M_AP_VOUCHER_APPR_03', 'Voucher Approver 3', 'voucherApprover3', 'Third level approval for vouchers.', 'accounting_procurement', 13, true, true),
('maintenance_voucher_build_errors', 'M_AP_MAINT_VOUCHER_ERR', 'Maintenance Voucher Build Errors', 'maintenanceVoucherBuildErrors', 'Access to resolve errors in voucher building processes.', 'accounting_procurement', 14, true, true),
('match_override', 'M_AP_MATCH_OVERRIDE', 'Match Override', 'matchOverride', 'Permission to override matching discrepancies in accounts payable.', 'accounting_procurement', 15, true, true),
('ap_inquiry_only', 'M_AP_INQUIRY_ONLY', 'AP Inquiry Only', 'apInquiryOnly', 'View-only access to Accounts Payable information.', 'accounting_procurement', 16, true, true),
('ap_workflow_approver', 'M_AP_WORKFLOW_APPR', 'AP Workflow Approver', 'apWorkflowApprover', 'Approver role within the Accounts Payable workflow.', 'accounting_procurement', 17, true, true),
('ap_workflow_route_controls', 'M_AP_WORKFLOW_ROUTE_CTRL', 'AP Workflow Route Controls', 'apWorkflowRouteControls', 'Manages routing controls for AP workflows.', 'accounting_procurement', 18, true, true)
ON CONFLICT (flag_key) DO UPDATE SET
  role_code = EXCLUDED.role_code,
  name = EXCLUDED.name,
  form_name = EXCLUDED.form_name,
  description = EXCLUDED.description,
  updated_at = now();

-- Insert Accounts Receivable and Cash Management roles
INSERT INTO public.role_catalog (flag_key, role_code, name, form_name, description, domain, display_order, active, is_active) VALUES
('cash_maintenance', 'M_FS_AR_ACCT_CASH_MAINT', 'Cash Maintenance', 'cashMaintenance', 'Manages cash-related transactions and records.', 'accounting_procurement', 30, true, true),
('receivable_specialist', 'M_AR_RECEIVABLE_SPEC', 'Receivable Specialist', 'receivableSpecialist', 'Specialist role for managing accounts receivable.', 'accounting_procurement', 31, true, true),
('receivable_supervisor', 'M_AR_RECEIVABLE_SUP', 'Receivable Supervisor', 'receivableSupervisor', 'Supervisory role for accounts receivable operations.', 'accounting_procurement', 32, true, true),
('billing_create', 'M_AR_BILLING_CREATE', 'Billing Create', 'billingCreate', 'Creates new billing entries.', 'accounting_procurement', 33, true, true),
('billing_specialist', 'M_AR_BILLING_SPEC', 'Billing Specialist', 'billingSpecialist', 'Specialist role for billing processes.', 'accounting_procurement', 34, true, true),
('billing_supervisor', 'M_AR_BILLING_SUP', 'Billing Supervisor', 'billingSupervisor', 'Supervisory role for billing operations.', 'accounting_procurement', 35, true, true),
('customer_maintenance_specialist', 'M_AR_CUST_MAINT_SPEC', 'Customer Maintenance Specialist', 'customerMaintenanceSpecialist', 'Manages customer records and data.', 'accounting_procurement', 36, true, true),
('ar_billing_setup', 'M_AR_BILLING_SETUP', 'AR Billing Setup', 'arBillingSetup', 'Configures Accounts Receivable billing settings.', 'accounting_procurement', 37, true, true),
('ar_billing_inquiry_only', 'M_AR_BILLING_INQUIRY', 'AR Billing Inquiry Only', 'arBillingInquiryOnly', 'View-only access to Accounts Receivable billing information.', 'accounting_procurement', 38, true, true),
('cash_management_inquiry_only', 'M_AR_CASH_MGMT_INQUIRY', 'Cash Management Inquiry Only', 'cashManagementInquiryOnly', 'View-only access to cash management details.', 'accounting_procurement', 39, true, true)
ON CONFLICT (flag_key) DO UPDATE SET
  role_code = EXCLUDED.role_code,
  name = EXCLUDED.name,
  form_name = EXCLUDED.form_name,
  description = EXCLUDED.description,
  updated_at = now();

-- Insert Budget roles
INSERT INTO public.role_catalog (flag_key, role_code, name, form_name, description, domain, display_order, active, is_active) VALUES
('budget_journal_entry_online', 'M_BUD_JRNL_ENTRY_ONLINE', 'Budget Journal Entry Online', 'budgetJournalEntryOnline', 'Allows online entry of budget journals.', 'accounting_procurement', 50, true, true),
('budget_journal_load', 'M_BUD_JRNL_LOAD', 'Budget Journal Load', 'budgetJournalLoad', 'Loads budget journals into the system.', 'accounting_procurement', 51, true, true),
('journal_approver', 'M_BUD_JRNL_APPR', 'Journal Approver', 'journalApprover', 'Approves budget journals.', 'accounting_procurement', 52, true, true),
('journal_approver_appr', 'M_FS_WF_KK_JRNL_AP_01', 'Journal Approver Appropriation', 'journalApproverAppr', 'Approves appropriation budget journals.', 'accounting_procurement', 53, true, true),
('journal_approver_rev', 'M_FS_WF_KK_JRNL_RB_01', 'Journal Approver Revenue', 'journalApproverRev', 'Approves revenue budget journals.', 'accounting_procurement', 54, true, true),
('budget_transfer_entry_online', 'M_BUD_TRANS_ENTRY_ONLINE', 'Budget Transfer Entry Online', 'budgetTransferEntryOnline', 'Allows online entry of budget transfers.', 'accounting_procurement', 55, true, true),
('transfer_approver', 'M_BUD_TRANS_APPR', 'Transfer Approver', 'transferApprover', 'Approves budget transfers.', 'accounting_procurement', 56, true, true),
('budget_inquiry_only', 'M_BUD_INQUIRY_ONLY', 'Budget Inquiry Only', 'budgetInquiryOnly', 'View-only access to budget information.', 'accounting_procurement', 57, true, true)
ON CONFLICT (flag_key) DO UPDATE SET
  role_code = EXCLUDED.role_code,
  name = EXCLUDED.name,
  form_name = EXCLUDED.form_name,
  description = EXCLUDED.description,
  updated_at = now();

-- Insert General Ledger roles
INSERT INTO public.role_catalog (flag_key, role_code, name, form_name, description, domain, display_order, active, is_active) VALUES
('journal_entry_online', 'M_GL_JRNL_ENTRY_ONLINE', 'Journal Entry Online', 'journalEntryOnline', 'Allows online entry of general ledger journals.', 'accounting_procurement', 70, true, true),
('journal_load', 'M_GL_JRNL_LOAD', 'Journal Load', 'journalLoad', 'Loads general ledger journals into the system.', 'accounting_procurement', 71, true, true),
('agency_chartfield_maintenance', 'M_GL_AGENCY_CHART_MAINT', 'Agency Chartfield Maintenance', 'agencyChartfieldMaintenance', 'Maintains chartfield data for agencies.', 'accounting_procurement', 72, true, true),
('gl_agency_approver', 'M_GL_AGENCY_APPR', 'GL Agency Approver', 'glAgencyApprover', 'Approves general ledger entries for agencies.', 'accounting_procurement', 73, true, true),
('general_ledger_inquiry_only', 'M_GL_INQUIRY_ONLY', 'General Ledger Inquiry Only', 'generalLedgerInquiryOnly', 'View-only access to General Ledger information.', 'accounting_procurement', 74, true, true),
('nvision_reporting_agency_user', 'M_GL_NVISION_AGENCY_USER', 'NVISION Reporting Agency User', 'nvisionReportingAgencyUser', 'User role for NVISION reporting within an agency.', 'accounting_procurement', 75, true, true),
('needs_daily_receipts_report', 'M_GL_DAILY_RECEIPTS_RPT', 'Needs Daily Receipts Report', 'needsDailyReceiptsReport', 'Requires access to daily receipts reports.', 'accounting_procurement', 76, true, true)
ON CONFLICT (flag_key) DO UPDATE SET
  role_code = EXCLUDED.role_code,
  name = EXCLUDED.name,
  form_name = EXCLUDED.form_name,
  description = EXCLUDED.description,
  updated_at = now();

-- Insert Grants roles
INSERT INTO public.role_catalog (flag_key, role_code, name, form_name, description, domain, display_order, active, is_active) VALUES
('award_data_entry', 'M_GM_AWARD_DATA_ENTRY', 'Award Data Entry', 'awardDataEntry', 'Allows entry of award-related data for grants.', 'accounting_procurement', 90, true, true),
('grant_fiscal_manager', 'M_GM_FISCAL_MANAGER', 'Grant Fiscal Manager', 'grantFiscalManager', 'Manages financial aspects of grants.', 'accounting_procurement', 91, true, true),
('program_manager', 'M_GM_PROGRAM_MANAGER', 'Program Manager', 'programManager', 'Manages grant programs.', 'accounting_procurement', 92, true, true),
('gm_agency_setup', 'M_GM_AGENCY_SETUP', 'GM Agency Setup', 'gmAgencySetup', 'Configures agency-specific settings for grants management.', 'accounting_procurement', 93, true, true),
('grants_inquiry_only', 'M_GM_INQUIRY_ONLY', 'Grants Inquiry Only', 'grantsInquiryOnly', 'View-only access to grants information.', 'accounting_procurement', 94, true, true)
ON CONFLICT (flag_key) DO UPDATE SET
  role_code = EXCLUDED.role_code,
  name = EXCLUDED.name,
  form_name = EXCLUDED.form_name,
  description = EXCLUDED.description,
  updated_at = now();

-- Insert Project Costing roles
INSERT INTO public.role_catalog (flag_key, role_code, name, form_name, description, domain, display_order, active, is_active) VALUES
('federal_project_initiator', 'M_PC_FED_PROJ_INIT', 'Federal Project Initiator', 'federalProjectInitiator', 'Initiates federal projects.', 'accounting_procurement', 110, true, true),
('oim_initiator', 'M_PC_OIM_INIT', 'OIM Initiator', 'oimInitiator', 'Initiates OIM (Other Information Management) projects.', 'accounting_procurement', 111, true, true),
('project_initiator', 'M_PC_PROJ_INIT', 'Project Initiator', 'projectInitiator', 'Initiates new projects.', 'accounting_procurement', 112, true, true),
('project_manager', 'M_PC_PROJ_MANAGER', 'Project Manager', 'projectManager', 'Manages project lifecycle and resources.', 'accounting_procurement', 113, true, true),
('capital_programs_office', 'M_PC_CAP_PROG_OFFICE', 'Capital Programs Office', 'capitalProgramsOffice', 'Access related to capital programs office functions.', 'accounting_procurement', 114, true, true),
('project_cost_accountant', 'M_PC_COST_ACCOUNTANT', 'Project Cost Accountant', 'projectCostAccountant', 'Manages project costs and accounting.', 'accounting_procurement', 115, true, true),
('project_fixed_asset', 'M_PC_FIXED_ASSET', 'Project Fixed Asset', 'projectFixedAsset', 'Manages fixed assets related to projects.', 'accounting_procurement', 116, true, true),
('category_subcategory_manager', 'M_PC_CAT_SUBCAT_MANAGER', 'Category Subcategory Manager', 'categorySubcategoryManager', 'Manages project categories and subcategories.', 'accounting_procurement', 117, true, true),
('project_control_dates', 'M_PC_CTRL_DATES', 'Project Control Dates', 'projectControlDates', 'Manages control dates for projects.', 'accounting_procurement', 118, true, true),
('project_accounting_systems', 'M_PC_ACCT_SYSTEMS', 'Project Accounting Systems', 'projectAccountingSystems', 'Access to project accounting systems.', 'accounting_procurement', 119, true, true),
('mndot_projects_inquiry', 'M_PC_MNDOT_PROJ_INQUIRY', 'MNDOT Projects Inquiry', 'mndotProjectsInquiry', 'View-only access to MNDOT projects.', 'accounting_procurement', 120, true, true),
('projects_inquiry_only', 'M_PC_INQUIRY_ONLY', 'Projects Inquiry Only', 'projectsInquiryOnly', 'View-only access to general project information.', 'accounting_procurement', 121, true, true),
('mndot_project_approver', 'M_PC_MNDOT_PROJ_APPR', 'MNDOT Project Approver', 'mndotProjectApprover', 'Approves MNDOT projects.', 'accounting_procurement', 122, true, true),
('route_control', 'M_PC_ROUTE_CTRL', 'Route Control', 'routeControl', 'Manages routing controls for project processes.', 'accounting_procurement', 123, true, true)
ON CONFLICT (flag_key) DO UPDATE SET
  role_code = EXCLUDED.role_code,
  name = EXCLUDED.name,
  form_name = EXCLUDED.form_name,
  description = EXCLUDED.description,
  updated_at = now();

-- Insert Cost Allocation and Asset Management roles
INSERT INTO public.role_catalog (flag_key, role_code, name, form_name, description, domain, display_order, active, is_active) VALUES
('cost_allocation_inquiry_only', 'M_CA_INQUIRY_ONLY', 'Cost Allocation Inquiry Only', 'costAllocationInquiryOnly', 'View-only access to cost allocation information.', 'accounting_procurement', 140, true, true),
('financial_accountant_assets', 'M_AM_FIN_ACCT_ASSETS', 'Financial Accountant Assets', 'financialAccountantAssets', 'Manages financial accounting for assets.', 'accounting_procurement', 150, true, true),
('asset_management_inquiry_only', 'M_AM_INQUIRY_ONLY', 'Asset Management Inquiry Only', 'assetManagementInquiryOnly', 'View-only access to asset management information.', 'accounting_procurement', 151, true, true),
('physical_inventory_approval_1', 'M_AM_PHYS_INV_APPR_01', 'Physical Inventory Approval 1', 'physicalInventoryApproval1', 'First level approval for physical inventory.', 'accounting_procurement', 152, true, true),
('physical_inventory_approval_2', 'M_AM_PHYS_INV_APPR_02', 'Physical Inventory Approval 2', 'physicalInventoryApproval2', 'Second level approval for physical inventory.', 'accounting_procurement', 153, true, true)
ON CONFLICT (flag_key) DO UPDATE SET
  role_code = EXCLUDED.role_code,
  name = EXCLUDED.name,
  form_name = EXCLUDED.form_name,
  description = EXCLUDED.description,
  updated_at = now();
