/*
  # Add director_name column to security_areas

  1. Changes
    - Add `director_name` column to `security_areas` table
    - Column is nullable to support existing records
    - Stores the name of the director for the security area

  2. Notes
    - This column complements the existing `director_email` column
    - Existing records will have NULL values for this column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'security_areas' AND column_name = 'director_name'
  ) THEN
    ALTER TABLE security_areas ADD COLUMN director_name text;
  END IF;
END $$;
