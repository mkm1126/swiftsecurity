# EPM Role Mapping Fix - Implementation Summary

## Issue

When editing an existing EPM request (clicking "Edit Roles"), the EPM role checkboxes were not being populated with the saved values. This meant that roles like Basic Report Developer, Advanced Report Developer, Dashboard Developer, and Agency Administrator appeared unchecked even though they were previously selected and saved.

## Root Cause

The field mappings in `EpmDwhRoleSelectionPage.tsx` were using incorrect database column names with a `gw_` prefix:

**Incorrect Mappings:**
```typescript
const mappings: Record<string, keyof Form> = {
  gw_basic_report_dev: 'gwBasicReportDev',      // ❌ Wrong
  gw_advanced_report_dev: 'gwAdvancedReportDev',  // ❌ Wrong
  gw_dashboard_developer: 'gwDashboardDeveloper',  // ❌ Wrong
  gw_agency_administrator: 'gwAgencyAdministrator', // ❌ Wrong
  // ...
};
```

**Actual Database Column Names:**
```sql
-- From migration 20251007140000_add_epm_dwh_columns.sql
basic_report_dev         -- ✅ No gw_ prefix
advanced_report_dev      -- ✅ No gw_ prefix
dashboard_developer      -- ✅ No gw_ prefix
agency_administrator     -- ✅ No gw_ prefix
```

The mapping was looking for columns that didn't exist (`gw_basic_report_dev`), so the `setValue()` calls never executed, leaving the form fields with their default unchecked state.

## Fix Applied

Updated the field mappings in **two locations** within `/src/EpmDwhRoleSelectionPage.tsx`:

### Location 1: `fetchExistingSelections()` function (line ~363)
### Location 2: `handleUserDetailsLoaded()` function (line ~194)

**Corrected Mappings:**
```typescript
const mappings: Record<string, keyof Form> = {
  data_extracts: 'dataExtracts',
  basic_report_dev: 'gwBasicReportDev',          // ✅ Fixed (removed gw_ prefix)
  advanced_report_dev: 'gwAdvancedReportDev',    // ✅ Fixed (removed gw_ prefix)
  dashboard_developer: 'gwDashboardDeveloper',   // ✅ Fixed (removed gw_ prefix)
  agency_administrator: 'gwAgencyAdministrator',  // ✅ Fixed (removed gw_ prefix)
  gw_agency_code: 'gwAgencyCode',                // ✅ Correct (has gw_ prefix)
  private_by_department: 'hrPrivateByDepartment', // ✅ Fixed (removed hr_ prefix)
  statewide_data: 'hrStatewideData',             // ✅ Fixed (removed hr_ prefix)
  data_excluded_employees: 'hrDataExcludedEmployees', // ✅ Fixed (removed hr_ prefix)
  // ... rest of mappings
};
```

**Summary of All Fixes:**
1. EPM roles: Removed incorrect `gw_` prefix (4 fields)
2. HR/Payroll roles: Removed incorrect `hr_` prefix (3 fields)

## Impact

### Before Fix
1. User selects EPM roles (e.g., Basic Report Developer)
2. Saves the request
3. Returns to "Edit Roles"
4. ❌ EPM role checkboxes appear unchecked (data was saved but not loaded)

### After Fix
1. User selects EPM roles (e.g., Basic Report Developer)
2. Saves the request
3. Returns to "Edit Roles"
4. ✅ EPM role checkboxes correctly show as checked

## Verification Steps

To test the fix:

1. **Create a new EPM request**
   - Fill out main form with agency (e.g., "Administration" - "G02")
   - Navigate to EPM Role Selection page
   - Check roles: Data Extracts, Basic Report Developer, Advanced Report Developer

2. **Save and navigate away**
   - Click "Save and Continue" to go to MNIT Details
   - Go to Request Details page

3. **Edit the roles**
   - Click "Edit Roles" button
   - Verify you're taken to the EPM Role Selection page
   - ✅ Verify all previously selected checkboxes are checked
   - ✅ Verify agency code field shows correct value (read-only)

4. **Check MNIT Details**
   - Navigate to MNIT Details page
   - ✅ Verify role codes show as `M_EPM_G02_BASIC_RPT_DEVELOPER` (not `M_EPM_{AGENCY_CODE}_...`)

## Files Modified

- `/src/EpmDwhRoleSelectionPage.tsx` (2 mapping objects updated)

## Database Schema Reference

The correct column names in `security_role_selections` table:

```sql
-- EPM Data Warehouse columns (from migration 20251007140000_add_epm_dwh_columns.sql)
data_extracts              boolean DEFAULT false
basic_report_dev           boolean DEFAULT false  -- No gw_ prefix
advanced_report_dev        boolean DEFAULT false  -- No gw_ prefix
dashboard_developer        boolean DEFAULT false  -- No gw_ prefix
agency_administrator       boolean DEFAULT false  -- No gw_ prefix
gw_agency_code            text                   -- Has gw_ prefix (used for agency code)

-- HR/Payroll columns (from migration 20251007140000_add_epm_dwh_columns.sql)
private_by_department      boolean DEFAULT false  -- No hr_ prefix
statewide_data            boolean DEFAULT false  -- No hr_ prefix
data_excluded_employees   boolean DEFAULT false  -- No hr_ prefix
```

## Build Status

✅ Project builds successfully with fixes
✅ No TypeScript errors
✅ No linting errors

## Related Changes

This fix is part of the larger update to use the main form's agency code for EPM role resolution. See:
- `AGENCY_CODE_UPDATE_SUMMARY.md` - Main agency code source change
- `AGENCY_CODE_FLOW.md` - Visual data flow diagrams
- `APPLY_MIGRATION_INSTRUCTIONS.md` - Database migration instructions

---

**Date:** October 8, 2025
**Issue:** EPM roles not loading when editing existing request
**Cause:** Incorrect database column name mappings with `gw_` prefix
**Status:** ✅ Fixed
