/*
  # Add Status Column to Request Approvals

  1. Changes
    - Add `status` column to `request_approvals` table
    - Default status is 'pending'
    - Allows tracking of approval workflow states

  2. Notes
    - This column is required by the frontend RequestListPage
    - Status values: 'pending', 'approved', 'rejected'
*/

-- Add status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'request_approvals' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.request_approvals
    ADD COLUMN status text DEFAULT 'pending';
  END IF;
END $$;
