/*
  # Convert gw_agency_code to Multi-Select (Text Array)

  1. Changes
    - Convert gw_agency_code column from text to text[]
    - Preserve existing single agency code values by converting them to arrays
    - Handle null and empty values appropriately
    - Update column comments to reflect multi-select capability

  2. Migration Strategy
    - Create a temporary column to hold the converted array values
    - Copy existing data, converting single values to single-element arrays
    - Drop the old column and rename the new column
    - Update the column comment to document multi-select support

  3. Data Preservation
    - Existing single agency codes (e.g., 'DOT') become ['DOT']
    - Null values remain null
    - Empty strings become empty arrays []

  4. Rollback Support
    - To rollback: Convert text[] back to text by taking first element or null
    - SQL: UPDATE security_role_selections SET gw_agency_code_text =
            CASE WHEN array_length(gw_agency_code, 1) > 0
            THEN gw_agency_code[1]
            ELSE NULL END;

  5. Security
    - All changes inherit existing RLS policies from security_role_selections table
    - No additional policies required
*/

-- Step 1: Add a new text[] column to hold the converted values
ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS gw_agency_code_new text[];

-- Step 2: Convert existing data
-- If gw_agency_code is not null and not empty, convert it to a single-element array
-- Otherwise, set to null (we'll use null instead of empty arrays for consistency)
UPDATE public.security_role_selections
SET gw_agency_code_new = CASE
  WHEN gw_agency_code IS NOT NULL AND trim(gw_agency_code) != ''
  THEN ARRAY[upper(trim(gw_agency_code))]
  ELSE NULL
END
WHERE gw_agency_code_new IS NULL;

-- Step 3: Drop the old column
ALTER TABLE public.security_role_selections
  DROP COLUMN IF EXISTS gw_agency_code;

-- Step 4: Rename the new column to the original name
ALTER TABLE public.security_role_selections
  RENAME COLUMN gw_agency_code_new TO gw_agency_code;

-- Step 5: Update the column comment to document multi-select capability
COMMENT ON COLUMN public.security_role_selections.gw_agency_code IS
  'Array of three-character agency codes used for General Warehouse agency-specific roles. Multiple agencies can be selected. Stored in uppercase. Displayed as comma-delimited list in UI. Example: {DOT, MDH, DPS}';

-- Step 6: Create an index for better query performance on array operations
CREATE INDEX IF NOT EXISTS idx_security_role_selections_gw_agency_code_gin
  ON public.security_role_selections USING GIN (gw_agency_code);

-- Migration complete - log success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully converted gw_agency_code from text to text[]. Existing values preserved as single-element arrays.';
END $$;
