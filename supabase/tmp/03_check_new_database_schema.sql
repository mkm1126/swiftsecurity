-- ============================================================================
-- DIAGNOSTIC: Check NEW database schema
-- ============================================================================
-- Run this in NEW database: https://supabase.com/dashboard/project/aciuwjjucrfzhdhqmixk/sql
-- ============================================================================

-- Check security_role_requests table structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'security_role_requests'
ORDER BY ordinal_position;
