/*
  # Add HR/Payroll Role Columns

  1. New Columns
    - Agency/Department ID Access fields
      - `add_access_type` (text) - Type of access: 'agency' or 'department'
      - `agency_codes` (text) - Selected agency codes
      - `department_id` (text) - Department ID for department-based access
      - `prohibited_department_ids` (text) - Prohibited department IDs
      - `delete_access_codes` (text) - Access codes to delete

    - HR/Payroll SEMA4 Roles
      - `hr_data_entry` (boolean) - HR data entry access
      - `hr_data_inquiry` (boolean) - HR data inquiry access
      - `hr_supervisor` (boolean) - HR supervisor role
      - `hr_director` (boolean) - HR director role
      - `hr_statewide` (boolean) - HR statewide access

    - Human Resources Components – Administer Testing / Emergency / Employment / General
      - `admin_testing_all_correct` (boolean) - Administer Testing All-Correct
      - `admin_testing_enroll_update` (boolean) - Administer Testing Enroll-Update
      - `admin_testing_view_only` (boolean) - Administer Testing View only
      - `admin_testing_company_property_correct` (boolean) - Company Property Table Correct
      - `emergency_contact_update` (boolean) - Emergency Contact Update
      - `emergency_contact_view` (boolean) - Emergency Contact View
      - `employment_data_update` (boolean) - Employment Data Update
      - `general_data_correct` (boolean) - General Data Correct
      - `general_data_update` (boolean) - General Data Update
      - `general_data_view` (boolean) - General Data View

    - Payroll Components
      - `adjustments_retro_pay_update` (boolean) - Adjustments/RetroPay Update
      - `adjustments_retro_pay_view` (boolean) - Adjustments/RetroPay View
      - `adjustments_retro_pay_view_inquire` (boolean) - Adjustments/RetroPay View Inquire only
      - `balances_paycheck_view` (boolean) - Balances/Paycheck View only
      - `business_expense_update` (boolean) - Business Expense Update
      - `business_expense_view` (boolean) - Business Expense View
      - `business_expense_view_inquire` (boolean) - Business Expense View Inquire only
      - `direct_deposit_update_correct` (boolean) - Direct Deposit Update/Correct
      - `direct_deposit_view` (boolean) - Direct Deposit View
      - `dept_tbl_payroll_view` (boolean) - DeptTbl Payroll Access View only
      - `expense_transfers_update` (boolean) - Expense Transfers Update
      - `expense_transfers_view` (boolean) - Expense Transfers View
      - `expense_transfers_view_inquire` (boolean) - Expense Transfers View Inquire only
      - `garnishment_view` (boolean) - Garnishment View only
      - `labor_distribution_update` (boolean) - Labor Distribution Update
      - `labor_distribution_view` (boolean) - Labor Distribution View
      - `leave_update` (boolean) - Leave Update
      - `leave_view` (boolean) - Leave View
      - `mass_time_entry_update_correct` (boolean) - Mass Time Entry Update/Correct
      - `mass_time_entry_view` (boolean) - Mass Time Entry View
      - `payroll_data_update_correct` (boolean) - Payroll Data Update/Correct
      - `payroll_data_view` (boolean) - Payroll Data View
      - `schedules_update` (boolean) - Schedules Update
      - `schedules_view` (boolean) - Schedules View
      - `self_service_time_entry_admin` (boolean) - Self Service Time Entry Administrator
      - `self_service_time_entry_view` (boolean) - Self Service Time Entry View

    - Benefits Administration
      - `adjustments_bene_adm_base` (boolean) - Administrator Base Benefits
      - `adjustments_bene_adm_auto` (boolean) - Administrator Automated Benefits
      - `adjustments_bene_billing` (boolean) - Administrator Benefits Billings
      - `bene_aca_eligibility_update` (boolean) - Benefits ACA Eligibility Update/Correct
      - `mn_state_college_bene_reports` (boolean) - MN State Universities & Colleges Benefits Reports

    - Recruiting Solutions
      - `recruit_recruiter` (boolean) - Recruiter
      - `recruit_recruiter_limited` (boolean) - Recruiter-Limited
      - `recruit_affirmative_action` (boolean) - Affirmative Action Officer
      - `recruit_hiring_manager` (boolean) - Hiring Manager Proxy

  2. Security
    - All new columns have default values of false for boolean fields and null for text fields
    - No additional RLS policies needed as they inherit from existing table policies
*/

-- Agency/Department ID Access fields
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS add_access_type text;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS agency_codes text;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS department_id text;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS prohibited_department_ids text;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS delete_access_codes text;

-- HR/Payroll SEMA4 Roles
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS hr_data_entry boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS hr_data_inquiry boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS hr_supervisor boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS hr_director boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS hr_statewide boolean DEFAULT false;

-- Human Resources Components – Administer Testing / Emergency / Employment / General
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS admin_testing_all_correct boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS admin_testing_enroll_update boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS admin_testing_view_only boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS admin_testing_company_property_correct boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS emergency_contact_update boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS emergency_contact_view boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS employment_data_update boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS general_data_correct boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS general_data_update boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS general_data_view boolean DEFAULT false;

-- Payroll Components - Left Column
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS adjustments_retro_pay_update boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS adjustments_retro_pay_view boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS adjustments_retro_pay_view_inquire boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS balances_paycheck_view boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS business_expense_update boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS business_expense_view boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS business_expense_view_inquire boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS direct_deposit_update_correct boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS direct_deposit_view boolean DEFAULT false;

-- Payroll Components - Middle Column
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS dept_tbl_payroll_view boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS expense_transfers_update boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS expense_transfers_view boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS expense_transfers_view_inquire boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS garnishment_view boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS labor_distribution_update boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS labor_distribution_view boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS leave_update boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS leave_view boolean DEFAULT false;

-- Payroll Components - Right Column
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS mass_time_entry_update_correct boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS mass_time_entry_view boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS payroll_data_update_correct boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS payroll_data_view boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS schedules_update boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS schedules_view boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS self_service_time_entry_admin boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS self_service_time_entry_view boolean DEFAULT false;

-- Benefits Administration
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS adjustments_bene_adm_base boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS adjustments_bene_adm_auto boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS adjustments_bene_billing boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS bene_aca_eligibility_update boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS mn_state_college_bene_reports boolean DEFAULT false;

-- Recruiting Solutions
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS recruit_recruiter boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS recruit_recruiter_limited boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS recruit_affirmative_action boolean DEFAULT false;
ALTER TABLE security_role_selections ADD COLUMN IF NOT EXISTS recruit_hiring_manager boolean DEFAULT false;