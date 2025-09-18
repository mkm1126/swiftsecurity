/*
  # Add missing po_approver_route_controls field

  1. Changes
    - Add `po_approver_route_controls` column to `security_role_selections` table
    - Column is text type and nullable to match similar fields in the table

  2. Notes
    - Uses IF NOT EXISTS to prevent errors if column already exists
    - Maintains consistency with existing table structure
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'security_role_selections' AND column_name = 'po_approver_route_controls'
  ) THEN
    ALTER TABLE security_role_selections ADD COLUMN po_approver_route_controls text;
  END IF;
END $$;