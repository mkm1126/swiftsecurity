-- ============================================================================
-- SETUP NEW DATABASE (zbhivvrmejywmqdhjyqj)
-- ============================================================================
-- This script sets up the complete schema for the security role request system
-- Run this in the SQL Editor of your NEW Supabase database
-- ============================================================================

-- Step 1: Create all tables with proper structure
-- Based on: 20251006175659_create_base_schema.sql

CREATE TABLE IF NOT EXISTS public.security_role_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Employee Details
  start_date date NOT NULL,
  employee_name text NOT NULL,
  employee_id text,
  is_non_employee boolean DEFAULT false,
  work_location text,
  work_phone text,
  email text NOT NULL,
  agency_name text NOT NULL,
  agency_code text NOT NULL,
  justification text,

  -- Submitter Details
  submitter_name text NOT NULL,
  submitter_email text NOT NULL,

  -- Approver Details
  supervisor_name text,
  supervisor_username text,
  security_admin_name text,
  security_admin_username text,

  -- Security Area
  security_area text,

  -- Additional Directors/Admins
  accounting_director text,
  accounting_director_username text,
  hr_mainframe_logon_id text,
  hr_view_statewide boolean DEFAULT false,
  elm_key_admin text,
  elm_key_admin_username text,
  elm_director text,
  elm_director_email text,
  hr_director text,
  hr_director_email text,

  -- Copy User
  copy_from_user boolean DEFAULT false,
  copy_user_name text,
  copy_user_employee_id text,
  copy_user_sema4_id text,

  -- Non-Employee
  non_employee_type text,
  access_end_date date,
  security_measures text,

  -- Status
  status text DEFAULT 'draft'
);

CREATE TABLE IF NOT EXISTS public.security_role_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.security_role_requests(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Business Units
  home_business_unit text,
  other_business_units text,

  -- Accounts Payable
  voucher_entry boolean DEFAULT false,
  voucher_approver_1 text,
  voucher_approver_2 text,
  voucher_approver_3 text,
  maintenance_voucher_build_errors boolean DEFAULT false,
  match_override boolean DEFAULT false,
  ap_inquiry_only boolean DEFAULT false,
  ap_workflow_approver boolean DEFAULT false,
  ap_workflow_route_controls text,
  ap_voucher_approver_1 boolean DEFAULT false,
  ap_voucher_approver_2 boolean DEFAULT false,
  ap_voucher_approver_3 boolean DEFAULT false,
  ap_voucher_approver_1_route_controls text,
  ap_voucher_approver_2_route_controls text,
  ap_voucher_approver_3_route_controls text,

  -- Accounts Receivable and Cash Management
  cash_maintenance boolean DEFAULT false,
  receivable_specialist boolean DEFAULT false,
  receivable_supervisor boolean DEFAULT false,
  writeoff_approval_business_units text,
  billing_create boolean DEFAULT false,
  billing_specialist boolean DEFAULT false,
  billing_supervisor boolean DEFAULT false,
  credit_invoice_approval_business_units text,
  customer_maintenance_specialist boolean DEFAULT false,
  ar_billing_setup boolean DEFAULT false,
  ar_billing_inquiry_only boolean DEFAULT false,
  cash_management_inquiry_only boolean DEFAULT false,

  -- Budgets
  budget_journal_entry_online boolean DEFAULT false,
  budget_journal_load boolean DEFAULT false,
  journal_approver boolean DEFAULT false,
  journal_approver_appr boolean DEFAULT false,
  journal_approver_rev boolean DEFAULT false,
  appropriation_sources text,
  expense_budget_source text,
  revenue_budget_source text,
  budget_transfer_entry_online boolean DEFAULT false,
  transfer_approver boolean DEFAULT false,
  transfer_appropriation_sources text,
  budget_inquiry_only boolean DEFAULT false,

  -- General Ledger
  journal_entry_online boolean DEFAULT false,
  journal_load boolean DEFAULT false,
  agency_chartfield_maintenance boolean DEFAULT false,
  gl_agency_approver boolean DEFAULT false,
  gl_agency_approver_sources text,
  general_ledger_inquiry_only boolean DEFAULT false,
  nvision_reporting_agency_user boolean DEFAULT false,
  needs_daily_receipts_report boolean DEFAULT false,

  -- Grants
  award_data_entry boolean DEFAULT false,
  grant_fiscal_manager boolean DEFAULT false,
  program_manager boolean DEFAULT false,
  gm_agency_setup boolean DEFAULT false,
  grants_inquiry_only boolean DEFAULT false,

  -- Project Costing
  federal_project_initiator boolean DEFAULT false,
  oim_initiator boolean DEFAULT false,
  project_initiator boolean DEFAULT false,
  project_manager boolean DEFAULT false,
  capital_programs_office boolean DEFAULT false,
  project_cost_accountant boolean DEFAULT false,
  project_fixed_asset boolean DEFAULT false,
  category_subcategory_manager boolean DEFAULT false,
  project_control_dates boolean DEFAULT false,
  project_accounting_systems boolean DEFAULT false,
  mndot_projects_inquiry boolean DEFAULT false,
  projects_inquiry_only boolean DEFAULT false,
  mndot_project_approver boolean DEFAULT false,
  route_control text,

  -- Cost Allocation
  cost_allocation_inquiry_only boolean DEFAULT false,

  -- Asset Management
  financial_accountant_assets boolean DEFAULT false,
  asset_management_inquiry_only boolean DEFAULT false,
  physical_inventory_approval_1 boolean DEFAULT false,
  physical_inventory_business_units text,
  physical_inventory_approval_2 boolean DEFAULT false,
  physical_inventory_department_ids text,

  -- Inventory
  inventory_express_issue boolean DEFAULT false,
  inventory_adjustment_approver boolean DEFAULT false,
  inventory_replenishment_buyer boolean DEFAULT false,
  inventory_control_worker boolean DEFAULT false,
  inventory_express_putaway boolean DEFAULT false,
  inventory_fulfillment_specialist boolean DEFAULT false,
  inventory_po_receiver boolean DEFAULT false,
  inventory_returns_receiver boolean DEFAULT false,
  inventory_cost_adjustment boolean DEFAULT false,
  inventory_materials_manager boolean DEFAULT false,
  inventory_delivery boolean DEFAULT false,
  inventory_inquiry_only boolean DEFAULT false,
  inventory_configuration_agency boolean DEFAULT false,
  inventory_pick_plan_report_distribution boolean DEFAULT false,
  ship_to_location text,
  inventory_business_units text,

  -- Approval
  supervisor_approval boolean DEFAULT false,

  -- JSON storage for flexible data
  role_selection_json jsonb
);

CREATE TABLE IF NOT EXISTS public.security_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.security_role_requests(id) ON DELETE CASCADE,
  area_type text NOT NULL,
  director_email text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.request_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.security_role_requests(id) ON DELETE CASCADE,
  step text NOT NULL,
  approver_email text NOT NULL,
  status text DEFAULT 'pending',
  approved_at timestamptz,
  comments text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(request_id, step)
);

CREATE TABLE IF NOT EXISTS public.role_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key text UNIQUE NOT NULL,
  role_code text,
  name text NOT NULL,
  form_name text,
  ps_name text,
  description text,
  domain text,
  requires_route_controls boolean DEFAULT false,
  control_spec jsonb,
  display_order integer,
  active boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 2: Enable Row Level Security
ALTER TABLE public.security_role_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_role_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_catalog ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS Policies (Public access for now)
DROP POLICY IF EXISTS "Allow public read access to requests" ON public.security_role_requests;
CREATE POLICY "Allow public read access to requests"
  ON public.security_role_requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert to requests" ON public.security_role_requests;
CREATE POLICY "Allow public insert to requests"
  ON public.security_role_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to requests" ON public.security_role_requests;
CREATE POLICY "Allow public update to requests"
  ON public.security_role_requests FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete to requests" ON public.security_role_requests;
CREATE POLICY "Allow public delete to requests"
  ON public.security_role_requests FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read access to selections" ON public.security_role_selections;
CREATE POLICY "Allow public read access to selections"
  ON public.security_role_selections FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert to selections" ON public.security_role_selections;
CREATE POLICY "Allow public insert to selections"
  ON public.security_role_selections FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to selections" ON public.security_role_selections;
CREATE POLICY "Allow public update to selections"
  ON public.security_role_selections FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete to selections" ON public.security_role_selections;
CREATE POLICY "Allow public delete to selections"
  ON public.security_role_selections FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read access to areas" ON public.security_areas;
CREATE POLICY "Allow public read access to areas"
  ON public.security_areas FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert to areas" ON public.security_areas;
CREATE POLICY "Allow public insert to areas"
  ON public.security_areas FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to areas" ON public.security_areas;
CREATE POLICY "Allow public update to areas"
  ON public.security_areas FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete to areas" ON public.security_areas;
CREATE POLICY "Allow public delete to areas"
  ON public.security_areas FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read access to approvals" ON public.request_approvals;
CREATE POLICY "Allow public read access to approvals"
  ON public.request_approvals FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert to approvals" ON public.request_approvals;
CREATE POLICY "Allow public insert to approvals"
  ON public.request_approvals FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to approvals" ON public.request_approvals;
CREATE POLICY "Allow public update to approvals"
  ON public.request_approvals FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public read access to role catalog" ON public.role_catalog;
CREATE POLICY "Allow public read access to role catalog"
  ON public.role_catalog FOR SELECT USING (true);

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_security_role_selections_request_id
  ON public.security_role_selections(request_id);
CREATE INDEX IF NOT EXISTS idx_security_areas_request_id
  ON public.security_areas(request_id);
CREATE INDEX IF NOT EXISTS idx_request_approvals_request_id
  ON public.request_approvals(request_id);
CREATE INDEX IF NOT EXISTS idx_role_catalog_flag_key
  ON public.role_catalog(flag_key);
CREATE INDEX IF NOT EXISTS idx_role_catalog_domain
  ON public.role_catalog(domain);

-- ============================================================================
-- DONE! Schema is ready.
-- Next: Run the role catalog population script to add all the security roles.
-- ============================================================================
