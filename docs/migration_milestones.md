# Migration Milestones
## SWIFT Security Role Access Request System - ASP.NET Core Migration

**Document Version:** 1.0
**Last Updated:** November 21, 2025
**Document Type:** Project Timeline & Milestones

---

## Table of Contents

1. [Milestone Overview](#1-milestone-overview)
2. [Phase 1 Milestones](#2-phase-1-milestones)
3. [Phase 2 Milestones](#3-phase-2-milestones)
4. [Phase 3 Milestones](#4-phase-3-milestones)
5. [Phase 4 Milestones](#5-phase-4-milestones)
6. [Phase 5 Milestones](#6-phase-5-milestones)
7. [Phase 6 Milestones](#7-phase-6-milestones)
8. [Critical Path Analysis](#8-critical-path-analysis)

---

## 1. Milestone Overview

### 1.1 Project Timeline

**Total Duration:** 17 weeks
**Total Milestones:** 35
**Start Date:** Week 1, Day 1
**Go-Live:** Week 17, Day 5

### 1.2 Milestone Categories

| Category | Count | Weeks |
|----------|-------|-------|
| Infrastructure Setup | 8 | 1-2 |
| Backend Development | 10 | 3-8 |
| Frontend Integration | 6 | 9-11 |
| Data Migration | 4 | 12-13 |
| Testing & Validation | 5 | 14-16 |
| Deployment | 2 | 17 |

---

## 2. Phase 1 Milestones

### Infrastructure & Setup (Week 1-2)

#### M1: Azure Subscription Configured
**Week:** 1 | **Days:** 1-2 | **Owner:** DevOps Engineer

**Deliverables:**
- Azure subscription provisioned
- Resource groups created (dev, test, staging, prod)
- Naming conventions established
- Cost alerts configured
- RBAC roles assigned

**Success Criteria:**
- All team members have appropriate access
- Resource groups visible in Azure Portal
- Cost tracking active

**Dependencies:** None

---

#### M2: Azure AD Authentication Configured
**Week:** 1 | **Days:** 1-2 | **Owner:** Tech Lead

**Deliverables:**
- App registrations created (API + SPA)
- Redirect URIs configured
- API permissions set up
- Token configuration complete
- Test users created

**Success Criteria:**
- Users can authenticate via Azure AD
- Tokens contain required claims
- Permissions properly scoped

**Dependencies:** M1

---

#### M3: Database Infrastructure Provisioned
**Week:** 1 | **Days:** 3-4 | **Owner:** Database Administrator

**Deliverables:**
- Azure SQL Server instances created
- Databases provisioned
- Firewall rules configured
- Backup policies set
- Geo-replication enabled (prod)

**Success Criteria:**
- Can connect to all databases
- Backups running successfully
- Security configurations verified

**Dependencies:** M1

---

#### M4: Key Vault and Secrets Management
**Week:** 1 | **Days:** 3-4 | **Owner:** DevOps Engineer

**Deliverables:**
- Azure Key Vault created
- Connection strings stored
- API keys secured
- Access policies configured
- Managed identities set up

**Success Criteria:**
- Applications can retrieve secrets
- Audit logging enabled
- No secrets in source code

**Dependencies:** M3

---

#### M5: App Services Provisioned
**Week:** 1 | **Days:** 5 | **Owner:** DevOps Engineer

**Deliverables:**
- App Service Plans created
- API App Services provisioned
- Static Web Apps created
- Application Insights enabled
- Managed identities configured

**Success Criteria:**
- Services accessible via URLs
- Health endpoints responding
- Monitoring dashboards visible

**Dependencies:** M1

---

#### M6: Project Structure Created
**Week:** 2 | **Days:** 1-2 | **Owner:** Tech Lead

**Deliverables:**
- ASP.NET Core solution scaffolded
- Project layers established
- Test projects created
- NuGet packages installed
- Configuration files set up

**Success Criteria:**
- Solution builds successfully
- All projects reference correctly
- Configuration loads properly

**Dependencies:** None

---

#### M7: CI/CD Pipeline Operational
**Week:** 2 | **Days:** 3-4 | **Owner:** DevOps Engineer

**Deliverables:**
- GitHub Actions workflows created
- Build pipeline working
- Test pipeline configured
- Deployment pipelines set up
- Deployment secrets configured

**Success Criteria:**
- Code commits trigger builds
- Tests run automatically
- Deployments succeed to dev
- Pipeline status visible

**Dependencies:** M5, M6

---

#### M8: Development Environment Ready
**Week:** 2 | **Days:** 5 | **Owner:** Tech Lead

**Deliverables:**
- Code quality tools configured
- Documentation structure established
- Development runbooks created
- Team onboarded
- First deployment to dev successful

**Success Criteria:**
- All developers can build locally
- Code standards enforced
- Documentation accessible
- Dev environment functional

**Dependencies:** M6, M7

---

## 3. Phase 2 Milestones

### Backend Migration (Week 3-8)

#### M9: Domain Models Implemented
**Week:** 3 | **Days:** 1-3 | **Owner:** Senior Backend Developer

**Deliverables:**
- Core entities created
- Value objects implemented
- Domain events defined
- Domain exceptions created
- Unit tests written (>80% coverage)

**Success Criteria:**
- All domain logic encapsulated
- Business rules enforced
- Unit tests passing
- No infrastructure dependencies

**Dependencies:** M6

---

#### M10: Database Schema Designed
**Week:** 3 | **Days:** 4-5 | **Owner:** Database Administrator

**Deliverables:**
- Complete database schema
- ER diagram
- Index strategy
- RLS policies defined
- Always Encrypted columns identified

**Success Criteria:**
- Schema reviewed and approved
- Performance considerations addressed
- Security requirements met

**Dependencies:** M9

---

#### M11: Entity Framework Configured
**Week:** 4 | **Days:** 1-2 | **Owner:** Senior Backend Developer

**Deliverables:**
- SwiftDbContext created
- Entity configurations complete
- Conventions configured
- Interceptors implemented
- Initial migration created

**Success Criteria:**
- EF Core properly configured
- Migrations generate correctly
- Change tracking working

**Dependencies:** M9, M10

---

#### M12: Database Deployed to All Environments
**Week:** 4 | **Days:** 3-5 | **Owner:** Database Administrator

**Deliverables:**
- Migrations applied (dev, test, staging)
- Reference data seeded
- RLS policies deployed
- Backup configured
- Performance baseline established

**Success Criteria:**
- Database schema matches design
- Reference data loaded correctly
- Performance acceptable

**Dependencies:** M11

---

#### M13: CQRS Commands Implemented
**Week:** 5 | **Days:** 1-5 | **Owner:** Senior Backend Developer

**Deliverables:**
- Request command handlers
- Approval command handlers
- Role selection command handlers
- FluentValidation validators
- Pipeline behaviors

**Success Criteria:**
- All command handlers working
- Validation working properly
- Unit tests passing (>80%)

**Dependencies:** M11, M12

---

#### M14: CQRS Queries Implemented
**Week:** 6 | **Days:** 1-2 | **Owner:** Senior Backend Developer

**Deliverables:**
- Request query handlers
- Approval query handlers
- Role selection query handlers
- Reference data query handlers
- DTOs and AutoMapper profiles

**Success Criteria:**
- All query handlers working
- Efficient queries
- DTOs properly mapped

**Dependencies:** M13

---

#### M15: Event Handlers Implemented
**Week:** 6 | **Days:** 3 | **Owner:** Senior Backend Developer

**Deliverables:**
- Domain event handlers created
- Email service integrated
- Email templates created
- Retry logic implemented
- Event publishing working

**Success Criteria:**
- Events properly raised
- Emails sent successfully
- Retry logic working

**Dependencies:** M13

---

#### M16: API Controllers Implemented
**Week:** 7 | **Days:** 1-3 | **Owner:** Senior Backend Developer

**Deliverables:**
- All API controllers created
- Routing configured
- Filters implemented
- Swagger/OpenAPI configured
- Middleware configured

**Success Criteria:**
- All endpoints accessible via Swagger
- Proper error handling
- API documentation generated

**Dependencies:** M13, M14

---

#### M17: Authentication and Authorization Complete
**Week:** 7 | **Days:** 4-5 | **Owner:** Tech Lead

**Deliverables:**
- Azure AD authentication configured
- JWT bearer authentication working
- Authorization policies implemented
- RLS context configured
- CurrentUserService created

**Success Criteria:**
- Users can authenticate
- Authorization policies enforced
- RLS working correctly

**Dependencies:** M2, M16

---

#### M18: Backend Integration Testing Complete
**Week:** 8 | **Days:** 1-5 | **Owner:** Senior Backend Developer + QA Engineer

**Deliverables:**
- Integration test infrastructure set up
- API endpoint tests written (>50 tests)
- Auth tests
- Performance testing completed
- Security testing completed

**Success Criteria:**
- All integration tests passing
- API performance acceptable
- No security vulnerabilities
- Code coverage >80%

**Dependencies:** M16, M17

---

## 4. Phase 3 Milestones

### Frontend Integration (Week 9-11)

#### M19: API Client Refactored
**Week:** 9 | **Days:** 1-3 | **Owner:** Frontend Developer

**Deliverables:**
- API client updated for new endpoints
- TypeScript types updated
- Error handling implemented
- API service modules created
- Request/response interceptors updated

**Success Criteria:**
- API calls working to new backend
- Error handling functional
- TypeScript types correct

**Dependencies:** M16

---

#### M20: Azure AD Authentication Integrated
**Week:** 9 | **Days:** 4-5 | **Owner:** Frontend Developer

**Deliverables:**
- Supabase auth removed
- MSAL library integrated
- AuthContext created
- Protected routes updated
- Login/logout working

**Success Criteria:**
- Users can log in with Azure AD
- Token management working
- Protected routes enforced

**Dependencies:** M17, M19

---

#### M21: Main Pages Integrated
**Week:** 10 | **Days:** 1-3 | **Owner:** Frontend Developer

**Deliverables:**
- HomePage integrated
- SelectRolesPage integrated
- SignaturePage integrated
- RequestListPage integrated
- RequestDetailsPage integrated

**Success Criteria:**
- All main pages functional
- Forms submitting correctly
- Data loading properly

**Dependencies:** M19, M20

---

#### M22: MNIT Pages and Features Complete
**Week:** 10 | **Days:** 4-5 | **Owner:** Frontend Developer

**Deliverables:**
- MnitDetailsPage integrated
- Statistics dashboard implemented
- Search functionality enhanced
- Export functionality added
- Reference data loading working

**Success Criteria:**
- MNIT workflow functional
- New features working
- Performance acceptable

**Dependencies:** M21

---

#### M23: UI/UX Polish Complete
**Week:** 11 | **Days:** 1-2 | **Owner:** Frontend Developer

**Deliverables:**
- Accessibility enhancements applied
- Responsive design verified
- Visual polish applied
- User feedback improved
- Loading states polished

**Success Criteria:**
- WCAG 2.2 AA compliance
- Mobile responsive
- Professional appearance

**Dependencies:** M22

---

#### M24: Frontend Testing Complete
**Week:** 11 | **Days:** 3-5 | **Owner:** Frontend Developer + QA Engineer

**Deliverables:**
- Unit tests updated
- Integration tests written
- E2E tests written
- Cross-browser testing completed
- Performance testing completed

**Success Criteria:**
- All tests passing (>80%)
- E2E tests cover critical paths
- Browser compatibility verified

**Dependencies:** M23

---

## 5. Phase 4 Milestones

### Data Migration (Week 12-13)

#### M25: Migration Scripts Created
**Week:** 12 | **Days:** 1-4 | **Owner:** Database Administrator

**Deliverables:**
- Export scripts created
- Transformation logic implemented
- Import application created
- Validation scripts written
- Rollback procedures documented

**Success Criteria:**
- Scripts tested on dev data
- Data integrity checks passing
- Performance acceptable

**Dependencies:** M12

---

#### M26: Dev Migration Successful
**Week:** 12 | **Days:** 5 | **Owner:** Database Administrator

**Deliverables:**
- Dev data migrated successfully
- Validation checks passed
- Performance acceptable
- Issues documented and resolved

**Success Criteria:**
- All data migrated correctly
- No data loss
- Relationships intact

**Dependencies:** M25

---

#### M27: Staging Dry Run Successful
**Week:** 13 | **Days:** 1-2 | **Owner:** Database Administrator

**Deliverables:**
- Production data snapshot migrated
- Full migration process tested
- Timing data collected
- Production runbook finalized

**Success Criteria:**
- Staging migration successful
- Realistic timeline established
- Team ready for production

**Dependencies:** M26

---

#### M28: Production Data Migrated
**Week:** 13 | **Days:** 3 | **Owner:** Database Administrator

**Deliverables:**
- Production data exported
- Data transformed
- Data imported to SQL Server
- Validation checks passed
- New system activated

**Success Criteria:**
- Zero data loss
- All validation checks passed
- System functional

**Dependencies:** M27

---

## 6. Phase 5 Milestones

### Testing & Validation (Week 14-16)

#### M29: Functional Testing Complete
**Week:** 14 | **Days:** 1-5 | **Owner:** QA Engineer

**Deliverables:**
- 200+ test cases executed
- All user workflows tested
- Integration testing completed
- Critical issues resolved
- Test report created

**Success Criteria:**
- All critical paths working
- No critical bugs
- High priority bugs resolved

**Dependencies:** M24, M28

---

#### M30: UAT Complete with Sign-off
**Week:** 15 | **Days:** 1-3 | **Owner:** Business Analyst + QA

**Deliverables:**
- UAT environment prepared
- Test scenarios provided
- User testing completed
- Feedback collected and addressed
- User sign-off obtained

**Success Criteria:**
- All user groups tested successfully
- Critical feedback addressed
- Formal sign-off received

**Dependencies:** M29

---

#### M31: Performance Testing Complete
**Week:** 15 | **Days:** 4-5 | **Owner:** DevOps + Backend Developer

**Deliverables:**
- Load testing completed
- Stress testing completed
- Endurance testing completed
- Performance benchmarks met
- Capacity planning document

**Success Criteria:**
- API response time <500ms
- Page load time <2s
- System handles 100+ concurrent users

**Dependencies:** M30

---

#### M32: Security Audit Passed
**Week:** 16 | **Days:** 1-2 | **Owner:** Tech Lead + Security Team

**Deliverables:**
- Security testing completed
- OWASP Top 10 verified
- Penetration testing completed
- Vulnerabilities resolved
- Security sign-off obtained

**Success Criteria:**
- No critical vulnerabilities
- High-risk vulnerabilities resolved
- Security approval obtained

**Dependencies:** M31

---

#### M33: Go-Live Readiness Confirmed
**Week:** 16 | **Days:** 3-5 | **Owner:** Project Manager + Tech Lead

**Deliverables:**
- Regression testing complete
- Accessibility verified
- Browser compatibility confirmed
- Documentation complete
- Training material ready
- Go-live checklist completed

**Success Criteria:**
- All testing passed
- All documentation complete
- Team ready for deployment
- Stakeholder approval obtained

**Dependencies:** M29, M30, M31, M32

---

## 7. Phase 6 Milestones

### Deployment & Cutover (Week 17)

#### M34: Production Deployment Successful
**Week:** 17 | **Days:** 1-3 | **Owner:** DevOps + Tech Lead

**Deliverables:**
- Code deployed to production
- Database migrations applied
- System verification completed
- Monitoring activated
- Users notified

**Success Criteria:**
- Deployment completed without errors
- All health checks passing
- System functional
- Monitoring active

**Dependencies:** M33

---

#### M35: Go-Live Successful and Stable
**Week:** 17 | **Days:** 4-5 + Weeks 18-20 | **Owner:** Project Manager + Tech Lead

**Deliverables:**
- System live and stable
- Users productive
- Critical issues resolved
- Old system decommissioned
- Project closed out

**Success Criteria:**
- <10 support tickets per week
- User satisfaction >80%
- No critical incidents
- Old system archived

**Dependencies:** M34

---

## 8. Critical Path Analysis

### 8.1 Critical Path Sequence

```
M1 → M2 → M6 → M7 → M9 → M10 → M11 → M12 → M13 → M14 → M16 → M17 →
M18 → M19 → M20 → M21 → M24 → M25 → M26 → M27 → M28 → M29 → M30 →
M33 → M34 → M35
```

**Total Critical Path Duration:** 17 weeks

### 8.2 High-Risk Milestones

| Milestone | Risk | Impact | Mitigation |
|-----------|------|--------|------------|
| M2: Azure AD Config | HIGH | Blocks auth | Start early |
| M12: Database Deployed | HIGH | Blocks backend | Parallel work |
| M17: Auth & Authz | HIGH | Blocks frontend | Early testing |
| M28: Data Migration | CRITICAL | Delays go-live | Multiple dry runs |
| M30: UAT Sign-off | HIGH | Cannot go live | Early engagement |
| M34: Deployment | CRITICAL | Delays go-live | Thorough testing |

### 8.3 Parallel Work Opportunities

**Week 1-2:**
- M1 + M6 (Azure Setup + Project Structure)
- M3 + M4 + M5 (Database + Key Vault + App Services)

**Week 5-8:**
- Backend development + Frontend preparation
- Documentation + Test planning

**Week 14-16:**
- M29 + M31 (Functional + Performance Testing)
- Documentation + Training materials

---

## Document Summary

This milestone document provides **35 detailed milestones** across **6 phases** with clear:
- Deliverables
- Success criteria
- Dependencies
- Owner assignments
- Timeline

**Critical Path:** 26 milestones
**Project Duration:** 17 weeks
**Total Milestones:** 35

---

**Document Version:** 1.0
**Last Updated:** November 21, 2025
