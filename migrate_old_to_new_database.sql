-- ============================================================================
-- DATA MIGRATION: Old Database → New Database
-- ============================================================================
-- This script exports data from the OLD database in a format that can be
-- imported into the NEW database.
--
-- INSTRUCTIONS:
-- 1. Run PART 1 in the OLD database (lyzcqbbfmgtxieytskrf)
-- 2. Copy the output
-- 3. Run PART 2 (the output from step 2) in the NEW database (0ec90b57d6e95fcbda19832f)
-- ============================================================================

-- ============================================================================
-- PART 1: RUN THIS IN OLD DATABASE
-- Copy this query and run it in:
-- https://supabase.com/dashboard/project/lyzcqbbfmgtxieytskrf/sql
-- ============================================================================

-- This will generate INSERT statements for your data
SELECT
  'INSERT INTO public.security_role_requests (id, created_at, updated_at, start_date, employee_name, employee_id, is_non_employee, work_location, work_phone, email, agency_name, agency_code, justification, submitter_name, submitter_email, supervisor_name, supervisor_username, security_admin_name, security_admin_username, security_area, accounting_director, accounting_director_username, hr_mainframe_logon_id, hr_view_statewide, elm_key_admin, elm_key_admin_username, elm_director, elm_director_email, hr_director, hr_director_email, copy_from_user, copy_user_name, copy_user_employee_id, copy_user_sema4_id, non_employee_type, access_end_date, security_measures, status) VALUES' AS sql_statement
UNION ALL
SELECT
  format(
    '(%L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L)' ||
    CASE WHEN row_number() OVER () = count(*) OVER () THEN ';' ELSE ',' END,
    id::text,
    created_at,
    updated_at,
    start_date,
    employee_name,
    employee_id,
    is_non_employee,
    work_location,
    work_phone,
    email,
    agency_name,
    agency_code,
    justification,
    submitter_name,
    submitter_email,
    supervisor_name,
    supervisor_username,
    security_admin_name,
    security_admin_username,
    security_area,
    accounting_director,
    accounting_director_username,
    hr_mainframe_logon_id,
    hr_view_statewide,
    elm_key_admin,
    elm_key_admin_username,
    elm_director,
    elm_director_email,
    hr_director,
    hr_director_email,
    copy_from_user,
    copy_user_name,
    copy_user_employee_id,
    copy_user_sema4_id,
    non_employee_type,
    access_end_date,
    security_measures,
    status
  )
FROM public.access_requests
ORDER BY created_at;

-- Now do the same for security_role_selections
SELECT '' AS separator;
SELECT 'INSERT INTO public.security_role_selections (id, request_id, created_at, updated_at, home_business_unit, other_business_units, voucher_entry, voucher_approver_1, voucher_approver_2, voucher_approver_3, maintenance_voucher_build_errors, match_override, ap_inquiry_only, ap_workflow_approver, ap_workflow_route_controls, ap_voucher_approver_1, ap_voucher_approver_2, ap_voucher_approver_3, ap_voucher_approver_1_route_controls, ap_voucher_approver_2_route_controls, ap_voucher_approver_3_route_controls, cash_maintenance, receivable_specialist, receivable_supervisor, writeoff_approval_business_units, billing_create, billing_specialist, billing_supervisor, credit_invoice_approval_business_units, customer_maintenance_specialist, ar_billing_setup, ar_billing_inquiry_only, cash_management_inquiry_only, budget_journal_entry_online, budget_journal_load, journal_approver, journal_approver_appr, journal_approver_rev, appropriation_sources, expense_budget_source, revenue_budget_source, budget_transfer_entry_online, transfer_approver, transfer_appropriation_sources, budget_inquiry_only, journal_entry_online, journal_load, agency_chartfield_maintenance, gl_agency_approver, gl_agency_approver_sources, general_ledger_inquiry_only, nvision_reporting_agency_user, needs_daily_receipts_report, award_data_entry, grant_fiscal_manager, program_manager, gm_agency_setup, grants_inquiry_only, federal_project_initiator, oim_initiator, project_initiator, project_manager, capital_programs_office, project_cost_accountant, project_fixed_asset, category_subcategory_manager, project_control_dates, project_accounting_systems, mndot_projects_inquiry, projects_inquiry_only, mndot_project_approver, route_control, cost_allocation_inquiry_only, financial_accountant_assets, asset_management_inquiry_only, physical_inventory_approval_1, physical_inventory_business_units, physical_inventory_approval_2, physical_inventory_department_ids, inventory_express_issue, inventory_adjustment_approver, inventory_replenishment_buyer, inventory_control_worker, inventory_express_putaway, inventory_fulfillment_specialist, inventory_po_receiver, inventory_returns_receiver, inventory_cost_adjustment, inventory_materials_manager, inventory_delivery, inventory_inquiry_only, inventory_configuration_agency, inventory_pick_plan_report_distribution, ship_to_location, inventory_business_units, supervisor_approval, role_selection_json) VALUES' AS sql_statement
UNION ALL
SELECT
  format(
    '(%L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L)' ||
    CASE WHEN row_number() OVER () = count(*) OVER () THEN ';' ELSE ',' END,
    id::text,
    request_id::text,
    created_at,
    updated_at,
    home_business_unit,
    other_business_units,
    voucher_entry,
    voucher_approver_1,
    voucher_approver_2,
    voucher_approver_3,
    maintenance_voucher_build_errors,
    match_override,
    ap_inquiry_only,
    ap_workflow_approver,
    ap_workflow_route_controls,
    ap_voucher_approver_1,
    ap_voucher_approver_2,
    ap_voucher_approver_3,
    ap_voucher_approver_1_route_controls,
    ap_voucher_approver_2_route_controls,
    ap_voucher_approver_3_route_controls,
    cash_maintenance,
    receivable_specialist,
    receivable_supervisor,
    writeoff_approval_business_units,
    billing_create,
    billing_specialist,
    billing_supervisor,
    credit_invoice_approval_business_units,
    customer_maintenance_specialist,
    ar_billing_setup,
    ar_billing_inquiry_only,
    cash_management_inquiry_only,
    budget_journal_entry_online,
    budget_journal_load,
    journal_approver,
    journal_approver_appr,
    journal_approver_rev,
    appropriation_sources,
    expense_budget_source,
    revenue_budget_source,
    budget_transfer_entry_online,
    transfer_approver,
    transfer_appropriation_sources,
    budget_inquiry_only,
    journal_entry_online,
    journal_load,
    agency_chartfield_maintenance,
    gl_agency_approver,
    gl_agency_approver_sources,
    general_ledger_inquiry_only,
    nvision_reporting_agency_user,
    needs_daily_receipts_report,
    award_data_entry,
    grant_fiscal_manager,
    program_manager,
    gm_agency_setup,
    grants_inquiry_only,
    federal_project_initiator,
    oim_initiator,
    project_initiator,
    project_manager,
    capital_programs_office,
    project_cost_accountant,
    project_fixed_asset,
    category_subcategory_manager,
    project_control_dates,
    project_accounting_systems,
    mndot_projects_inquiry,
    projects_inquiry_only,
    mndot_project_approver,
    route_control,
    cost_allocation_inquiry_only,
    financial_accountant_assets,
    asset_management_inquiry_only,
    physical_inventory_approval_1,
    physical_inventory_business_units,
    physical_inventory_approval_2,
    physical_inventory_department_ids,
    inventory_express_issue,
    inventory_adjustment_approver,
    inventory_replenishment_buyer,
    inventory_control_worker,
    inventory_express_putaway,
    inventory_fulfillment_specialist,
    inventory_po_receiver,
    inventory_returns_receiver,
    inventory_cost_adjustment,
    inventory_materials_manager,
    inventory_delivery,
    inventory_inquiry_only,
    inventory_configuration_agency,
    inventory_pick_plan_report_distribution,
    ship_to_location,
    inventory_business_units,
    supervisor_approval,
    role_selection_json::text
  )
FROM public.security_role_selections
ORDER BY created_at;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- After you run this query in the old database:
-- 1. You'll get INSERT statements as output
-- 2. Copy ALL the output
-- 3. Go to your NEW database: https://supabase.com/dashboard/project/0ec90b57d6e95fcbda19832f/sql
-- 4. Paste and run the INSERT statements there
--
-- This will copy all your data from the old database to the new one!
-- ============================================================================
