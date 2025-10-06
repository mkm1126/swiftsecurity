-- ============================================================================
-- FIX FOR OLD DATABASE (lyzcqbbfmgtxieytskrf)
-- This script only creates/updates the missing function and view
-- Copy this entire script and run it in your Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/lyzcqbbfmgtxieytskrf/sql
-- ============================================================================

-- Step 1: Create or replace the view to join selections with role codes
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
  (rc.flag_key = 'ap_voucher_approver_1' AND srs.ap_voucher_approver_1 = true) OR
  (rc.flag_key = 'ap_voucher_approver_2' AND srs.ap_voucher_approver_2 = true) OR
  (rc.flag_key = 'ap_voucher_approver_3' AND srs.ap_voucher_approver_3 = true)
);

-- Step 2: Create RPC function for MNIT Details page
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

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION public.mnit_details_payload(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.mnit_details_payload(uuid) TO authenticated;

-- Done! This will fix the missing role codes issue.
