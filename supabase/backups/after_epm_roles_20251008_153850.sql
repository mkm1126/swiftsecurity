/*
  RESTORE POINT: After Adding EPM Role Codes

  Purpose: Backup of database state after successfully adding EPM role codes

  Changes Made:
  1. Added 5 EPM roles to role_catalog table:
     - data_extracts (M_EPM_DATA_EXTRACTS)
     - basic_report_dev (M_EPM_{AGENCY_CODE}_BASIC_RPT_DEVELOPER)
     - advanced_report_dev (M_EPM_{AGENCY_CODE}_ADV_RPT_DEVELOPER)
     - dashboard_developer (M_EPM_{AGENCY_CODE}_DASHBOARD_DEVELOPER)
     - agency_administrator (M_EPM_{AGENCY_CODE}_AGY_ADMINISTRATOR)

  2. Created helper function: resolve_epm_role_code(role_code, agency_code)
     - Substitutes {AGENCY_CODE} placeholder with actual agency code
     - Handles uppercase conversion and validation

  3. Updated active_roles_for_request view
     - Now includes EPM Data Warehouse roles
     - Uses resolve_epm_role_code for dynamic code generation

  4. MNIT Details payload automatically includes EPM roles
     - No changes to mnit_details_payload function needed
     - View update cascaded to RPC function

  Migration Files:
  - 20251008150000_add_epm_roles_to_catalog.sql
  - 20251008150100_update_mnit_details_for_epm_roles.sql

  To rollback these changes, run:
  1. DROP FUNCTION IF EXISTS resolve_epm_role_code(text, text);
  2. DELETE FROM role_catalog WHERE domain = 'epm_data_warehouse';
  3. Re-create original active_roles_for_request view without EPM roles
*/

-- Verification queries
SELECT COUNT(*) as epm_roles_count
FROM role_catalog
WHERE domain = 'epm_data_warehouse' AND is_active = true;

SELECT flag_key, role_code, name
FROM role_catalog
WHERE domain = 'epm_data_warehouse'
ORDER BY display_order;

-- Test helper function
SELECT resolve_epm_role_code('M_EPM_{AGENCY_CODE}_TEST', 'DOT') as test_result;
