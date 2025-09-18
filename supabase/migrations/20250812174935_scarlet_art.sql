/*
  # Add missing AP fields to security_role_selections table

  1. New Columns
    - `ap_inquiry_only` (boolean, default false)
    - `ap_voucher_approver_1` (boolean, default false) 
    - `ap_voucher_approver_2` (boolean, default false)
    - `ap_voucher_approver_3` (boolean, default false)
    - `ap_voucher_approver_1_route_controls` (text, nullable)
    - `ap_voucher_approver_2_route_controls` (text, nullable)
    - `ap_voucher_approver_3_route_controls` (text, nullable)

  2. Notes
    - These fields support additional AP functionality in the SelectRolesPage
    - All boolean fields default to false for consistency
    - Route control fields are text and nullable for flexibility
*/

-- Add missing AP fields to security_role_selections table
DO $$
BEGIN
  -- Add ap_inquiry_only if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'security_role_selections' AND column_name = 'ap_inquiry_only'
  ) THEN
    ALTER TABLE security_role_selections ADD COLUMN ap_inquiry_only boolean DEFAULT false;
  END IF;

  -- Add ap_voucher_approver_1 if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'security_role_selections' AND column_name = 'ap_voucher_approver_1'
  ) THEN
    ALTER TABLE security_role_selections ADD COLUMN ap_voucher_approver_1 boolean DEFAULT false;
  END IF;

  -- Add ap_voucher_approver_2 if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'security_role_selections' AND column_name = 'ap_voucher_approver_2'
  ) THEN
    ALTER TABLE security_role_selections ADD COLUMN ap_voucher_approver_2 boolean DEFAULT false;
  END IF;

  -- Add ap_voucher_approver_3 if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'security_role_selections' AND column_name = 'ap_voucher_approver_3'
  ) THEN
    ALTER TABLE security_role_selections ADD COLUMN ap_voucher_approver_3 boolean DEFAULT false;
  END IF;

  -- Add ap_voucher_approver_1_route_controls if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'security_role_selections' AND column_name = 'ap_voucher_approver_1_route_controls'
  ) THEN
    ALTER TABLE security_role_selections ADD COLUMN ap_voucher_approver_1_route_controls text;
  END IF;

  -- Add ap_voucher_approver_2_route_controls if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'security_role_selections' AND column_name = 'ap_voucher_approver_2_route_controls'
  ) THEN
    ALTER TABLE security_role_selections ADD COLUMN ap_voucher_approver_2_route_controls text;
  END IF;

  -- Add ap_voucher_approver_3_route_controls if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'security_role_selections' AND column_name = 'ap_voucher_approver_3_route_controls'
  ) THEN
    ALTER TABLE security_role_selections ADD COLUMN ap_voucher_approver_3_route_controls text;
  END IF;
END $$;