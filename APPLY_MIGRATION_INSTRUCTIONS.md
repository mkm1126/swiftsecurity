# How to Apply the Agency Code Migration

## Quick Start

The database view needs to be updated to use the main form's agency code. Follow one of the methods below:

## Method 1: Using Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `/supabase/migrations/20251008160000_use_main_form_agency_code.sql`
5. Click **Run** to execute the migration
6. You should see a success message confirming the view was updated

## Method 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Navigate to project directory
cd /path/to/project

# Apply all pending migrations
supabase db push
```

## Method 3: Direct SQL Execution

Copy this SQL and execute it in your PostgreSQL client:

```sql
-- Update the active_roles_for_request view to use main form agency code
CREATE OR REPLACE VIEW public.active_roles_for_request AS
SELECT
  srs.request_id,
  rc.flag_key,
  -- Resolve EPM role codes with agency code from main form (security_role_requests.agency_code)
  public.resolve_epm_role_code(rc.role_code, srr.agency_code) as role_code,
  rc.name,
  rc.description,
  rc.requires_route_controls,
  rc.control_spec,
  rc.domain,
  rc.display_order
FROM public.security_role_selections srs
-- Join with security_role_requests to get agency_code from main form
INNER JOIN public.security_role_requests srr ON srr.id = srs.request_id
CROSS JOIN public.role_catalog rc
WHERE rc.is_active = true
AND (
  -- [All role flag checks here - see full migration file]
  (rc.flag_key = 'voucher_entry' AND srs.voucher_entry = true) OR
  -- ... (truncated for brevity)
  (rc.flag_key = 'agency_administrator' AND srs.agency_administrator = true)
);

-- Add helpful comment
COMMENT ON VIEW public.active_roles_for_request IS
  'Returns all active roles for a given request. EPM role codes with {AGENCY_CODE} placeholder are resolved using the agency_code from security_role_requests table (main form User Details section).';
```

**Note:** For the complete SQL, use the file at `/supabase/migrations/20251008160000_use_main_form_agency_code.sql`

## Verification

After applying the migration, verify it worked:

### 1. Check the View Definition

```sql
SELECT definition
FROM pg_views
WHERE viewname = 'active_roles_for_request'
AND schemaname = 'public';
```

The definition should contain `srr.agency_code` and `INNER JOIN public.security_role_requests srr`

### 2. Test with a Real Request

```sql
-- Replace <request_id> with an actual request ID that has EPM roles
SELECT * FROM active_roles_for_request WHERE request_id = '<request_id>';
```

For EPM roles, the `role_code` column should show resolved codes like `M_EPM_G02_BASIC_RPT_DEVELOPER` instead of `M_EPM_{AGENCY_CODE}_BASIC_RPT_DEVELOPER`

### 3. Test the MNIT Details Payload

```sql
-- Replace <request_id> with an actual request ID
SELECT mnit_details_payload('<request_id>');
```

The returned JSON should have `selectedRoles` with resolved EPM role codes.

## Troubleshooting

### Error: "relation 'srr' does not exist"

Make sure you're using the complete SQL from the migration file. The view needs the INNER JOIN clause.

### EPM roles still showing {AGENCY_CODE}

Check that:
1. The request has a valid `agency_code` in `security_role_requests` table
2. The `resolve_epm_role_code` function exists and is working
3. The view was successfully updated (check with verification query above)

### No roles showing in MNIT Details

Verify:
1. The request has EPM roles selected in `security_role_selections`
2. The EPM roles exist in `role_catalog` with `is_active = true`
3. The view join is working correctly (check with test query above)

## Rollback (If Needed)

To rollback to the previous version (using `gw_agency_code`):

```sql
-- Restore the previous view definition
CREATE OR REPLACE VIEW public.active_roles_for_request AS
SELECT
  srs.request_id,
  rc.flag_key,
  public.resolve_epm_role_code(rc.role_code, srs.gw_agency_code) as role_code,
  -- ... rest of the view definition
FROM public.security_role_selections srs
CROSS JOIN public.role_catalog rc
-- ... rest of WHERE clause
```

## Support

If you encounter issues:

1. Check the migration file: `/supabase/migrations/20251008160000_use_main_form_agency_code.sql`
2. Review the summary: `/AGENCY_CODE_UPDATE_SUMMARY.md`
3. Check Supabase logs for any error messages
4. Verify the `resolve_epm_role_code` function exists: `SELECT * FROM pg_proc WHERE proname = 'resolve_epm_role_code'`

---

**Important:** This migration only updates the database view. The frontend changes have already been applied to `/src/EpmDwhRoleSelectionPage.tsx`.
