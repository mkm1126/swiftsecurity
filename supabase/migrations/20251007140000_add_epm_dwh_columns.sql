/*
  # Add EPM Data Warehouse Role Columns to Security Role Selections

  1. New Columns
    - Table 1: Data Extracts
      - `data_extracts` (boolean) - Data Extract (M_EPM_DATA_EXTRACTS) - staging tables only

    - Table 2: General Warehouse Roles
      - `gw_agency_code` (text) - 3-character agency code for agency-specific roles
      - `basic_report_dev` (boolean) - Agency Specific Basic Report Developer
      - `advanced_report_dev` (boolean) - Agency Specific Advanced Report Developer
      - `dashboard_developer` (boolean) - Agency Specific Dashboard Developer
      - `agency_administrator` (boolean) - Agency Specific Administrator

    - Table 3: FMS (Accounting/Procurement)
      - `fms_lookup` (boolean) - M_EPM_FSCM_LOOKUP (required for FMS roles)
      - `year_end_financial_reporting` (boolean) - Year-End Financial Reporting Data

    - Table 4: ELM Warehouse
      - `elm_warehouse_report` (boolean) - M_EPM_ELM_REPORT

    - Table 5: HR/Payroll (SEMA4)
      - `hcm_lookup` (boolean) - M_EPM_HCM_LOOKUP (required for any HR/Payroll roles)
      - `payroll_funding_salary_fte` (boolean) - Payroll Funding Salary FTE (Salary Projections)
      - `payroll_paycheck_info` (boolean) - Payroll Paycheck Information
      - `private_by_department` (boolean) - HR Private Data by Department
      - `payroll_self_service_data` (boolean) - Payroll Self Service (SS) Data
      - `statewide_data` (boolean) - HR Statewide Data
      - `recruiting_solutions_data` (boolean) - Recruiting Solutions (RS) Data
      - `labor_distribution` (boolean) - Labor Distribution

    - Table 6: Restricted HR/Payroll Warehouse Roles
      - `ssn_view` (boolean) - SSN View (strictly limited access)
      - `payroll_deductions` (boolean) - Payroll Deductions (strictly limited access)
      - `data_excluded_employees` (boolean) - HR Data for Excluded Employees (strictly limited)

    - Table 7: Reporting & Planning System (RAPS)
      - `raps_bi_author` (boolean) - BI Author (required for all RAPS users)
      - `raps_hcm_lookup` (boolean) - M_EPM_HCM_LOOKUP (required for all RAPS users)
      - `raps_link` (boolean) - M_RAPS_LINK (includes private data)

  2. Role Code Mappings
    - data_extracts: M_EPM_DATA_EXTRACTS
    - fms_lookup: M_EPM_FSCM_LOOKUP
    - elm_warehouse_report: M_EPM_ELM_REPORT
    - hcm_lookup: M_EPM_HCM_LOOKUP
    - raps_link: M_RAPS_LINK

  3. Notes
    - These columns correspond to roles defined in EpmDwhRoleSelectionPage.tsx
    - The strip2() function removes 2-character prefixes (gw_, hr_, fms_, etc.) from field names
    - hcm_lookup is automatically added when any HR/Payroll roles are selected
    - RAPS roles (raps_bi_author, raps_hcm_lookup) default to true when RAPS access requested
    - All columns default to false to maintain data integrity
    - gw_agency_code is limited to 3 characters and stored uppercase

  4. Security
    - All new columns inherit existing RLS policies from security_role_selections table
    - No additional policies required
    - Restricted roles (SSN View, Payroll Deductions, Excluded Employee Data) require special approval
*/

-- Table 1: Data Extracts
ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS data_extracts boolean DEFAULT false;

-- Table 2: General Warehouse Roles
ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS gw_agency_code text;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS basic_report_dev boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS advanced_report_dev boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS dashboard_developer boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS agency_administrator boolean DEFAULT false;

-- Table 3: FMS (Accounting/Procurement)
ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS fms_lookup boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS year_end_financial_reporting boolean DEFAULT false;

-- Table 4: ELM Warehouse
ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS elm_warehouse_report boolean DEFAULT false;

-- Table 5: HR/Payroll (SEMA4)
ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS hcm_lookup boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS payroll_funding_salary_fte boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS payroll_paycheck_info boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS private_by_department boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS payroll_self_service_data boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS statewide_data boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS recruiting_solutions_data boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS labor_distribution boolean DEFAULT false;

-- Table 6: Restricted HR/Payroll Warehouse Roles
ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS ssn_view boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS payroll_deductions boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS data_excluded_employees boolean DEFAULT false;

-- Table 7: Reporting & Planning System (RAPS)
ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS raps_bi_author boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS raps_hcm_lookup boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS raps_link boolean DEFAULT false;

-- Create indexes for better query performance on EPM/DWH roles
CREATE INDEX IF NOT EXISTS idx_security_role_selections_epm_dwh_roles
  ON public.security_role_selections(
    data_extracts,
    fms_lookup,
    elm_warehouse_report,
    hcm_lookup,
    raps_link
  );

-- Add comments to document role categories and restrictions
COMMENT ON COLUMN public.security_role_selections.data_extracts IS
  'EPM Data Extract role (M_EPM_DATA_EXTRACTS). Provides access to staging tables only, not available in OBIEE.';

COMMENT ON COLUMN public.security_role_selections.gw_agency_code IS
  'Three-character agency code used for General Warehouse agency-specific roles. Stored in uppercase.';

COMMENT ON COLUMN public.security_role_selections.fms_lookup IS
  'M_EPM_FSCM_LOOKUP role. Required for users needing FMS (Accounting/Procurement) data access.';

COMMENT ON COLUMN public.security_role_selections.elm_warehouse_report IS
  'M_EPM_ELM_REPORT role. Provides access to Enterprise Learning Management warehouse data.';

COMMENT ON COLUMN public.security_role_selections.hcm_lookup IS
  'M_EPM_HCM_LOOKUP role. Required for any HR/Payroll data access. Automatically added when HR/Payroll roles selected.';

COMMENT ON COLUMN public.security_role_selections.ssn_view IS
  'RESTRICTED: SSN View access. Strictly limited and requires special approval. Part of Restricted HR/Payroll Warehouse Roles.';

COMMENT ON COLUMN public.security_role_selections.payroll_deductions IS
  'RESTRICTED: Payroll Deductions access. Strictly limited and requires special approval. Part of Restricted HR/Payroll Warehouse Roles.';

COMMENT ON COLUMN public.security_role_selections.data_excluded_employees IS
  'RESTRICTED: HR Data for Excluded Employees. Strictly limited and requires special approval. Part of Restricted HR/Payroll Warehouse Roles.';

COMMENT ON COLUMN public.security_role_selections.raps_bi_author IS
  'RAPS: BI Author role. Required for all RAPS (Reporting & Planning System) users.';

COMMENT ON COLUMN public.security_role_selections.raps_hcm_lookup IS
  'RAPS: M_EPM_HCM_LOOKUP role. Required for all RAPS users.';

COMMENT ON COLUMN public.security_role_selections.raps_link IS
  'RAPS: M_RAPS_LINK role. Includes access to private data. Required for RAPS access.';
