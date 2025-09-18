/*
  # Configure Route Controls for AP Voucher Approver Roles

  1. Updates
    - Set `requires_route_controls` to true for AP voucher approver roles
    - Add proper `control_spec` JSON configuration for route control fields
    - Ensure roles are active and properly configured

  2. Route Controls Added
    - `ap_voucher_approver_1`: Voucher Approver 1 route controls
    - `match_override`: Match Override route controls  
    - `voucher_entry`: Voucher Entry route controls

  3. Control Specifications
    - Each role gets appropriate input fields for route controls
    - Fields are configured as multiselect for email addresses
    - Proper labels and hints provided for user guidance
*/

-- Update AP Voucher Approver 1 to require route controls
UPDATE public.role_catalog
SET
    requires_route_controls = true,
    is_active = true,
    active = true,
    control_spec = '{
        "controls": [
            {
                "column": "voucher_approver_1",
                "label": "Voucher Approver 1 Email(s)",
                "type": "multiselect",
                "options": [],
                "required": false,
                "hint": "Enter email addresses for first level voucher approvers",
                "placeholder": "Enter email addresses..."
            },
            {
                "column": "ap_voucher_approver_1_route_controls",
                "label": "Route Control Settings",
                "type": "multiselect",
                "options": [],
                "required": false,
                "hint": "Additional route control configurations",
                "placeholder": "Enter route control values..."
            }
        ]
    }'::jsonb
WHERE flag_key = 'ap_voucher_approver_1';

-- Update Match Override to require route controls
UPDATE public.role_catalog
SET
    requires_route_controls = true,
    is_active = true,
    active = true,
    control_spec = '{
        "controls": [
            {
                "column": "match_override_settings",
                "label": "Match Override Settings",
                "type": "multiselect",
                "options": [],
                "required": false,
                "hint": "Configure match override parameters",
                "placeholder": "Enter override settings..."
            }
        ]
    }'::jsonb
WHERE flag_key = 'match_override';

-- Update Voucher Entry to require route controls
UPDATE public.role_catalog
SET
    requires_route_controls = true,
    is_active = true,
    active = true,
    control_spec = '{
        "controls": [
            {
                "column": "voucher_entry_settings",
                "label": "Voucher Entry Settings",
                "type": "multiselect",
                "options": [],
                "required": false,
                "hint": "Configure voucher entry parameters",
                "placeholder": "Enter entry settings..."
            }
        ]
    }'::jsonb
WHERE flag_key = 'voucher_entry';

-- Ensure the roles exist and are properly configured
DO $$
BEGIN
    -- Check if ap_voucher_approver_1 exists, if not create it
    IF NOT EXISTS (
        SELECT 1 FROM public.role_catalog WHERE flag_key = 'ap_voucher_approver_1'
    ) THEN
        INSERT INTO public.role_catalog (
            flag_key,
            role_code,
            name,
            description,
            domain,
            requires_route_controls,
            control_spec,
            display_order,
            active,
            is_active
        ) VALUES (
            'ap_voucher_approver_1',
            'M_AP_VOUCHER_APPR_01',
            'AP Voucher Approver 1',
            'First level approval for vouchers with route controls',
            'accounting_procurement',
            true,
            '{
                "controls": [
                    {
                        "column": "voucher_approver_1",
                        "label": "Voucher Approver 1 Email(s)",
                        "type": "multiselect",
                        "options": [],
                        "required": false,
                        "hint": "Enter email addresses for first level voucher approvers",
                        "placeholder": "Enter email addresses..."
                    }
                ]
            }'::jsonb,
            120,
            true,
            true
        );
    END IF;

    -- Check if match_override exists, if not create it
    IF NOT EXISTS (
        SELECT 1 FROM public.role_catalog WHERE flag_key = 'match_override'
    ) THEN
        INSERT INTO public.role_catalog (
            flag_key,
            role_code,
            name,
            description,
            domain,
            requires_route_controls,
            control_spec,
            display_order,
            active,
            is_active
        ) VALUES (
            'match_override',
            'M_AP_MATCH_OVERRIDE',
            'Match Override',
            'Permission to override matching discrepancies in accounts payable',
            'accounting_procurement',
            true,
            '{
                "controls": [
                    {
                        "column": "match_override_settings",
                        "label": "Match Override Settings",
                        "type": "text",
                        "required": false,
                        "hint": "Configure match override parameters",
                        "placeholder": "Enter override settings..."
                    }
                ]
            }'::jsonb,
            125,
            true,
            true
        );
    END IF;

    -- Check if voucher_entry exists, if not create it
    IF NOT EXISTS (
        SELECT 1 FROM public.role_catalog WHERE flag_key = 'voucher_entry'
    ) THEN
        INSERT INTO public.role_catalog (
            flag_key,
            role_code,
            name,
            description,
            domain,
            requires_route_controls,
            control_spec,
            display_order,
            active,
            is_active
        ) VALUES (
            'voucher_entry',
            'M_AP_VOUCHER_ENTRY',
            'Voucher Entry',
            'Allows users to create and enter vouchers into the system',
            'accounting_procurement',
            true,
            '{
                "controls": [
                    {
                        "column": "voucher_entry_settings",
                        "label": "Voucher Entry Settings",
                        "type": "text",
                        "required": false,
                        "hint": "Configure voucher entry parameters",
                        "placeholder": "Enter entry settings..."
                    }
                ]
            }'::jsonb,
            110,
            true,
            true
        );
    END IF;
END $$;