-- ============================================================================
-- MIGRATION: Copy data from OLD database to NEW database
-- ============================================================================
-- Instructions:
-- 1. First, enable dblink extension in NEW database if not already enabled:
--    CREATE EXTENSION IF NOT EXISTS dblink;
-- 2. Replace YOUR_OLD_DB_PASSWORD with actual password
-- 3. Run this in NEW database: https://supabase.com/dashboard/project/aciuwjjucrfzhdhqmixk/sql
-- ============================================================================

-- NOTE: This script is in supabase/tmp (not migrations) because it's a one-time
-- data migration, not a schema change

-- Step 1: Migrate access_requests table
INSERT INTO access_requests (
  id, created_at, updated_at, start_date, employee_name, employee_id,
  is_non_employee, work_location, work_phone, email, agency_name, agency_code,
  justification, submitter_name, submitter_email, supervisor_name, supervisor_email,
  security_admin_name, security_admin_email, status, poc_user, completed_by,
  completed_at, hr_mainframe_logon_id
)
SELECT
  id, created_at, updated_at, start_date, employee_name, employee_id,
  is_non_employee, work_location, work_phone, email, agency_name, agency_code,
  justification, submitter_name, submitter_email, supervisor_name, supervisor_email,
  security_admin_name, security_admin_email, status, poc_user, completed_by,
  completed_at, hr_mainframe_logon_id
FROM dblink(
  'dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
  'SELECT id, created_at, updated_at, start_date, employee_name, employee_id,
          is_non_employee, work_location, work_phone, email, agency_name, agency_code,
          justification, submitter_name, submitter_email, supervisor_name, supervisor_email,
          security_admin_name, security_admin_email, status, poc_user, completed_by,
          completed_at, hr_mainframe_logon_id
   FROM access_requests'
) AS t(
  id uuid, created_at timestamptz, updated_at timestamptz, start_date date,
  employee_name text, employee_id text, is_non_employee boolean, work_location text,
  work_phone text, email text, agency_name text, agency_code char,
  justification text, submitter_name text, submitter_email text,
  supervisor_name text, supervisor_email text, security_admin_name text,
  security_admin_email text, status text, poc_user text, completed_by text,
  completed_at timestamptz, hr_mainframe_logon_id text
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Migrate security_role_selections to role_selections
-- Map old boolean columns to new role_code structure
INSERT INTO role_selections (request_id, role_code, details, created_at)
SELECT request_id, role_code, details, created_at FROM (
  -- Accounting & Procurement roles
  SELECT request_id, 'VOUCHER_ENTRY' as role_code, NULL::jsonb as details, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE voucher_entry = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'VOUCHER_BUILD_ERRORS' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE maintenance_voucher_build_errors = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'MATCH_OVERRIDE' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE match_override = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'AP_INQUIRY' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE ap_inquiry_only = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'CASH_MAINTENANCE' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE cash_maintenance = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'RECEIVABLE_SPECIALIST' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE receivable_specialist = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'RECEIVABLE_SUPERVISOR' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE receivable_supervisor = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'BILLING_CREATE' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE billing_create = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'BILLING_SPECIALIST' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE billing_specialist = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'BILLING_SUPERVISOR' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE billing_supervisor = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'CUSTOMER_MAINTENANCE' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE customer_maintenance_specialist = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'AR_BILLING_SETUP' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE ar_billing_setup = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'AR_BILLING_INQUIRY' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE ar_billing_inquiry_only = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'CASH_MGMT_INQUIRY' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE cash_management_inquiry_only = true')
  AS t(request_id uuid, created_at timestamptz)

  -- Budget roles
  UNION ALL
  SELECT request_id, 'BUDGET_JOURNAL_ENTRY' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE budget_journal_entry_online = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'BUDGET_JOURNAL_LOAD' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE budget_journal_load = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'BUDGET_JOURNAL_APPROVER' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE journal_approver = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'BUDGET_TRANSFER_ENTRY' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE budget_transfer_entry_online = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'BUDGET_TRANSFER_APPROVER' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE transfer_approver = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'BUDGET_INQUIRY' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE budget_inquiry_only = true')
  AS t(request_id uuid, created_at timestamptz)

  -- General Ledger roles
  UNION ALL
  SELECT request_id, 'GL_JOURNAL_ENTRY' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE journal_entry_online = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'GL_JOURNAL_LOAD' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE journal_load = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'GL_CHARTFIELD_MAINT' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE agency_chartfield_maintenance = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'GL_AGENCY_APPROVER' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE gl_agency_approver = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'GL_INQUIRY' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE general_ledger_inquiry_only = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'NVISION_AGENCY_USER' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE nvision_reporting_agency_user = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'DAILY_RECEIPTS_REPORT' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE needs_daily_receipts_report = true')
  AS t(request_id uuid, created_at timestamptz)

  -- Grants Management roles
  UNION ALL
  SELECT request_id, 'GM_AWARD_ENTRY' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE award_data_entry = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'GM_FISCAL_MANAGER' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE grant_fiscal_manager = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'GM_PROGRAM_MANAGER' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE program_manager = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'GM_AGENCY_SETUP' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE gm_agency_setup = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'GM_INQUIRY' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE grants_inquiry_only = true')
  AS t(request_id uuid, created_at timestamptz)

  -- Project Costing roles
  UNION ALL
  SELECT request_id, 'PC_FEDERAL_INITIATOR' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE federal_project_initiator = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'PC_OIM_INITIATOR' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE oim_initiator = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'PC_PROJECT_INITIATOR' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE project_initiator = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'PC_PROJECT_MANAGER' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE project_manager = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'PC_CAPITAL_PROGRAMS' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE capital_programs_office = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'PC_COST_ACCOUNTANT' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE project_cost_accountant = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'PC_FIXED_ASSET' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE project_fixed_asset = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'PC_CATEGORY_MANAGER' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE category_subcategory_manager = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'PC_CONTROL_DATES' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE project_control_dates = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'PC_ACCOUNTING_SYSTEMS' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE project_accounting_systems = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'PC_MNDOT_INQUIRY' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE mndot_projects_inquiry = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'PC_INQUIRY' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE projects_inquiry_only = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'PC_MNDOT_APPROVER' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE mndot_project_approver = true')
  AS t(request_id uuid, created_at timestamptz)

  -- Cost Allocation & Asset Management roles
  UNION ALL
  SELECT request_id, 'COST_ALLOC_INQUIRY' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE cost_allocation_inquiry_only = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'AM_FINANCIAL_ACCOUNTANT' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE financial_accountant_assets = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'AM_INQUIRY' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE asset_management_inquiry_only = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'AM_INVENTORY_APPROVER_1' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE physical_inventory_approval_1 = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'AM_INVENTORY_APPROVER_2' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE physical_inventory_approval_2 = true')
  AS t(request_id uuid, created_at timestamptz)

  -- ELM roles
  UNION ALL
  SELECT request_id, 'ELM_SYSTEM_ADMIN' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE elm_system_administrator = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_KEY_ADMIN' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE elm_key_administrator = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_COURSE_ADMIN' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE elm_course_administrator = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_REPORTING_ADMIN' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE elm_reporting_administrator = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_CREATE_COURSES' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE create_courses = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_EDIT_COURSES' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE edit_courses = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_DELETE_COURSES' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE delete_courses = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_MANAGE_CONTENT' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE manage_course_content = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_MANAGE_USERS' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE manage_user_accounts = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_ASSIGN_ROLES' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE assign_user_roles = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_VIEW_PROGRESS' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE view_user_progress = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_GENERATE_REPORTS' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE generate_user_reports = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_SYSTEM_REPORTS' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE access_system_reports = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_CUSTOM_REPORTS' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE create_custom_reports = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_EXPORT_DATA' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE export_report_data = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_ANALYTICS' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE view_analytics_dashboard = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_CREATE_PATHS' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE create_learning_paths = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_EDIT_PATHS' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE edit_learning_paths = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_ASSIGN_PATHS' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE assign_learning_paths = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_TRACK_PROGRESS' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE track_learning_progress = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_MANAGE_CERTS' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE manage_certifications = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_ISSUE_CERTS' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE issue_certificates = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_TRACK_CERTS' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE track_certification_status = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_RENEW_CERTS' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE renew_certifications = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_SYSTEM_CONFIG' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE configure_system_settings = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_INTEGRATIONS' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE manage_integrations = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_NOTIFICATIONS' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE setup_notifications = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_SECURITY' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE manage_security_settings = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_BULK_OPS' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE bulk_user_operations = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_DATA_IMPORT_EXPORT' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE data_import_export = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_BACKUP' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE system_backup_access = true')
  AS t(request_id uuid, created_at timestamptz)

  UNION ALL
  SELECT request_id, 'ELM_AUDIT_LOG' as role_code, NULL::jsonb, created_at
  FROM dblink('dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=YOUR_OLD_DB_PASSWORD',
    'SELECT request_id, created_at FROM security_role_selections WHERE audit_log_access = true')
  AS t(request_id uuid, created_at timestamptz)
) AS all_roles
ON CONFLICT (request_id, role_code) DO NOTHING;

-- Summary queries
SELECT COUNT(*) as total_access_requests_migrated FROM access_requests;
SELECT COUNT(*) as total_role_selections_migrated FROM role_selections;
SELECT role_code, COUNT(*) as count FROM role_selections GROUP BY role_code ORDER BY count DESC LIMIT 20;
