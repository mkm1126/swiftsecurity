/*
  # Add EPM Data Warehouse Roles to Role Catalog

  1. Role Definitions
    - Adds 5 EPM Data Warehouse roles to the role_catalog table
    - Uses template pattern {AGENCY_CODE} for agency-specific roles
    - Static role code for Data Extracts (non-agency-specific)

  2. Role Code Templates
    - data_extracts → M_EPM_DATA_EXTRACTS (static)
    - basic_report_dev → M_EPM_{AGENCY_CODE}_BASIC_RPT_DEVELOPER (template)
    - advanced_report_dev → M_EPM_{AGENCY_CODE}_ADV_RPT_DEVELOPER (template)
    - dashboard_developer → M_EPM_{AGENCY_CODE}_DASHBOARD_DEVELOPER (template)
    - agency_administrator → M_EPM_{AGENCY_CODE}_AGY_ADMINISTRATOR (template)

  3. Template Substitution
    - The {AGENCY_CODE} placeholder is replaced at runtime with the actual agency code
    - Agency code comes from gw_agency_code field in security_role_selections
    - Format: uppercase, 3 characters (e.g., DOT, G02, MND)
    - Example: M_EPM_{AGENCY_CODE}_BASIC_RPT_DEVELOPER → M_EPM_DOT_BASIC_RPT_DEVELOPER

  4. Domain and Display
    - All EPM roles assigned to 'epm_data_warehouse' domain
    - Display order 200-210 to group EPM roles together
    - Displayed in separate section from accounting/procurement roles

  5. Notes
    - Corrects spelling: "Advanced Report Dev" (not "Advamced")
    - Uses ON CONFLICT to safely update existing entries
    - All roles set to active by default
*/

-- Insert EPM Data Warehouse roles into role_catalog
INSERT INTO public.role_catalog (
  flag_key,
  role_code,
  name,
  form_name,
  description,
  domain,
  display_order,
  active,
  is_active
) VALUES
  -- Table 1: Data Extracts (static role code)
  (
    'data_extracts',
    'M_EPM_DATA_EXTRACTS',
    'Data Extracts',
    'dataExtracts',
    'EPM Data Extract role. Provides access to staging tables only, not available in OBIEE.',
    'epm_data_warehouse',
    200,
    true,
    true
  ),

  -- Table 2: General Warehouse Roles (agency-specific templates)
  (
    'basic_report_dev',
    'M_EPM_{AGENCY_CODE}_BASIC_RPT_DEVELOPER',
    'Basic Report Developer',
    'gwBasicReportDev',
    'Agency-specific Basic Report Developer role. The {AGENCY_CODE} placeholder is replaced with the actual 3-character agency code (e.g., M_EPM_DOT_BASIC_RPT_DEVELOPER).',
    'epm_data_warehouse',
    201,
    true,
    true
  ),
  (
    'advanced_report_dev',
    'M_EPM_{AGENCY_CODE}_ADV_RPT_DEVELOPER',
    'Advanced Report Developer',
    'gwAdvancedReportDev',
    'Agency-specific Advanced Report Developer role. The {AGENCY_CODE} placeholder is replaced with the actual 3-character agency code (e.g., M_EPM_DOT_ADV_RPT_DEVELOPER).',
    'epm_data_warehouse',
    202,
    true,
    true
  ),
  (
    'dashboard_developer',
    'M_EPM_{AGENCY_CODE}_DASHBOARD_DEVELOPER',
    'Dashboard Developer',
    'gwDashboardDeveloper',
    'Agency-specific Dashboard Developer role. The {AGENCY_CODE} placeholder is replaced with the actual 3-character agency code (e.g., M_EPM_DOT_DASHBOARD_DEVELOPER).',
    'epm_data_warehouse',
    203,
    true,
    true
  ),
  (
    'agency_administrator',
    'M_EPM_{AGENCY_CODE}_AGY_ADMINISTRATOR',
    'Agency Administrator',
    'gwAgencyAdministrator',
    'Agency-specific Administrator role. Grants M_EPM_{AGENCY_CODE}_AGY_ADMINISTRATOR and M_EPM_AGY_ADMINISTRATOR. The {AGENCY_CODE} placeholder is replaced with the actual 3-character agency code (e.g., M_EPM_DOT_AGY_ADMINISTRATOR).',
    'epm_data_warehouse',
    204,
    true,
    true
  )
ON CONFLICT (flag_key) DO UPDATE SET
  role_code = EXCLUDED.role_code,
  name = EXCLUDED.name,
  form_name = EXCLUDED.form_name,
  description = EXCLUDED.description,
  domain = EXCLUDED.domain,
  display_order = EXCLUDED.display_order,
  active = EXCLUDED.active,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Add comments to document the template substitution pattern
COMMENT ON COLUMN public.role_catalog.role_code IS
  'SWIFT security role code. May contain {AGENCY_CODE} placeholder for agency-specific roles, which is replaced at runtime with the actual agency code from gw_agency_code field.';

-- Verify the EPM roles were added successfully
DO $$
DECLARE
  epm_role_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO epm_role_count
  FROM public.role_catalog
  WHERE domain = 'epm_data_warehouse';

  RAISE NOTICE 'EPM Data Warehouse roles added successfully. Total EPM roles: %', epm_role_count;
END $$;
