/*
  # Debug and Fix Route Controls Configuration

  1. Investigation
    - Check current role_catalog entries for AP voucher roles
    - Verify column names in security_role_selections table
    - Fix control_spec to use correct column names

  2. Fixes
    - Update control_spec to use existing columns
    - Ensure only roles that need route controls have them
    - Set proper validation patterns and labels
*/

-- First, let's see what columns exist in security_role_selections for voucher approvers
-- This will help us understand what column names to use in control_spec

-- Check current role_catalog configuration
SELECT 
    flag_key, 
    name, 
    role_code,
    requires_route_controls, 
    control_spec,
    is_active
FROM public.role_catalog 
WHERE flag_key IN (
    'ap_voucher_approver_1', 
    'ap_voucher_approver_2', 
    'ap_voucher_approver_3',
    'match_override',
    'voucher_entry'
)
ORDER BY flag_key;

-- Now let's fix the configuration based on your actual database schema
-- Looking at your schema, I can see these columns exist in security_role_selections:
-- - voucher_approver_1 (text[])
-- - voucher_approver_2 (text[])  
-- - voucher_approver_3 (text[])

-- Update AP Voucher Approver roles to have proper route controls
UPDATE public.role_catalog
SET 
    requires_route_controls = TRUE,
    control_spec = CASE 
        WHEN flag_key = 'ap_voucher_approver_1' THEN '{
            "controls": [
                {
                    "column": "voucher_approver_1",
                    "label": "Route Controls: Financial Department ID(s)",
                    "type": "multiselect",
                    "pattern": "\\d{5}",
                    "required": false,
                    "hint": "8 characters each; separate with commas || new lines",
                    "placeholder": "e.g. 12345678, 23456789 (or one per line)",
                    "options": []
                }
            ]
        }'::jsonb
        WHEN flag_key = 'ap_voucher_approver_2' THEN '{
            "controls": [
                {
                    "column": "voucher_approver_2", 
                    "label": "Route Controls: Financial Department ID(s)",
                    "type": "multiselect",
                    "pattern": "\\d{5}",
                    "required": false,
                    "hint": "8 characters each; separate with commas || new lines",
                    "placeholder": "e.g. 12345678, 23456789 (or one per line)",
                    "options": []
                }
            ]
        }'::jsonb
        WHEN flag_key = 'ap_voucher_approver_3' THEN '{
            "controls": [
                {
                    "column": "voucher_approver_3",
                    "label": "Route Controls: Financial Department ID(s)", 
                    "type": "multiselect",
                    "pattern": "\\d{5}",
                    "required": false,
                    "hint": "8 characters each; separate with commas || new lines",
                    "placeholder": "e.g. 12345678, 23456789 (or one per line)",
                    "options": []
                }
            ]
        }'::jsonb
        ELSE control_spec
    END,
    is_active = TRUE
WHERE flag_key IN ('ap_voucher_approver_1', 'ap_voucher_approver_2', 'ap_voucher_approver_3');

-- Remove route controls from roles that shouldn't have them
UPDATE public.role_catalog
SET 
    requires_route_controls = FALSE,
    control_spec = '{}'::jsonb
WHERE flag_key IN ('match_override', 'voucher_entry', 'maintenance_voucher_build_errors', 'ap_inquiry_only')
  AND requires_route_controls = TRUE;

-- Verify the changes
SELECT 
    flag_key, 
    name, 
    role_code,
    requires_route_controls, 
    control_spec->'controls'->0->>'column' as control_column,
    control_spec->'controls'->0->>'label' as control_label,
    is_active
FROM public.role_catalog 
WHERE flag_key IN (
    'ap_voucher_approver_1', 
    'ap_voucher_approver_2', 
    'ap_voucher_approver_3',
    'match_override',
    'voucher_entry'
)
ORDER BY flag_key;