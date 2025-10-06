/*
  # Fix Missing Role Codes for Cash Maintenance and Journal Approver Roles

  1. Role Code Updates
    - Cash Maintenance (AR) → M_FS_AR_ACCT_CASH_MAINT
    - Cash Maintenance (CM) → M_FS_AR_ACCT_CASH_MAINT
    - Journal Approver Appr → M_FS_WF_KK_JRNL_AP_01
    - Journal Approver Rev → M_FS_WF_KK_JRNL_RB_01

  2. Changes Made
    - Update role_code for ar_acct_cash_maint
    - Update role_code for cm_cash_maintenance
    - Update role_code for kk_journal_approver_appr
    - Update role_code for kk_journal_approver_rev

  3. Notes
    - Both AR and CM Cash Maintenance use the same role code
    - Journal Approver roles follow the workflow naming pattern
    - Updates only affect role_code field, preserving all other data
*/

-- Update Cash Maintenance for AR (Accounts Receivable)
UPDATE public.role_catalog
SET
  role_code = 'M_FS_AR_ACCT_CASH_MAINT',
  updated_at = now()
WHERE flag_key = 'ar_acct_cash_maint'
  AND (role_code IS NULL OR role_code != 'M_FS_AR_ACCT_CASH_MAINT');

-- Update Cash Maintenance for CM (Cash Management)
UPDATE public.role_catalog
SET
  role_code = 'M_FS_AR_ACCT_CASH_MAINT',
  updated_at = now()
WHERE flag_key = 'cm_cash_maintenance'
  AND (role_code IS NULL OR role_code != 'M_FS_AR_ACCT_CASH_MAINT');

-- Update Journal Approver Appropriation
UPDATE public.role_catalog
SET
  role_code = 'M_FS_WF_KK_JRNL_AP_01',
  updated_at = now()
WHERE flag_key = 'kk_journal_approver_appr'
  AND (role_code IS NULL OR role_code != 'M_FS_WF_KK_JRNL_AP_01');

-- Update Journal Approver Revenue
UPDATE public.role_catalog
SET
  role_code = 'M_FS_WF_KK_JRNL_RB_01',
  updated_at = now()
WHERE flag_key = 'kk_journal_approver_rev'
  AND (role_code IS NULL OR role_code != 'M_FS_WF_KK_JRNL_RB_01');
