# Migration Plan
## SWIFT Security Role Access Request System - React/Supabase to ASP.NET Core/SQL Server

**Document Version:** 1.0
**Last Updated:** November 21, 2025
**Document Type:** Migration Strategy & Planning
**Classification:** Technical Planning

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Migration Overview](#2-migration-overview)
3. [Phase 1: Foundation & Setup](#phase-1-foundation--setup)
4. [Phase 2: Backend Migration](#phase-2-backend-migration)
5. [Phase 3: Frontend Integration](#phase-3-frontend-integration)
6. [Phase 4: Data Migration](#phase-4-data-migration)
7. [Phase 5: Testing & Validation](#phase-5-testing--validation)
8. [Phase 6: Deployment & Cutover](#phase-6-deployment--cutover)
9. [Risk Management](#9-risk-management)
10. [Success Criteria](#10-success-criteria)

---

## 1. Executive Summary

### 1.1 Migration Scope

**Current System:**
- Frontend: React 18 + TypeScript + Vite
- Backend: Supabase (PostgreSQL + Edge Functions)
- Hosting: Netlify (frontend), Supabase Cloud (backend)
- Authentication: Supabase Auth (email/password)

**Target System:**
- Frontend: React 18 + TypeScript + Vite (retained, modified for new API)
- Backend: ASP.NET Core 8.0 Web API (new)
- Database: SQL Server 2022 (Azure SQL Database)
- Hosting: Azure (App Services + Static Web Apps)
- Authentication: Azure Active Directory (Azure AD / Entra ID)

### 1.2 Migration Strategy

**Approach:** Big Bang Migration with Parallel Development

**Rationale:**
- The application is currently in active use
- Data volume is manageable (~1000-5000 records)
- Downtime window is acceptable (weekend deployment)
- Clean cutover preferred over gradual migration
- Opportunity to implement significant improvements

### 1.3 Timeline Overview

| Phase | Duration | Target Completion |
|-------|----------|-------------------|
| Phase 1: Foundation & Setup | 2 weeks | Week 2 |
| Phase 2: Backend Migration | 6 weeks | Week 8 |
| Phase 3: Frontend Integration | 3 weeks | Week 11 |
| Phase 4: Data Migration | 2 weeks | Week 13 |
| Phase 5: Testing & Validation | 3 weeks | Week 16 |
| Phase 6: Deployment & Cutover | 1 week | Week 17 |
| **Total Duration** | **17 weeks** | **~4.5 months** |

### 1.4 Team Requirements

| Role | Allocation | Responsibilities |
|------|-----------|------------------|
| Tech Lead / Architect | 100% | Architecture, technical decisions, code reviews |
| Senior Backend Developer | 100% | ASP.NET Core API development |
| Frontend Developer | 50% (weeks 1-8), 100% (weeks 9-17) | React integration, UI updates |
| Database Administrator | 25% | SQL Server setup, migrations, optimization |
| DevOps Engineer | 25% | Azure infrastructure, CI/CD pipelines |
| QA Engineer | 50% (weeks 1-13), 100% (weeks 14-17) | Test planning, execution, automation |
| Business Analyst | 25% | Requirements validation, UAT coordination |
| Project Manager | 50% | Planning, coordination, stakeholder communication |

---

## 2. Migration Overview

### 2.1 Migration Phases Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Migration Timeline                           │
└─────────────────────────────────────────────────────────────────┘

Week 1-2    │███████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
Phase 1     │ Foundation & Setup
            │ - Azure environment setup
            │ - Project structure creation
            │ - CI/CD pipeline configuration
            └────────────────────────────────────────────────────┘

Week 3-8    │            ███████████████████████████████░░░░░░░░░│
Phase 2     │            Backend Migration
            │            - Domain models & entities
            │            - CQRS implementation
            │            - API controllers
            │            - Authentication integration
            └────────────────────────────────────────────────────┘

Week 9-11   │                                      ████████░░░░░░│
Phase 3     │                                      Frontend
            │                                      - API integration
            │                                      - Auth changes
            │                                      - UI updates
            └────────────────────────────────────────────────────┘

Week 12-13  │                                              ███░░░│
Phase 4     │                                              Data
            │                                              Migration
            └────────────────────────────────────────────────────┘

Week 14-16  │                                                ████│
Phase 5     │                                                Test
            │                                                & Val
            └────────────────────────────────────────────────────┘

Week 17     │                                                  ██│
Phase 6     │                                                  Go
            │                                                  Live
            └────────────────────────────────────────────────────┘
```

### 2.2 Critical Path

**Sequential Dependencies:**

1. **Azure Setup** → Backend Development
2. **Domain Models** → Database Schema → EF Migrations
3. **API Endpoints** → Frontend Integration
4. **Authentication Setup** → All Development Work
5. **Backend Complete** → Data Migration Scripts
6. **Frontend Integration** → End-to-End Testing
7. **All Testing Complete** → Production Deployment

### 2.3 Parallel Work Streams

**Can be done concurrently:**
- Azure infrastructure setup + Project scaffolding
- Domain model development + Database design
- Backend API development + Frontend mockup preparation
- Unit test development + Integration test planning
- Documentation writing + Training material creation

---

## Phase 1: Foundation & Setup
**Duration:** 2 weeks (Weeks 1-2)

### Phase 1 Goals

✅ Azure environment provisioned and configured
✅ Project structure established
✅ Development tools and standards configured
✅ CI/CD pipelines operational
✅ Team onboarded and ready

### Week 1: Azure Environment & Infrastructure

#### Day 1-2: Azure Subscription & Resource Groups

**Tasks:**
1. Create Azure subscription (or use existing)
2. Set up resource groups:
   - `rg-swift-security-dev`
   - `rg-swift-security-test`
   - `rg-swift-security-staging`
   - `rg-swift-security-prod`

3. Configure Azure AD (Entra ID):
   - Create App Registration for API
   - Create App Registration for SPA
   - Configure redirect URIs
   - Set up API permissions
   - Configure token lifetimes

4. Establish naming conventions:
   ```
   Resource Pattern: {service}-{app}-{env}

   Examples:
   - app-swift-security-api-dev
   - sql-swift-security-dev
   - kv-swift-security-prod
   ```

**Deliverables:**
- Azure subscription active
- Resource groups created
- Azure AD configured
- Naming convention document

#### Day 3-4: Database & Storage

**Tasks:**
1. Provision Azure SQL Database:
   - Create SQL Server instances (dev, test, staging, prod)
   - Configure firewall rules
   - Enable Advanced Threat Protection
   - Set up geo-replication (prod only)
   - Configure backup retention

2. Create Azure Key Vault:
   - Store database connection strings
   - Store API keys and secrets
   - Configure access policies
   - Enable soft delete and purge protection

3. Set up Azure Storage Account:
   - Create containers for signature images
   - Configure blob lifecycle management
   - Set up CDN (optional)

**Deliverables:**
- SQL databases provisioned
- Key Vault configured with initial secrets
- Storage account ready

#### Day 5: App Services & Networking

**Tasks:**
1. Create App Service Plan:
   - Dev/Test: B1 tier
   - Staging: S1 tier
   - Prod: P2V3 tier with auto-scaling

2. Provision App Services:
   - API: `app-swift-security-api-{env}`
   - Configure deployment slots (prod: staging slot)
   - Enable App Insights
   - Configure managed identity

3. Create Static Web App:
   - `stapp-swift-security-web-{env}`
   - Link to GitHub repository
   - Configure custom domains

4. Set up Azure Front Door (prod only):
   - Configure WAF rules
   - Set up CDN
   - Configure SSL certificates

**Deliverables:**
- App Services created and configured
- Static Web Apps provisioned
- Networking configured

### Week 2: Project Setup & Development Environment

#### Day 1-2: Backend Project Structure

**Tasks:**
1. Create ASP.NET Core solution:
   ```
   SwiftSecurity.sln
   ├── src/
   │   ├── SwiftSecurity.Api/              (Presentation)
   │   ├── SwiftSecurity.Application/       (Application Layer)
   │   ├── SwiftSecurity.Domain/            (Domain Layer)
   │   └── SwiftSecurity.Infrastructure/    (Infrastructure)
   └── tests/
       ├── SwiftSecurity.Api.Tests/
       ├── SwiftSecurity.Application.Tests/
       ├── SwiftSecurity.Domain.Tests/
       └── SwiftSecurity.IntegrationTests/
   ```

2. Configure NuGet packages:
   - MediatR
   - FluentValidation
   - AutoMapper
   - Entity Framework Core
   - Serilog
   - Azure libraries

3. Set up project references and dependencies

4. Configure appsettings files:
   - appsettings.json (defaults)
   - appsettings.Development.json
   - appsettings.Test.json
   - appsettings.Staging.json
   - appsettings.Production.json

**Deliverables:**
- Solution structure created
- All projects configured
- NuGet packages installed
- Configuration files ready

#### Day 3-4: CI/CD Pipeline

**Tasks:**
1. Create GitHub Actions workflows:

   **Backend Build & Deploy:**
   ```yaml
   name: Backend CI/CD

   on:
     push:
       branches: [main, develop]
       paths: ['src/backend/**']
     pull_request:
       branches: [main, develop]

   jobs:
     build:
       - Restore dependencies
       - Build solution
       - Run unit tests
       - Run integration tests
       - Code coverage report
       - Security scanning

     deploy-dev:
       - Deploy to dev App Service
       - Run smoke tests

     deploy-test:
       - Deploy to test App Service
       - Run automated tests

     deploy-staging:
       - Requires PR approval
       - Deploy to staging
       - Run full test suite

     deploy-prod:
       - Requires release tag
       - Blue-green deployment
       - Health checks
       - Traffic swap
   ```

   **Frontend Build & Deploy:**
   ```yaml
   name: Frontend CI/CD

   on:
     push:
       branches: [main, develop]
       paths: ['src/frontend/**']

   jobs:
     build:
       - Install dependencies
       - Run linter
       - Build React app
       - Run unit tests

     deploy:
       - Deploy to Static Web App
       - Environment-specific builds
   ```

2. Configure branch protection rules
3. Set up automated testing
4. Configure deployment secrets

**Deliverables:**
- CI/CD pipelines operational
- Automated testing configured
- Deployment process documented

#### Day 5: Development Standards & Tools

**Tasks:**
1. Configure code quality tools:
   - EditorConfig
   - StyleCop / Roslyn Analyzers
   - ESLint + Prettier (frontend)
   - SonarQube integration

2. Set up documentation structure:
   - API documentation (Swagger)
   - Architecture decision records (ADRs)
   - Code documentation standards
   - Wiki structure

3. Create development runbooks:
   - Local development setup
   - Debugging guide
   - Database migration guide
   - Troubleshooting guide

4. Team onboarding:
   - Repository access
   - Azure access
   - Tool installations
   - Development environment setup

**Deliverables:**
- Code quality tools configured
- Documentation structure ready
- Development runbooks created
- Team onboarded

### Phase 1 Completion Checklist

- [ ] Azure subscription and resource groups created
- [ ] Azure AD configured with app registrations
- [ ] SQL databases provisioned (all environments)
- [ ] Key Vault configured with secrets
- [ ] App Services and Static Web Apps created
- [ ] Project structure established
- [ ] CI/CD pipelines operational
- [ ] Code quality tools configured
- [ ] Team onboarded and ready

---

## Phase 2: Backend Migration
**Duration:** 6 weeks (Weeks 3-8)

### Phase 2 Goals

✅ Domain models and entities implemented
✅ Database schema designed and deployed
✅ CQRS pattern with MediatR implemented
✅ All API endpoints functional
✅ Authentication and authorization working
✅ Unit and integration tests passing

### Week 3-4: Domain Layer & Database

#### Domain Models (Week 3, Day 1-3)

**Tasks:**
1. Implement core entities:
   - SecurityRoleRequest
   - SecurityRoleSelection
   - RequestApproval
   - SecurityArea
   - RoleCatalog

2. Implement value objects:
   - Email
   - RequestStatus
   - ApprovalStatus

3. Define domain events:
   - RequestCreatedEvent
   - RequestSubmittedEvent
   - RequestApprovedEvent
   - RequestRejectedEvent
   - RequestCompletedEvent

4. Implement domain exceptions:
   - DomainException
   - ValidationException
   - BusinessRuleViolationException

5. Write unit tests for domain logic

**Deliverables:**
- All domain entities implemented
- Value objects defined
- Domain events ready
- Unit tests passing (>80% coverage)

#### Database Design (Week 3, Day 4-5)

**Tasks:**
1. Design database schema:
   - security_role_requests table
   - security_role_selections table (100+ columns)
   - request_approvals table
   - security_areas table
   - role_catalog table
   - business_units table
   - audit_logs table

2. Define relationships and foreign keys

3. Design indexes:
   - Primary keys (GUIDs)
   - Foreign keys
   - Query optimization indexes
   - Full-text search indexes

4. Configure Always Encrypted columns:
   - EmployeeId (DETERMINISTIC)
   - WorkPhone (RANDOMIZED)
   - SecurityMeasures (RANDOMIZED)

5. Set up Row-Level Security (RLS):
   - Security predicate functions
   - Security policies

**Deliverables:**
- Complete database schema design
- ER diagram
- Index strategy document
- RLS policies defined

#### Entity Framework Setup (Week 4, Day 1-2)

**Tasks:**
1. Create SwiftDbContext:
   - DbSet configurations
   - OnModelCreating configurations
   - Audit trail interceptors
   - Soft delete interceptors

2. Create entity configurations:
   - RequestConfiguration
   - RoleSelectionConfiguration
   - ApprovalConfiguration
   - Fluent API mappings

3. Configure conventions:
   - Naming conventions
   - Default values
   - Cascade delete behavior
   - Concurrency tokens

4. Create initial migration:
   ```bash
   dotnet ef migrations add InitialCreate
   ```

**Deliverables:**
- SwiftDbContext implemented
- Entity configurations complete
- Initial migration created
- Migration tested locally

#### Database Deployment (Week 4, Day 3-5)

**Tasks:**
1. Apply migrations to dev environment:
   ```bash
   dotnet ef database update --environment Development
   ```

2. Seed reference data:
   - Role catalog (100+ roles)
   - Business units (~500 units)
   - Security areas
   - Agencies

3. Set up database projects:
   - Stored procedures (if needed)
   - Views for reporting
   - Functions

4. Configure backup and recovery:
   - Automated backups
   - Point-in-time restore testing
   - Disaster recovery procedures

5. Performance testing:
   - Query performance analysis
   - Index effectiveness
   - Execution plan review

**Deliverables:**
- Database deployed to dev
- Reference data loaded
- Backup configured
- Performance baseline established

### Week 5-6: Application Layer (CQRS)

#### Commands Implementation (Week 5)

**Tasks:**
1. Implement Request Commands:
   - CreateRequestCommand + Handler
   - UpdateRequestCommand + Handler
   - DeleteRequestCommand + Handler
   - SubmitRequestCommand + Handler
   - CompleteRequestCommand + Handler

2. Implement Approval Commands:
   - ApproveRequestCommand + Handler
   - RejectRequestCommand + Handler

3. Implement Role Selection Commands:
   - SaveRoleSelectionCommand + Handler

4. Create validators (FluentValidation):
   - CreateRequestValidator
   - UpdateRequestValidator
   - ApproveRequestValidator
   - RoleSelectionValidator

5. Implement pipeline behaviors:
   - ValidationBehavior
   - LoggingBehavior
   - PerformanceBehavior
   - TransactionBehavior

**Deliverables:**
- All command handlers implemented
- Validators created
- Pipeline behaviors working
- Unit tests passing

#### Queries Implementation (Week 6, Day 1-2)

**Tasks:**
1. Implement Request Queries:
   - GetRequestByIdQuery + Handler
   - GetRequestsListQuery + Handler
   - GetRequestStatisticsQuery + Handler

2. Implement Approval Queries:
   - GetPendingApprovalsQuery + Handler
   - GetApprovalHistoryQuery + Handler

3. Implement Role Queries:
   - GetRoleSelectionQuery + Handler
   - GetRoleSummaryQuery + Handler

4. Implement Reference Data Queries:
   - GetRoleCatalogQuery + Handler
   - GetBusinessUnitsQuery + Handler
   - GetAgenciesQuery + Handler

5. Create DTOs and mapping profiles (AutoMapper)

**Deliverables:**
- All query handlers implemented
- DTOs defined
- AutoMapper configured
- Integration tests passing

#### Event Handlers (Week 6, Day 3)

**Tasks:**
1. Implement domain event handlers:
   - RequestSubmittedEventHandler (send email)
   - RequestApprovedEventHandler (send email, check workflow)
   - RequestRejectedEventHandler (send email)
   - RequestCompletedEventHandler (send emails, archive)

2. Configure email service:
   - Email templates
   - Azure Communication Services integration
   - Retry logic

3. Test event publishing and handling

**Deliverables:**
- Event handlers implemented
- Email service functional
- Events properly raised and handled

### Week 7-8: API Layer & Authentication

#### API Controllers (Week 7, Day 1-3)

**Tasks:**
1. Implement controllers:
   - RequestsController
   - ApprovalsController
   - RoleSelectionsController
   - MnitController
   - ReferenceDataController

2. Configure routing and versioning

3. Implement filters:
   - ExceptionFilter
   - ValidationFilter
   - AuthorizationFilter

4. Configure Swagger/OpenAPI:
   - API documentation
   - Example requests/responses
   - Authentication configuration

5. Add middleware:
   - Exception handling
   - Request logging
   - Performance monitoring
   - CORS configuration

**Deliverables:**
- All API controllers implemented
- Swagger documentation generated
- Middleware configured
- API testable via Swagger UI

#### Authentication & Authorization (Week 7, Day 4-5)

**Tasks:**
1. Configure Azure AD authentication:
   - JWT bearer authentication
   - Token validation
   - Claims transformation

2. Implement authorization policies:
   - CanSubmitRequest
   - CanApprove
   - CanAccessMnit
   - CanViewAllRequests

3. Implement Row-Level Security context:
   - Set session context in middleware
   - Pass user claims to database

4. Create CurrentUserService:
   - Get current user ID
   - Get current user email
   - Get current user roles

**Deliverables:**
- Azure AD authentication working
- Authorization policies implemented
- RLS context configured
- Authentication tested

#### Integration Testing (Week 8)

**Tasks:**
1. Set up integration test infrastructure:
   - Test database (Docker or LocalDB)
   - WebApplicationFactory
   - Test data builders

2. Write integration tests:
   - Request lifecycle tests
   - Approval workflow tests
   - Authentication/authorization tests
   - Error handling tests

3. API endpoint testing:
   - Happy path scenarios
   - Error scenarios
   - Authorization scenarios
   - Validation scenarios

4. Performance testing:
   - Load testing (basic)
   - Response time benchmarks

5. Security testing:
   - OWASP Top 10 checks
   - Authentication bypass attempts
   - SQL injection tests
   - XSS tests

**Deliverables:**
- Integration test suite (>50 tests)
- All tests passing
- Performance baseline documented
- Security vulnerabilities addressed

### Phase 2 Completion Checklist

- [ ] Domain models implemented and tested
- [ ] Database schema deployed to all environments
- [ ] All command handlers working
- [ ] All query handlers working
- [ ] Event handlers functional
- [ ] All API controllers implemented
- [ ] Authentication and authorization working
- [ ] Integration tests passing
- [ ] API documentation complete
- [ ] Code coverage >80%

---

## Phase 3: Frontend Integration
**Duration:** 3 weeks (Weeks 9-11)

### Phase 3 Goals

✅ React app integrated with new ASP.NET Core API
✅ Azure AD authentication implemented
✅ All pages functional with new backend
✅ UI/UX improvements applied
✅ Frontend tests updated and passing

### Week 9: API Integration Layer

#### API Client Refactoring (Day 1-3)

**Tasks:**
1. Update API client configuration:
   - Change base URL to ASP.NET Core API
   - Update request/response interceptors
   - Implement new token management

2. Create new API service modules:
   - requestsApi.ts (refactored for new endpoints)
   - approvalsApi.ts (updated)
   - roleSelectionsApi.ts (updated)
   - mnitApi.ts (updated)
   - referenceDataApi.ts (new)

3. Update TypeScript types:
   - RequestDto type definitions
   - ApprovalDto type definitions
   - RoleSelectionDto types
   - API response wrappers
   - Error types

4. Implement error handling:
   - Parse new error response format
   - Display user-friendly messages
   - Handle validation errors
   - Handle authentication errors

**Deliverables:**
- API client fully refactored
- All TypeScript types updated
- Error handling implemented
- API integration tested

#### Authentication Migration (Day 4-5)

**Tasks:**
1. Remove Supabase authentication:
   - Remove Supabase client initialization
   - Remove Supabase auth context
   - Clean up related code

2. Implement MSAL (Microsoft Authentication Library):
   ```typescript
   import { PublicClientApplication } from '@azure/msal-browser';

   const msalConfig = {
     auth: {
       clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
       authority: `https://login.microsoftonline.com/${tenantId}`,
       redirectUri: window.location.origin,
     },
   };

   const msalInstance = new PublicClientApplication(msalConfig);
   ```

3. Create new AuthContext:
   - Login with Azure AD
   - Token acquisition and refresh
   - Logout functionality
   - User profile management

4. Update protected routes:
   - Use MSAL authentication guard
   - Handle redirect flows
   - Preserve deep linking

5. Update all pages to use new auth:
   - Remove Supabase auth calls
   - Use MSAL auth context
   - Update user profile display

**Deliverables:**
- Azure AD authentication working
- Login/logout functional
- Protected routes working
- User profile displayed correctly

### Week 10: Page Updates & Integration

#### Main Pages Integration (Day 1-3)

**Tasks:**
1. Update HomePage (App.tsx):
   - Integrate with new POST /api/requests endpoint
   - Update form submission handling
   - Test auto-save functionality
   - Update error handling

2. Update SelectRolesPage:
   - Integrate with POST /api/requests/{id}/roles
   - Load role catalog from new API
   - Update role selection logic
   - Test auto-save

3. Update SignaturePage:
   - Integrate with POST /api/approvals/{id}/approve
   - Update signature capture
   - Test approval/rejection flows

4. Update RequestListPage:
   - Integrate with GET /api/requests
   - Implement new filtering
   - Update pagination
   - Test sorting

5. Update RequestDetailsPage:
   - Integrate with GET /api/requests/{id}
   - Display role selections
   - Show approval timeline
   - Test with different request states

**Deliverables:**
- All main pages functional
- API integration working
- Page-level tests passing
- User flows tested

#### MNIT Pages & Additional Features (Day 4-5)

**Tasks:**
1. Update MnitDetailsPage:
   - Integrate with GET /api/mnit/requests/{id}
   - Display role codes for provisioning
   - Update completion workflow
   - Test MNIT-specific permissions

2. Implement new features:
   - Request statistics dashboard
   - Approval history view
   - Enhanced search functionality
   - Export functionality

3. Update reference data loading:
   - Load agencies from API
   - Load business units from API
   - Load role catalog from API
   - Cache reference data appropriately

4. Implement loading states:
   - Skeleton loaders
   - Spinner components
   - Progress indicators

**Deliverables:**
- MNIT pages functional
- New features implemented
- Reference data loading working
- Loading states polished

### Week 11: UI/UX Polish & Testing

#### UI/UX Improvements (Day 1-2)

**Tasks:**
1. Accessibility enhancements:
   - ARIA labels updated
   - Keyboard navigation verified
   - Screen reader testing
   - WCAG 2.2 AA compliance verified

2. Responsive design verification:
   - Mobile testing
   - Tablet testing
   - Desktop testing
   - 400% zoom testing

3. Visual polish:
   - Consistent spacing
   - Color scheme refinement
   - Typography review
   - Icon usage

4. User feedback improvements:
   - Success messages
   - Error messages
   - Loading indicators
   - Confirmation dialogs

**Deliverables:**
- Accessibility verified
- Responsive design confirmed
- Visual polish applied
- User feedback improved

#### Frontend Testing (Day 3-5)

**Tasks:**
1. Update unit tests:
   - Component tests
   - Hook tests
   - Utility function tests
   - Mock new API calls

2. Write integration tests:
   - User authentication flow
   - Request submission flow
   - Approval flow
   - MNIT processing flow

3. End-to-end testing (Cypress/Playwright):
   - Complete request lifecycle
   - Multi-user approval workflow
   - Error scenarios
   - Edge cases

4. Cross-browser testing:
   - Chrome
   - Firefox
   - Safari
   - Edge

5. Performance testing:
   - Lighthouse scores
   - Load time analysis
   - Bundle size optimization

**Deliverables:**
- Unit tests updated (>80% coverage)
- Integration tests passing
- E2E tests passing
- Cross-browser compatibility confirmed
- Performance benchmarks met

### Phase 3 Completion Checklist

- [ ] API client integrated with new backend
- [ ] Azure AD authentication working
- [ ] All pages functional
- [ ] MNIT pages working
- [ ] Reference data loading correctly
- [ ] UI/UX improvements applied
- [ ] Accessibility verified
- [ ] Frontend tests passing
- [ ] Cross-browser compatibility confirmed
- [ ] Performance benchmarks met

---

## Phase 4: Data Migration
**Duration:** 2 weeks (Weeks 12-13)

### Phase 4 Goals

✅ Data migration strategy finalized
✅ Migration scripts created and tested
✅ Production data migrated successfully
✅ Data integrity verified
✅ Old system archived

### Week 12: Migration Planning & Scripts

#### Migration Strategy (Day 1)

**Approach: Offline Big Bang Migration**

**Steps:**
1. Freeze current system (read-only mode)
2. Export data from Supabase PostgreSQL
3. Transform data to SQL Server format
4. Import data into SQL Server
5. Verify data integrity
6. Cut over to new system

**Data to migrate:**
- security_role_requests (~1000-5000 records)
- security_role_selections (~1000-5000 records)
- request_approvals (~5000-25000 records)
- security_areas (~3000-15000 records)

**Data NOT migrated (reference data will be re-created):**
- role_catalog (will be seeded from new definitions)
- business_units (will be loaded from current sources)

#### Export Scripts (Day 2)

**Tasks:**
1. Create PostgreSQL export scripts:
   ```sql
   -- Export security_role_requests
   COPY (
     SELECT * FROM security_role_requests
     WHERE NOT is_deleted
     ORDER BY created_at
   ) TO '/tmp/security_role_requests.csv' WITH CSV HEADER;

   -- Export security_role_selections
   COPY (
     SELECT * FROM security_role_selections
     ORDER BY created_at
   ) TO '/tmp/security_role_selections.csv' WITH CSV HEADER;

   -- Export request_approvals
   COPY (
     SELECT * FROM request_approvals
     ORDER BY created_at
   ) TO '/tmp/request_approvals.csv' WITH CSV HEADER;
   ```

2. Test export on dev database

3. Verify data completeness

4. Document export process

**Deliverables:**
- Export scripts created
- Test export successful
- Data completeness verified

#### Transformation Scripts (Day 3-4)

**Tasks:**
1. Create data transformation logic:
   - Convert UUIDs (PostgreSQL) to GUIDs (SQL Server)
   - Map old column names to new (if any differences)
   - Convert timestamps (with time zones) to SQL Server format
   - Transform JSON fields if needed
   - Handle null values appropriately

2. Implement data cleaning:
   - Remove orphaned records
   - Fix data inconsistencies
   - Validate foreign key relationships
   - Standardize formats

3. Create C# import application:
   ```csharp
   public class DataMigrationService
   {
       public async Task MigrateRequestsAsync(string csvPath)
       {
           var records = ReadCsvFile<RequestCsvDto>(csvPath);

           foreach (var record in records)
           {
               var request = MapToEntity(record);
               await _dbContext.SecurityRoleRequests.AddAsync(request);
           }

           await _dbContext.SaveChangesAsync();
       }
   }
   ```

4. Implement validation checks:
   - Record counts match
   - Foreign key integrity
   - Data type correctness
   - Required fields populated

**Deliverables:**
- Transformation logic implemented
- Import application created
- Validation checks working

#### Import Testing (Day 5)

**Tasks:**
1. Run full migration on dev environment:
   - Export from dev Supabase
   - Transform data
   - Import to dev SQL Server
   - Run validation checks

2. Compare data:
   - Record counts
   - Sample data verification
   - Relationship integrity
   - Data accuracy

3. Performance testing:
   - Import speed
   - Database load during import
   - Index rebuild time

4. Document any issues and resolutions

**Deliverables:**
- Dev migration successful
- Validation passing
- Performance acceptable
- Issues documented and resolved

### Week 13: Production Migration & Verification

#### Dry Run (Day 1-2)

**Tasks:**
1. Perform dry run in staging:
   - Use production data snapshot
   - Full migration process
   - Timing each step
   - Document any issues

2. Test cutover procedures:
   - System freeze process
   - Migration execution
   - System activation
   - Rollback procedures (if needed)

3. Refine scripts based on dry run

4. Create detailed runbook for production

**Deliverables:**
- Staging migration successful
- Timing data collected
- Runbook finalized
- Team prepared for production

#### Production Migration (Day 3, Weekend)

**Pre-Migration (Friday Evening):**
1. Communication:
   - Notify all users
   - Post maintenance banner
   - Set auto-reply emails

2. Backup current system:
   - Full Supabase backup
   - Export all data
   - Store backups securely

3. Put system in read-only mode:
   - Disable write operations
   - Display maintenance message

**Migration (Saturday Morning):**
1. Export data from Supabase (1-2 hours)
2. Transform data (30 mins)
3. Import to SQL Server (2-3 hours)
4. Run validation checks (1 hour)
5. Rebuild indexes and update statistics (30 mins)
6. Smoke testing (1 hour)

**Cutover (Saturday Afternoon):**
1. Update DNS/routing to new system
2. Remove maintenance message
3. Enable write operations
4. Monitor system closely

**Deliverables:**
- Production data migrated
- Validation passing
- New system live
- Old system on standby

#### Verification & Monitoring (Day 4-5, Mon-Tue)

**Tasks:**
1. Data verification:
   - Run comparison queries
   - Spot-check critical records
   - Verify user access
   - Test all workflows

2. System monitoring:
   - API response times
   - Database performance
   - Error rates
   - User feedback

3. User validation:
   - Key users test system
   - Report any issues
   - Verify data accuracy

4. Issue resolution:
   - Fix any data issues
   - Performance tuning
   - Bug fixes

5. Documentation:
   - Migration report
   - Lessons learned
   - Updated architecture docs

**Deliverables:**
- Data verification complete
- System performing well
- Issues resolved
- Migration report created

### Phase 4 Completion Checklist

- [ ] Export scripts created and tested
- [ ] Transformation logic implemented
- [ ] Import scripts working
- [ ] Dev migration successful
- [ ] Staging dry run successful
- [ ] Production migration successful
- [ ] Data validation passing
- [ ] System performance acceptable
- [ ] Users validated data accuracy
- [ ] Old system archived

---

## Phase 5: Testing & Validation
**Duration:** 3 weeks (Weeks 14-16)

### Phase 5 Goals

✅ Comprehensive testing completed
✅ User Acceptance Testing (UAT) successful
✅ Performance benchmarks met
✅ Security audit passed
✅ Documentation complete

### Week 14: System Testing

#### Functional Testing (Day 1-3)

**Test Scenarios:**
1. Request Submission:
   - New employee request
   - Non-employee request
   - Copy user functionality
   - All security areas
   - Draft save/load
   - Form validation

2. Role Selection:
   - All role categories
   - Route control specifications
   - Business unit selection
   - Required roles validation
   - Auto-save functionality

3. Approval Workflow:
   - Supervisor approval
   - Security Admin approval
   - Director approvals (various types)
   - Signature capture
   - Rejection flow
   - Email notifications

4. MNIT Processing:
   - View pending requests
   - Role code display
   - Complete processing
   - Completion notifications

5. Reference Data:
   - Load agencies
   - Load business units
   - Load role catalog
   - Search functionality

**Deliverables:**
- Test cases executed (>200 tests)
- Issues logged and triaged
- Critical issues resolved

#### Integration Testing (Day 4-5)

**Test Scenarios:**
1. End-to-end workflows:
   - Complete request lifecycle
   - Multi-level approval chains
   - Different security areas
   - Edge cases

2. System integrations:
   - Azure AD authentication
   - Email service
   - Database operations
   - File storage (signatures)

3. Error handling:
   - Network failures
   - Database errors
   - Authentication failures
   - Validation errors

4. Concurrent operations:
   - Multiple users submitting
   - Simultaneous approvals
   - Race conditions

**Deliverables:**
- Integration tests passing
- Error handling verified
- Concurrency issues resolved

### Week 15: UAT & Performance Testing

#### User Acceptance Testing (Day 1-3)

**UAT Process:**
1. UAT environment setup:
   - Production-like data
   - All user roles configured
   - Test scenarios provided

2. User groups:
   - Submitters (5 users)
   - Supervisors (3 users)
   - Security Admins (2 users)
   - Directors (3 users)
   - MNIT staff (2 users)

3. Test scenarios:
   - Real-world workflows
   - Common use cases
   - Edge cases
   - Error scenarios

4. Feedback collection:
   - Daily standups
   - Issue tracking
   - Feature requests
   - Usability feedback

5. Issue resolution:
   - Critical issues: immediate fix
   - High priority: fix this week
   - Medium/Low: backlog

**Deliverables:**
- UAT completed with user sign-off
- Critical issues resolved
- Feedback documented

#### Performance Testing (Day 4-5)

**Performance Requirements:**
- API response time: <500ms (p95)
- Page load time: <2s
- Database query time: <100ms (p95)
- Concurrent users: 100+
- Approval email: <30s delivery

**Tests:**
1. Load testing:
   - 10 concurrent users
   - 50 concurrent users
   - 100 concurrent users
   - 500 concurrent requests/minute

2. Stress testing:
   - Find breaking point
   - Recovery testing
   - Resource monitoring

3. Endurance testing:
   - 24-hour sustained load
   - Memory leak detection
   - Connection pool exhaustion

4. Database performance:
   - Query execution plans
   - Index usage
   - Slow query analysis

**Deliverables:**
- Performance benchmarks met
- Bottlenecks identified and resolved
- Capacity planning document

### Week 16: Security & Final Validation

#### Security Testing (Day 1-2)

**Security Audit:**
1. Authentication testing:
   - Token validation
   - Session management
   - Password policies
   - MFA enforcement

2. Authorization testing:
   - Role-based access control
   - Row-level security
   - Privilege escalation attempts
   - Cross-user data access

3. OWASP Top 10:
   - Injection attacks (SQL, XSS, etc.)
   - Broken authentication
   - Sensitive data exposure
   - XML external entities
   - Broken access control
   - Security misconfiguration
   - Cross-site scripting (XSS)
   - Insecure deserialization
   - Using components with known vulnerabilities
   - Insufficient logging & monitoring

4. Penetration testing:
   - External pen test (if required)
   - Internal pen test
   - Vulnerability scanning

5. Code security review:
   - Static code analysis
   - Dependency vulnerability scan
   - Secret scanning

**Deliverables:**
- Security audit report
- Vulnerabilities resolved
- Security sign-off

#### Final Validation (Day 3-5)

**Tasks:**
1. Regression testing:
   - Re-run all test suites
   - Verify bug fixes
   - No new issues introduced

2. Accessibility testing:
   - WCAG 2.2 AA compliance
   - Screen reader testing
   - Keyboard navigation
   - Color contrast
   - 400% magnification

3. Browser compatibility:
   - Chrome (latest)
   - Firefox (latest)
   - Safari (latest)
   - Edge (latest)

4. Documentation review:
   - User guides
   - Admin guides
   - API documentation
   - Troubleshooting guides

5. Training material:
   - User training videos
   - Admin training guides
   - Quick reference cards

6. Go-live readiness:
   - Deployment checklist
   - Rollback plan
   - Support plan
   - Communication plan

**Deliverables:**
- Regression tests passing
- Accessibility verified
- Browser compatibility confirmed
- Documentation complete
- Training material ready
- Go-live approval

### Phase 5 Completion Checklist

- [ ] Functional testing complete
- [ ] Integration testing complete
- [ ] UAT successful with sign-off
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Accessibility verified
- [ ] Browser compatibility confirmed
- [ ] Documentation complete
- [ ] Training material ready
- [ ] Go-live readiness confirmed

---

## Phase 6: Deployment & Cutover
**Duration:** 1 week (Week 17)

### Phase 6 Goals

✅ Production deployment successful
✅ Users transitioned to new system
✅ Monitoring and support in place
✅ Old system decommissioned
✅ Project closed out

### Day 1-2 (Mon-Tue): Pre-Deployment

**Tasks:**
1. Final code freeze:
   - No new features
   - Only critical bug fixes
   - All code reviewed and approved

2. Final deployment testing:
   - Staging deployment
   - Smoke tests
   - Performance tests
   - Security scan

3. Communication:
   - Email all users
   - Post announcements
   - Schedule training sessions
   - Prepare helpdesk

4. Team preparation:
   - Deployment runbook review
   - Role assignments
   - Communication channels
   - Escalation procedures

5. Monitoring setup:
   - Application Insights alerts
   - Database monitoring
   - Error tracking
   - User analytics

**Deliverables:**
- Code frozen
- Staging verified
- Communications sent
- Team prepared

### Day 3 (Wed): Production Deployment

**Morning (8am-12pm):**
1. Final backup of old system

2. Deploy backend to production:
   - Deploy to staging slot
   - Run smoke tests
   - Swap to production slot
   - Verify health checks

3. Deploy database changes:
   - Run migrations
   - Seed reference data
   - Verify data

4. Deploy frontend:
   - Build production React app
   - Deploy to Static Web App
   - Verify deployment

**Afternoon (1pm-5pm):**
5. System verification:
   - Smoke tests
   - Critical path testing
   - Performance check
   - Security check

6. User access verification:
   - Test user login
   - Verify permissions
   - Check data access

7. Integration verification:
   - Email sending
   - Azure AD auth
   - Database connectivity

8. Monitoring check:
   - Verify Application Insights
   - Check alerts
   - Review logs

**Evening (5pm-8pm):**
9. Go-live announcement:
   - Email users
   - Post in Teams/Slack
   - Update status page

10. Initial monitoring:
    - Watch for errors
    - Monitor performance
    - Track user activity

**Deliverables:**
- Production deployment complete
- System functional
- Monitoring active
- Users notified

### Day 4 (Thu): Hypercare Day 1

**Tasks:**
1. Intensive monitoring:
   - Application errors
   - Performance metrics
   - User feedback
   - Database performance

2. User support:
   - Answer questions
   - Resolve issues
   - Collect feedback
   - Document problems

3. Issue triage:
   - Critical: fix immediately
   - High: fix today
   - Medium: backlog
   - Low: backlog

4. Training sessions:
   - Morning: Submitters
   - Afternoon: Approvers
   - Evening: MNIT staff

5. Daily standup:
   - Review issues
   - Discuss resolutions
   - Plan next steps

**Deliverables:**
- Issues identified and triaged
- Critical issues resolved
- Training sessions conducted
- User feedback collected

### Day 5 (Fri): Hypercare Day 2

**Tasks:**
1. Continue monitoring and support

2. Issue resolution:
   - Address high-priority items
   - Deploy hot fixes if needed

3. Performance tuning:
   - Analyze slow queries
   - Optimize bottlenecks
   - Adjust scaling if needed

4. User feedback analysis:
   - Common issues
   - Feature requests
   - Usability improvements

5. Documentation updates:
   - Known issues
   - Workarounds
   - FAQ updates

6. Week 1 retrospective:
   - What went well
   - What didn't go well
   - Action items

**Deliverables:**
- High-priority issues resolved
- Performance optimized
- Feedback analyzed
- Retrospective complete

### Post-Go-Live: Weeks 2-4

**Week 18-20 Tasks:**
1. Continued support and monitoring

2. Address backlog items:
   - Medium priority issues
   - Minor enhancements
   - Documentation updates

3. Decommission old system:
   - Week 18: Keep on standby
   - Week 19: Archive data
   - Week 20: Decommission infrastructure

4. Knowledge transfer:
   - Operations team
   - Support team
   - Admin documentation

5. Project closeout:
   - Final report
   - Lessons learned
   - Team celebration

**Deliverables:**
- System stable
- Old system decommissioned
- Knowledge transferred
- Project closed

### Phase 6 Completion Checklist

- [ ] Production deployment successful
- [ ] System functional and stable
- [ ] Monitoring and alerts active
- [ ] Users trained and productive
- [ ] Critical issues resolved
- [ ] Performance acceptable
- [ ] User feedback positive
- [ ] Old system decommissioned
- [ ] Knowledge transferred
- [ ] Project closed out

---

## 9. Risk Management

### 9.1 High-Impact Risks

| Risk | Probability | Impact | Mitigation | Contingency |
|------|------------|--------|------------|-------------|
| **Data loss during migration** | Low | Critical | - Multiple backups<br>- Test migrations<br>- Validation scripts | - Rollback to old system<br>- Restore from backup |
| **Authentication issues** | Medium | High | - Thorough Azure AD testing<br>- Fallback auth method<br>- Early integration | - Manual approval process<br>- Temporary workarounds |
| **Performance degradation** | Medium | High | - Load testing<br>- Performance monitoring<br>- Capacity planning | - Scale up resources<br>- Optimize queries<br>- Rollback if severe |
| **Security vulnerabilities** | Low | Critical | - Security audit<br>- Pen testing<br>- Code review | - Emergency patching<br>- Temporary access restrictions |
| **User adoption issues** | Medium | Medium | - Training programs<br>- Documentation<br>- Change management | - Extended support<br>- Additional training |
| **Timeline delays** | Medium | Medium | - Buffer time in schedule<br>- Parallel work streams<br>- Clear dependencies | - Reduce scope<br>- Add resources<br>- Phased rollout |
| **Scope creep** | High | Medium | - Change control process<br>- Regular scope reviews<br>- Stakeholder management | - Defer to Phase 2<br>- Prioritize MVP |

### 9.2 Technical Risks

| Risk | Mitigation |
|------|------------|
| EF Core performance issues | - Proper indexing<br>- Query optimization<br>- Performance testing |
| Azure service outages | - Multi-region deployment<br>- Redundancy<br>- DR plan |
| SQL Server compatibility | - Early testing<br>- Migration scripts validation |
| CORS/CSRF issues | - Proper configuration<br>- Security testing |
| Email delivery problems | - Use reliable service (Azure)<br>- Retry logic<br>- Monitoring |

### 9.3 Mitigation Strategies

**1. Communication:**
- Weekly status reports
- Daily standups during critical phases
- Slack/Teams channel for real-time updates
- Stakeholder demos

**2. Quality Assurance:**
- Code reviews (100% coverage)
- Automated testing (unit, integration, E2E)
- Manual testing (functional, UAT)
- Security audits

**3. Change Management:**
- Formal change control process
- Impact analysis for changes
- Approval required for scope changes
- Documentation of all changes

**4. Contingency Planning:**
- Rollback procedures documented
- Backups at every stage
- Alternative approaches identified
- Emergency contacts established

---

## 10. Success Criteria

### 10.1 Technical Success Criteria

- [ ] All API endpoints functional (100%)
- [ ] All unit tests passing (>80% code coverage)
- [ ] All integration tests passing
- [ ] Performance benchmarks met:
  - API response time <500ms (p95)
  - Page load time <2s
  - Database queries <100ms (p95)
- [ ] Security audit passed with no critical issues
- [ ] Accessibility compliance (WCAG 2.2 AA)
- [ ] Zero data loss during migration
- [ ] 99.9% uptime in first month

### 10.2 Business Success Criteria

- [ ] All user roles can perform their tasks
- [ ] Request processing time <3 days (average)
- [ ] User satisfaction >80% (post-launch survey)
- [ ] Support ticket volume <10 per week (after month 1)
- [ ] Training completion rate >90%
- [ ] Zero critical production incidents
- [ ] Cost within budget (±10%)
- [ ] Timeline met (±1 week)

### 10.3 User Acceptance Criteria

- [ ] Submitters can create and submit requests
- [ ] Approvers can review and approve requests
- [ ] MNIT can process completed requests
- [ ] Email notifications working
- [ ] Digital signatures captured correctly
- [ ] Role selections accurate
- [ ] Reporting functional
- [ ] Search and filtering working
- [ ] Mobile responsive
- [ ] Accessible to users with disabilities

---

## Document Summary

This migration plan provides:

**Comprehensive Planning**: 6 phases over 17 weeks with detailed tasks
**Risk Management**: Identified risks with mitigation strategies
**Success Criteria**: Clear, measurable goals
**Team Structure**: Defined roles and responsibilities
**Deliverables**: Specific outputs for each phase

The plan follows industry best practices:
- Phased approach with clear milestones
- Parallel development where possible
- Comprehensive testing at every stage
- Risk mitigation strategies
- Clear success criteria

---

**Document Version:** 1.0
**Last Updated:** November 21, 2025
**Status:** Complete
**Estimated Timeline:** 17 weeks (~4.5 months)
**Estimated Team Size:** 6-8 people

---

**END OF MIGRATION_PLAN.MD**
