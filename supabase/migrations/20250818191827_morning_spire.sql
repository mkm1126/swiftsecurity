/*
  # Modify home_business_unit column to support multiple values

  1. Schema Changes
    - Change `home_business_unit` column from `character(5)` to `text` in `security_role_selections` table
    - This allows storing multiple business unit codes as comma-separated values

  2. Data Preservation
    - Existing single business unit codes will remain intact
    - New entries can store multiple codes like "B0401,B1001,G0201"

  3. Notes
    - This change is backward compatible
    - Existing queries will continue to work
    - Frontend will handle parsing comma-separated values
*/

-- Change the home_business_unit column type from character(5) to text
ALTER TABLE security_role_selections 
ALTER COLUMN home_business_unit TYPE text;