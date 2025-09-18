/*
  # Add missing fields to security_role_selections table

  1. New Columns
    - `po_approver` (boolean, default false)
    - `role_selection_json` (jsonb, nullable) - stores full form payload for future-proofing
  
  2. Security
    - No RLS changes needed as table already has RLS enabled
  
  3. Notes
    - Only adds columns that don't already exist in the table
    - Uses conditional logic to prevent errors if columns already exist
*/

-- Add po_approver boolean field if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'security_role_selections' AND column_name = 'po_approver'
  ) THEN
    ALTER TABLE security_role_selections ADD COLUMN po_approver boolean DEFAULT false;
  END IF;
END $$;

-- Add role_selection_json field if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'security_role_selections' AND column_name = 'role_selection_json'
  ) THEN
    ALTER TABLE security_role_selections ADD COLUMN role_selection_json jsonb;
  END IF;
END $$;