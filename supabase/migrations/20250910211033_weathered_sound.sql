/*
  # Fix Route Controls Configuration

  1. Changes Made
    - Remove route controls from roles that don't need them (Match Override, Voucher Entry)
    - Fix route controls for AP Voucher Approver roles to use correct column names
    - Ensure only roles that actually need route controls have them enabled

  2. Route Controls
    - Only AP Voucher Approver roles will have route controls
    - Uses correct column names that exist in security_role_selections table
    - Proper validation patterns for department IDs
*/

-- First, disable route controls for roles that shouldn't have them
UPDATE public.role_catalog
SET 
    requires_route_controls = FALSE,
    control_spec = '{}'::jsonb
WHERE flag_key IN (
    'match_override',
    'voucher_entry'
);

-- Now fix the AP Voucher Approver roles with correct route controls
-- These should map to the actual columns in security_role_selections table

UPDATE public.role_catalog
SET 
    requires_route_controls = TRUE,
    control_spec = '{
        "controls": [
            {
                "column": "voucher_approver_1",
                "label": "Route Controls: Financial Department ID(s)",
                "type": "multiselect",
                "options": [],
                "required": false,
                "pattern": "\\d{5}",
                "hint": "8 characters each; separate with commas or new lines",
                "placeholder": "e.g. 12345678, 23456789 (or one per line)",
                "allowCustom": true
            }
        ]
    }'::jsonb
WHERE flag_key = 'ap_voucher_approver_1';

UPDATE public.role_catalog
SET 
    requires_route_controls = TRUE,
    control_spec = '{
        "controls": [
            {
                "column": "voucher_approver_2", 
                "label": "Route Controls: Financial Department ID(s)",
                "type": "multiselect",
                "options": [],
                "required": false,
                "pattern": "\\d{5}",
                "hint": "8 characters each; separate with commas or new lines",
                "placeholder": "e.g. 12345678, 23456789 (or one per line)",
                "allowCustom": true
            }
        ]
    }'::jsonb
WHERE flag_key = 'ap_voucher_approver_2';

UPDATE public.role_catalog
SET 
    requires_route_controls = TRUE,
    control_spec = '{
        "controls": [
            {
                "column": "voucher_approver_3",
                "label": "Route Controls: Financial Department ID(s)", 
                "type": "multiselect",
                "options": [],
                "required": false,
                "pattern": "\\d{5}",
                "hint": "8 characters each; separate with commas or new lines",
                "placeholder": "e.g. 12345678, 23456789 (or one per line)",
                "allowCustom": true
            }
        ]
    }'::jsonb
WHERE flag_key = 'ap_voucher_approver_3';

-- Ensure all roles are active
UPDATE public.role_catalog
SET 
    active = TRUE,
    is_active = TRUE
WHERE flag_key IN (
    'ap_voucher_approver_1',
    'ap_voucher_approver_2', 
    'ap_voucher_approver_3',
    'match_override',
    'voucher_entry'
);