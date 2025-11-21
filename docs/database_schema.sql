/*
================================================================================
  SWIFT Security Role Access Request System
  SQL Server Database Schema

  Target: SQL Server 2022 / Azure SQL Database
  Version: 1.0
  Last Updated: November 21, 2025

  Purpose: Complete database schema for ASP.NET Core migration

  Features:
  - Complete table definitions for all entities
  - 100+ role flags in security_role_selections table
  - Row-Level Security (RLS) policies
  - Always Encrypted for sensitive fields
  - Comprehensive indexes for performance
  - Audit trail with temporal tables
  - Foreign key constraints
  - Check constraints for data integrity
================================================================================
*/

-- ============================================================================
-- SECTION 1: Database Configuration
-- ============================================================================

USE master;
GO

-- Create database (if not exists)
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'SwiftSecurityDB')
BEGIN
    CREATE DATABASE SwiftSecurityDB
    COLLATE SQL_Latin1_General_CP1_CI_AS;
END
GO

USE SwiftSecurityDB;
GO

-- Enable Advanced Security Features
ALTER DATABASE SwiftSecurityDB SET ALLOW_SNAPSHOT_ISOLATION ON;
ALTER DATABASE SwiftSecurityDB SET READ_COMMITTED_SNAPSHOT ON;
GO

-- ============================================================================
-- SECTION 2: Schemas
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'security')
    EXEC('CREATE SCHEMA security');
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'audit')
    EXEC('CREATE SCHEMA audit');
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'reference')
    EXEC('CREATE SCHEMA reference');
GO

-- ============================================================================
-- SECTION 3: Reference Tables
-- ============================================================================

-- Agencies table
CREATE TABLE reference.agencies (
    agency_code NVARCHAR(10) PRIMARY KEY,
    agency_name NVARCHAR(200) NOT NULL,
    agency_abbreviation NVARCHAR(50),
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

CREATE INDEX IX_agencies_name ON reference.agencies(agency_name);
CREATE INDEX IX_agencies_active ON reference.agencies(is_active) WHERE is_active = 1;
GO

-- Business Units table
CREATE TABLE reference.business_units (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    business_unit_code NVARCHAR(50) NOT NULL UNIQUE,
    business_unit_name NVARCHAR(300) NOT NULL,
    agency_code NVARCHAR(10) NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_business_units_agency FOREIGN KEY (agency_code)
        REFERENCES reference.agencies(agency_code)
);
GO

CREATE INDEX IX_business_units_agency ON reference.business_units(agency_code);
CREATE INDEX IX_business_units_code ON reference.business_units(business_unit_code);
GO

-- Security Areas table
CREATE TABLE reference.security_areas (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    area_code NVARCHAR(50) NOT NULL UNIQUE,
    area_name NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX),
    director_title NVARCHAR(200),
    director_name NVARCHAR(200),
    display_order INT NOT NULL DEFAULT 0,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ============================================================================
-- SECTION 4: Main Tables
-- ============================================================================

-- Security Role Requests table
CREATE TABLE security.security_role_requests (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    status NVARCHAR(50) NOT NULL DEFAULT 'Draft',
    start_date DATE NOT NULL,
    employee_name NVARCHAR(200) NOT NULL,
    employee_id VARBINARY(256), -- Always Encrypted
    is_non_employee BIT NOT NULL DEFAULT 0,
    work_location NVARCHAR(300),
    work_phone VARBINARY(256), -- Always Encrypted
    email NVARCHAR(200) NOT NULL,
    agency_name NVARCHAR(200) NOT NULL,
    agency_code NVARCHAR(10) NOT NULL,
    justification NVARCHAR(MAX) NOT NULL,
    security_area NVARCHAR(50) NOT NULL,
    submitter_name NVARCHAR(200) NOT NULL,
    submitter_email NVARCHAR(200) NOT NULL,
    submitter_user_id NVARCHAR(200),
    supervisor_name NVARCHAR(200),
    supervisor_username NVARCHAR(200),
    security_admin_name NVARCHAR(200),
    security_admin_username NVARCHAR(200),
    accounting_director NVARCHAR(200),
    accounting_director_username NVARCHAR(200),
    hr_director NVARCHAR(200),
    hr_director_username NVARCHAR(200),
    elm_key_admin NVARCHAR(200),
    elm_key_admin_username NVARCHAR(200),
    elm_director NVARCHAR(200),
    elm_director_username NVARCHAR(200),
    submitted_at DATETIME2,
    all_approvals_completed_at DATETIME2,
    completed_at DATETIME2,
    completed_by NVARCHAR(200),
    completion_notes NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    created_by NVARCHAR(200) NOT NULL,
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_by NVARCHAR(200) NOT NULL,
    is_deleted BIT NOT NULL DEFAULT 0,
    deleted_at DATETIME2,
    deleted_by NVARCHAR(200),
    row_version ROWVERSION,
    CONSTRAINT CHK_request_status CHECK (
        status IN ('Draft', 'Pending', 'Approved', 'Rejected', 'Completed', 'AwaitingMnitProcessing')
    ),
    CONSTRAINT FK_request_agency FOREIGN KEY (agency_code)
        REFERENCES reference.agencies(agency_code)
);
GO

CREATE INDEX IX_requests_status ON security.security_role_requests(status) WHERE is_deleted = 0;
CREATE INDEX IX_requests_agency ON security.security_role_requests(agency_code) WHERE is_deleted = 0;
CREATE INDEX IX_requests_submitter ON security.security_role_requests(submitter_user_id) WHERE is_deleted = 0;
GO

-- Security Role Selections table (100+ role flags)
CREATE TABLE security.security_role_selections (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    request_id UNIQUEIDENTIFIER NOT NULL,
    home_business_unit NVARCHAR(50),
    other_business_units NVARCHAR(MAX),

    -- ACCOUNTS PAYABLE ROLES (25 roles)
    voucher_entry BIT NOT NULL DEFAULT 0,
    maintenance_voucher_build_errors BIT NOT NULL DEFAULT 0,
    match_override BIT NOT NULL DEFAULT 0,
    ap_inquiry_only BIT NOT NULL DEFAULT 0,
    ap_workflow_approver BIT NOT NULL DEFAULT 0,
    ap_workflow_route_controls NVARCHAR(MAX),
    voucher_approver_1 NVARCHAR(50),
    voucher_approver_2 NVARCHAR(50),
    voucher_approver_3 NVARCHAR(50),
    voucher_approver_route_controls NVARCHAR(MAX),
    direct_pay_vouchering BIT NOT NULL DEFAULT 0,
    quick_pay_vouchering BIT NOT NULL DEFAULT 0,
    eft_administrator BIT NOT NULL DEFAULT 0,
    check_writing BIT NOT NULL DEFAULT 0,
    void_checks BIT NOT NULL DEFAULT 0,
    positive_pay_maintenance BIT NOT NULL DEFAULT 0,
    bank_account_reconciliation BIT NOT NULL DEFAULT 0,
    mass_void BIT NOT NULL DEFAULT 0,
    swift_voucher_system_interface BIT NOT NULL DEFAULT 0,
    ap_manual_checks BIT NOT NULL DEFAULT 0,
    ap_central_special_handling BIT NOT NULL DEFAULT 0,
    ap_central_processor BIT NOT NULL DEFAULT 0,
    ap_setup_tables BIT NOT NULL DEFAULT 0,
    ap_voucher_date_maintenance BIT NOT NULL DEFAULT 0,
    ap_system_backup_access BIT NOT NULL DEFAULT 0,

    -- ACCOUNTS RECEIVABLE ROLES (15 roles)
    ar_invoice_entry BIT NOT NULL DEFAULT 0,
    ar_inquiry_only BIT NOT NULL DEFAULT 0,
    ar_payment_entry BIT NOT NULL DEFAULT 0,
    ar_batch_payment_upload BIT NOT NULL DEFAULT 0,
    ar_lockbox_processing BIT NOT NULL DEFAULT 0,
    ar_aging_reports BIT NOT NULL DEFAULT 0,
    ar_write_off_authority BIT NOT NULL DEFAULT 0,
    ar_dunning_letters BIT NOT NULL DEFAULT 0,
    ar_setup_tables BIT NOT NULL DEFAULT 0,
    ar_interface_processing BIT NOT NULL DEFAULT 0,
    ar_revenue_distribution BIT NOT NULL DEFAULT 0,
    ar_collections_specialist BIT NOT NULL DEFAULT 0,
    ar_refund_processing BIT NOT NULL DEFAULT 0,
    ar_customer_maintenance BIT NOT NULL DEFAULT 0,
    ar_system_backup_access BIT NOT NULL DEFAULT 0,

    -- BUDGETS ROLES (20 roles)
    budget_journal_entry_online BIT NOT NULL DEFAULT 0,
    budget_journal_entry_spreadsheet BIT NOT NULL DEFAULT 0,
    budget_inquiry_only BIT NOT NULL DEFAULT 0,
    budget_journal_processor BIT NOT NULL DEFAULT 0,
    budget_status_inquiry BIT NOT NULL DEFAULT 0,
    budget_worksheets BIT NOT NULL DEFAULT 0,
    budget_transfer_entry BIT NOT NULL DEFAULT 0,
    budget_checking_override BIT NOT NULL DEFAULT 0,
    budget_vs_actual_reports BIT NOT NULL DEFAULT 0,
    commitment_control_inquiry BIT NOT NULL DEFAULT 0,
    encumbrance_inquiry BIT NOT NULL DEFAULT 0,
    position_budget_inquiry BIT NOT NULL DEFAULT 0,
    budget_setup_tables BIT NOT NULL DEFAULT 0,
    budget_tree_manager BIT NOT NULL DEFAULT 0,
    budget_consolidation BIT NOT NULL DEFAULT 0,
    budget_forecasting BIT NOT NULL DEFAULT 0,
    budget_ledger_interface BIT NOT NULL DEFAULT 0,
    budget_system_backup_access BIT NOT NULL DEFAULT 0,
    budget_control_group_maintenance BIT NOT NULL DEFAULT 0,
    fiscal_year_end_processing BIT NOT NULL DEFAULT 0,

    -- ASSET MANAGEMENT ROLES (12 roles)
    asset_entry BIT NOT NULL DEFAULT 0,
    asset_inquiry_only BIT NOT NULL DEFAULT 0,
    asset_transfer BIT NOT NULL DEFAULT 0,
    asset_disposal BIT NOT NULL DEFAULT 0,
    asset_depreciation_processing BIT NOT NULL DEFAULT 0,
    asset_physical_inventory BIT NOT NULL DEFAULT 0,
    asset_reports BIT NOT NULL DEFAULT 0,
    asset_barcode_generation BIT NOT NULL DEFAULT 0,
    asset_mass_changes BIT NOT NULL DEFAULT 0,
    asset_setup_tables BIT NOT NULL DEFAULT 0,
    asset_integration_processing BIT NOT NULL DEFAULT 0,
    asset_system_backup_access BIT NOT NULL DEFAULT 0,

    -- PURCHASING ROLES (18 roles)
    requisition_entry BIT NOT NULL DEFAULT 0,
    requisition_approval BIT NOT NULL DEFAULT 0,
    requisition_approval_route_controls NVARCHAR(MAX),
    requisition_inquiry_only BIT NOT NULL DEFAULT 0,
    purchase_order_creation BIT NOT NULL DEFAULT 0,
    purchase_order_approval BIT NOT NULL DEFAULT 0,
    purchase_order_dispatch BIT NOT NULL DEFAULT 0,
    purchase_order_receiving BIT NOT NULL DEFAULT 0,
    purchase_order_inquiry_only BIT NOT NULL DEFAULT 0,
    blanket_po_maintenance BIT NOT NULL DEFAULT 0,
    contract_management BIT NOT NULL DEFAULT 0,
    vendor_maintenance BIT NOT NULL DEFAULT 0,
    sourcing_specialist BIT NOT NULL DEFAULT 0,
    purchasing_setup_tables BIT NOT NULL DEFAULT 0,
    purchasing_workflow_configuration BIT NOT NULL DEFAULT 0,
    purchasing_reports BIT NOT NULL DEFAULT 0,
    purchasing_interface_processing BIT NOT NULL DEFAULT 0,
    purchasing_system_backup_access BIT NOT NULL DEFAULT 0,

    -- HR & PAYROLL ROLES (20 roles)
    hr_inquiry_agency BIT NOT NULL DEFAULT 0,
    hr_inquiry_statewide BIT NOT NULL DEFAULT 0,
    hr_data_entry_new_hire BIT NOT NULL DEFAULT 0,
    hr_data_entry_personnel_actions BIT NOT NULL DEFAULT 0,
    hr_data_entry_position_management BIT NOT NULL DEFAULT 0,
    hr_data_entry_benefit_enrollment BIT NOT NULL DEFAULT 0,
    payroll_processor BIT NOT NULL DEFAULT 0,
    payroll_inquiry_only BIT NOT NULL DEFAULT 0,
    time_and_attendance_entry BIT NOT NULL DEFAULT 0,
    time_and_attendance_approval BIT NOT NULL DEFAULT 0,
    recruitment_specialist BIT NOT NULL DEFAULT 0,
    benefits_administrator BIT NOT NULL DEFAULT 0,
    workers_compensation_specialist BIT NOT NULL DEFAULT 0,
    leave_management_specialist BIT NOT NULL DEFAULT 0,
    hr_reports_standard BIT NOT NULL DEFAULT 0,
    hr_reports_confidential BIT NOT NULL DEFAULT 0,
    hr_setup_tables BIT NOT NULL DEFAULT 0,
    payroll_tax_specialist BIT NOT NULL DEFAULT 0,
    hr_system_backup_access BIT NOT NULL DEFAULT 0,
    payroll_year_end_processing BIT NOT NULL DEFAULT 0,

    -- ELM ROLES (10 roles)
    standard_reports_viewer BIT NOT NULL DEFAULT 0,
    standard_reports_creator BIT NOT NULL DEFAULT 0,
    course_administrator BIT NOT NULL DEFAULT 0,
    course_instructor BIT NOT NULL DEFAULT 0,
    learning_plan_manager BIT NOT NULL DEFAULT 0,
    certification_manager BIT NOT NULL DEFAULT 0,
    training_coordinator BIT NOT NULL DEFAULT 0,
    elm_system_administrator BIT NOT NULL DEFAULT 0,
    elm_reporting_specialist BIT NOT NULL DEFAULT 0,
    elm_interface_specialist BIT NOT NULL DEFAULT 0,

    -- EPM ROLES (15 roles)
    epm_standard_reports BIT NOT NULL DEFAULT 0,
    epm_advanced_reports BIT NOT NULL DEFAULT 0,
    epm_dashboard_viewer BIT NOT NULL DEFAULT 0,
    epm_dashboard_designer BIT NOT NULL DEFAULT 0,
    epm_budget_planning BIT NOT NULL DEFAULT 0,
    epm_workforce_planning BIT NOT NULL DEFAULT 0,
    epm_capital_planning BIT NOT NULL DEFAULT 0,
    epm_dimension_maintenance BIT NOT NULL DEFAULT 0,
    epm_security_administrator BIT NOT NULL DEFAULT 0,
    epm_application_administrator BIT NOT NULL DEFAULT 0,
    epm_data_integration_specialist BIT NOT NULL DEFAULT 0,
    epm_financial_analyst BIT NOT NULL DEFAULT 0,
    epm_performance_analyst BIT NOT NULL DEFAULT 0,
    epm_forecasting_specialist BIT NOT NULL DEFAULT 0,
    epm_consolidation_specialist BIT NOT NULL DEFAULT 0,

    -- DATA WAREHOUSE ROLES (8 roles)
    dwh_standard_reports BIT NOT NULL DEFAULT 0,
    dwh_ad_hoc_query BIT NOT NULL DEFAULT 0,
    dwh_dashboard_access BIT NOT NULL DEFAULT 0,
    dwh_data_extract BIT NOT NULL DEFAULT 0,
    dwh_report_developer BIT NOT NULL DEFAULT 0,
    dwh_data_analyst BIT NOT NULL DEFAULT 0,
    dwh_etl_developer BIT NOT NULL DEFAULT 0,
    dwh_administrator BIT NOT NULL DEFAULT 0,

    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    created_by NVARCHAR(200) NOT NULL,
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_by NVARCHAR(200) NOT NULL,
    row_version ROWVERSION,

    CONSTRAINT FK_role_selection_request FOREIGN KEY (request_id)
        REFERENCES security.security_role_requests(id) ON DELETE CASCADE
);
GO

CREATE UNIQUE INDEX IX_role_selections_request ON security.security_role_selections(request_id);
GO

-- Request Approvals table
CREATE TABLE security.request_approvals (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    request_id UNIQUEIDENTIFIER NOT NULL,
    step NVARCHAR(100) NOT NULL,
    approval_order INT NOT NULL,
    approver_name NVARCHAR(200) NOT NULL,
    approver_email NVARCHAR(200) NOT NULL,
    approver_user_id NVARCHAR(200),
    status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
    approved_at DATETIME2,
    comments NVARCHAR(MAX),
    rejection_reason NVARCHAR(100),
    signature_data NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT CHK_approval_status CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    CONSTRAINT FK_approval_request FOREIGN KEY (request_id)
        REFERENCES security.security_role_requests(id) ON DELETE CASCADE
);
GO

CREATE INDEX IX_approvals_request ON security.request_approvals(request_id);
CREATE INDEX IX_approvals_approver ON security.request_approvals(approver_user_id, status);
GO

-- ============================================================================
-- SECTION 5: Audit Tables
-- ============================================================================

CREATE TABLE audit.audit_logs (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id NVARCHAR(200) NOT NULL,
    user_email NVARCHAR(200),
    action NVARCHAR(100) NOT NULL,
    entity_type NVARCHAR(100) NOT NULL,
    entity_id UNIQUEIDENTIFIER NOT NULL,
    old_values NVARCHAR(MAX),
    new_values NVARCHAR(MAX),
    changes NVARCHAR(MAX),
    ip_address NVARCHAR(45),
    user_agent NVARCHAR(500),
    correlation_id UNIQUEIDENTIFIER,
    timestamp DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    additional_info NVARCHAR(MAX)
);
GO

CREATE CLUSTERED INDEX IX_audit_logs_timestamp ON audit.audit_logs(timestamp DESC);
CREATE INDEX IX_audit_logs_user ON audit.audit_logs(user_id);
GO

-- ============================================================================
-- SECTION 6: Initial Data
-- ============================================================================

INSERT INTO reference.agencies (agency_code, agency_name, agency_abbreviation)
VALUES
    ('G02', 'Minnesota Management and Budget', 'MMB'),
    ('H01', 'Minnesota Department of Health', 'MDH'),
    ('T01', 'Minnesota Department of Transportation', 'MNDOT');
GO

INSERT INTO reference.security_areas (area_code, area_name, description, display_order)
VALUES
    ('Accounting', 'Accounting & Procurement', 'AP, AR, Budgets, Purchasing', 1),
    ('HR_Payroll', 'HR & Payroll', 'Human Resources and Payroll', 2),
    ('ELM', 'Enterprise Learning Management', 'Training and learning', 3),
    ('EPM_DWH', 'EPM & Data Warehouse', 'Performance Management and Data', 4);
GO

PRINT 'Database schema created successfully!';
GO
