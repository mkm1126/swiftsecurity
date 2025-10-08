# EPM Agency Code Data Flow

## Before Change

```
┌─────────────────────────────────────────────────────────────────┐
│ Main Form (User Details)                                         │
│                                                                   │
│  ┌────────────────────────────────────────┐                      │
│  │ Agency Name: Administration            │                      │
│  │ Agency Code: G02                       │ ─────┐               │
│  └────────────────────────────────────────┘      │               │
│                                                   │               │
└───────────────────────────────────────────────────┼───────────────┘
                                                    │
                                                    │ Saved to
                                                    │ security_role_requests
                                                    │ .agency_code
                                                    ▼
                                            ┌───────────────┐
                                            │ agency_code   │
                                            │ = "G02"       │
                                            └───────────────┘

                                                    ❌ NOT USED

┌─────────────────────────────────────────────────────────────────┐
│ EPM Role Selection Page                                          │
│                                                                   │
│  ┌────────────────────────────────────────┐                      │
│  │ Agency Code: [___] ← User enters DOT   │ ─────┐              │
│  └────────────────────────────────────────┘      │              │
│                                                   │              │
└───────────────────────────────────────────────────┼──────────────┘
                                                    │
                                                    │ Saved to
                                                    │ security_role_selections
                                                    │ .gw_agency_code
                                                    ▼
                                            ┌───────────────┐
                                            │ gw_agency_code│
                                            │ = "DOT"       │ ✅ USED FOR
                                            └───────────────┘    ROLE CODES
                                                    │
                                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ MNIT Details Page                                                │
│                                                                   │
│  Role Code: M_EPM_DOT_BASIC_RPT_DEVELOPER                        │
│                                                                   │
│  ⚠️ PROBLEM: Uses "DOT" but user's agency is "G02"              │
└──────────────────────────────────────────────────────────────────┘
```

## After Change (Current Implementation)

```
┌─────────────────────────────────────────────────────────────────┐
│ Main Form (User Details)                                         │
│                                                                   │
│  ┌────────────────────────────────────────┐                      │
│  │ Agency Name: Administration            │                      │
│  │ Agency Code: G02                       │ ─────┐               │
│  └────────────────────────────────────────┘      │               │
│                                                   │               │
└───────────────────────────────────────────────────┼───────────────┘
                                                    │
                                                    │ Saved to
                                                    │ security_role_requests
                                                    │ .agency_code
                                                    ▼
                                            ┌───────────────┐
                                            │ agency_code   │
                                            │ = "G02"       │ ✅ USED FOR
                                            └───────────────┘    ROLE CODES
                                                    │              │
                                    ┌───────────────┘              │
                                    │                              │
                                    ▼                              │
┌─────────────────────────────────────────────────────────────────┤
│ EPM Role Selection Page                                          │
│                                                                   │
│  ┌────────────────────────────────────────┐                      │
│  │ Agency Code: G02 (from main form)      │ ← Read-only         │
│  │              Administration            │ ← Auto-populated    │
│  └────────────────────────────────────────┘                      │
│                                                                   │
│  ℹ️  User cannot change this value                              │
└──────────────────────────────────────────────────────────────────┘
                                                    ▲
                                                    │
                                    ┌───────────────┘
                                    │
                                    │ Database View Join
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ active_roles_for_request VIEW                                    │
│                                                                   │
│  SELECT                                                           │
│    resolve_epm_role_code(                                        │
│      rc.role_code,                                               │
│      srr.agency_code  ← Uses main form agency                   │
│    )                                                              │
│  FROM security_role_selections srs                               │
│  INNER JOIN security_role_requests srr ← New join               │
│    ON srr.id = srs.request_id                                    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ MNIT Details Page                                                │
│                                                                   │
│  Role Code: M_EPM_G02_BASIC_RPT_DEVELOPER                        │
│                                                                   │
│  ✅ CORRECT: Uses "G02" matching user's agency                   │
└──────────────────────────────────────────────────────────────────┘
```

## Key Changes

| Aspect | Before | After |
|--------|--------|-------|
| **Agency Code Source** | EPM Role Selection Page (`gw_agency_code`) | Main Form User Details (`agency_code`) |
| **User Input** | User enters agency code on EPM page | Agency code auto-populated, read-only |
| **Data Consistency** | Risk of mismatch between main form and EPM page | Single source of truth ensures consistency |
| **Database View** | `resolve_epm_role_code(rc.role_code, srs.gw_agency_code)` | `resolve_epm_role_code(rc.role_code, srr.agency_code)` |
| **Table Join** | No join with `security_role_requests` | `INNER JOIN security_role_requests` added |

## Example Scenarios

### Scenario 1: Administration Agency (G02)

**Main Form:**
- Agency: Administration
- Agency Code: G02

**EPM Roles Selected:**
- Basic Report Developer
- Data Extracts

**MNIT Details Display:**
- `M_EPM_G02_BASIC_RPT_DEVELOPER` ✅
- `M_EPM_DATA_EXTRACTS` (no {AGENCY_CODE}, stays as-is) ✅

### Scenario 2: Department of Transportation (DOT)

**Main Form:**
- Agency: Transportation
- Agency Code: DOT

**EPM Roles Selected:**
- Advanced Report Developer
- Agency Administrator

**MNIT Details Display:**
- `M_EPM_DOT_ADV_RPT_DEVELOPER` ✅
- `M_EPM_DOT_AGY_ADMINISTRATOR` ✅

### Scenario 3: Static Roles (No Agency Code)

**Main Form:**
- Agency: Health
- Agency Code: MDH

**EPM Roles Selected:**
- Data Extracts (static role)

**MNIT Details Display:**
- `M_EPM_DATA_EXTRACTS` (unchanged, no {AGENCY_CODE} placeholder) ✅

## Technical Implementation

### Database Function: resolve_epm_role_code

```sql
CREATE OR REPLACE FUNCTION public.resolve_epm_role_code(
  p_role_code text,
  p_agency_code text
)
RETURNS text
AS $$
BEGIN
  -- If role code contains {AGENCY_CODE} and we have an agency code
  IF p_role_code LIKE '%{AGENCY_CODE}%'
     AND p_agency_code IS NOT NULL
     AND LENGTH(TRIM(p_agency_code)) > 0
  THEN
    -- Replace placeholder with uppercase 3-char agency code
    RETURN REPLACE(
      p_role_code,
      '{AGENCY_CODE}',
      UPPER(LPAD(TRIM(p_agency_code), 3, '0'))
    );
  END IF;

  -- Otherwise return original role code
  RETURN p_role_code;
END;
$$;
```

### View Logic Flow

```
1. User selects EPM roles → Boolean flags set in security_role_selections
2. active_roles_for_request view processes the request
3. View joins security_role_requests to get agency_code
4. For each selected role, resolve_epm_role_code is called
5. Function checks for {AGENCY_CODE} placeholder
6. If found, replaces with actual agency code from main form
7. Result: Fully qualified role codes like M_EPM_G02_BASIC_RPT_DEVELOPER
```

## Benefits Summary

✅ **Consistency:** Single source of truth for agency code
✅ **User Experience:** No redundant data entry
✅ **Data Integrity:** Eliminates risk of mismatched agency codes
✅ **Clarity:** Clear indication that agency comes from main form
✅ **Maintenance:** Easier to understand and maintain data flow
