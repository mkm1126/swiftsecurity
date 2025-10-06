-- ============================================================================
-- MIGRATION: Copy data from OLD database to NEW database
-- ============================================================================
-- Both databases have the SAME schema structure, we just need to:
-- 1. Map supervisor_email → supervisor_username
-- 2. Map security_admin_email → security_admin_username
-- 3. Copy all data
-- ============================================================================

-- Enable dblink if not already enabled
CREATE EXTENSION IF NOT EXISTS dblink;

-- Step 1: Migrate access_requests to security_role_requests
INSERT INTO security_role_requests (
  id, created_at, updated_at, start_date, employee_name, employee_id,
  is_non_employee, work_location, work_phone, email, agency_name, agency_code,
  justification, submitter_name, submitter_email, supervisor_name,
  supervisor_username, security_admin_name, security_admin_username,
  status, hr_mainframe_logon_id
)
SELECT
  id, created_at, updated_at, start_date, employee_name, employee_id,
  is_non_employee, work_location, work_phone, email, agency_name,
  agency_code,
  justification, submitter_name, submitter_email, supervisor_name,
  supervisor_email as supervisor_username,  -- Map email to username
  security_admin_name,
  security_admin_email as security_admin_username,  -- Map email to username
  status, hr_mainframe_logon_id
FROM dblink(
  'dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=Mucfrev@9xe',
  'SELECT id, created_at, updated_at, start_date, employee_name, employee_id,
          is_non_employee, work_location, work_phone, email, agency_name, agency_code,
          justification, submitter_name, submitter_email, supervisor_name,
          supervisor_email, security_admin_name, security_admin_email,
          status, hr_mainframe_logon_id
   FROM access_requests'
) AS t(
  id uuid, created_at timestamptz, updated_at timestamptz, start_date date,
  employee_name text, employee_id text, is_non_employee boolean, work_location text,
  work_phone text, email text, agency_name text, agency_code text,
  justification text, submitter_name text, submitter_email text,
  supervisor_name text, supervisor_email text, security_admin_name text,
  security_admin_email text, status text, hr_mainframe_logon_id text
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Migrate security_role_selections (all columns as-is)
INSERT INTO security_role_selections (
  id, request_id, created_at, updated_at,
  home_business_unit, other_business_units,
  voucher_entry, voucher_approver_1, voucher_approver_2, voucher_approver_3,
  maintenance_voucher_build_errors, match_override, ap_inquiry_only,
  cash_maintenance, receivable_specialist, receivable_supervisor,
  writeoff_approval_business_units, billing_create, billing_specialist,
  billing_supervisor, credit_invoice_approval_business_units,
  customer_maintenance_specialist, ar_billing_setup, ar_billing_inquiry_only,
  cash_management_inquiry_only, budget_journal_entry_online, budget_journal_load,
  journal_approver, appropriation_sources, expense_budget_source,
  revenue_budget_source, budget_transfer_entry_online, transfer_approver,
  transfer_appropriation_sources, budget_inquiry_only, journal_entry_online,
  journal_load, agency_chartfield_maintenance, gl_agency_approver,
  gl_agency_approver_sources, general_ledger_inquiry_only,
  nvision_reporting_agency_user, needs_daily_receipts_report,
  award_data_entry, grant_fiscal_manager, program_manager,
  gm_agency_setup, grants_inquiry_only, federal_project_initiator,
  oim_initiator, project_initiator, project_manager, capital_programs_office,
  project_cost_accountant, project_fixed_asset, category_subcategory_manager,
  project_control_dates, project_accounting_systems, mndot_projects_inquiry,
  projects_inquiry_only, mndot_project_approver, route_control,
  cost_allocation_inquiry_only, financial_accountant_assets,
  asset_management_inquiry_only, physical_inventory_approval_1,
  physical_inventory_business_units, physical_inventory_approval_2,
  physical_inventory_department_ids,
  elm_system_administrator, elm_key_administrator, elm_course_administrator,
  elm_reporting_administrator, create_courses, edit_courses, delete_courses,
  manage_course_content, manage_user_accounts, assign_user_roles,
  view_user_progress, generate_user_reports, access_system_reports,
  create_custom_reports, export_report_data, view_analytics_dashboard,
  create_learning_paths, edit_learning_paths, assign_learning_paths,
  track_learning_progress, manage_certifications, issue_certificates,
  track_certification_status, renew_certifications, configure_system_settings,
  manage_integrations, setup_notifications, manage_security_settings,
  bulk_user_operations, data_import_export, system_backup_access,
  audit_log_access
)
SELECT
  id, request_id, created_at, updated_at,
  home_business_unit, other_business_units,
  voucher_entry, voucher_approver_1, voucher_approver_2, voucher_approver_3,
  maintenance_voucher_build_errors, match_override, ap_inquiry_only,
  cash_maintenance, receivable_specialist, receivable_supervisor,
  writeoff_approval_business_units, billing_create, billing_specialist,
  billing_supervisor, credit_invoice_approval_business_units,
  customer_maintenance_specialist, ar_billing_setup, ar_billing_inquiry_only,
  cash_management_inquiry_only, budget_journal_entry_online, budget_journal_load,
  journal_approver, appropriation_sources, expense_budget_source,
  revenue_budget_source, budget_transfer_entry_online, transfer_approver,
  transfer_appropriation_sources, budget_inquiry_only, journal_entry_online,
  journal_load, agency_chartfield_maintenance, gl_agency_approver,
  gl_agency_approver_sources, general_ledger_inquiry_only,
  nvision_reporting_agency_user, needs_daily_receipts_report,
  award_data_entry, grant_fiscal_manager, program_manager,
  gm_agency_setup, grants_inquiry_only, federal_project_initiator,
  oim_initiator, project_initiator, project_manager, capital_programs_office,
  project_cost_accountant, project_fixed_asset, category_subcategory_manager,
  project_control_dates, project_accounting_systems, mndot_projects_inquiry,
  projects_inquiry_only, mndot_project_approver, route_control,
  cost_allocation_inquiry_only, financial_accountant_assets,
  asset_management_inquiry_only, physical_inventory_approval_1,
  physical_inventory_business_units, physical_inventory_approval_2,
  physical_inventory_department_ids,
  elm_system_administrator, elm_key_administrator, elm_course_administrator,
  elm_reporting_administrator, create_courses, edit_courses, delete_courses,
  manage_course_content, manage_user_accounts, assign_user_roles,
  view_user_progress, generate_user_reports, access_system_reports,
  create_custom_reports, export_report_data, view_analytics_dashboard,
  create_learning_paths, edit_learning_paths, assign_learning_paths,
  track_learning_progress, manage_certifications, issue_certificates,
  track_certification_status, renew_certifications, configure_system_settings,
  manage_integrations, setup_notifications, manage_security_settings,
  bulk_user_operations, data_import_export, system_backup_access,
  audit_log_access
FROM dblink(
  'dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=Mucfrev@9xe',
  'SELECT id, request_id, created_at, updated_at,
          home_business_unit, other_business_units,
          voucher_entry, voucher_approver_1, voucher_approver_2, voucher_approver_3,
          maintenance_voucher_build_errors, match_override, ap_inquiry_only,
          cash_maintenance, receivable_specialist, receivable_supervisor,
          writeoff_approval_business_units, billing_create, billing_specialist,
          billing_supervisor, credit_invoice_approval_business_units,
          customer_maintenance_specialist, ar_billing_setup, ar_billing_inquiry_only,
          cash_management_inquiry_only, budget_journal_entry_online, budget_journal_load,
          journal_approver, appropriation_sources, expense_budget_source,
          revenue_budget_source, budget_transfer_entry_online, transfer_approver,
          transfer_appropriation_sources, budget_inquiry_only, journal_entry_online,
          journal_load, agency_chartfield_maintenance, gl_agency_approver,
          gl_agency_approver_sources, general_ledger_inquiry_only,
          nvision_reporting_agency_user, needs_daily_receipts_report,
          award_data_entry, grant_fiscal_manager, program_manager,
          gm_agency_setup, grants_inquiry_only, federal_project_initiator,
          oim_initiator, project_initiator, project_manager, capital_programs_office,
          project_cost_accountant, project_fixed_asset, category_subcategory_manager,
          project_control_dates, project_accounting_systems, mndot_projects_inquiry,
          projects_inquiry_only, mndot_project_approver, route_control,
          cost_allocation_inquiry_only, financial_accountant_assets,
          asset_management_inquiry_only, physical_inventory_approval_1,
          physical_inventory_business_units, physical_inventory_approval_2,
          physical_inventory_department_ids,
          elm_system_administrator, elm_key_administrator, elm_course_administrator,
          elm_reporting_administrator, create_courses, edit_courses, delete_courses,
          manage_course_content, manage_user_accounts, assign_user_roles,
          view_user_progress, generate_user_reports, access_system_reports,
          create_custom_reports, export_report_data, view_analytics_dashboard,
          create_learning_paths, edit_learning_paths, assign_learning_paths,
          track_learning_progress, manage_certifications, issue_certificates,
          track_certification_status, renew_certifications, configure_system_settings,
          manage_integrations, setup_notifications, manage_security_settings,
          bulk_user_operations, data_import_export, system_backup_access,
          audit_log_access
   FROM security_role_selections'
) AS t(
  id uuid, request_id uuid, created_at timestamptz, updated_at timestamptz,
  home_business_unit text, other_business_units text,
  voucher_entry boolean, voucher_approver_1 text, voucher_approver_2 text, voucher_approver_3 text,
  maintenance_voucher_build_errors boolean, match_override boolean, ap_inquiry_only boolean,
  cash_maintenance boolean, receivable_specialist boolean, receivable_supervisor boolean,
  writeoff_approval_business_units text, billing_create boolean, billing_specialist boolean,
  billing_supervisor boolean, credit_invoice_approval_business_units text,
  customer_maintenance_specialist boolean, ar_billing_setup boolean, ar_billing_inquiry_only boolean,
  cash_management_inquiry_only boolean, budget_journal_entry_online boolean, budget_journal_load boolean,
  journal_approver boolean, appropriation_sources text, expense_budget_source text,
  revenue_budget_source text, budget_transfer_entry_online boolean, transfer_approver boolean,
  transfer_appropriation_sources text, budget_inquiry_only boolean, journal_entry_online boolean,
  journal_load boolean, agency_chartfield_maintenance boolean, gl_agency_approver boolean,
  gl_agency_approver_sources text, general_ledger_inquiry_only boolean,
  nvision_reporting_agency_user boolean, needs_daily_receipts_report boolean,
  award_data_entry boolean, grant_fiscal_manager boolean, program_manager boolean,
  gm_agency_setup boolean, grants_inquiry_only boolean, federal_project_initiator boolean,
  oim_initiator boolean, project_initiator boolean, project_manager boolean, capital_programs_office boolean,
  project_cost_accountant boolean, project_fixed_asset boolean, category_subcategory_manager boolean,
  project_control_dates boolean, project_accounting_systems boolean, mndot_projects_inquiry boolean,
  projects_inquiry_only boolean, mndot_project_approver boolean, route_control text,
  cost_allocation_inquiry_only boolean, financial_accountant_assets boolean,
  asset_management_inquiry_only boolean, physical_inventory_approval_1 boolean,
  physical_inventory_business_units text, physical_inventory_approval_2 boolean,
  physical_inventory_department_ids text,
  elm_system_administrator boolean, elm_key_administrator boolean, elm_course_administrator boolean,
  elm_reporting_administrator boolean, create_courses boolean, edit_courses boolean, delete_courses boolean,
  manage_course_content boolean, manage_user_accounts boolean, assign_user_roles boolean,
  view_user_progress boolean, generate_user_reports boolean, access_system_reports boolean,
  create_custom_reports boolean, export_report_data boolean, view_analytics_dashboard boolean,
  create_learning_paths boolean, edit_learning_paths boolean, assign_learning_paths boolean,
  track_learning_progress boolean, manage_certifications boolean, issue_certificates boolean,
  track_certification_status boolean, renew_certifications boolean, configure_system_settings boolean,
  manage_integrations boolean, setup_notifications boolean, manage_security_settings boolean,
  bulk_user_operations boolean, data_import_export boolean, system_backup_access boolean,
  audit_log_access boolean
)
ON CONFLICT (id) DO NOTHING;

-- Summary
SELECT 'Migration completed!' as status;
SELECT COUNT(*) as total_requests_migrated FROM security_role_requests;
SELECT COUNT(*) as total_role_selections_migrated FROM security_role_selections;
