/*
  # Add Routing Controls to Role Catalog

  1. Updates
    - Set `requires_route_controls = true` for roles that need routing details
    - Add `control_spec` JSON configuration for each role's routing control fields
    - Configure MnDOT Project Approver, AP Voucher Approvers, and PO Approver roles

  2. Roles with Routing Controls
    - mndot_project_approver: Route control field
    - ap_voucher_approver_1: Route controls field (8-digit codes)
    - ap_voucher_approver_2: Route controls field (8-digit codes)
    - ap_voucher_approver_3: Route controls field (8-digit codes)
    - po_approver: Route controls field (8-digit codes)

  3. Control Spec Structure
    - Each control_spec contains an array of control definitions
    - Each control defines: column name, label, type, and validation rules
*/

-- Update MnDOT Project Approver role
UPDATE public.role_catalog
SET
  requires_route_controls = true,
  control_spec = '{
    "controls": [
      {
        "column": "route_control",
        "label": "Route Control",
        "type": "text",
        "required": true,
        "hint": "Enter the route control code for this approver"
      }
    ]
  }'::jsonb
WHERE flag_key = 'mndot_project_approver';

-- Update AP Voucher Approver 1 role
UPDATE public.role_catalog
SET
  requires_route_controls = true,
  control_spec = '{
    "controls": [
      {
        "column": "ap_voucher_approver_1_route_controls",
        "label": "Route Controls",
        "type": "multiselect",
        "required": false,
        "hint": "Enter 8-digit route control codes (one per line or comma-separated)",
        "pattern": "^[0-9]{8}$"
      }
    ]
  }'::jsonb
WHERE flag_key = 'ap_voucher_approver_1';

-- Update AP Voucher Approver 2 role
UPDATE public.role_catalog
SET
  requires_route_controls = true,
  control_spec = '{
    "controls": [
      {
        "column": "ap_voucher_approver_2_route_controls",
        "label": "Route Controls",
        "type": "multiselect",
        "required": false,
        "hint": "Enter 8-digit route control codes (one per line or comma-separated)",
        "pattern": "^[0-9]{8}$"
      }
    ]
  }'::jsonb
WHERE flag_key = 'ap_voucher_approver_2';

-- Update AP Voucher Approver 3 role
UPDATE public.role_catalog
SET
  requires_route_controls = true,
  control_spec = '{
    "controls": [
      {
        "column": "ap_voucher_approver_3_route_controls",
        "label": "Route Controls",
        "type": "multiselect",
        "required": false,
        "hint": "Enter 8-digit route control codes (one per line or comma-separated)",
        "pattern": "^[0-9]{8}$"
      }
    ]
  }'::jsonb
WHERE flag_key = 'ap_voucher_approver_3';

-- Update PO Approver role
UPDATE public.role_catalog
SET
  requires_route_controls = true,
  control_spec = '{
    "controls": [
      {
        "column": "po_approver_route_controls",
        "label": "Route Controls",
        "type": "multiselect",
        "required": false,
        "hint": "Enter 8-digit route control codes (one per line or comma-separated)",
        "pattern": "^[0-9]{8}$"
      }
    ]
  }'::jsonb
WHERE flag_key = 'po_approver';

-- Verification: Display updated roles
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE 'Roles with routing controls configured:';
  FOR rec IN
    SELECT flag_key, name, requires_route_controls, control_spec
    FROM public.role_catalog
    WHERE requires_route_controls = true
    ORDER BY flag_key
  LOOP
    RAISE NOTICE 'Role: % | Name: % | Controls: %',
      rec.flag_key, rec.name, rec.control_spec;
  END LOOP;
END $$;
