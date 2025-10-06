-- ============================================================================
-- DIAGNOSTIC: Check what columns exist in OLD database
-- ============================================================================
-- Run this in OLD database: https://supabase.com/dashboard/project/lyzcqbbfmgtxieytskrf/sql
-- ============================================================================

-- Check access_requests table structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'access_requests'
ORDER BY ordinal_position;

-- Check security_role_selections table structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'security_role_selections'
ORDER BY ordinal_position;

-- Count rows
SELECT
  'access_requests' as table_name,
  COUNT(*) as row_count
FROM access_requests
UNION ALL
SELECT
  'security_role_selections',
  COUNT(*)
FROM security_role_selections;
