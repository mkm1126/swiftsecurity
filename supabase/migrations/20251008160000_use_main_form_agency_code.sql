/*
  # Use Main Form Agency Code for EPM Role Resolution

  1. Changes
    - Update active_roles_for_request view to join with security_role_requests table
    - Use security_role_requests.agency_code instead of security_role_selections.gw_agency_code
    - This ensures EPM role codes use the agency from the main form's User Details section

  2. Impact
    - EPM role codes like M_{AGENCY_CODE}_DATA_EXTRACTS will now use the agency code from the main form
    - Example: If main form has agency_code='G02', role becomes M_EPM_G02_DATA_EXTRACTS
    - The gw_agency_code field on EPM Role Selection Page is no longer used for role code resolution

  3. Benefits
    - Single source of truth for agency code (from main form)
    - More consistent user experience
    - Agency is defined once at the beginning of the request
*/

-- Update the active_roles_for_request view to use main form agency code
CREATE OR REPLACE VIEW public.active_roles_for_request AS
SELECT
  srs.request_id,
  rc.flag_key,
  -- Resolve EPM role codes with agency code from main form (security_role_requests.agency_code)
  public.resolve_epm_role_code(rc.role_code, srr.agency_code) as role_code,
  rc.name,
  rc.description,
  rc.requires_route_controls,
  rc.control_spec,
  rc.domain,
  rc.display_order
FROM public.security_role_selections srs
-- Join with security_role_requests to get agency_code from main form
INNER JOIN public.security_role_requests srr ON srr.id = srs.request_id
CROSS JOIN public.role_catalog rc
WHERE rc.is_active = true
AND (
  -- Existing Accounting/Procurement roles
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

  -- EPM Data Warehouse roles
  (rc.flag_key = 'data_extracts' AND srs.data_extracts = true) OR
  (rc.flag_key = 'basic_report_dev' AND srs.basic_report_dev = true) OR
  (rc.flag_key = 'advanced_report_dev' AND srs.advanced_report_dev = true) OR
  (rc.flag_key = 'dashboard_developer' AND srs.dashboard_developer = true) OR
  (rc.flag_key = 'agency_administrator' AND srs.agency_administrator = true)
);

-- Add helpful comment
COMMENT ON VIEW public.active_roles_for_request IS
  'Returns all active roles for a given request. EPM role codes with {AGENCY_CODE} placeholder are resolved using the agency_code from security_role_requests table (main form User Details section).';

-- Verify the update was successful
DO $$
DECLARE
  v_view_definition text;
BEGIN
  SELECT definition INTO v_view_definition
  FROM pg_views
  WHERE viewname = 'active_roles_for_request'
  AND schemaname = 'public';

  IF v_view_definition LIKE '%srr.agency_code%' THEN
    RAISE NOTICE '✓ View successfully updated to use security_role_requests.agency_code';
    RAISE NOTICE '✓ EPM role codes will now use agency code from main form User Details section';
  ELSE
    RAISE WARNING '⚠ View update may not have applied correctly';
  END IF;
END $$;
