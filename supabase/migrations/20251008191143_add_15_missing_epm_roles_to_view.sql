/*
  # Add 15 Missing EPM Roles to active_roles_for_request View

  1. Changes
    - Add 15 new EPM Data Warehouse role checks to the WHERE clause
    - These roles were added to role_catalog but missing from the view

  2. New EPM Roles
    - fms_lookup
    - year_end_financial_reporting
    - elm_warehouse_report
    - hcm_lookup
    - payroll_funding_salary_fte
    - payroll_paycheck_info
    - private_by_department
    - payroll_self_service_data
    - statewide_data
    - recruiting_solutions_data
    - labor_distribution
    - ssn_view
    - payroll_deductions
    - data_excluded_employees
    - raps_link
*/

DROP VIEW IF EXISTS public.active_roles_for_request;

CREATE VIEW public.active_roles_for_request AS
SELECT
  srs.request_id,
  rc.flag_key,
  -- For EPM roles with {AGENCY_CODE} placeholder, use gw_agency_code array
  -- For all other roles, use agency_code from main form
  CASE
    WHEN rc.domain = 'EPM Data Warehouse' AND rc.role_code LIKE '%{AGENCY_CODE}%' THEN
      public.resolve_epm_role_code(rc.role_code, agency_code_unnested.code)
    ELSE
      public.resolve_epm_role_code(rc.role_code, srr.agency_code)
  END as role_code,
  rc.name,
  rc.description,
  rc.requires_route_controls,
  rc.control_spec,
  rc.domain,
  rc.display_order
FROM public.security_role_selections srs
INNER JOIN public.security_role_requests srr ON srr.id = srs.request_id
CROSS JOIN public.role_catalog rc
-- For EPM roles with {AGENCY_CODE} placeholder, unnest the array to get one row per agency
LEFT JOIN LATERAL (
  SELECT UNNEST(
    CASE
      WHEN srs.gw_agency_code IS NOT NULL AND array_length(srs.gw_agency_code, 1) > 0
      THEN srs.gw_agency_code
      ELSE ARRAY[NULL::text]
    END
  ) as code
) agency_code_unnested ON (rc.domain = 'EPM Data Warehouse' AND rc.role_code LIKE '%{AGENCY_CODE}%')
WHERE rc.is_active = true
AND (
  (rc.flag_key = 'voucher_entry' AND srs.voucher_entry = true) OR
  (rc.flag_key = 'maintenance_voucher_build_errors' AND srs.maintenance_voucher_build_errors = true) OR
  (rc.flag_key = 'match_override' AND srs.match_override = true) OR
  (rc.flag_key = 'ap_inquiry_only' AND srs.ap_inquiry_only = true) OR
  (rc.flag_key = 'cash_maintenance' AND srs.cash_maintenance = true) OR
  (rc.flag_key = 'receivable_specialist' AND srs.receivable_specialist = true) OR
  (rc.flag_key = 'receivable_supervisor' AND srs.receivable_supervisor = true) OR
  (rc.flag_key = 'billing_create' AND srs.billing_create = true) OR
  (rc.flag_key = 'billing_specialist' AND srs.billing_specialist = true) OR
  (rc.flag_key = 'billing_supervisor' AND srs.billing_supervisor = true) OR
  (rc.flag_key = 'customer_maintenance_specialist' AND srs.customer_maintenance_specialist = true) OR
  (rc.flag_key = 'ar_billing_setup' AND srs.ar_billing_setup = true) OR
  (rc.flag_key = 'ar_billing_inquiry_only' AND srs.ar_billing_inquiry_only = true) OR
  (rc.flag_key = 'cash_management_inquiry_only' AND srs.cash_management_inquiry_only = true) OR
  (rc.flag_key = 'budget_journal_entry_online' AND srs.budget_journal_entry_online = true) OR
  (rc.flag_key = 'budget_journal_load' AND srs.budget_journal_load = true) OR
  (rc.flag_key = 'journal_approver' AND srs.journal_approver = true) OR
  (rc.flag_key = 'journal_approver_appr' AND srs.journal_approver_appr = true) OR
  (rc.flag_key = 'journal_approver_rev' AND srs.journal_approver_rev = true) OR
  (rc.flag_key = 'budget_transfer_entry_online' AND srs.budget_transfer_entry_online = true) OR
  (rc.flag_key = 'transfer_approver' AND srs.transfer_approver = true) OR
  (rc.flag_key = 'budget_inquiry_only' AND srs.budget_inquiry_only = true) OR
  (rc.flag_key = 'journal_entry_online' AND srs.journal_entry_online = true) OR
  (rc.flag_key = 'journal_load' AND srs.journal_load = true) OR
  (rc.flag_key = 'agency_chartfield_maintenance' AND srs.agency_chartfield_maintenance = true) OR
  (rc.flag_key = 'gl_agency_approver' AND srs.gl_agency_approver = true) OR
  (rc.flag_key = 'general_ledger_inquiry_only' AND srs.general_ledger_inquiry_only = true) OR
  (rc.flag_key = 'nvision_reporting_agency_user' AND srs.nvision_reporting_agency_user = true) OR
  (rc.flag_key = 'needs_daily_receipts_report' AND srs.needs_daily_receipts_report = true) OR
  (rc.flag_key = 'award_data_entry' AND srs.award_data_entry = true) OR
  (rc.flag_key = 'grant_fiscal_manager' AND srs.grant_fiscal_manager = true) OR
  (rc.flag_key = 'program_manager' AND srs.program_manager = true) OR
  (rc.flag_key = 'gm_agency_setup' AND srs.gm_agency_setup = true) OR
  (rc.flag_key = 'grants_inquiry_only' AND srs.grants_inquiry_only = true) OR
  (rc.flag_key = 'federal_project_initiator' AND srs.federal_project_initiator = true) OR
  (rc.flag_key = 'oim_initiator' AND srs.oim_initiator = true) OR
  (rc.flag_key = 'project_initiator' AND srs.project_initiator = true) OR
  (rc.flag_key = 'project_manager' AND srs.project_manager = true) OR
  (rc.flag_key = 'capital_programs_office' AND srs.capital_programs_office = true) OR
  (rc.flag_key = 'project_cost_accountant' AND srs.project_cost_accountant = true) OR
  (rc.flag_key = 'project_fixed_asset' AND srs.project_fixed_asset = true) OR
  (rc.flag_key = 'category_subcategory_manager' AND srs.category_subcategory_manager = true) OR
  (rc.flag_key = 'project_control_dates' AND srs.project_control_dates = true) OR
  (rc.flag_key = 'project_accounting_systems' AND srs.project_accounting_systems = true) OR
  (rc.flag_key = 'mndot_projects_inquiry' AND srs.mndot_projects_inquiry = true) OR
  (rc.flag_key = 'projects_inquiry_only' AND srs.projects_inquiry_only = true) OR
  (rc.flag_key = 'mndot_project_approver' AND srs.mndot_project_approver = true) OR
  (rc.flag_key = 'cost_allocation_inquiry_only' AND srs.cost_allocation_inquiry_only = true) OR
  (rc.flag_key = 'financial_accountant_assets' AND srs.financial_accountant_assets = true) OR
  (rc.flag_key = 'asset_management_inquiry_only' AND srs.asset_management_inquiry_only = true) OR
  (rc.flag_key = 'physical_inventory_approval_1' AND srs.physical_inventory_approval_1 = true) OR
  (rc.flag_key = 'physical_inventory_approval_2' AND srs.physical_inventory_approval_2 = true) OR
  
  -- EPM Data Warehouse roles (original 5)
  (rc.flag_key = 'data_extracts' AND srs.data_extracts = true) OR
  (rc.flag_key = 'basic_report_dev' AND srs.basic_report_dev = true) OR
  (rc.flag_key = 'advanced_report_dev' AND srs.advanced_report_dev = true) OR
  (rc.flag_key = 'dashboard_developer' AND srs.dashboard_developer = true) OR
  (rc.flag_key = 'agency_administrator' AND srs.agency_administrator = true) OR
  
  -- EPM Data Warehouse roles (newly added 15)
  (rc.flag_key = 'fms_lookup' AND srs.fms_lookup = true) OR
  (rc.flag_key = 'year_end_financial_reporting' AND srs.year_end_financial_reporting = true) OR
  (rc.flag_key = 'elm_warehouse_report' AND srs.elm_warehouse_report = true) OR
  (rc.flag_key = 'hcm_lookup' AND srs.hcm_lookup = true) OR
  (rc.flag_key = 'payroll_funding_salary_fte' AND srs.payroll_funding_salary_fte = true) OR
  (rc.flag_key = 'payroll_paycheck_info' AND srs.payroll_paycheck_info = true) OR
  (rc.flag_key = 'private_by_department' AND srs.private_by_department = true) OR
  (rc.flag_key = 'payroll_self_service_data' AND srs.payroll_self_service_data = true) OR
  (rc.flag_key = 'statewide_data' AND srs.statewide_data = true) OR
  (rc.flag_key = 'recruiting_solutions_data' AND srs.recruiting_solutions_data = true) OR
  (rc.flag_key = 'labor_distribution' AND srs.labor_distribution = true) OR
  (rc.flag_key = 'ssn_view' AND srs.ssn_view = true) OR
  (rc.flag_key = 'payroll_deductions' AND srs.payroll_deductions = true) OR
  (rc.flag_key = 'data_excluded_employees' AND srs.data_excluded_employees = true) OR
  (rc.flag_key = 'raps_link' AND srs.raps_link = true)
)
-- Filter out rows where EPM agency-specific roles have null agency codes
AND (
  (rc.domain = 'EPM Data Warehouse' AND rc.role_code LIKE '%{AGENCY_CODE}%' AND agency_code_unnested.code IS NOT NULL) OR
  (rc.domain != 'EPM Data Warehouse' OR rc.role_code NOT LIKE '%{AGENCY_CODE}%')
)
ORDER BY rc.display_order, rc.name;

-- Grant permissions on the view
GRANT SELECT ON public.active_roles_for_request TO anon;
GRANT SELECT ON public.active_roles_for_request TO authenticated;

-- Update view comment
COMMENT ON VIEW public.active_roles_for_request IS
  'Returns all active roles for each request based on selected flags. For EPM roles with {AGENCY_CODE} placeholder, expands gw_agency_code array to generate one role per agency code. Non-EPM roles use agency_code from main form.';
