-- Run this in NEW database to check what columns exist in OLD database

CREATE EXTENSION IF NOT EXISTS dblink;

-- Check columns in old access_requests table
SELECT * FROM dblink(
  'dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=Mucfrev@9xe',
  'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ''access_requests'' ORDER BY ordinal_position'
) AS t(column_name text, data_type text);

-- Check columns in old security_role_selections table
SELECT * FROM dblink(
  'dbname=postgres host=db.lyzcqbbfmgtxieytskrf.supabase.co port=5432 user=postgres password=Mucfrev@9xe',
  'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ''security_role_selections'' ORDER BY ordinal_position'
) AS t(column_name text, data_type text);
