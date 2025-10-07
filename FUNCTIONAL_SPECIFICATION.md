# SWIFT Security Role Access Request Application
## Functional Specification Document

**Version:** 1.0
**Last Updated:** October 7, 2025
**Project Status:** Production Ready

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [User Roles and Personas](#user-roles-and-personas)
4. [Feature Specifications](#feature-specifications)
5. [User Workflows](#user-workflows)
6. [Database Schema](#database-schema)
7. [Security and Access Control](#security-and-access-control)
8. [User Interface Specifications](#user-interface-specifications)
9. [Integration Points](#integration-points)
10. [Testing Requirements](#testing-requirements)
11. [Deployment and Operations](#deployment-and-operations)
12. [Appendices](#appendices)

---

## 1. Executive Summary

### 1.1 Purpose
The SWIFT Security Role Access Request Application is a web-based system designed to streamline and manage security role access requests for Minnesota's Statewide Systems. The application replaces manual paper-based processes with a digital workflow that includes electronic signatures, automated routing, and comprehensive audit trails.

### 1.2 Scope
This system handles security access requests for four primary security areas:
- **Accounting/Procurement** - Financial management system access
- **HR/Payroll** - Human resources and payroll system access
- **EPM Data Warehouse** - Enterprise performance management data access
- **ELM (Enterprise Learning Management)** - Learning management system administration

### 1.3 Key Benefits
- Streamlined request submission with guided workflows
- Digital signature capture for all approvals
- Automated email notifications to approvers
- Comprehensive request tracking and audit trails
- Role-based access control with detailed permission settings
- Integration with existing SWIFT systems

---

## 2. System Overview

### 2.1 Architecture
The application is built as a modern single-page application (SPA) with the following technology stack:

**Frontend:**
- React 18 with TypeScript for type-safe development
- Tailwind CSS for responsive styling
- React Hook Form for form validation and management
- React Router DOM for navigation
- Lucide React for consistent iconography

**Backend/Database:**
- Supabase (PostgreSQL) for data persistence
- Row Level Security (RLS) for access control
- Real-time subscriptions for status updates

**Build & Deploy:**
- Vite for fast development and optimized production builds
- Docker containerization for consistent deployments
- Nginx for production web serving

### 2.2 Core Components

#### 2.2.1 Request Management
- Create new security role access requests
- Edit existing requests in draft status
- View detailed request information
- Track request status through approval workflow
- Search and filter request lists

#### 2.2.2 Role Selection
Four specialized role selection interfaces:
- **Accounting/Procurement Roles** - Financial system permissions
- **HR/Payroll Roles** - HR and payroll data access
- **EPM Data Warehouse Roles** - Reporting and analytics access
- **ELM Roles** - Learning management administration

#### 2.2.3 Approval Workflow
Multi-step approval process:
1. Supervisor approval
2. Security administrator approval
3. Area-specific director approval (when required)
4. MNIT final processing

#### 2.2.4 Signature Capture
Digital signature functionality for:
- Supervisors
- Security administrators
- Directors
- MNIT personnel

---

## 3. User Roles and Personas

### 3.1 Request Submitter
**Description:** Employee or designated submitter who initiates access requests

**Capabilities:**
- Fill out initial request form
- Select security area
- Choose individual roles or copy from existing user
- Submit request for approval
- View status of submitted requests
- Edit requests in draft status

**Example:** Agency HR staff submitting request for new employee

### 3.2 Employee (Request Subject)
**Description:** Individual who will receive the security access

**Information Collected:**
- Full name
- Employee ID (if employee) or non-employee type
- Email address
- Work location
- Work phone
- Start date
- Access end date (for non-employees)

### 3.3 Supervisor
**Description:** Direct supervisor who approves access need

**Capabilities:**
- Review request details
- Approve or reject requests
- Provide digital signature
- Add approval comments

**Notification:** Email notification when request is submitted

### 3.4 Security Administrator
**Description:** Agency security administrator who validates role selections

**Capabilities:**
- Review all request details
- Verify role appropriateness
- Approve or reject requests
- Provide digital signature
- Add technical notes

**Notification:** Email notification after supervisor approval

### 3.5 Director
**Description:** Area-specific director (ELM, HR, Accounting) who provides final approval

**Capabilities:**
- Review high-level access requests
- Approve or reject requests
- Provide digital signature
- Add executive comments

**Notification:** Email notification after security admin approval (when required)

### 3.6 MNIT Personnel
**Description:** State IT staff who process approved requests

**Capabilities:**
- View all approved requests
- Access MNIT-specific details page
- Mark requests as completed
- Generate provisioning reports
- Access audit trails

---

## 4. Feature Specifications

### 4.1 Initial Request Form

#### 4.1.1 Employee Information Section

**Fields:**
- **Start Date** (Required)
  - Date picker
  - Must be today or future date
  - Validation: Cannot be in the past

- **Employee Name** (Required)
  - Text input
  - Full legal name
  - Validation: Minimum 2 characters

- **Employee ID** (Conditional)
  - Text input
  - Required for employees
  - Optional for non-employees
  - Format: Agency-specific format

- **Employee Type** (Required)
  - Checkbox: "This is a non-employee"
  - Reveals additional fields when checked

- **Work Location** (Optional)
  - Text input
  - Physical office location

- **Work Phone** (Optional)
  - Text input
  - Format: (###) ###-####

- **Email** (Required)
  - Email input
  - Validation: Valid email format
  - Used for notifications

#### 4.1.2 Agency Information Section

**Fields:**
- **Agency** (Required)
  - Searchable dropdown
  - Data source: agency-listing-table.csv
  - Displays agency name and code
  - Updates business unit options

- **Justification** (Optional)
  - Multi-line text area
  - Business reason for access
  - Recommended for audit purposes

#### 4.1.3 Submitter Information Section

**Fields:**
- **Submitter Name** (Required)
  - Text input
  - Person filling out the form
  - Pre-filled in test mode

- **Submitter Email** (Required)
  - Email input
  - Contact for questions
  - Pre-filled in test mode

#### 4.1.4 Approver Information Section

**Fields:**
- **Supervisor Name** (Required)
  - Text input
  - Direct supervisor of employee

- **Supervisor Username** (Required)
  - Text input
  - SWIFT username
  - Used for email notifications

- **Security Administrator Name** (Required)
  - Text input
  - Agency security contact

- **Security Administrator Username** (Required)
  - Text input
  - SWIFT username
  - Used for email notifications

#### 4.1.5 Security Area Selection

**Options:**
- Accounting/Procurement
- HR/Payroll
- EPM Data Warehouse
- ELM (Enterprise Learning Management)

**Behavior:**
- Single selection only
- Radio button interface
- Each area has specialized fields
- Selection determines role selection page

#### 4.1.6 Area-Specific Fields

**Accounting/Procurement:**
- Accounting Director Name
- Accounting Director Username

**HR/Payroll:**
- HR Mainframe Logon ID
- "View All State Agencies?" checkbox
- HR Director Name
- HR Director Email

**ELM:**
- Key Administrator Name
- Key Administrator Username
- ELM Director Name
- ELM Director Email

#### 4.1.7 Copy User Feature

**Purpose:** Copy role assignments from existing user

**Fields:**
- **Copy From User** (Checkbox)
  - Enables copy functionality
  - Reveals additional fields

- **Copy User Name** (Conditional)
  - Text input
  - Name of user to copy from

- **Copy User Employee ID** (Conditional)
  - Text input
  - Employee ID to reference

- **Copy User SEMA4 ID** (Conditional)
  - Text input
  - SEMA4 system identifier

**Behavior:**
- Bypasses individual role selection
- Copies all roles from specified user
- Still requires approvals
- Shows copied roles in summary

#### 4.1.8 Non-Employee Fields

**Conditional Fields (when "Non-Employee" checked):**

- **Non-Employee Type** (Required)
  - Dropdown selection:
    - Contractor
    - Consultant
    - Intern
    - Temporary Worker
    - Vendor
    - Other

- **Access End Date** (Required)
  - Date picker
  - Must be future date
  - Must be after Start Date
  - Triggers access expiration

- **Security Measures** (Required)
  - Multi-line text area
  - Document background check status
  - Document training completion
  - Document security agreement

### 4.2 Role Selection Pages

#### 4.2.1 Accounting/Procurement Roles

**Categories:**

**Accounts Payable**
- Voucher Entry
- Voucher Approver (Levels 1, 2, 3)
- Maintenance Voucher Build Errors
- Match Override
- AP Inquiry Only
- AP Workflow Approver (with route controls)

**Accounts Receivable and Cash Management**
- Cash Maintenance
- Receivable Specialist
- Receivable Supervisor (with business unit specification)
- Billing Create
- Billing Specialist
- Billing Supervisor (with business unit specification)
- Customer Maintenance Specialist
- AR Billing Setup
- AR Billing Inquiry Only
- Cash Management Inquiry Only

**Budgets/Commitment Control**
- Budget Journal Entry (Online)
- Budget Journal Load
- Journal Approver (with appropriation sources)
- Budget Transfer Entry (Online)
- Transfer Approver (with appropriation sources)
- Budget Inquiry Only

**General Ledger**
- Journal Entry (Online)
- Journal Load
- Agency Chartfield Maintenance
- GL Agency Approver (with sources)
- General Ledger Inquiry Only
- nVision Reporting Agency User
- Daily Receipts Report

**Grants Management**
- Award Data Entry
- Grant Fiscal Manager
- Program Manager
- GM Agency Setup
- Grants Inquiry Only

**Project Costing**
- Federal Project Initiator
- OIM Initiator
- Project Initiator
- Project Manager
- Capital Programs Office
- Project Cost Accountant
- Project Fixed Asset
- Category/Subcategory Manager
- Project Control Dates
- Project Accounting Systems
- MnDOT Projects Inquiry
- Projects Inquiry Only
- MnDOT Project Approver (with route control)

**Cost Allocation**
- Cost Allocation Inquiry Only

**Asset Management**
- Financial Accountant - Assets
- Asset Management Inquiry Only
- Physical Inventory Approval Level 1 (with business units)
- Physical Inventory Approval Level 2 (with department IDs)

**Inventory**
- Inventory Express Issue
- Inventory Adjustment Approver
- Inventory Replenishment Buyer
- Inventory Control Worker
- Inventory Express Putaway
- Inventory Fulfillment Specialist
- Inventory PO Receiver
- Inventory Returns Receiver
- Inventory Cost Adjustment
- Inventory Materials Manager
- Inventory Delivery
- Inventory Inquiry Only
- Inventory Configuration Agency
- Inventory Pick Plan Report Distribution
- Ship To Location (specification)
- Inventory Business Units (specification)

#### 4.2.2 HR/Payroll Roles

**Categories:**

**HR Inquiry**
- HR Inquiry - Agency
- HR Inquiry - Statewide

**Payroll**
- Payroll Processor
- Payroll Inquiry
- Payroll Tax Administrator

**Position Management**
- Position Management Analyst
- Position Budget Manager

**Recruitment**
- Recruiting Coordinator
- Hiring Manager Access

**Benefits Administration**
- Benefits Administrator
- Benefits Inquiry

**Time and Attendance**
- Timekeeper
- Time Administrator

#### 4.2.3 EPM Data Warehouse Roles

**Categories:**

**Reporting Access**
- Standard Reports Viewer
- Custom Report Developer
- Dashboard Access

**Data Access**
- Financial Data Viewer
- HR Data Viewer
- Operational Data Viewer
- Executive Dashboard Access

**Administration**
- Report Administrator
- Data Refresh Monitor

#### 4.2.4 ELM Roles

**Categories:**

**Learning Administration**
- Course Administrator
- Curriculum Manager
- Instructor Access

**Reporting**
- Training Reports Viewer
- Compliance Reports Access

**System Administration**
- ELM System Administrator
- Integration Manager

### 4.3 Business Unit Selection

**Purpose:** Specify which organizational units the user can access

**Features:**
- Multi-select dropdown
- Searchable interface
- Agency-filtered options
- Data source: Business Unit List 07092025.csv
- Home business unit (required)
- Additional business units (optional)

**Validation:**
- At least one business unit required
- Home business unit must be selected
- Cannot exceed system limits

### 4.4 Approval Workflow

#### 4.4.1 Workflow States

**Request States:**
1. **Draft** - Request created but not submitted
2. **Pending Supervisor** - Awaiting supervisor approval
3. **Pending Security Admin** - Awaiting security administrator approval
4. **Pending Director** - Awaiting director approval (when required)
5. **Pending MNIT** - Awaiting MNIT processing
6. **Completed** - Access provisioned
7. **Rejected** - Request denied at any stage

#### 4.4.2 Approval Steps

**Step 1: Supervisor Approval**
- Email notification sent to supervisor
- Review employee information
- Review role selections
- Provide digital signature
- Option to add comments
- Can approve or reject

**Step 2: Security Administrator Approval**
- Email notification after supervisor approval
- Review all request details
- Verify role appropriateness
- Check for security conflicts
- Provide digital signature
- Option to add technical notes
- Can approve or reject

**Step 3: Director Approval (Conditional)**
- Required for certain high-level roles
- Required for statewide access
- Email notification after security admin approval
- Executive-level review
- Provide digital signature
- Option to add executive comments
- Can approve or reject

**Step 4: MNIT Processing**
- Final provisioning step
- Access MNIT details page
- Generate provisioning reports
- Execute access in SWIFT systems
- Mark as completed
- Document completion date

#### 4.4.3 Email Notifications

**Trigger Events:**
- Request submitted (to supervisor)
- Supervisor approved (to security admin)
- Security admin approved (to director if required, or MNIT)
- Director approved (to MNIT)
- Request rejected (to submitter)
- Request completed (to employee and submitter)

**Email Content:**
- Request ID
- Employee name
- Security area
- Link to approval page
- Summary of roles requested
- Urgency indicator (based on start date)

### 4.5 Signature Capture

#### 4.5.1 Signature Interface

**Features:**
- HTML5 canvas-based drawing
- Touch-enabled for tablets
- Mouse-enabled for desktop
- Clear/retry functionality
- Preview before submission
- High-resolution capture

**Validation:**
- Cannot be blank
- Minimum stroke requirement
- Must match approver identity
- Timestamp captured

**Storage:**
- Stored as base64-encoded image
- Linked to specific approval step
- Included in audit trail
- Available for PDF generation

#### 4.5.2 Signature Fields

**Captured with Signature:**
- Approver name (auto-filled)
- Approval date/time (auto-captured)
- Approval status (approve/reject)
- Comments (optional)

### 4.6 Request List and Management

#### 4.6.1 Request List View

**Display Columns:**
- Request ID (clickable)
- Employee Name
- Agency
- Security Area
- Status
- Submitted Date
- Last Updated
- Actions

**Features:**
- Sortable columns
- Search functionality
- Filter by status
- Filter by security area
- Filter by date range
- Pagination

**Action Buttons:**
- View Details
- Edit (draft only)
- Delete (draft only)
- Resume (draft only)

#### 4.6.2 Request Details View

**Information Displayed:**
- All employee information
- All submitter information
- All approver information
- Selected security area
- Selected roles with descriptions
- Approval history
- Digital signatures
- Audit trail
- Current status

**Actions Available:**
- Print request
- Export to PDF
- Send reminder email
- Cancel request (draft only)
- Edit request (draft only)

### 4.7 MNIT Details Page

#### 4.7.1 Purpose
Specialized view for MNIT personnel to process approved requests

#### 4.7.2 Information Displayed

**Employee Details:**
- Full name
- Employee ID
- Email
- Work location
- Start date
- Access end date (if applicable)

**Technical Details:**
- Security area
- All selected roles with technical codes
- Business units with codes
- Mainframe logon ID (if applicable)
- SEMA4 ID (if applicable)

**Approval Chain:**
- All approvers with signatures
- Approval dates/times
- Approval comments

**Provisioning Information:**
- SWIFT user creation checklist
- Role assignment checklist
- Access verification steps
- Training requirements

#### 4.7.3 Actions

**Complete Request:**
- Mark as completed
- Document completion date
- Trigger completion emails
- Archive request

**Generate Reports:**
- Provisioning worksheet
- Audit report
- Access summary

### 4.8 Test Mode Features

#### 4.8.1 Purpose
Enable testing and demonstration without affecting production data

#### 4.8.2 Features

**User Session Management:**
- Simulate different user identities
- Pre-fill form fields
- Isolate test data
- Quick user switching

**Auto-Approval:**
- Bypass approval workflow
- Instant approval simulation
- Test completion process
- Rapid workflow testing

**Data Management:**
- Clear test data
- Reset to clean state
- Preserve production data
- Export test scenarios

---

## 5. User Workflows

### 5.1 Submit New Request Workflow

**Steps:**
1. Navigate to application home page
2. Click "New Request" or access root URL
3. Fill out employee information
4. Select agency from dropdown
5. Enter submitter details
6. Enter approver information
7. Select security area (single choice)
8. Fill area-specific fields if shown
9. Choose copy user OR individual roles
10. Click "Select or Copy Individual Roles"
11. On role selection page, choose specific roles
12. Configure role-specific options (approvers, business units, etc.)
13. Review role selections summary
14. Click "Submit for Approval"
15. Review confirmation page
16. Navigate to signatures for approval flow

**Alternative Path - Copy User:**
- At step 9, enable "Copy From User"
- Enter user details to copy
- Skip individual role selection
- Proceed to submission

### 5.2 Supervisor Approval Workflow

**Steps:**
1. Receive email notification with approval link
2. Click link to open signature page
3. Review employee information
4. Review role selections
5. Verify business need
6. Add comments if needed
7. Sign using digital signature pad
8. Click "Approve" or "Reject"
9. Receive confirmation
10. Email sent to next approver

### 5.3 Edit Existing Request Workflow

**Steps:**
1. Navigate to Request List page
2. Find request in draft status
3. Click "Edit" button
4. System loads request data
5. Main form populated with saved data
6. Make changes as needed
7. Click "Save and Verify Role Selection"
8. Navigate to role selection page
9. Previous selections pre-checked
10. Modify role selections
11. Click "Save Changes"
12. Return to main form or submit

### 5.4 MNIT Processing Workflow

**Steps:**
1. Access approved requests list
2. Select request for processing
3. Click "MNIT Details" link
4. Review all provisioning information
5. Access SWIFT systems
6. Create user accounts
7. Assign roles per request
8. Verify access in test environment
9. Return to MNIT details page
10. Click "Mark as Complete"
11. Enter completion notes
12. Submit completion
13. Completion emails sent

---

## 6. Database Schema

### 6.1 Tables

#### 6.1.1 security_role_requests

**Purpose:** Main table storing request header information

**Columns:**
- `id` (UUID, Primary Key) - Unique request identifier
- `created_at` (Timestamp) - Creation timestamp
- `updated_at` (Timestamp) - Last update timestamp
- `start_date` (Date) - Employee start date
- `employee_name` (Text) - Full employee name
- `employee_id` (Text) - Employee identifier
- `is_non_employee` (Boolean) - Non-employee flag
- `work_location` (Text) - Physical work location
- `work_phone` (Text) - Work contact number
- `email` (Text) - Employee email
- `agency_name` (Text) - Agency name
- `agency_code` (Text) - Agency code
- `justification` (Text) - Business justification
- `submitter_name` (Text) - Form submitter name
- `submitter_email` (Text) - Submitter email
- `supervisor_name` (Text) - Supervisor name
- `supervisor_username` (Text) - Supervisor SWIFT username
- `security_admin_name` (Text) - Security admin name
- `security_admin_username` (Text) - Security admin username
- `security_area` (Text) - Selected security area
- `accounting_director` (Text) - Accounting director name
- `accounting_director_username` (Text) - Accounting director username
- `hr_mainframe_logon_id` (Text) - HR mainframe ID
- `hr_view_statewide` (Boolean) - Statewide access flag
- `elm_key_admin` (Text) - ELM key admin name
- `elm_key_admin_username` (Text) - ELM admin username
- `elm_director` (Text) - ELM director name
- `elm_director_email` (Text) - ELM director email
- `hr_director` (Text) - HR director name
- `hr_director_email` (Text) - HR director email
- `copy_from_user` (Boolean) - Copy user flag
- `copy_user_name` (Text) - Name to copy from
- `copy_user_employee_id` (Text) - Employee ID to copy from
- `copy_user_sema4_id` (Text) - SEMA4 ID to copy from
- `non_employee_type` (Text) - Non-employee type
- `access_end_date` (Date) - Access expiration date
- `security_measures` (Text) - Security documentation
- `status` (Text) - Current request status

**Indexes:**
- Primary key on `id`
- Index on `status`
- Index on `created_at`
- Index on `agency_code`

#### 6.1.2 security_role_selections

**Purpose:** Stores selected roles and configurations

**Columns:**
- `id` (UUID, Primary Key) - Unique selection identifier
- `request_id` (UUID, Foreign Key) - Links to security_role_requests
- `created_at` (Timestamp) - Creation timestamp
- `updated_at` (Timestamp) - Last update timestamp
- `home_business_unit` (Text) - Primary business unit
- `other_business_units` (Text) - Additional business units
- Boolean fields for each role (100+ columns)
- Text fields for role configurations (approvers, sources, etc.)
- `role_selection_json` (JSONB) - Flexible JSON storage

**Indexes:**
- Primary key on `id`
- Foreign key index on `request_id`
- Index on `updated_at`

**Role Categories Stored:**
- Accounts Payable (10+ roles)
- Accounts Receivable (10+ roles)
- Budgets (8+ roles)
- General Ledger (7+ roles)
- Grants (5+ roles)
- Project Costing (15+ roles)
- Asset Management (6+ roles)
- Inventory (15+ roles)
- HR/Payroll (10+ roles)
- EPM Data Warehouse (8+ roles)
- ELM (6+ roles)

#### 6.1.3 security_areas

**Purpose:** Links requests to security area directors

**Columns:**
- `id` (UUID, Primary Key) - Unique identifier
- `request_id` (UUID, Foreign Key) - Links to security_role_requests
- `area_type` (Text) - Security area type
- `director_email` (Text) - Director email for approval
- `director_name` (Text) - Director name
- `created_at` (Timestamp) - Creation timestamp

**Indexes:**
- Primary key on `id`
- Foreign key index on `request_id`
- Index on `area_type`

#### 6.1.4 request_approvals

**Purpose:** Tracks approval workflow steps

**Columns:**
- `id` (UUID, Primary Key) - Unique approval identifier
- `request_id` (UUID, Foreign Key) - Links to security_role_requests
- `step` (Text) - Approval step name
- `approver_email` (Text) - Approver email
- `approved_at` (Timestamp) - Approval timestamp
- `comments` (Text) - Approval comments
- `status` (Text) - Approval status
- `signature_data` (Text) - Base64 signature image
- `created_at` (Timestamp) - Creation timestamp

**Indexes:**
- Primary key on `id`
- Foreign key index on `request_id`
- Unique constraint on `(request_id, step)`
- Index on `approved_at`

**Approval Steps:**
- supervisor
- security_admin
- director
- mnit

#### 6.1.5 role_catalog

**Purpose:** Master catalog of available roles

**Columns:**
- `id` (UUID, Primary Key) - Unique role identifier
- `flag_key` (Text, Unique) - Programming key name
- `role_code` (Text) - Official SWIFT role code
- `name` (Text) - Display name
- `form_name` (Text) - Form label
- `ps_name` (Text) - PeopleSoft name
- `description` (Text) - Role description
- `domain` (Text) - Security domain
- `requires_route_controls` (Boolean) - Needs routing
- `control_spec` (JSONB) - Control specifications
- `display_order` (Integer) - UI display order
- `active` (Boolean) - Active status
- `is_active` (Boolean) - Legacy active flag
- `created_at` (Timestamp) - Creation timestamp
- `updated_at` (Timestamp) - Last update timestamp

**Indexes:**
- Primary key on `id`
- Unique index on `flag_key`
- Index on `domain`
- Index on `active`

### 6.2 Relationships

**security_role_requests → security_role_selections**
- One-to-one relationship
- Cascade delete

**security_role_requests → security_areas**
- One-to-many relationship
- Cascade delete

**security_role_requests → request_approvals**
- One-to-many relationship
- Cascade delete

### 6.3 Data Validation Rules

**security_role_requests:**
- `start_date` must be present or future
- `email` must be valid email format
- `status` must be valid state
- `access_end_date` must be after `start_date`
- Required fields must not be null

**security_role_selections:**
- At least one role must be selected
- `home_business_unit` required
- Role configurations must match role selection

**request_approvals:**
- `step` must be unique per request
- `approved_at` only set when status is approved
- `signature_data` required for approval

---

## 7. Security and Access Control

### 7.1 Row Level Security (RLS)

**Implementation:**
All tables have RLS enabled with public access policies for development. Production deployment should implement:

**Authenticated User Policies:**
- Users can view requests they submitted
- Users can view requests awaiting their approval
- MNIT users can view all requests
- Admins can view all requests

**Data Modification Policies:**
- Users can edit only draft requests they created
- Approvers can update approval records
- MNIT can update all approved requests
- Admins have full access

### 7.2 Authentication

**Current State:**
- Test mode with user selection for development
- No authentication required

**Production Requirements:**
- Integration with State of Minnesota SSO
- SWIFT credential validation
- Session management
- Automatic logout after inactivity

### 7.3 Data Protection

**Sensitive Data:**
- Employee personal information
- Email addresses
- Phone numbers
- Security role assignments
- Digital signatures

**Protection Measures:**
- Database encryption at rest
- TLS encryption in transit
- Audit logging of all access
- Data retention policies
- PII handling compliance

### 7.4 Audit Trail

**Logged Events:**
- Request creation
- Request modifications
- Role selections/changes
- Approval actions
- Rejection actions
- Status changes
- User access
- Data exports

**Audit Information:**
- User identifier
- Action timestamp
- Action type
- Changed fields
- Old/new values
- IP address
- Browser information

---

## 8. User Interface Specifications

### 8.1 Design Principles

**Consistency:**
- Uniform styling across all pages
- Standard button placements
- Consistent form layouts
- Predictable navigation

**Accessibility:**
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus indicators
- Descriptive labels

**Responsiveness:**
- Mobile-first design
- Tablet optimization
- Desktop full-feature experience
- Flexible layouts
- Touch-friendly controls

### 8.2 Layout Specifications

#### 8.2.1 Header Component

**Elements:**
- Minnesota Management & Budget logo
- Application title: "SWIFT Security Role Access Request"
- Navigation links:
  - Home
  - Request List
  - Help (future)
- User session indicator (test mode)
- Test mode toggle (development only)

**Styling:**
- White background
- Blue accent color (#0066CC)
- Fixed position
- Drop shadow
- Responsive collapse on mobile

#### 8.2.2 Main Form Layout

**Structure:**
- Single column on mobile
- Two columns on tablet/desktop
- Form sections with headers
- Progressive disclosure
- Sticky navigation buttons

**Sections:**
1. Employee Information
2. Agency Information
3. Submitter Information
4. Approver Information
5. Security Area Selection
6. Area-Specific Fields
7. Copy User (expandable)
8. Non-Employee Details (conditional)

#### 8.2.3 Role Selection Layout

**Structure:**
- Category-based organization
- Collapsible sections
- Checkbox/radio controls
- Dependent field revelation
- Role count indicator
- Summary sidebar (desktop)

**Categories Display:**
- Category header with icon
- Expand/collapse control
- Role list with descriptions
- Configuration fields inline
- Help text for complex roles

#### 8.2.4 Approval Pages

**Structure:**
- Request summary header
- Employee information card
- Role selections display
- Signature canvas
- Approval buttons
- Comments section

### 8.3 Component Specifications

#### 8.3.1 Buttons

**Primary Button:**
- Blue background (#0066CC)
- White text
- Rounded corners (4px)
- Hover state: darker blue
- Disabled state: gray
- Loading spinner when processing

**Secondary Button:**
- White background
- Blue border
- Blue text
- Hover state: light blue background

**Danger Button:**
- Red background (#DC2626)
- White text
- Used for reject/delete actions

#### 8.3.2 Form Inputs

**Text Input:**
- White background
- Gray border
- Focus: blue border
- Error: red border with message
- Placeholder text: light gray
- Full width by default

**Select Dropdown:**
- Searchable when >10 options
- Keyboard navigation
- Clear button
- Multi-select support
- Selected item badges

**Checkbox:**
- Square with checkmark
- Blue when checked
- Label clickable
- Description text below

**Radio Button:**
- Circle with dot
- Blue when selected
- Label clickable
- Group spacing

**Date Picker:**
- Calendar popup
- Min/max date constraints
- Today button
- Clear button
- Keyboard input support

**Text Area:**
- Multi-line input
- Auto-resize option
- Character counter
- Max length enforcement

#### 8.3.3 Signature Canvas

**Features:**
- Touch drawing support
- Mouse drawing support
- Clear button
- Visual drawing area (300x150px)
- Border to indicate active area
- Instructions text
- Preview after drawing

**Styling:**
- White background
- Black ink color
- 2px line width
- Smooth curves
- Anti-aliasing

#### 8.3.4 Status Indicators

**Badge Styles:**
- Draft: Gray
- Pending: Yellow
- Approved: Green
- Rejected: Red
- Completed: Blue

**Format:**
- Uppercase text
- Rounded pill shape
- Contrasting text color
- Icon prefix

#### 8.3.5 Tables

**Request List Table:**
- Alternating row colors
- Hover highlight
- Sortable headers
- Clickable rows
- Action buttons column
- Responsive: cards on mobile

### 8.4 Color Palette

**Primary Colors:**
- Blue: #0066CC (State brand color)
- Dark Blue: #004A99 (hover states)
- Light Blue: #E6F2FF (backgrounds)

**Status Colors:**
- Success: #10B981 (green)
- Warning: #F59E0B (orange)
- Error: #DC2626 (red)
- Info: #3B82F6 (blue)

**Neutral Colors:**
- White: #FFFFFF
- Light Gray: #F3F4F6
- Gray: #9CA3AF
- Dark Gray: #4B5563
- Black: #111827

### 8.5 Typography

**Font Family:**
- Primary: System font stack
- Fallback: Arial, sans-serif

**Font Sizes:**
- Heading 1: 2rem (32px)
- Heading 2: 1.5rem (24px)
- Heading 3: 1.25rem (20px)
- Body: 1rem (16px)
- Small: 0.875rem (14px)
- Tiny: 0.75rem (12px)

**Font Weights:**
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### 8.6 Spacing System

**Scale (rem):**
- xs: 0.25 (4px)
- sm: 0.5 (8px)
- md: 1 (16px)
- lg: 1.5 (24px)
- xl: 2 (32px)
- 2xl: 3 (48px)

**Application:**
- Form field spacing: md
- Section spacing: xl
- Page margins: lg
- Button padding: sm (vertical), md (horizontal)

### 8.7 Icons

**Library:** Lucide React

**Common Icons:**
- ClipboardList: Main form
- Users: Role selection
- CheckCircle: Approval/success
- XCircle: Rejection/error
- Edit: Edit action
- Eye: View action
- Trash: Delete action
- Download: Export action
- Mail: Email notification
- Calendar: Date fields

---

## 9. Integration Points

### 9.1 Email System

**Provider:** To be determined (SMTP/SendGrid/AWS SES)

**Email Types:**
- Supervisor approval request
- Security admin approval request
- Director approval request
- MNIT processing notification
- Rejection notification
- Completion notification
- Reminder emails

**Email Template Requirements:**
- State branding
- Clear subject lines
- Direct action links
- Request summary
- Deadline information
- Contact information
- Plain text alternative

### 9.2 SWIFT Systems

**Integration Requirements:**
- User provisioning API
- Role assignment automation
- Business unit validation
- User lookup functionality
- Access verification

**Data Exchange:**
- User credentials
- Role codes
- Business unit codes
- Permission sets
- Effective dates

### 9.3 Agency Data Sources

**Current Implementation:**
- Static CSV files
- agency-listing-table.csv
- Business Unit List 07092025.csv

**Future Enhancement:**
- Live agency directory API
- Automated data updates
- Real-time validation

### 9.4 Authentication System

**Target:** State of Minnesota SSO

**Requirements:**
- SAML 2.0 support
- OAuth 2.0 support
- User attribute mapping
- Role/group synchronization
- Session management

---

## 10. Testing Requirements

### 10.1 Unit Testing

**Scope:**
- Individual components
- Form validation logic
- Data transformation functions
- Utility functions

**Tools:**
- Jest
- React Testing Library

**Coverage Target:** 80%

### 10.2 Integration Testing

**Scope:**
- Form submission flow
- Database operations
- Role selection logic
- Approval workflow
- Navigation flow

**Test Scenarios:**
- Create new request
- Edit existing request
- Submit for approval
- Approve at each level
- Reject request
- Complete request
- Copy from user

### 10.3 User Acceptance Testing

**Test Users:**
- Request submitters
- Supervisors
- Security administrators
- Directors
- MNIT personnel

**Test Scenarios:**
- Complete request workflow
- Accessibility testing
- Browser compatibility
- Mobile device testing
- Error handling
- Edge cases

### 10.4 Performance Testing

**Metrics:**
- Page load time < 2 seconds
- Form submission < 1 second
- Search/filter < 500ms
- Database query time < 200ms

**Load Testing:**
- Concurrent users: 100+
- Requests per second: 50+
- Database connections: 20+

### 10.5 Security Testing

**Tests:**
- SQL injection prevention
- XSS attack prevention
- CSRF protection
- Authentication bypass attempts
- Authorization boundary testing
- Data exposure testing
- Session management testing

### 10.6 Test Mode Features

**Purpose:**
Enable comprehensive testing without production impact

**Features:**
- User simulation
- Auto-approval toggle
- Test data isolation
- Quick reset functionality
- Scenario templates

---

## 11. Deployment and Operations

### 11.1 Deployment Architecture

**Environment Structure:**
- Development
- Staging
- Production

**Components:**
- React SPA (Vite build)
- Nginx web server
- Supabase PostgreSQL database
- Docker containers

### 11.2 Deployment Process

**Build Steps:**
1. Run `npm run build`
2. Build Docker image
3. Push to container registry
4. Deploy to environment
5. Run smoke tests
6. Monitor logs

**Database Migrations:**
1. Review migration SQL
2. Test in staging
3. Backup production
4. Apply migration
5. Verify schema
6. Test application

### 11.3 Configuration Management

**Environment Variables:**
- `VITE_SUPABASE_URL` - Database URL
- `VITE_SUPABASE_ANON_KEY` - Database key
- Email service credentials
- SSO configuration
- Feature flags

**Configuration Files:**
- `.env` - Environment variables
- `vite.config.ts` - Build configuration
- `nginx.conf` - Web server configuration
- `Dockerfile` - Container configuration

### 11.4 Monitoring and Logging

**Application Monitoring:**
- Error tracking
- Performance metrics
- User analytics
- Uptime monitoring

**Logging:**
- Application logs
- Access logs
- Error logs
- Audit logs

**Alerts:**
- Application errors
- Performance degradation
- Failed deployments
- Security events

### 11.5 Backup and Recovery

**Database Backups:**
- Daily automatic backups
- 30-day retention
- Point-in-time recovery
- Backup verification

**Disaster Recovery:**
- Recovery time objective: 4 hours
- Recovery point objective: 1 hour
- Documented recovery procedures
- Regular DR testing

### 11.6 Maintenance Windows

**Scheduled Maintenance:**
- Monthly updates
- Security patches
- Database maintenance
- Off-hours deployment

**Communication:**
- 48-hour advance notice
- Status page updates
- Email notifications
- In-app banners

---

## 12. Appendices

### Appendix A: Glossary

**Terms:**
- **SWIFT** - Statewide Systems (Minnesota's enterprise systems)
- **ELM** - Enterprise Learning Management
- **EPM** - Enterprise Performance Management
- **MNIT** - Minnesota IT Services
- **RLS** - Row Level Security
- **SEMA4** - State Employee Management System
- **Business Unit** - Organizational division within agency
- **Route Controls** - Workflow routing specifications
- **Appropriation Source** - Budget funding source

### Appendix B: Agency Codes

Reference: agency-listing-table.csv

Agencies include state departments, boards, councils, and authorities.

### Appendix C: Business Unit Codes

Reference: Business Unit List 07092025.csv

Business units are agency-specific organizational codes.

### Appendix D: Role Code Mapping

**Sample Mappings:**
- Voucher Entry → AP_VCHR_ENTRY
- Budget Journal Entry → BU_JNL_ENTRY
- Project Manager → PC_PROJ_MGR
- HR Inquiry Agency → HR_INQ_AGCY

Full mapping available in role_catalog table.

### Appendix E: Approval Matrix

| Security Area | Supervisor | Security Admin | Director | MNIT |
|---------------|------------|----------------|----------|------|
| Accounting/Procurement | Required | Required | Conditional* | Required |
| HR/Payroll | Required | Required | Conditional* | Required |
| EPM Data Warehouse | Required | Required | No | Required |
| ELM | Required | Required | Required | Required |

*Director approval required for statewide access or high-level roles

### Appendix F: Screen References

**Main Form:**
[Screenshot: Main request form with all sections visible]

**Role Selection:**
[Screenshot: Accounting/Procurement role selection page]

**Signature Page:**
[Screenshot: Digital signature capture interface]

**Request List:**
[Screenshot: Request list with filtering and search]

**MNIT Details:**
[Screenshot: MNIT processing page with technical details]

### Appendix G: Sample Workflows

**New Employee Onboarding:**
1. HR submits request 5 days before start date
2. Supervisor approves same day
3. Security admin reviews and approves next day
4. MNIT processes 2 days before start
5. Access ready on start date

**Role Addition:**
1. Employee requests additional roles
2. Submitter creates request
3. Accelerated approval (1-2 days)
4. MNIT adds roles to existing account

**Non-Employee Access:**
1. Department sponsor submits request
2. Additional security documentation required
3. Director approval mandatory
4. Access end date automatically set
5. System triggers access removal notification

### Appendix H: Change Log

**Version 1.0 - October 7, 2025**
- Initial functional specification
- Complete feature documentation
- Database schema definition
- UI specifications
- Testing requirements

---

## Document Approval

**Prepared By:** Development Team
**Date:** October 7, 2025

**Reviewed By:** [Stakeholder Name]
**Date:** [Review Date]

**Approved By:** [Approval Authority]
**Date:** [Approval Date]

---

**END OF FUNCTIONAL SPECIFICATION**
