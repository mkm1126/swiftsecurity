-- Run this in OLD database SQL Editor to see what tables and data we need to migrate
-- URL: https://supabase.com/dashboard/project/lyzcqbbfmgtxieytskrf/sql

-- 1. List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Count rows in each table
SELECT
  'access_requests' as table_name,
  COUNT(*) as row_count
FROM access_requests
UNION ALL
SELECT 'security_role_selections', COUNT(*) FROM security_role_selections
UNION ALL
SELECT 'role_catalog', COUNT(*) FROM role_catalog;

-- 3. Get sample of access_requests to understand structure
SELECT * FROM access_requests LIMIT 5;

-- 4. Get sample of security_role_selections
SELECT * FROM security_role_selections LIMIT 5;

-- 5. Check for any other tables we might be missing
SELECT
  schemaname,
  tablename,
  rowcount
FROM pg_catalog.pg_tables t
LEFT JOIN (
  SELECT
    schemaname,
    tablename,
    n_tup_ins - n_tup_del as rowcount
  FROM pg_stat_user_tables
) s USING (schemaname, tablename)
WHERE schemaname = 'public'
ORDER BY tablename;
