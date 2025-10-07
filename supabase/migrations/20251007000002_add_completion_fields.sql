/*
  # Add completion tracking fields to security_role_requests

  1. Changes
    - Add `completed_by` column to track who completed the request
    - Add `completed_at` column to track when the request was completed
    - Both columns are nullable since existing requests may not be completed

  2. Notes
    - These fields are used to track the final completion of a request
    - Only populated when a request status is set to 'completed'
*/

DO $$
BEGIN
  -- Add completed_by column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'security_role_requests' AND column_name = 'completed_by'
  ) THEN
    ALTER TABLE security_role_requests ADD COLUMN completed_by text;
  END IF;

  -- Add completed_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'security_role_requests' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE security_role_requests ADD COLUMN completed_at timestamptz;
  END IF;
END $$;
