/*
  # Add Missing Procurement and Vendor Role Columns

  1. Changes to security_role_selections table
    - Add vendor management roles:
      - `vendor_request_add_update` - Vendor Request Add/Update role
      - `vendor_inquiry_only` - Vendor Inquiry Only role
      - `vendor_response` - Create a Vendor Response (RESPOND) role

    - Add procurement/purchasing roles:
      - `po_epro_buyer` - PO/ePRO Buyer role
      - `contract_encumbrance` - Contract Encumbrance role
      - `purchase_order_data_entry` - Purchase Order Data Entry Only role
      - `po_accounting_coordinator` - PO Accounting Coordinator role
      - `core_order_receiver` - CORE Order Receiver role
      - `po_inquiry_only` - PO Inquiry Only role
      - `epro_buyer` - ePRO Buyer role
      - `epro_requisition_requester` - ePRO Requisition Requester role
      - `epro_requisition_inquiry_only` - ePRO Requisition Inquiry Only role
      - `po_approver` - PO Approver workflow role
      - `po_approver_route_controls` - Route Controls for PO Approver
      - `po_receiver` - PO Receiver role

    - Add PCard (Purchasing Card) roles:
      - `pcard_agency_admin` - PCard Agency Administrator
      - `pcard_approver` - PCard Approver
      - `pcard_reconciler` - PCard Reconciler
      - `pcard_reviewer` - PCard Reviewer

    - Add Strategic Sourcing roles:
      - `ss_event_creator_buyer` - Event Creator/Buyer
      - `ss_create_vendor_response` - Create a Vendor Response
      - `ss_event_approver` - Event Approver
      - `ss_event_collaborator` - Event Collaborator
      - `ss_event_inquiry_only` - Event Inquiry Only
      - `ss_business_units` - Business unit(s) for SS
      - `ss_all_origins` - Check here for all origins
      - `ss_selected_origins` - Selected origins
      - `ss_default_business_unit` - Default business unit
      - `ss_default_origin` - Default origin
      - `ss_template_bu_create` - Business unit template create permission
      - `ss_template_bu_update` - Business unit template update permission
      - `ss_template_bu_delete` - Business unit template delete permission
      - `ss_template_dept_create` - Department template create permission
      - `ss_template_dept_update` - Department template update permission
      - `ss_template_dept_delete` - Department template delete permission
      - `ss_template_personal_create` - Personal template create permission
      - `ss_template_personal_update` - Personal template update permission
      - `ss_template_personal_delete` - Personal template delete permission
      - `ss_tech_coord_approver` - Professional || Technical Coordinator Approver
      - `ss_tech_state_approver` - Professional || Technical State Agency Approver
      - `ss_grant_coord_approver` - Grant Coordinator Approver

    - Add Catalog Management roles:
      - `catalog_owner` - Catalog Owner
      - `catalog_management_inquiry_only` - Catalog Management Inquiry Only

  2. Notes
    - All new columns are boolean fields with DEFAULT false
    - Text fields for route controls and configuration data
    - This completes the procurement/purchasing module roles
*/

-- Add Vendor roles
ALTER TABLE public.security_role_selections
ADD COLUMN IF NOT EXISTS vendor_request_add_update boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS vendor_inquiry_only boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS vendor_response boolean DEFAULT false;

-- Add Procurement/Purchasing roles
ALTER TABLE public.security_role_selections
ADD COLUMN IF NOT EXISTS po_epro_buyer boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS contract_encumbrance boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS purchase_order_data_entry boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS po_accounting_coordinator boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS core_order_receiver boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS po_inquiry_only boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS epro_buyer boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS epro_requisition_requester boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS epro_requisition_inquiry_only boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS po_approver boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS po_approver_route_controls text,
ADD COLUMN IF NOT EXISTS po_receiver boolean DEFAULT false;

-- Add PCard roles
ALTER TABLE public.security_role_selections
ADD COLUMN IF NOT EXISTS pcard_agency_admin boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS pcard_approver boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS pcard_reconciler boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS pcard_reviewer boolean DEFAULT false;

-- Add Strategic Sourcing roles
ALTER TABLE public.security_role_selections
ADD COLUMN IF NOT EXISTS ss_event_creator_buyer boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ss_create_vendor_response boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ss_event_approver boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ss_event_collaborator boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ss_event_inquiry_only boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ss_business_units text,
ADD COLUMN IF NOT EXISTS ss_all_origins boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ss_selected_origins text,
ADD COLUMN IF NOT EXISTS ss_default_business_unit text,
ADD COLUMN IF NOT EXISTS ss_default_origin text,
ADD COLUMN IF NOT EXISTS ss_template_bu_create boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ss_template_bu_update boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ss_template_bu_delete boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ss_template_dept_create boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ss_template_dept_update boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ss_template_dept_delete boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ss_template_personal_create boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ss_template_personal_update boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ss_template_personal_delete boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ss_tech_coord_approver boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ss_tech_state_approver boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ss_grant_coord_approver boolean DEFAULT false;

-- Add Catalog Management roles
ALTER TABLE public.security_role_selections
ADD COLUMN IF NOT EXISTS catalog_owner boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS catalog_management_inquiry_only boolean DEFAULT false;
