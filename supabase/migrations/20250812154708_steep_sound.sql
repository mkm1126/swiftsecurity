/*
  # Add missing fields to security_role_selections table

  1. New Columns
    - `po_approver` (text) - PO Approver field
    - `po_approver_2` (text) - Second PO Approver field  
    - `po_approver_3` (text) - Third PO Approver field
    - `po_approver_limit_1` (text) - PO Approver limit 1
    - `po_approver_limit_2` (text) - PO Approver limit 2
    - `po_approver_limit_3` (text) - PO Approver limit 3

  2. Security
    - No RLS changes needed as table already has RLS enabled
*/

-- Add missing PO Approver fields
ALTER TABLE security_role_selections 
ADD COLUMN IF NOT EXISTS po_approver text,
ADD COLUMN IF NOT EXISTS po_approver_2 text,
ADD COLUMN IF NOT EXISTS po_approver_3 text,
ADD COLUMN IF NOT EXISTS po_approver_limit_1 text,
ADD COLUMN IF NOT EXISTS po_approver_limit_2 text,
ADD COLUMN IF NOT EXISTS po_approver_limit_3 text;