/*
  # Add Missing EPM Role Codes to Role Catalog

  1. Changes
    - Add 15 missing EPM Data Warehouse role codes to the role_catalog table
    - All roles are set to is_active = true
    - Domain set to 'EPM Data Warehouse'
    - These roles were being selected but had no catalog entries

  2. New Role Codes Added
    - M_EPM_FSCM_LOOKUP (FMS Lookup)
    - M_EPM_FSCM_FINRPT (Year End Financial Reporting)
    - M_EPM_ELM_REPORT (ELM Warehouse Report)
    - M_EPM_HCM_LOOKUP (HCM Lookup)
    - M_EPM_PYRL_FUNDNG_SALARY_FTE (Payroll Funding Salary FTE)
    - M_EPM_PYRL_PAYCHECK_INFO (Payroll Paycheck Info)
    - M_EPM_HR_PRIVATE_DATA_BY_DEPT (Private By Department)
    - M_EPM_PYRL_SS_DATA (Payroll Self Service Data)
    - M_EPM_HR_STATEWIDE_DATA (Statewide Data)
    - M_EPM_RS_REPORT (Recruiting Solutions Data)
    - M_EPM_LABOR_DATA_INC_CHRTFLD (Labor Distribution)
    - M_EPM_SSN_VIEW (SSN View)
    - M_EPM_PYRL_DEDUCTIONS (Payroll Deductions)
    - M_EPM_HR_EXCLUDE_INDICATOR (Data Excluded Employees)
    - M_RAPS_LINK (RAPS Link)
*/

INSERT INTO role_catalog (flag_key, role_code, name, description, domain, is_active, display_order)
VALUES
  ('fms_lookup', 'M_EPM_FSCM_LOOKUP', 'FMS Lookup', 'Access to FMS lookup data in EPM Data Warehouse', 'EPM Data Warehouse', true, 100),
  ('year_end_financial_reporting', 'M_EPM_FSCM_FINRPT', 'Year End Financial Reporting', 'Access to year-end financial reporting data in EPM Data Warehouse', 'EPM Data Warehouse', true, 101),
  ('elm_warehouse_report', 'M_EPM_ELM_REPORT', 'ELM Warehouse Report', 'Access to ELM warehouse reporting data', 'EPM Data Warehouse', true, 102),
  ('hcm_lookup', 'M_EPM_HCM_LOOKUP', 'HCM Lookup', 'Access to HCM lookup data in EPM Data Warehouse', 'EPM Data Warehouse', true, 103),
  ('payroll_funding_salary_fte', 'M_EPM_PYRL_FUNDNG_SALARY_FTE', 'Payroll Funding Salary FTE', 'Access to payroll funding, salary, and FTE data', 'EPM Data Warehouse', true, 104),
  ('payroll_paycheck_info', 'M_EPM_PYRL_PAYCHECK_INFO', 'Payroll Paycheck Info', 'Access to payroll paycheck information', 'EPM Data Warehouse', true, 105),
  ('private_by_department', 'M_EPM_HR_PRIVATE_DATA_BY_DEPT', 'Private By Department', 'Access to private HR data by department', 'EPM Data Warehouse', true, 106),
  ('payroll_self_service_data', 'M_EPM_PYRL_SS_DATA', 'Payroll Self Service Data', 'Access to payroll self-service data', 'EPM Data Warehouse', true, 107),
  ('statewide_data', 'M_EPM_HR_STATEWIDE_DATA', 'Statewide Data', 'Access to statewide HR data', 'EPM Data Warehouse', true, 108),
  ('recruiting_solutions_data', 'M_EPM_RS_REPORT', 'Recruiting Solutions Data', 'Access to recruiting solutions reporting data', 'EPM Data Warehouse', true, 109),
  ('labor_distribution', 'M_EPM_LABOR_DATA_INC_CHRTFLD', 'Labor Distribution', 'Access to labor distribution data including chartfields', 'EPM Data Warehouse', true, 110),
  ('ssn_view', 'M_EPM_SSN_VIEW', 'SSN View', 'Access to view Social Security Numbers', 'EPM Data Warehouse', true, 111),
  ('payroll_deductions', 'M_EPM_PYRL_DEDUCTIONS', 'Payroll Deductions', 'Access to payroll deductions data', 'EPM Data Warehouse', true, 112),
  ('data_excluded_employees', 'M_EPM_HR_EXCLUDE_INDICATOR', 'Data Excluded Employees', 'Access to data for excluded employees', 'EPM Data Warehouse', true, 113),
  ('raps_link', 'M_RAPS_LINK', 'RAPS Link', 'Access to RAPS link functionality', 'EPM Data Warehouse', true, 114)
ON CONFLICT (flag_key) DO NOTHING;
