/*
  RESTORE POINT: Before Adding EPM Role Codes

  Purpose: Backup of role_catalog state before adding EPM role codes

  To restore this state, remove the following EPM roles from role_catalog:
  - data_extracts
  - basic_report_dev
  - advanced_report_dev
  - dashboard_developer
  - agency_administrator

  Restoration Query:
  DELETE FROM role_catalog
  WHERE flag_key IN (
    'data_extracts',
    'basic_report_dev',
    'advanced_report_dev',
    'dashboard_developer',
    'agency_administrator'
  );
*/

-- Query to verify restoration
SELECT flag_key, role_code, name, domain, is_active
FROM role_catalog
WHERE domain = 'epm_data_warehouse'
ORDER BY display_order;
