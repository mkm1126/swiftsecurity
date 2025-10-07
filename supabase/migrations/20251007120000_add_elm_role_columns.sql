/*
  # Add Missing ELM Role Columns to Security Role Selections

  1. New Columns
    - `learning_administrator` (boolean) - Learning Administrator role with expanded menu access
    - `learning_catalog_administrator` (boolean) - Manages Learner Groups, Programs, Courses, and Classes
    - `roster_administrator` (boolean) - Administers Class and Program rosters, creates announcements, runs reports
    - `enrollment_administrator` (boolean) - Enrolls learners, maintains learning requests, monitors approvals
    - `maintain_approvals` (boolean) - Access to Learner Task folder for monitoring and maintaining approvals
    - `profile_administrator` (boolean) - Manages User Profiles, External learner profiles, and reporting relationships
    - `m_hr_external_learner_security` (boolean) - Part of External Learner Security Administrator role
    - `m_lmlelm_external_learning_adm` (boolean) - Part of External Learner Security Administrator role

  2. Role Code Mappings
    - learning_administrator: M_LMLELM_Learning_Administrator
    - learning_catalog_administrator: M_LMLELM_Learning_Catalog_Adm
    - roster_administrator: M_LMLELM_Roster_Administrator
    - enrollment_administrator: M_LMLELM_Enrollment_Administrator
    - maintain_approvals: M_LMLELM_Maintain_Approvals
    - profile_administrator: M_LMLELM_Profile_Administrator
    - m_hr_external_learner_security: M_HR_External_Learner_Security
    - m_lmlelm_external_learning_adm: M_LMLELM_External_Learning_Adm

  3. Notes
    - These columns correspond to the actual ELM roles defined in ElmRoleSelectionPage.tsx
    - system_backup_access already exists for Sandbox Access (M_ELM_TRAINING_LINK)
    - The External Learner Security Administrator UI checkbox maps to BOTH m_hr_external_learner_security
      and m_lmlelm_external_learning_adm columns as per the original requirements
    - All columns default to false to maintain data integrity

  4. Security
    - All new columns inherit existing RLS policies from security_role_selections table
    - No additional policies required
*/

-- Add ELM Administrative Role columns
ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS learning_administrator boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS learning_catalog_administrator boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS roster_administrator boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS enrollment_administrator boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS maintain_approvals boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS profile_administrator boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS m_hr_external_learner_security boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS m_lmlelm_external_learning_adm boolean DEFAULT false;

-- Create index for better query performance on ELM roles
CREATE INDEX IF NOT EXISTS idx_security_role_selections_elm_admin_roles
  ON public.security_role_selections(
    learning_administrator,
    learning_catalog_administrator,
    roster_administrator,
    enrollment_administrator,
    maintain_approvals,
    profile_administrator
  );

-- Add comment to document the relationship between UI and database columns
COMMENT ON COLUMN public.security_role_selections.m_hr_external_learner_security IS
  'Part of External Learner Security Administrator role. Both m_hr_external_learner_security and m_lmlelm_external_learning_adm are set together when the External Learner Security Administrator checkbox is selected.';

COMMENT ON COLUMN public.security_role_selections.m_lmlelm_external_learning_adm IS
  'Part of External Learner Security Administrator role. Both m_hr_external_learner_security and m_lmlelm_external_learning_adm are set together when the External Learner Security Administrator checkbox is selected.';
