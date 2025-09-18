/*
  # Fix AP Voucher Approver Route Controls

  1. Configuration Updates
    - Update role_catalog entry for ap_voucher_approver_1_route_controls
    - Set requires_route_controls = true and is_active = true
    - Configure control_spec with proper voucher approver fields
    
  2. Route Control Fields
    - voucher_approver_1: Email addresses for first level approvers
    - voucher_approver_2: Email addresses for second level approvers  
    - voucher_approver_3: Email addresses for third level approvers
    
  3. Data Integrity
    - Uses IF NOT EXISTS checks to prevent conflicts
    - Handles existing records gracefully
*/

-- Step 1: Check and insert the route controls role if it doesn't exist
INSERT INTO public.role_catalog (
  flag_key,
  role_code,
  name,
  form_name,
  ps_name,
  description,
  domain,
  requires_route_controls,
  control_spec,
  display_order,
  active,
  is_active
)
SELECT 
  'ap_voucher_approver_1_route_controls',
  'M_AP_VOUCHER_ROUTE_CTRL',
  'AP Voucher Approver Route Controls',
  'ap_voucher_approver_route_controls',
  NULL,
  'Route controls for AP voucher approval workflow',
  'accounting_procurement',
  TRUE,
  '{
    "controls": [
      {
        "column": "voucher_approver_1",
        "label": "Voucher Approver 1 Email(s)",
        "type": "multiselect",
        "options": [],
        "required": false,
        "hint": "Enter email address(es) for first level voucher approvers",
        "placeholder": "approver1@agency.gov"
      },
      {
        "column": "voucher_approver_2", 
        "label": "Voucher Approver 2 Email(s)",
        "type": "multiselect",
        "options": [],
        "required": false,
        "hint": "Enter email address(es) for second level voucher approvers",
        "placeholder": "approver2@agency.gov"
      },
      {
        "column": "voucher_approver_3",
        "label": "Voucher Approver 3 Email(s)", 
        "type": "multiselect",
        "options": [],
        "required": false,
        "hint": "Enter email address(es) for third level voucher approvers",
        "placeholder": "approver3@agency.gov"
      }
    ]
  }'::jsonb,
  125,
  TRUE,
  TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.role_catalog 
  WHERE flag_key = 'ap_voucher_approver_1_route_controls'
);

-- Step 2: Update existing entry if it exists but is misconfigured
UPDATE public.role_catalog
SET
  requires_route_controls = TRUE,
  is_active = TRUE,
  active = TRUE,
  role_code = 'M_AP_VOUCHER_ROUTE_CTRL',
  control_spec = '{
    "controls": [
      {
        "column": "voucher_approver_1",
        "label": "Voucher Approver 1 Email(s)",
        "type": "multiselect", 
        "options": [],
        "required": false,
        "hint": "Enter email address(es) for first level voucher approvers",
        "placeholder": "approver1@agency.gov"
      },
      {
        "column": "voucher_approver_2",
        "label": "Voucher Approver 2 Email(s)",
        "type": "multiselect",
        "options": [],
        "required": false,
        "hint": "Enter email address(es) for second level voucher approvers", 
        "placeholder": "approver2@agency.gov"
      },
      {
        "column": "voucher_approver_3",
        "label": "Voucher Approver 3 Email(s)",
        "type": "multiselect",
        "options": [],
        "required": false,
        "hint": "Enter email address(es) for third level voucher approvers",
        "placeholder": "approver3@agency.gov"
      }
    ]
  }'::jsonb
WHERE flag_key = 'ap_voucher_approver_1_route_controls';

-- Step 3: Update the main AP voucher approver roles to have correct role_codes
UPDATE public.role_catalog
SET
  role_code = CASE
    WHEN id = 'e5383f81-e298-4ef7-8a99-7c4cf0118fb8' THEN 'M_AP_VOUCHER_APPR_01'
    WHEN id = 'b9181c95-7a51-4712-85d9-40883eb65769' THEN 'M_AP_VOUCHER_APPR_02' 
    WHEN id = 'a6d673e4-eca9-4ffd-b7eb-ca3c091a0bc1' THEN 'M_AP_VOUCHER_APPR_03'
    ELSE role_code
  END,
  ps_name = NULL,
  updated_at = now()
WHERE
  id IN (
    'e5383f81-e298-4ef7-8a99-7c4cf0118fb8',
    'b9181c95-7a51-4712-85d9-40883eb65769', 
    'a6d673e4-eca9-4ffd-b7eb-ca3c091a0bc1'
  );

-- Step 4: Clean up any conflicting role_code entries that might exist
DELETE FROM public.role_catalog
WHERE role_code IN ('M_AP_VOUCHER_APPR_01', 'M_AP_VOUCHER_APPR_02', 'M_AP_VOUCHER_APPR_03')
  AND flag_key IN ('M_FS_WF_AP_APPR_01', 'M_FS_WF_AP_APPR_02', 'M_FS_WF_AP_APPR_03');