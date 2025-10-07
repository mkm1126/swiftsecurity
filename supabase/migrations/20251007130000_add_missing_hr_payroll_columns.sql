/*
  # Add Missing HR/Payroll Role Columns to Security Role Selections

  1. New Columns
    - Human Resources Components (middle/right columns)
      - `health_safety_view` (boolean) - Health & Safety View access
      - `job_data_correct` (boolean) - Job Data Correct permission
      - `job_data_update` (boolean) - Job Data Update permission
      - `job_data_view` (boolean) - Job Data View only access
      - `labor_relations_update` (boolean) - Labor Relations Update permission
      - `labor_relations_view` (boolean) - Labor Relations View access
      - `manage_competencies_update` (boolean) - Manage Competencies Update permission
      - `manage_competencies_view` (boolean) - Manage Competencies View access
      - `personal_data_correct` (boolean) - Personal Data Correct permission
      - `personal_data_update` (boolean) - Personal Data Update permission
      - `personal_data_view` (boolean) - Personal Data View only access
      - `physical_exams_update` (boolean) - Physical Exams Update permission
      - `physical_exams_view` (boolean) - Physical Exams View access
      - `position_data_correct` (boolean) - Position Data Correct permission
      - `position_data_update` (boolean) - Position Data Update permission
      - `position_data_view` (boolean) - Position Data View only access
      - `position_funding_correct` (boolean) - Position Funding Correct permission
      - `position_funding_update` (boolean) - Position Funding Update permission
      - `position_funding_view` (boolean) - Position Funding View only access

  2. Notes
    - These columns correspond to the HR middle/right column roles in HrPayrollRoleSelectionPage.tsx
    - All columns were added to ROLE_FLAG_KEYS array (lines 202-221) but missing from database
    - The code comment says "HR middle/right column (newly wired)" indicating recent addition
    - All columns default to false to maintain data integrity

  3. Security
    - All new columns inherit existing RLS policies from security_role_selections table
    - No additional policies required
*/

-- Add HR middle/right column role fields
ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS health_safety_view boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS job_data_correct boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS job_data_update boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS job_data_view boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS labor_relations_update boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS labor_relations_view boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS manage_competencies_update boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS manage_competencies_view boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS personal_data_correct boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS personal_data_update boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS personal_data_view boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS physical_exams_update boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS physical_exams_view boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS position_data_correct boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS position_data_update boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS position_data_view boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS position_funding_correct boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS position_funding_update boolean DEFAULT false;

ALTER TABLE public.security_role_selections
  ADD COLUMN IF NOT EXISTS position_funding_view boolean DEFAULT false;

-- Create index for better query performance on HR additional roles
CREATE INDEX IF NOT EXISTS idx_security_role_selections_hr_extended_roles
  ON public.security_role_selections(
    health_safety_view,
    job_data_correct,
    labor_relations_update,
    manage_competencies_update,
    personal_data_correct,
    physical_exams_update,
    position_data_correct,
    position_funding_correct
  );

-- Add comments to document these role groups
COMMENT ON COLUMN public.security_role_selections.health_safety_view IS
  'HR Component: Health & Safety view-only access';

COMMENT ON COLUMN public.security_role_selections.job_data_correct IS
  'HR Component: Job Data correction permission (includes update and view)';

COMMENT ON COLUMN public.security_role_selections.personal_data_correct IS
  'HR Component: Personal Data correction permission (includes update and view)';

COMMENT ON COLUMN public.security_role_selections.position_data_correct IS
  'HR Component: Position Data correction permission (includes update and view)';

COMMENT ON COLUMN public.security_role_selections.position_funding_correct IS
  'HR Component: Position Funding correction permission (includes update and view)';
