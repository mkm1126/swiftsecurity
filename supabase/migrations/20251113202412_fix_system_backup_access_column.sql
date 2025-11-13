/*
  # Fix system_backup_access column schema cache issue

  1. Changes
    - Drop and recreate system_backup_access column to force PostgREST cache refresh
    - This is the nuclear option to fix persistent schema cache issues
  
  2. Notes
    - Column will be recreated with same type and default
    - Existing data will be preserved via backup and restore
*/

-- Backup existing data
DO $$
DECLARE
  backup_data jsonb;
BEGIN
  SELECT jsonb_object_agg(id::text, system_backup_access)
  INTO backup_data
  FROM security_role_selections
  WHERE system_backup_access = true;
  
  -- Store in a temp table
  CREATE TEMP TABLE IF NOT EXISTS system_backup_access_backup AS
  SELECT id, system_backup_access
  FROM security_role_selections
  WHERE system_backup_access = true;
END $$;

-- Drop the column
ALTER TABLE security_role_selections DROP COLUMN IF EXISTS system_backup_access;

-- Recreate the column
ALTER TABLE security_role_selections ADD COLUMN system_backup_access boolean DEFAULT false;

-- Restore data
UPDATE security_role_selections s
SET system_backup_access = b.system_backup_access
FROM system_backup_access_backup b
WHERE s.id = b.id;

-- Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
