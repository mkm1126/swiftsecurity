# EPM Role Codes - Quick Reference Card

## Role Mappings

| Database Column | Role Code Template | Example Output |
|----------------|-------------------|----------------|
| `data_extracts` | `M_EPM_DATA_EXTRACTS` | `M_EPM_DATA_EXTRACTS` |
| `basic_report_dev` | `M_EPM_{AGENCY_CODE}_BASIC_RPT_DEVELOPER` | `M_EPM_DOT_BASIC_RPT_DEVELOPER` |
| `advanced_report_dev` | `M_EPM_{AGENCY_CODE}_ADV_RPT_DEVELOPER` | `M_EPM_DOT_ADV_RPT_DEVELOPER` |
| `dashboard_developer` | `M_EPM_{AGENCY_CODE}_DASHBOARD_DEVELOPER` | `M_EPM_DOT_DASHBOARD_DEVELOPER` |
| `agency_administrator` | `M_EPM_{AGENCY_CODE}_AGY_ADMINISTRATOR` | `M_EPM_DOT_AGY_ADMINISTRATOR` |

## Quick Test Query

```sql
-- Test role code resolution
SELECT
  flag_key,
  role_code as template,
  resolve_epm_role_code(role_code, 'DOT') as resolved
FROM role_catalog
WHERE domain = 'epm_data_warehouse'
ORDER BY display_order;
```

## Quick Verification

```sql
-- Check EPM roles in catalog
SELECT COUNT(*) FROM role_catalog WHERE domain = 'epm_data_warehouse';
-- Expected: 5

-- Test helper function
SELECT resolve_epm_role_code('M_EPM_{AGENCY_CODE}_TEST', 'DOT');
-- Expected: M_EPM_DOT_TEST

-- View EPM roles for a request (replace UUID)
SELECT * FROM active_roles_for_request
WHERE request_id = '...' AND domain = 'epm_data_warehouse';
```

## Files to Review

1. **Migrations:** `supabase/migrations/20251008150000_*.sql` and `20251008150100_*.sql`
2. **Testing Guide:** `supabase/migrations/TEST_EPM_ROLES.md`
3. **Full Documentation:** `supabase/migrations/IMPLEMENTATION_SUMMARY.md`
4. **Restore Points:** `supabase/backups/before_epm_roles_*.sql` and `after_epm_roles_*.sql`

## Rollback If Needed

```sql
DROP FUNCTION IF EXISTS resolve_epm_role_code(text, text);
DELETE FROM role_catalog WHERE domain = 'epm_data_warehouse';
```

## Key Functions

- **resolve_epm_role_code(role_code, agency_code)** - Substitutes {AGENCY_CODE} placeholder
- **mnit_details_payload(request_id)** - Returns EPM roles with resolved codes
- **active_roles_for_request** - View that includes EPM roles

## How It Works

1. User selects EPM roles and enters agency code (e.g., 'DOT')
2. Data saved to `security_role_selections` table
3. MNIT Details page calls `mnit_details_payload()` RPC
4. Function queries `active_roles_for_request` view
5. View calls `resolve_epm_role_code()` to substitute {AGENCY_CODE}
6. Final output: `M_EPM_DOT_BASIC_RPT_DEVELOPER`
