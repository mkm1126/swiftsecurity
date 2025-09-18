/*
  # Fix AP Voucher Approver Route Controls Configuration

  1. Updates
    - Configure proper route controls for AP Voucher Approver roles
    - Set correct control specifications for Financial Department IDs
    - Remove unnecessary email fields
    - Ensure proper validation patterns

  2. Route Controls
    - Financial Department ID(s) for each voucher approver level
    - 8-character validation pattern
    - Proper hints and placeholders
    - Multi-select capability for multiple department IDs

  3. Security
    - Maintains existing RLS policies
    - Updates only the control specifications
*/

-- First, let's check what we're working with and clean up any incorrect configurations
DELETE FROM public.role_catalog 
WHERE flag_key IN (
  'ap_voucher_approver_1_route_controls',
  'voucher_approver_1_email',
  'voucher_approver_1_emails'
) AND name LIKE '%Email%';

-- Update the main AP Voucher Approver roles to have proper route controls
UPDATE public.role_catalog
SET
  requires_route_controls = TRUE,
  is_active = TRUE,
  active = TRUE,
  control_spec = CASE
    WHEN flag_key = 'ap_voucher_approver_1' THEN '{
      "controls": [
        {
          "column": "voucher_approver_1",
          "label": "Route Controls: Financial Department ID(s)",
          "type": "multiselect",
          "options": [],
          "required": false,
          "pattern": "\\d{8}",
          "hint": "8 characters each; separate with commas || new lines",
          "placeholder": "e.g. 12345678, 23456789 (or one per line)",
          "allowCustom": true
        }
      ]
    }'::jsonb
    WHEN flag_key = 'ap_voucher_approver_2' THEN '{
      "controls": [
        {
          "column": "voucher_approver_2", 
          "label": "Route Controls: Financial Department ID(s)",
          "type": "multiselect",
          "options": [],
          "required": false,
          "pattern": "\\d{8}",
          "hint": "8 characters each; separate with commas || new lines",
          "placeholder": "e.g. 12345678, 23456789 (or one per line)",
          "allowCustom": true
        }
      ]
    }'::jsonb
    WHEN flag_key = 'ap_voucher_approver_3' THEN '{
      "controls": [
        {
          "column": "voucher_approver_3",
          "label": "Route Controls: Financial Department ID(s)", 
          "type": "multiselect",
          "options": [],
          "required": false,
          "pattern": "\\d{8}",
          "hint": "8 characters each; separate with commas || new lines",
          "placeholder": "e.g. 12345678, 23456789 (or one per line)",
          "allowCustom": true
        }
      ]
    }'::jsonb
    ELSE control_spec
  END
WHERE flag_key IN ('ap_voucher_approver_1', 'ap_voucher_approver_2', 'ap_voucher_approver_3');

-- Ensure the roles have proper role codes
UPDATE public.role_catalog
SET role_code = CASE
  WHEN flag_key = 'ap_voucher_approver_1' THEN 'M_AP_VOUCHER_APPR_01'
  WHEN flag_key = 'ap_voucher_approver_2' THEN 'M_AP_VOUCHER_APPR_02' 
  WHEN flag_key = 'ap_voucher_approver_3' THEN 'M_AP_VOUCHER_APPR_03'
  ELSE role_code
END
WHERE flag_key IN ('ap_voucher_approver_1', 'ap_voucher_approver_2', 'ap_voucher_approver_3');

-- Verify the configuration
DO $$
BEGIN
  -- Log the current configuration for debugging
  RAISE NOTICE 'AP Voucher Approver route controls configuration updated';
  
  -- Check if the roles exist and are properly configured
  IF NOT EXISTS (
    SELECT 1 FROM public.role_catalog 
    WHERE flag_key = 'ap_voucher_approver_1' 
    AND requires_route_controls = TRUE
    AND control_spec IS NOT NULL
    AND control_spec != '{}'::jsonb
  ) THEN
    RAISE WARNING 'AP Voucher Approver 1 route controls may not be properly configured';
  END IF;
END $$;