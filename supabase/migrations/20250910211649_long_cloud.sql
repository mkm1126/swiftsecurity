/*
  # Fix Route Controls Configuration

  1. Debug Current State
    - Show current role_catalog entries for AP roles
    - Identify configuration issues

  2. Fix Configuration
    - Remove route controls from roles that shouldn't have them
    - Add proper route controls to AP Voucher Approver roles
    - Use correct column names from security_role_selections table

  3. Verification
    - Confirm changes are applied correctly
*/

-- First, let's see what we currently have
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Current role_catalog entries for AP roles:';
    
    FOR rec IN 
        SELECT flag_key, name, requires_route_controls, control_spec, is_active
        FROM role_catalog 
        WHERE flag_key IN ('ap_voucher_approver_1', 'match_override', 'voucher_entry', 'maintenance_voucher_build_errors')
        ORDER BY flag_key
    LOOP
        RAISE NOTICE 'Role: % | Name: % | Route Controls: % | Active: % | Control Spec: %', 
            rec.flag_key, rec.name, rec.requires_route_controls, rec.is_active, rec.control_spec;
    END LOOP;
END $$;

-- Remove route controls from roles that shouldn't have them
UPDATE role_catalog 
SET 
    requires_route_controls = FALSE,
    control_spec = '{"controls": []}'::jsonb
WHERE flag_key IN ('match_override', 'voucher_entry', 'maintenance_voucher_build_errors')
  AND requires_route_controls = TRUE;

-- Fix the AP Voucher Approver 1 role to have proper route controls
UPDATE role_catalog 
SET 
    requires_route_controls = TRUE,
    control_spec = '{
        "controls": [
            {
                "column": "voucher_approver_1",
                "label": "Route Controls: Financial Department ID(s)",
                "type": "multiselect",
                "required": false,
                "pattern": "\\d{5}",
                "hint": "Enter 5-digit department IDs (e.g., 12345, 67890)",
                "placeholder": "Enter department IDs..."
            }
        ]
    }'::jsonb,
    is_active = TRUE,
    active = TRUE
WHERE flag_key = 'ap_voucher_approver_1';

-- Also fix AP Voucher Approver 2 and 3 if they exist
UPDATE role_catalog 
SET 
    requires_route_controls = TRUE,
    control_spec = '{
        "controls": [
            {
                "column": "voucher_approver_2",
                "label": "Route Controls: Financial Department ID(s)",
                "type": "multiselect",
                "required": false,
                "pattern": "\\d{5}",
                "hint": "Enter 5-digit department IDs (e.g., 12345, 67890)",
                "placeholder": "Enter department IDs..."
            }
        ]
    }'::jsonb,
    is_active = TRUE,
    active = TRUE
WHERE flag_key = 'ap_voucher_approver_2';

UPDATE role_catalog 
SET 
    requires_route_controls = TRUE,
    control_spec = '{
        "controls": [
            {
                "column": "voucher_approver_3",
                "label": "Route Controls: Financial Department ID(s)",
                "type": "multiselect",
                "required": false,
                "pattern": "\\d{5}",
                "hint": "Enter 5-digit department IDs (e.g., 12345, 67890)",
                "placeholder": "Enter department IDs..."
            }
        ]
    }'::jsonb,
    is_active = TRUE,
    active = TRUE
WHERE flag_key = 'ap_voucher_approver_3';

-- Verify the changes
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Updated role_catalog entries:';
    
    FOR rec IN 
        SELECT flag_key, name, requires_route_controls, control_spec, is_active
        FROM role_catalog 
        WHERE flag_key IN ('ap_voucher_approver_1', 'ap_voucher_approver_2', 'ap_voucher_approver_3', 'match_override', 'voucher_entry')
        ORDER BY flag_key
    LOOP
        RAISE NOTICE 'Role: % | Route Controls: % | Active: % | Control Spec: %', 
            rec.flag_key, rec.requires_route_controls, rec.is_active, rec.control_spec;
    END LOOP;
END $$;