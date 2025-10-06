/*
  # Create MNIT Details Support Functions and Views

  1. Database Objects Created
    - View: active_roles_for_request - Shows active roles for a given request
    - Function: mnit_details_payload - Returns role and route control data for MNIT Details page
    
  2. Purpose
    - Support the MNIT Details page in fetching role codes and route control configurations
    - Provide a consolidated view of roles selected for a request with their metadata
    
  3. Security
    - Public access to view and function (matches existing RLS policies)
*/

-- Create a view that joins security_role_selections with role_catalog
CREATE OR REPLACE VIEW public.active_roles_for_request AS
SELECT 
  srs.request_id,
  rc.flag_key,
  rc.role_code,
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
  -- Check if the boolean flag for this role is true in security_role_selections
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
  (rc.flag_key = 'physical_inventory_approval_2' AND srs.physical_inventory_approval_2 = true)
);

-- Create the RPC function that returns payload for MNIT Details page
CREATE OR REPLACE FUNCTION public.mnit_details_payload(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_selected_roles jsonb;
  v_route_controls jsonb;
BEGIN
  -- Get selected roles with their codes
  SELECT jsonb_agg(
    jsonb_build_object(
      'flag_key', flag_key,
      'role_code', role_code,
      'role_name', name
    )
    ORDER BY domain, display_order
  )
  INTO v_selected_roles
  FROM public.active_roles_for_request
  WHERE request_id = p_request_id;

  -- Get route controls for roles that require them
  SELECT jsonb_agg(
    jsonb_build_object(
      'flag_key', rc.flag_key,
      'role_code', rc.role_code,
      'role_name', rc.name,
      'control_key', ctrl->>'column',
      'label', ctrl->>'label',
      'type', ctrl->>'type',
      'options', ctrl->'options',
      'value', NULL,
      'required', COALESCE((ctrl->>'required')::boolean, false),
      'pattern', ctrl->>'pattern',
      'hint', ctrl->>'hint',
      'placeholder', ctrl->>'placeholder'
    )
  )
  INTO v_route_controls
  FROM public.role_catalog rc
  CROSS JOIN jsonb_array_elements(rc.control_spec->'controls') AS ctrl
  WHERE rc.requires_route_controls = true
    AND rc.flag_key IN (
      SELECT flag_key 
      FROM public.active_roles_for_request 
      WHERE request_id = p_request_id
    );

  -- Build final result
  v_result := jsonb_build_object(
    'selectedRoles', COALESCE(v_selected_roles, '[]'::jsonb),
    'routeControls', COALESCE(v_route_controls, '[]'::jsonb)
  );

  RETURN v_result;
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.mnit_details_payload(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.mnit_details_payload(uuid) TO authenticated;
