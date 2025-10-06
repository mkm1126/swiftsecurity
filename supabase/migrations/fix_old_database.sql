-- ============================================================================
-- COMPLETE SQL MIGRATION FOR OLD DATABASE (lyzcqbbfmgtxieytskrf)
-- Copy this entire script and run it in your Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/lyzcqbbfmgtxieytskrf/sql
-- ============================================================================

-- Step 1: Create role_catalog table
CREATE TABLE IF NOT EXISTS public.role_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key text NOT NULL UNIQUE,
  role_code text NOT NULL,
  name text NOT NULL,
  description text,
  domain text NOT NULL,
  requires_route_controls boolean DEFAULT false,
  control_spec jsonb,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.role_catalog ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Allow public read access to role catalog"
  ON public.role_catalog FOR SELECT
  TO public
  USING (true);

-- Step 2: Populate role_catalog with all SWIFT roles
INSERT INTO public.role_catalog (flag_key, role_code, name, description, domain, requires_route_controls, control_spec, display_order) VALUES
-- Accounts Payable
('voucher_entry', 'M_FS_AP_VCHR_ENTRY', 'Voucher Entry', 'Create and enter vouchers', 'accounting_procurement', false, NULL, 10),
('maintenance_voucher_build_errors', 'M_FS_AP_MAINT_VCHR_ERRORS', 'Maintenance of Voucher Build Errors', 'Correct voucher build errors', 'accounting_procurement', false, NULL, 20),
('match_override', 'M_FS_AP_MATCH_OVERRIDE', 'Match Override', 'Override matching requirements', 'accounting_procurement', false, NULL, 30),
('ap_inquiry_only', 'M_FS_AP_INQUIRY', 'AP Inquiry Only', 'View accounts payable data', 'accounting_procurement', false, NULL, 40),
('ap_voucher_approver_1', 'M_FS_WF_AP_VCHR_01', 'AP Voucher Approver Level 1', 'First level voucher approval', 'accounting_procurement', true, '{"controls": [{"column": "voucher_approver_1", "type": "multiselect", "label": "Route Controls: Financial Department ID(s)", "required": true}]}', 50),
('ap_voucher_approver_2', 'M_FS_WF_AP_VCHR_02', 'AP Voucher Approver Level 2', 'Second level voucher approval', 'accounting_procurement', true, '{"controls": [{"column": "voucher_approver_2", "type": "multiselect", "label": "Route Controls: Financial Department ID(s)", "required": true}]}', 60),
('ap_voucher_approver_3', 'M_FS_WF_AP_VCHR_03', 'AP Voucher Approver Level 3', 'Third level voucher approval', 'accounting_procurement', true, '{"controls": [{"column": "voucher_approver_3", "type": "multiselect", "label": "Route Controls: Financial Department ID(s)", "required": true}]}', 70),

-- Accounts Receivable
('cash_maintenance', 'M_FS_AR_ACCT_CASH_MAINT', 'Cash Maintenance', 'Process cash receipts and payments', 'accounting_procurement', false, NULL, 80),
('receivable_specialist', 'M_FS_AR_ACCT_REC_SPEC', 'Receivable Specialist', 'Manage receivable accounts', 'accounting_procurement', false, NULL, 90),
('receivable_supervisor', 'M_FS_AR_SUPERVISOR', 'Receivable Supervisor', 'Supervise receivable operations', 'accounting_procurement', false, NULL, 100),
('billing_create', 'M_FS_AR_BILLING_CREATE', 'Billing Create', 'Create billing transactions', 'accounting_procurement', false, NULL, 110),
('billing_specialist', 'M_AR_BILLING_SPEC', 'Billing Specialist', 'Process billing operations', 'accounting_procurement', false, NULL, 120),
('billing_supervisor', 'M_FS_AR_BILLING_SUPER', 'Billing Supervisor', 'Supervise billing operations', 'accounting_procurement', false, NULL, 130),
('customer_maintenance_specialist', 'M_FS_AR_CUST_MAINT_SPEC', 'Customer Maintenance Specialist', 'Maintain customer records', 'accounting_procurement', false, NULL, 140),
('ar_billing_setup', 'M_FS_AR_BILLING_SETUP', 'AR Billing Setup', 'Configure billing setup', 'accounting_procurement', false, NULL, 150),
('ar_billing_inquiry_only', 'M_FS_AR_INQUIRY_REC_BLLG', 'AR Billing Inquiry Only', 'View billing data', 'accounting_procurement', false, NULL, 160),
('cash_management_inquiry_only', 'M_FS_AR_CASH_MGMT_INQ', 'Cash Management Inquiry Only', 'View cash management data', 'accounting_procurement', false, NULL, 170),

-- Budget
('budget_journal_entry_online', 'M_FS_KK_BUD_JRNL_ENTRY', 'Budget Journal Entry Online', 'Enter budget journal entries', 'accounting_procurement', false, NULL, 180),
('budget_journal_load', 'M_FS_KK_BUD_JRNL_LOAD', 'Budget Journal Load', 'Load budget journal batches', 'accounting_procurement', false, NULL, 190),
('journal_approver', 'M_FS_KK_AGENCY_JRNL_APPRVR', 'Journal Approver', 'Approve budget journals', 'accounting_procurement', false, NULL, 200),
('journal_approver_appr', 'M_FS_WF_KK_AGENCY_JNL_APPR', 'Journal Approver - Appropriation', 'Approve appropriation journals', 'accounting_procurement', false, NULL, 210),
('journal_approver_rev', 'M_FS_WF_KK_AGENCY_JNL_REV', 'Journal Approver - Revenue', 'Approve revenue journals', 'accounting_procurement', false, NULL, 220),
('budget_transfer_entry_online', 'M_FS_KK_BUD_TRNSFR_ENTRY', 'Budget Transfer Entry Online', 'Enter budget transfers', 'accounting_procurement', false, NULL, 230),
('transfer_approver', 'M_FS_KK_TRNSFR_APPRVR', 'Transfer Approver', 'Approve budget transfers', 'accounting_procurement', false, NULL, 240),
('budget_inquiry_only', 'M_FS_KK_INQUIRY', 'Budget Inquiry Only', 'View budget data', 'accounting_procurement', false, NULL, 250),

-- General Ledger
('journal_entry_online', 'M_FS_GL_JRNL_ENTRY', 'Journal Entry Online', 'Enter general ledger journals', 'accounting_procurement', false, NULL, 260),
('journal_load', 'M_FS_GL_JRNL_LOAD', 'Journal Load', 'Load GL journal batches', 'accounting_procurement', false, NULL, 270),
('agency_chartfield_maintenance', 'M_FS_GL_AGENCY_CHARTFIELD', 'Agency Chartfield Maintenance', 'Maintain chartfield values', 'accounting_procurement', false, NULL, 280),
('gl_agency_approver', 'M_FS_GL_AGENCY_APPRVR', 'GL Agency Approver', 'Approve GL transactions', 'accounting_procurement', false, NULL, 290),
('general_ledger_inquiry_only', 'M_FS_GL_INQUIRY', 'General Ledger Inquiry Only', 'View GL data', 'accounting_procurement', false, NULL, 300),
('nvision_reporting_agency_user', 'M_FS_NVISION_AGENCY', 'nVision Reporting Agency User', 'Access nVision reports', 'accounting_procurement', false, NULL, 310)
ON CONFLICT (flag_key) DO UPDATE SET
  role_code = EXCLUDED.role_code,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  domain = EXCLUDED.domain,
  requires_route_controls = EXCLUDED.requires_route_controls,
  control_spec = EXCLUDED.control_spec,
  display_order = EXCLUDED.display_order,
  updated_at = now();

-- Step 3: Create view to join selections with role codes
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

-- Step 4: Create RPC function for MNIT Details page
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

-- Step 5: Grant permissions
GRANT EXECUTE ON FUNCTION public.mnit_details_payload(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.mnit_details_payload(uuid) TO authenticated;

-- Done! This will fix the missing role codes issue.
