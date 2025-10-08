# Agency Code Source Update - Implementation Summary

## Overview

Updated the EPM role code resolution to use the agency code from the main form's User Details section instead of the EPM Role Selection Page. This ensures that EPM role codes like `M_{AGENCY_CODE}_DATA_EXTRACTS` are resolved using the agency code entered at the beginning of the request (e.g., "G02").

## Changes Made

### 1. Database View Update

**File:** `/supabase/migrations/20251008160000_use_main_form_agency_code.sql`

Updated the `active_roles_for_request` view to:
- Join with `security_role_requests` table to access the main form's agency code
- Changed `resolve_epm_role_code()` function call from using `srs.gw_agency_code` to `srr.agency_code`
- Added table alias `srr` for `security_role_requests`

**Before:**
```sql
SELECT
  ...
  public.resolve_epm_role_code(rc.role_code, srs.gw_agency_code) as role_code,
  ...
FROM public.security_role_selections srs
```

**After:**
```sql
SELECT
  ...
  public.resolve_epm_role_code(rc.role_code, srr.agency_code) as role_code,
  ...
FROM public.security_role_selections srs
INNER JOIN public.security_role_requests srr ON srr.id = srs.request_id
```

### 2. Frontend Update

**File:** `/src/EpmDwhRoleSelectionPage.tsx`

Updated the Agency Code field on the EPM Role Selection Page to:
- Display as read-only (disabled input field)
- Show the agency code from the main form automatically
- Display the agency name next to the code for clarity
- Updated help text to explain that the code comes from the main form

**Changes:**
- Made input field `readOnly` and `disabled`
- Changed label from "Agency Code (3 characters) for agency-specific roles*" to "Agency Code (from main form)"
- Added agency name display next to the code field
- Updated help text to explain the automatic population and show example role code format

## How It Works

### User Flow

1. **Main Form (User Details Section)**
   - User selects agency (e.g., "Administration")
   - Agency code is automatically populated (e.g., "G02")
   - This is saved to `security_role_requests.agency_code`

2. **EPM Role Selection Page**
   - Agency code field displays the value from the main form (read-only)
   - User cannot change this value
   - Shows both code ("G02") and agency name ("Administration")

3. **MNIT Details Page**
   - EPM roles with `{AGENCY_CODE}` placeholder are resolved using the main form's agency code
   - Example: `M_EPM_{AGENCY_CODE}_BASIC_RPT_DEVELOPER` becomes `M_EPM_G02_BASIC_RPT_DEVELOPER`
   - Static roles (like `M_EPM_DATA_EXTRACTS`) remain unchanged

## Benefits

1. **Single Source of Truth**
   - Agency code is defined once in the main form
   - No risk of inconsistency between main form and EPM page
   - Eliminates user confusion about which agency code to use

2. **Improved User Experience**
   - Users don't need to re-enter agency code on EPM page
   - Reduces data entry errors
   - Clearer indication of where agency code comes from

3. **Data Consistency**
   - All EPM role codes use the same agency code from the main form
   - Role codes in MNIT Details always match the user's agency from User Details
   - Eliminates potential for mismatched agency codes

## Testing Checklist

To verify the implementation works correctly:

- [ ] Create a new request with agency code "G02" in main form
- [ ] Navigate to EPM Role Selection page
- [ ] Verify agency code field shows "G02" and is read-only
- [ ] Select EPM roles (e.g., Basic Report Developer)
- [ ] Navigate to MNIT Details page
- [ ] Verify EPM role codes show "M_EPM_G02_..." instead of "M_EPM_{AGENCY_CODE}_..."
- [ ] Verify Request Details page shows correct EPM role codes
- [ ] Test with different agencies (e.g., "DOT", "MDH") to ensure dynamic substitution works

## Migration Notes

**Important:** The database migration file has been created but needs to be applied manually:

1. The migration file is located at: `/supabase/migrations/20251008160000_use_main_form_agency_code.sql`
2. Apply this migration to your Supabase database using one of these methods:
   - Supabase CLI: `supabase db push`
   - Supabase Dashboard: Copy the SQL and run in SQL Editor
   - Direct PostgreSQL connection: Execute the SQL file

## Backward Compatibility

- **Existing `gw_agency_code` field:** The field still exists in `security_role_selections` table but is no longer used for role code resolution
- **Existing requests:** Will automatically use the agency code from `security_role_requests` when viewed
- **No data migration needed:** The change is in the view logic only, existing data remains unchanged

## Technical Details

### Database Schema

- **Source Table:** `security_role_requests`
- **Source Column:** `agency_code` (text, 3 characters)
- **View:** `active_roles_for_request`
- **Function:** `resolve_epm_role_code(role_code text, agency_code text)`

### Function Behavior

The `resolve_epm_role_code()` function:
- Detects `{AGENCY_CODE}` placeholder in role codes
- Replaces it with the uppercase 3-character agency code
- Returns original code if no placeholder or agency code is missing
- Handles edge cases (null, empty, wrong length)

## Files Modified

1. `/supabase/migrations/20251008160000_use_main_form_agency_code.sql` (created)
2. `/src/EpmDwhRoleSelectionPage.tsx` (modified)

## Build Status

✅ Project builds successfully with all changes
✅ No TypeScript errors
✅ No linting errors

---

**Date:** October 8, 2025
**Issue:** EPM role codes should use agency code from main form's User Details section
**Status:** ✅ Complete
