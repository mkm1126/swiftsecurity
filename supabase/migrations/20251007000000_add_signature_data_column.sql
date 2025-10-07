/*
  # Add signature_data column to request_approvals

  1. Changes
    - Add `signature_data` column to `request_approvals` table to store signature information
    - Column is nullable to support existing records
    - Uses text type to store signature data (could be base64 image or text)

  2. Notes
    - This column stores the actual signature data when an approval is signed
    - Existing records without signatures will have NULL values
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'request_approvals' AND column_name = 'signature_data'
  ) THEN
    ALTER TABLE request_approvals ADD COLUMN signature_data text;
  END IF;
END $$;
