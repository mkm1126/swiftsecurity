# Testing EPM Role Codes Implementation

## Overview
This document describes how to test and verify that EPM role codes are working correctly in the MNIT Details page.

## Prerequisites
- Both migration files have been applied:
  - `20251008150000_add_epm_roles_to_catalog.sql`
  - `20251008150100_update_mnit_details_for_epm_roles.sql`
- A test request with EPM roles selected

## Test Scenarios

### Scenario 1: Verify Role Catalog Entries

**Query:**
```sql
SELECT flag_key, role_code, name, domain, display_order, is_active
FROM role_catalog
WHERE domain = 'epm_data_warehouse'
ORDER BY display_order;
```

**Expected Results:**
Should return 5 EPM roles:
1. `data_extracts` - M_EPM_DATA_EXTRACTS
2. `basic_report_dev` - M_EPM_{AGENCY_CODE}_BASIC_RPT_DEVELOPER
3. `advanced_report_dev` - M_EPM_{AGENCY_CODE}_ADV_RPT_DEVELOPER
4. `dashboard_developer` - M_EPM_{AGENCY_CODE}_DASHBOARD_DEVELOPER
5. `agency_administrator` - M_EPM_{AGENCY_CODE}_AGY_ADMINISTRATOR

### Scenario 2: Test Role Code Resolution Helper Function

**Query:**
```sql
-- Test with agency code 'DOT'
SELECT resolve_epm_role_code('M_EPM_{AGENCY_CODE}_BASIC_RPT_DEVELOPER', 'DOT');
-- Expected: M_EPM_DOT_BASIC_RPT_DEVELOPER

-- Test with agency code 'G02'
SELECT resolve_epm_role_code('M_EPM_{AGENCY_CODE}_AGY_ADMINISTRATOR', 'G02');
-- Expected: M_EPM_G02_AGY_ADMINISTRATOR

-- Test with static role code
SELECT resolve_epm_role_code('M_EPM_DATA_EXTRACTS', 'DOT');
-- Expected: M_EPM_DATA_EXTRACTS (unchanged)

-- Test with null agency code
SELECT resolve_epm_role_code('M_EPM_{AGENCY_CODE}_BASIC_RPT_DEVELOPER', NULL);
-- Expected: M_EPM_{AGENCY_CODE}_BASIC_RPT_DEVELOPER (unchanged)
```

### Scenario 3: Verify Active Roles View Includes EPM Roles

**Setup:**
1. Create a test request with EPM roles selected
2. Ensure `gw_agency_code` is set (e.g., 'DOT')
3. Select at least one EPM role (e.g., `basic_report_dev = true`)

**Query:**
```sql
-- Replace <request_id> with actual request ID
SELECT flag_key, role_code, name, domain
FROM active_roles_for_request
WHERE request_id = '<request_id>'
  AND domain = 'epm_data_warehouse'
ORDER BY display_order;
```

**Expected Results:**
- Should show selected EPM roles
- Agency-specific roles should have {AGENCY_CODE} replaced with actual code
- Example: `M_EPM_DOT_BASIC_RPT_DEVELOPER` (not `M_EPM_{AGENCY_CODE}_BASIC_RPT_DEVELOPER`)

### Scenario 4: Test MNIT Details RPC Function

**Query:**
```sql
-- Replace <request_id> with actual request ID
SELECT mnit_details_payload('<request_id>');
```

**Expected Results:**
JSON payload with:
- `selectedRoles` array containing EPM roles with resolved role codes
- EPM roles grouped separately (domain: epm_data_warehouse)
- Role codes properly formatted (e.g., M_EPM_DOT_BASIC_RPT_DEVELOPER)

**Example Expected Output:**
```json
{
  "selectedRoles": [
    {
      "flag_key": "voucher_entry",
      "role_code": "M_AP_VOUCHER_ENTRY",
      "role_name": "Voucher Entry"
    },
    {
      "flag_key": "data_extracts",
      "role_code": "M_EPM_DATA_EXTRACTS",
      "role_name": "Data Extracts"
    },
    {
      "flag_key": "basic_report_dev",
      "role_code": "M_EPM_DOT_BASIC_RPT_DEVELOPER",
      "role_name": "Basic Report Developer"
    }
  ],
  "routeControls": []
}
```

### Scenario 5: Frontend MNIT Details Page Display

**Manual Test:**
1. Navigate to a request with EPM roles selected
2. Click "MNIT Details" button
3. Verify EPM roles display in their own section
4. Verify role codes are fully qualified with agency code

**Expected Display:**
- Section header: "EPM Data Warehouse Roles" (or similar)
- Static role: `M_EPM_DATA_EXTRACTS`
- Agency-specific roles: `M_EPM_DOT_BASIC_RPT_DEVELOPER`, `M_EPM_DOT_AGY_ADMINISTRATOR`, etc.
- No {AGENCY_CODE} placeholders visible

## Edge Cases to Test

### Missing Agency Code
**Setup:**
- Select EPM agency-specific role
- Leave `gw_agency_code` NULL or empty

**Expected Behavior:**
- Role code should display with {AGENCY_CODE} placeholder
- OR show warning/indicator that agency code is required

### Invalid Agency Code Format
**Test Cases:**
- Empty string: `''`
- Too short: `'DO'` (should pad to `'0DO'` or handle gracefully)
- Too long: `'DOTX'` (should truncate to `'DOT'`)
- Lowercase: `'dot'` (should convert to `'DOT'`)

**Query:**
```sql
SELECT
  resolve_epm_role_code('M_EPM_{AGENCY_CODE}_TEST', '') as empty_code,
  resolve_epm_role_code('M_EPM_{AGENCY_CODE}_TEST', 'DO') as short_code,
  resolve_epm_role_code('M_EPM_{AGENCY_CODE}_TEST', 'DOTX') as long_code,
  resolve_epm_role_code('M_EPM_{AGENCY_CODE}_TEST', 'dot') as lowercase_code;
```

### Multiple EPM Roles Selected
**Setup:**
- Select all 5 EPM roles for a single request
- Set agency code to 'G02'

**Expected:**
- All 5 roles appear in MNIT Details
- 4 agency-specific roles show `M_EPM_G02_*`
- 1 static role shows `M_EPM_DATA_EXTRACTS`

## Troubleshooting

### EPM Roles Not Showing
**Check:**
1. Verify role_catalog entries exist
2. Verify columns exist in security_role_selections table
3. Check that boolean flags are set to true
4. Verify view includes EPM flag checks

**Query:**
```sql
-- Check if columns exist
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'security_role_selections'
  AND column_name IN ('data_extracts', 'basic_report_dev', 'advanced_report_dev', 'dashboard_developer', 'agency_administrator');
```

### Role Codes Not Resolving
**Check:**
1. Verify `gw_agency_code` is populated
2. Test `resolve_epm_role_code` function directly
3. Check view is using the function correctly

### Build Errors
**Check:**
- Run `npm run build` to verify no TypeScript errors
- Check browser console for JavaScript errors
- Verify Supabase connection is working

## Success Criteria

✅ All 5 EPM roles appear in role_catalog with correct role_codes
✅ Helper function correctly substitutes {AGENCY_CODE} placeholder
✅ active_roles_for_request view includes EPM roles
✅ mnit_details_payload RPC returns EPM roles with resolved codes
✅ MNIT Details page displays EPM roles in separate section
✅ Agency-specific roles show fully qualified codes (e.g., M_EPM_DOT_BASIC_RPT_DEVELOPER)
✅ Static roles show unchanged (e.g., M_EPM_DATA_EXTRACTS)
✅ Project builds without errors
