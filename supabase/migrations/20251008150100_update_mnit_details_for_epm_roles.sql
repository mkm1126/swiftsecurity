/*
  # Update MNIT Details Functions to Support EPM Roles

  1. New Helper Function
    - resolve_epm_role_code - Substitutes {AGENCY_CODE} placeholder with actual agency code

  2. Updated View
    - active_roles_for_request - Now includes EPM Data Warehouse roles

  3. Updated RPC Function
    - mnit_details_payload - Uses helper function to resolve EPM role codes dynamically

  4. EPM Role Code Resolution
    - Reads gw_agency_code from security_role_selections
    - Replaces {AGENCY_CODE} with uppercase 3-character agency code
    - Returns original code if no placeholder or if agency code is missing

  5. Notes
    - EPM roles will display in their own section (domain: epm_data_warehouse)
    - Agency-specific roles show fully qualified codes (e.g., M_EPM_DOT_BASIC_RPT_DEVELOPER)
    - Static roles (like M_EPM_DATA_EXTRACTS) display unchanged
*/

-- Create helper function to resolve EPM role code templates
CREATE OR REPLACE FUNCTION public.resolve_epm_role_code(
  p_role_code text,
  p_agency_code text
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- If role code contains {AGENCY_CODE} placeholder and we have an agency code, substitute it
  IF p_role_code LIKE '%{AGENCY_CODE}%' AND p_agency_code IS NOT NULL AND LENGTH(TRIM(p_agency_code)) > 0 THEN
    -- Convert agency code to uppercase and ensure it's exactly 3 characters
    -- If shorter, pad with zeros; if longer, truncate
    RETURN REPLACE(
      p_role_code,
      '{AGENCY_CODE}',
      UPPER(LPAD(TRIM(p_agency_code), 3, '0'))
    );
  END IF;

  -- Otherwise return the original role code
  RETURN p_role_code;
END;
$$;

-- Update the active_roles_for_request view to include EPM roles
CREATE OR REPLACE VIEW public.active_roles_for_request AS
SELECT
  srs.request_id,
  rc.flag_key,
  -- Resolve EPM role codes with agency code substitution
  public.resolve_epm_role_code(rc.role_code, srs.gw_agency_code) as role_code,
  rc.name,
  rc.description,
  rc.requires_route_controls,
  rc.control_spec,
  rc.domain,
  rc.display_order
FROM public.security_role_selections srs
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

  -- NEW: EPM Data Warehouse roles
  (rc.flag_key = 'data_extracts' AND srs.data_extracts = true) OR
  (rc.flag_key = 'basic_report_dev' AND srs.basic_report_dev = true) OR
  (rc.flag_key = 'advanced_report_dev' AND srs.advanced_report_dev = true) OR
  (rc.flag_key = 'dashboard_developer' AND srs.dashboard_developer = true) OR
  (rc.flag_key = 'agency_administrator' AND srs.agency_administrator = true)
);

-- Update the mnit_details_payload function (no changes needed - it already uses the view)
-- The view update automatically includes EPM roles in the payload

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION public.resolve_epm_role_code(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.resolve_epm_role_code(text, text) TO authenticated;

-- Add comment to document the helper function
COMMENT ON FUNCTION public.resolve_epm_role_code(text, text) IS
  'Resolves EPM role code templates by replacing {AGENCY_CODE} placeholder with actual agency code. Used for dynamically generating agency-specific role codes like M_EPM_DOT_BASIC_RPT_DEVELOPER.';

-- Verify the update was successful
DO $$
DECLARE
  v_epm_roles_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_epm_roles_count
  FROM public.role_catalog
  WHERE domain = 'epm_data_warehouse' AND is_active = true;

  RAISE NOTICE 'MNIT Details updated successfully. Active EPM roles in catalog: %', v_epm_roles_count;
  RAISE NOTICE 'The active_roles_for_request view now includes EPM Data Warehouse roles.';
  RAISE NOTICE 'Role codes will be dynamically resolved using the gw_agency_code field.';
END $$;
