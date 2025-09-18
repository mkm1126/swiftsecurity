-- Diagnostic SQL Query for MNIT Details Missing Role
-- Request ID: 538d150e-ce0b-4844-a8db-33f1d3c9df68
-- Missing: "Maintenance Voucher Build Errors" role_code

-- 1. Check what's in the security_role_selections table for this request
SELECT 'security_role_selections' as table_name, *
FROM security_role_selections 
WHERE request_id = '538d150e-ce0b-4844-a8db-33f1d3c9df68';

-- 2. Check what boolean fields are TRUE in the selections
SELECT 'true_boolean_fields' as analysis,
       column_name,
       data_type
FROM information_schema.columns 
WHERE table_name = 'security_role_selections' 
  AND data_type = 'boolean'
  AND column_name IN (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'security_role_selections' 
      AND data_type = 'boolean'
  )
ORDER BY column_name;

-- 3. Look for "Maintenance Voucher Build Errors" related entries in role_catalog
SELECT 'role_catalog_search' as table_name,
       flag_key,
       role_code,
       name,
       description,
       domain,
       is_active,
       requires_route_controls,
       control_spec
FROM role_catalog 
WHERE LOWER(name) LIKE '%maintenance%voucher%build%error%'
   OR LOWER(description) LIKE '%maintenance%voucher%build%error%'
   OR LOWER(flag_key) LIKE '%maintenance%voucher%'
   OR LOWER(flag_key) LIKE '%voucher%build%'
   OR flag_key LIKE '%maintenance_voucher_build_errors%';

-- 4. Check all role_catalog entries that might match common variations
SELECT 'role_catalog_variations' as table_name,
       flag_key,
       role_code,
       name,
       is_active,
       requires_route_controls
FROM role_catalog 
WHERE flag_key IN (
  'maintenance_voucher_build_errors',
  'voucher_build_errors',
  'maintenance_voucher_errors',
  'voucher_maintenance',
  'build_errors'
)
ORDER BY flag_key;

-- 5. Check the active_roles_for_request view for this specific request
SELECT 'active_roles_view' as table_name, *
FROM active_roles_for_request 
WHERE request_id = '538d150e-ce0b-4844-a8db-33f1d3c9df68'
ORDER BY domain, display_order;

-- 6. Check if the RPC function exists and what it returns
SELECT 'rpc_check' as analysis,
       routine_name,
       routine_type,
       data_type
FROM information_schema.routines 
WHERE routine_name = 'mnit_details_payload'
  AND routine_schema = 'public';

-- 7. Manual check of what boolean fields are actually TRUE for this request
WITH boolean_columns AS (
  SELECT column_name
  FROM information_schema.columns 
  WHERE table_name = 'security_role_selections' 
    AND data_type = 'boolean'
),
selection_data AS (
  SELECT *
  FROM security_role_selections 
  WHERE request_id = '538d150e-ce0b-4844-a8db-33f1d3c9df68'
)
SELECT 'true_fields_analysis' as analysis,
       'Check these TRUE boolean fields manually' as instruction;

-- 8. Check if there are any role_catalog entries that are inactive but should be active
SELECT 'inactive_roles_check' as table_name,
       flag_key,
       role_code,
       name,
       is_active,
       'This role exists but is marked inactive' as note
FROM role_catalog 
WHERE is_active = false
  AND (LOWER(name) LIKE '%voucher%' OR LOWER(name) LIKE '%maintenance%')
ORDER BY name;

-- 9. Check the exact structure of control_spec for roles that do have route controls
SELECT 'control_spec_examples' as table_name,
       flag_key,
       name,
       requires_route_controls,
       control_spec
FROM role_catalog 
WHERE requires_route_controls = true
  AND control_spec IS NOT NULL
LIMIT 5;

-- 10. Final comprehensive check - show ALL boolean fields and their values for this request
-- (You'll need to run this manually to see the actual TRUE/FALSE values)
-- SELECT * FROM security_role_selections WHERE request_id = '538d150e-ce0b-4844-a8db-33f1d3c9df68';