-- ============================================================================
-- DIAGNOSTIC: Check access_requests table structure in OLD database
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

-- Sample a few rows to see the data
SELECT * FROM access_requests LIMIT 5;

-- Count total rows
SELECT COUNT(*) as total_access_requests FROM access_requests;
