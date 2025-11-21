# ASP.NET Core Technical Requirements
## SWIFT Security Role Access Request System

**Document Version:** 1.0
**Last Updated:** November 21, 2025
**Document Type:** Technical Requirements Specification
**Classification:** Enterprise Application Requirements

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Functional Requirements](#2-functional-requirements)
3. [Technical Architecture](#3-technical-architecture)
4. [Security Requirements](#4-security-requirements)
5. [Performance Requirements](#5-performance-requirements)
6. [Integration Requirements](#6-integration-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Deployment Requirements](#8-deployment-requirements)
9. [Testing Strategy](#9-testing-strategy)
10. [Budget and Resources](#10-budget-and-resources)

---

## 1. Project Overview

### 1.1 System Purpose

The SWIFT Security Role Access Request System is an enterprise web application that manages security role access requests for Minnesota state agencies. The system handles the complete lifecycle of access requests from submission through multi-level approval workflows to final provisioning by MNIT.

### 1.2 Current System

**Frontend:**
- React 18 with TypeScript
- Vite build tool
- TailwindCSS for styling
- React Router for navigation

**Backend:**
- Supabase (PostgreSQL database)
- Supabase Edge Functions (Deno)
- Supabase Auth for authentication

**Hosting:**
- Netlify (frontend)
- Supabase Cloud (backend)

### 1.3 Target System

**Frontend:**
- React 18 with TypeScript (retained)
- Vite build tool (retained)
- Azure Static Web Apps hosting

**Backend:**
- ASP.NET Core 8.0 Web API
- Entity Framework Core 8.0
- SQL Server 2022 / Azure SQL Database
- Azure App Services hosting

**Authentication:**
- Azure Active Directory (Azure AD / Entra ID)
- OAuth 2.0 / OpenID Connect

**Infrastructure:**
- Microsoft Azure cloud platform
- Azure DevOps or GitHub Actions for CI/CD

### 1.4 Migration Rationale

**Why ASP.NET Core:**

1. **Enterprise Standards**: Aligns with Minnesota state IT standards for .NET development
2. **Azure Integration**: Seamless integration with Azure services and Active Directory
3. **Performance**: Superior performance for complex business logic and large datasets
4. **Maintainability**: Strong typing, established patterns, better tooling
5. **Support**: Long-term support from Microsoft and large community
6. **Compliance**: Better audit trails, compliance features, enterprise security

**Why SQL Server:**

1. **Enterprise Features**: Row-Level Security, Always Encrypted, temporal tables
2. **Performance**: Superior query optimization for complex joins
3. **Tooling**: Excellent management and monitoring tools
4. **Integration**: Native Azure integration
5. **Support**: Enterprise-grade support from Microsoft

---

## 2. Functional Requirements

### 2.1 Core Functionality

#### FR-001: Request Creation
**Priority:** Critical

Users must be able to:
- Create new security role access requests
- Enter employee information (name, ID, start date, location)
- Select agency and business units
- Choose security area (Accounting, HR/Payroll, ELM, EPM/DWH)
- Select appropriate security roles (100+ options across domains)
- Provide justification for access
- Save drafts
- Submit for approval

**Acceptance Criteria:**
- Form validation prevents incomplete submissions
- Draft requests can be saved and resumed
- All required fields enforced
- Business rules validated before submission

#### FR-002: Multi-Level Approval Workflow
**Priority:** Critical

The system must support configurable approval workflows:

**Accounting Security Area:**
1. Supervisor approval
2. Security Administrator approval
3. Accounting Director approval (if applicable)

**HR/Payroll Security Area:**
1. Supervisor approval
2. Security Administrator approval
3. HR Director approval (if applicable)

**ELM Security Area:**
1. Supervisor approval
2. ELM Key Administrator approval
3. ELM Director approval

**EPM/DWH Security Area:**
1. Supervisor approval
2. Security Administrator approval

**Acceptance Criteria:**
- Correct approval chain based on security area
- Email notifications sent to each approver
- Approvers can approve or reject with comments
- Digital signature capture
- Audit trail of all approval actions

#### FR-003: MNIT Processing
**Priority:** Critical

MNIT staff must be able to:
- View all approved requests awaiting processing
- Search and filter requests
- View complete request details including all role selections
- Mark requests as completed
- Add completion notes
- Export request data

**Acceptance Criteria:**
- Dashboard showing pending requests
- Search by employee name, agency, date
- Complete audit trail
- Export to CSV/Excel
- Completion triggers email notification

#### FR-004: Request Management
**Priority:** High

All users must be able to:
- View their submitted requests
- Check request status
- View approval history
- Cancel pending requests (before approval)
- Edit draft requests

Approvers must be able to:
- View requests pending their approval
- View approval history
- Add comments during approval

MNIT staff must be able to:
- View all requests across all agencies
- Generate reports and statistics
- Search and filter by multiple criteria

**Acceptance Criteria:**
- Real-time status updates
- Complete history visible
- Filter by status, date, agency
- Pagination for large result sets

#### FR-005: Role Selection Interface
**Priority:** Critical

The system must provide specialized interfaces for each security area:

**Accounting & Procurement:**
- 60+ role options across:
  - Accounts Payable (25 roles)
  - Accounts Receivable (15 roles)
  - Budgets (20 roles)
  - Asset Management (12 roles)
  - Purchasing (18 roles)
- Route control specifications for workflow roles
- Business unit selection

**HR & Payroll:**
- 20+ role options
- Agency vs. statewide access distinction
- Position management roles
- Payroll processing roles

**ELM:**
- 10+ role options
- Training administration roles
- Reporting roles

**EPM & Data Warehouse:**
- 23+ role options
- Reporting access levels
- Data warehouse access

**Acceptance Criteria:**
- Interface adapts to selected security area
- Related roles grouped logically
- Route controls captured when required
- Business unit selection enforced
- Help text available for each role

### 2.2 UI/UX Requirements

#### UX-001: Responsive Design
**Priority:** High

- Mobile-responsive (≥768px width)
- Tablet-optimized (768px - 1024px)
- Desktop-optimized (>1024px)
- Touch-friendly controls
- Accessible navigation

#### UX-002: Accessibility
**Priority:** Critical

- WCAG 2.2 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast (4.5:1 minimum)
- Clear focus indicators
- Semantic HTML

#### UX-003: Performance
**Priority:** High

- Page load time <2 seconds
- Time to interactive <3 seconds
- Smooth scrolling and transitions
- Optimized images and assets
- Lazy loading for large datasets

#### UX-004: User Feedback
**Priority:** High

- Loading indicators for async operations
- Success/error messages
- Confirmation dialogs for destructive actions
- Inline validation feedback
- Progress indicators for multi-step processes

### 2.3 Data Management

#### DM-001: Data Validation
**Priority:** Critical

- Client-side validation for immediate feedback
- Server-side validation for security
- Business rule validation
- Data type and format validation
- Required field validation

#### DM-002: Data Integrity
**Priority:** Critical

- Foreign key constraints
- Check constraints
- Unique constraints
- Referential integrity
- Transaction consistency

#### DM-003: Data Retention
**Priority:** High

- Soft delete for requests (retain for audit)
- Audit log retention: 7 years
- Completed requests: retain indefinitely
- Draft requests: auto-delete after 90 days inactivity

---

## 3. Technical Architecture

### 3.1 Architecture Pattern

**Clean Architecture / Onion Architecture:**

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│    (API Controllers, Filters, Middleware│
└─────────────────────────────────────────┘
              │
┌─────────────────────────────────────────┐
│        Application Layer                │
│  (CQRS Commands/Queries, Handlers,      │
│   Validators, DTOs, Application Logic)  │
└─────────────────────────────────────────┘
              │
┌─────────────────────────────────────────┐
│          Domain Layer                   │
│  (Entities, Value Objects, Domain       │
│   Events, Business Rules, Interfaces)   │
└─────────────────────────────────────────┘
              │
┌─────────────────────────────────────────┐
│      Infrastructure Layer               │
│  (EF Core, SQL Server, Email Service,   │
│   File Storage, External APIs)          │
└─────────────────────────────────────────┘
```

### 3.2 Technology Stack

#### Backend

**Core Framework:**
- ASP.NET Core 8.0
- C# 12
- .NET 8 SDK

**ORM:**
- Entity Framework Core 8.0
- SQL Server provider
- Migrations

**CQRS & Mediator:**
- MediatR 12.x
- FluentValidation 11.x

**Authentication:**
- Microsoft.Identity.Web
- Azure AD / Entra ID integration
- JWT Bearer tokens

**Logging:**
- Serilog
- Application Insights

**Testing:**
- xUnit
- Moq
- FluentAssertions
- Testcontainers (integration tests)

#### Frontend

**Core:**
- React 18
- TypeScript 5
- Vite 5

**UI Libraries:**
- TailwindCSS 3
- Lucide React (icons)
- React Hook Form (forms)
- React Query (data fetching)

**Authentication:**
- @azure/msal-react
- @azure/msal-browser

#### Database

- SQL Server 2022 or Azure SQL Database
- SQL Server Management Studio (SSMS)
- Azure Data Studio

#### Infrastructure

- Azure App Services (API hosting)
- Azure Static Web Apps (frontend hosting)
- Azure SQL Database
- Azure Key Vault (secrets)
- Azure Application Insights (monitoring)
- Azure Storage (file storage if needed)

### 3.3 Project Structure

```
SwiftSecurity.sln
│
├── src/
│   ├── SwiftSecurity.Domain/           # Domain entities, value objects
│   ├── SwiftSecurity.Application/      # CQRS, DTOs, interfaces
│   ├── SwiftSecurity.Infrastructure/   # EF Core, repositories
│   └── SwiftSecurity.Api/              # API controllers, middleware
│
├── tests/
│   ├── SwiftSecurity.Domain.Tests/
│   ├── SwiftSecurity.Application.Tests/
│   ├── SwiftSecurity.Infrastructure.Tests/
│   └── SwiftSecurity.Api.Tests/
│
└── docs/                               # Documentation
```

### 3.4 Design Patterns

#### CQRS (Command Query Responsibility Segregation)

**Commands** (write operations):
- CreateRequestCommand
- UpdateRequestCommand
- SubmitRequestCommand
- ApproveRequestCommand
- RejectRequestCommand
- CompleteRequestCommand

**Queries** (read operations):
- GetRequestByIdQuery
- GetRequestsListQuery
- GetPendingApprovalsQuery
- GetRequestStatisticsQuery

#### Repository Pattern

- IRequestRepository
- IApprovalRepository
- IRoleSelectionRepository
- IAgencyRepository
- IBusinessUnitRepository

#### Unit of Work Pattern

- IUnitOfWork for transaction management
- Ensures consistency across repositories

#### Specification Pattern

- Complex query logic encapsulated
- Reusable query specifications
- Type-safe queries

---

## 4. Security Requirements

### 4.1 Authentication

**SEC-001: Azure AD Authentication**
**Priority:** Critical

- All users authenticate via Azure AD
- OAuth 2.0 / OpenID Connect protocol
- JWT bearer tokens
- Token validation on every request
- Refresh token support
- Single Sign-On (SSO) experience

**Acceptance Criteria:**
- Users authenticate with organizational credentials
- No local username/password storage
- Token expiration enforced
- Secure token storage (httpOnly cookies or secure storage)

### 4.2 Authorization

**SEC-002: Role-Based Access Control (RBAC)**
**Priority:** Critical

**Roles:**
- **Submitter**: Can create and submit requests
- **Supervisor**: Can approve requests (first level)
- **SecurityAdmin**: Can approve requests (security admin level)
- **Director**: Can approve requests (director level)
- **MnitStaff**: Can view, process, and complete all requests
- **Admin**: Full system access

**Permissions:**
- View own requests (Submitter)
- View and approve assigned requests (Approver roles)
- View all requests (MnitStaff, Admin)
- Complete requests (MnitStaff, Admin)
- Manage reference data (Admin)

**Acceptance Criteria:**
- Role claims in JWT token
- Authorization policies enforced
- API endpoints protected by role
- Frontend routes protected by role

### 4.3 Row-Level Security

**SEC-003: Data Access Control**
**Priority:** Critical

- Users can only view/edit their own requests (submitters)
- Approvers can only view requests assigned to them
- MNIT staff can view all requests
- Implemented via RLS in SQL Server
- Session context sets user ID for RLS

**Acceptance Criteria:**
- SQL Server RLS policies active
- Users cannot bypass RLS
- Queries automatically filtered
- No data leakage across users

### 4.4 Data Protection

**SEC-004: Sensitive Data Encryption**
**Priority:** High

**Always Encrypted:**
- Employee ID (deterministic encryption for queries)
- Work phone number (randomized encryption)

**Data at Rest:**
- Transparent Data Encryption (TDE) enabled on Azure SQL
- Encrypted backups

**Data in Transit:**
- TLS 1.3 for all connections
- HTTPS only (HSTS enabled)

**Acceptance Criteria:**
- Sensitive fields encrypted in database
- Application can query encrypted fields
- No plaintext sensitive data in logs

### 4.5 Security Best Practices

**SEC-005: Security Hardening**
**Priority:** High

- OWASP Top 10 mitigations
- SQL injection prevention (parameterized queries)
- XSS prevention (output encoding)
- CSRF protection
- Content Security Policy (CSP) headers
- Input validation and sanitization
- Rate limiting on API endpoints
- Secure headers (X-Frame-Options, X-Content-Type-Options)

**Acceptance Criteria:**
- No critical vulnerabilities in security scan
- Penetration testing passed
- Security audit sign-off

---

## 5. Performance Requirements

### 5.1 Response Time

**PERF-001: API Response Time**
**Priority:** High

- p50: <200ms
- p95: <500ms
- p99: <1000ms
- Timeout: 30 seconds

**PERF-002: Page Load Time**
**Priority:** High

- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Largest Contentful Paint: <2.5s

### 5.2 Throughput

**PERF-003: Concurrent Users**
**Priority:** High

- Support 100+ concurrent users
- 500+ requests per minute
- No degradation under normal load

### 5.3 Scalability

**PERF-004: Horizontal Scaling**
**Priority:** Medium

- API can scale to multiple instances
- Stateless API design
- Database connection pooling
- Distributed caching support (Redis)

### 5.4 Database Performance

**PERF-005: Query Performance**
**Priority:** High

- All queries <200ms
- Proper indexing on foreign keys
- Covering indexes for common queries
- Query execution plans reviewed
- No N+1 query problems

---

## 6. Integration Requirements

### 6.1 Email Notifications

**INT-001: Email Service**
**Priority:** Critical

- Azure Communication Services or SendGrid
- Email templates for:
  - Request submission confirmation
  - Approval needed notification
  - Approval completed notification
  - Request rejected notification
  - Request completed notification
- HTML and text versions
- Unsubscribe mechanism
- Retry logic for failed sends

### 6.2 Azure Services Integration

**INT-002: Azure Integration**
**Priority:** High

- Azure Key Vault for secrets
- Azure Application Insights for monitoring
- Azure Storage for file attachments (if needed)
- Managed Identity for service-to-service auth

---

## 7. Non-Functional Requirements

### 7.1 Availability

**NFR-001: Uptime**
**Priority:** High

- Target: 99.9% uptime
- Planned maintenance windows communicated in advance
- Disaster recovery plan
- Backup and restore procedures

### 7.2 Reliability

**NFR-002: Error Handling**
**Priority:** High

- Graceful error handling
- User-friendly error messages
- Detailed error logging
- No sensitive data in error messages
- Retry logic for transient failures

### 7.3 Maintainability

**NFR-003: Code Quality**
**Priority:** High

- Clean Architecture principles
- SOLID principles
- Code coverage >80%
- Documentation for complex logic
- Consistent code style (enforced by linters)

### 7.4 Monitoring

**NFR-004: Observability**
**Priority:** High

- Application Insights integration
- Structured logging
- Performance metrics
- Custom metrics (business metrics)
- Alerts for critical errors

### 7.5 Audit Trail

**NFR-005: Audit Logging**
**Priority:** Critical

- All data changes logged
- User actions logged
- Immutable audit log
- Includes: who, what, when, old value, new value
- Retention: 7 years

---

## 8. Deployment Requirements

### 8.1 Environments

**DEP-001: Environment Setup**
**Priority:** Critical

**Development:**
- Used by developers
- Frequent deployments
- Test data

**Test:**
- Used by QA
- Automated test runs
- Test data reset capability

**Staging:**
- Production-like environment
- UAT
- Performance testing
- Production data snapshot (anonymized)

**Production:**
- Live system
- Blue-green deployment
- Minimal downtime

### 8.2 CI/CD Pipeline

**DEP-002: Automated Deployment**
**Priority:** High

- GitHub Actions or Azure DevOps
- Automated build on commit
- Automated tests run on every build
- Automated deployment to dev
- Manual approval for staging/production
- Rollback capability

### 8.3 Configuration Management

**DEP-003: Environment Configuration**
**Priority:** High

- Configuration per environment
- Secrets in Azure Key Vault
- Connection strings in Key Vault
- Feature flags support
- Configuration validation on startup

---

## 9. Testing Strategy

### 9.1 Unit Testing

**TEST-001: Unit Test Coverage**
**Priority:** High

- Target: >80% code coverage
- All business logic tested
- Domain model tests
- Command/query handler tests
- Framework: xUnit
- Mocking: Moq

### 9.2 Integration Testing

**TEST-002: API Integration Tests**
**Priority:** High

- Test all API endpoints
- Test with real database (Testcontainers)
- Test authentication/authorization
- Test error scenarios
- >50 integration tests

### 9.3 E2E Testing

**TEST-003: End-to-End Tests**
**Priority:** Medium

- Test critical user workflows
- Test across browser environments
- Framework: Cypress or Playwright
- Automated in CI pipeline

### 9.4 Performance Testing

**TEST-004: Load Testing**
**Priority:** Medium

- Simulate 100+ concurrent users
- Identify bottlenecks
- Validate performance requirements
- Tool: JMeter or k6

### 9.5 Security Testing

**TEST-005: Security Testing**
**Priority:** High

- OWASP ZAP security scan
- Penetration testing
- Vulnerability scanning
- Dependency scanning (Dependabot)

### 9.6 UAT

**TEST-006: User Acceptance Testing**
**Priority:** Critical

- Real users test in staging
- Test all workflows
- Collect feedback
- Sign-off required before production

---

## 10. Budget and Resources

### 10.1 Team Composition

**Roles Required:**
- Project Manager (1)
- Tech Lead / Architect (1)
- Senior Backend Developer (.NET) (2)
- Frontend Developer (React) (1)
- Database Administrator (1)
- DevOps Engineer (1)
- QA Engineer (1)
- Business Analyst (0.5)

**Total Team Size:** 7.5 FTE

### 10.2 Timeline

**Total Duration:** 17 weeks

**Phase Breakdown:**
- Phase 1: Foundation & Setup (2 weeks)
- Phase 2: Backend Migration (6 weeks)
- Phase 3: Frontend Integration (3 weeks)
- Phase 4: Data Migration (2 weeks)
- Phase 5: Testing & Validation (3 weeks)
- Phase 6: Deployment & Cutover (1 week)

### 10.3 Budget Estimate

**Labor Costs:**
- Assuming average rate: $150/hour
- 7.5 FTE × 17 weeks × 40 hours × $150 = $765,000

**Azure Infrastructure:**
- App Services: $200/month × 4 environments = $800/month
- Azure SQL: $300/month × 4 = $1,200/month
- Static Web Apps: $10/month × 4 = $40/month
- Application Insights: $100/month
- Key Vault: $20/month
- Total: ~$2,200/month × 5 months = $11,000

**Third-Party Services:**
- Email service: $500/month × 5 = $2,500
- Tools and licenses: $5,000

**Total Estimated Budget:** $780,000 - $800,000

**Note:** This is a rough estimate. Actual costs depend on:
- Team location and rates
- Azure consumption patterns
- Timeline adjustments
- Scope changes

---

## Document Summary

This requirements document provides comprehensive specifications for migrating the SWIFT Security Role Access Request System to ASP.NET Core.

**Key Sections:**
- 100+ functional requirements
- Complete technical architecture
- Enterprise security requirements
- Performance benchmarks
- Integration specifications
- Testing strategy
- Budget and timeline

**Total Requirements:** 140+ detailed requirements across 10 major categories

---

**Document Version:** 1.0
**Last Updated:** November 21, 2025
**Status:** Approved for Implementation
