# System Architecture Documentation
## SWIFT Security Role Access Request System - ASP.NET Core Migration

**Document Version:** 1.0
**Last Updated:** November 21, 2025
**Document Type:** Architecture Specification
**Classification:** Technical Architecture

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Frontend Architecture](#2-frontend-architecture)
3. [Backend Architecture](#3-backend-architecture)
4. [Database Architecture](#4-database-architecture)
5. [Authentication Flow](#5-authentication-flow)
6. [Data Flow Diagrams](#6-data-flow-diagrams)
7. [Deployment Architecture](#7-deployment-architecture)
8. [Integration Architecture](#8-integration-architecture)
9. [Security Architecture](#9-security-architecture)

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    React SPA (TypeScript)                         │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │  │
│  │  │   Pages      │  │  Components  │  │  State Management    │  │  │
│  │  │  - Home      │  │  - Forms     │  │  - React Query       │  │  │
│  │  │  - Requests  │  │  - Tables    │  │  - Context API       │  │  │
│  │  │  - Approvals │  │  - Modals    │  │  - Local Storage     │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘  │  │
│  │                                                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────┐│  │
│  │  │              API Client (Axios + Interceptors)              ││  │
│  │  │  - JWT Token Management  - Error Handling                   ││  │
│  │  │  - Request/Response Logging - Retry Logic                   ││  │
│  │  └─────────────────────────────────────────────────────────────┘│  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS / TLS 1.3
                                    │ JWT Bearer Token
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              ASP.NET Core 8.0 Web API                             │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │  │
│  │  │ Controllers  │  │  Middleware  │  │     Filters          │  │  │
│  │  │  - Requests  │  │  - Auth      │  │  - Exception         │  │  │
│  │  │  - Approvals │  │  - Logging   │  │  - Validation        │  │  │
│  │  │  - Roles     │  │  - CORS      │  │  - Rate Limiting     │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ MediatR Commands/Queries
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      CQRS with MediatR                            │  │
│  │  ┌──────────────────────┐      ┌────────────────────────────┐   │  │
│  │  │      Commands        │      │        Queries             │   │  │
│  │  │  - CreateRequest     │      │  - GetRequestById         │   │  │
│  │  │  - UpdateRequest     │      │  - GetRequestsList        │   │  │
│  │  │  - ApproveRequest    │      │  - GetPendingApprovals    │   │  │
│  │  │  - RejectRequest     │      │  - GetRoleCatalog         │   │  │
│  │  └──────────────────────┘      └────────────────────────────┘   │  │
│  │                                                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────┐│  │
│  │  │              Pipeline Behaviors                             ││  │
│  │  │  Validation → Logging → Performance → Transaction          ││  │
│  │  └─────────────────────────────────────────────────────────────┘│  │
│  │                                                                    │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │  │
│  │  │     DTOs     │  │  Validators  │  │     Mappers          │  │  │
│  │  │  - Request   │  │  Fluent      │  │  AutoMapper          │  │  │
│  │  │  - Approval  │  │  Validation  │  │  Profiles            │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Domain Services
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           DOMAIN LAYER                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      Domain Model                                 │  │
│  │  ┌──────────────────────┐      ┌────────────────────────────┐   │  │
│  │  │      Entities        │      │    Value Objects           │   │  │
│  │  │  - Request           │      │  - Email                   │   │  │
│  │  │  - RoleSelection     │      │  - ApprovalStatus          │   │  │
│  │  │  - Approval          │      │  - RequestStatus           │   │  │
│  │  └──────────────────────┘      └────────────────────────────┘   │  │
│  │                                                                    │  │
│  │  ┌──────────────────────┐      ┌────────────────────────────┐   │  │
│  │  │   Domain Events      │      │    Business Rules          │   │  │
│  │  │  - RequestSubmitted  │      │  - Validation Logic        │   │  │
│  │  │  - RequestApproved   │      │  - Workflow Rules          │   │  │
│  │  └──────────────────────┘      └────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Repository Pattern
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      INFRASTRUCTURE LAYER                                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Data Access Layer                              │  │
│  │  ┌──────────────────────┐      ┌────────────────────────────┐   │  │
│  │  │  Entity Framework    │      │      Repositories          │   │  │
│  │  │  Core 8.0            │      │  - IRequestRepository      │   │  │
│  │  │  - DbContext         │      │  - IApprovalRepository     │   │  │
│  │  │  - Configurations    │      │  - IRoleCatalogRepo        │   │  │
│  │  │  - Migrations        │      │                            │   │  │
│  │  └──────────────────────┘      └────────────────────────────┘   │  │
│  │                                                                    │  │
│  │  ┌──────────────────────┐      ┌────────────────────────────┐   │  │
│  │  │  External Services   │      │    Infrastructure Services │   │  │
│  │  │  - Email Service     │      │  - CurrentUserService      │   │  │
│  │  │  - Azure AD          │      │  - DateTimeService         │   │  │
│  │  │  - File Storage      │      │  - CacheService            │   │  │
│  │  └──────────────────────┘      └────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ ADO.NET / EF Core
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                   SQL Server 2022                                 │  │
│  │  ┌──────────────────────────────────────────────────────────┐   │  │
│  │  │                     Database                              │   │  │
│  │  │  - SecurityRoleRequests    - RequestApprovals            │   │  │
│  │  │  - SecurityRoleSelections  - SecurityAreas               │   │  │
│  │  │  - RoleCatalog            - AuditLogs                    │   │  │
│  │  │                                                            │   │  │
│  │  │  Features:                                                │   │  │
│  │  │  • Row-Level Security   • Temporal Tables                │   │  │
│  │  │  • Always Encrypted     • Full-Text Search               │   │  │
│  │  │  • Query Store          • Change Tracking                │   │  │
│  │  └──────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Architecture Principles

**Clean Architecture:**
- Dependencies flow inward (Domain ← Application ← Infrastructure → Presentation)
- Domain layer has zero external dependencies
- Business logic isolated from infrastructure concerns
- Testable without external dependencies

**SOLID Principles:**
- **S**ingle Responsibility: Each class has one reason to change
- **O**pen/Closed: Open for extension, closed for modification
- **L**iskov Substitution: Derived classes substitutable for base classes
- **I**nterface Segregation: Many specific interfaces over one general
- **D**ependency Inversion: Depend on abstractions, not concretions

**DDD (Domain-Driven Design):**
- Ubiquitous language throughout codebase
- Rich domain models with behavior
- Aggregate roots enforce consistency
- Domain events for cross-aggregate communication

---

## 2. Frontend Architecture

### 2.1 React Application Structure

```
src/
├── pages/                          # Route-level page components
│   ├── HomePage.tsx               # Main request form
│   ├── RequestListPage.tsx        # List all requests
│   ├── RequestDetailsPage.tsx     # View request details
│   ├── SelectRolesPage.tsx        # Accounting/Procurement roles
│   ├── ElmRoleSelectionPage.tsx   # ELM roles
│   ├── HrPayrollRoleSelectionPage.tsx
│   ├── EpmDwhRoleSelectionPage.tsx
│   ├── SignaturePage.tsx          # Digital signature capture
│   ├── MnitDetailsPage.tsx        # MNIT processing view
│   └── SuccessPage.tsx            # Confirmation page
│
├── components/                     # Reusable components
│   ├── common/
│   │   ├── Header.tsx             # App header with navigation
│   │   ├── Button.tsx             # Styled button component
│   │   ├── LoadingSpinner.tsx     # Loading indicator
│   │   └── ErrorBoundary.tsx      # Error handling boundary
│   ├── forms/
│   │   ├── FormInput.tsx          # Form input wrapper
│   │   ├── SearchableSelect.tsx   # Searchable dropdown
│   │   ├── MultiSelect.tsx        # Multi-select dropdown
│   │   ├── DatePicker.tsx         # Date input component
│   │   └── SignatureCanvas.tsx    # Digital signature pad
│   ├── request/
│   │   ├── RequestCard.tsx        # Request summary card
│   │   ├── RequestStatus.tsx      # Status badge
│   │   ├── ApprovalTimeline.tsx   # Approval flow visualization
│   │   └── RoleSummary.tsx        # Role selection summary
│   └── layout/
│       ├── MainLayout.tsx         # Main app layout
│       └── PageContainer.tsx      # Page wrapper
│
├── services/                       # API and external services
│   ├── api/
│   │   ├── apiClient.ts           # Axios instance configuration
│   │   ├── requestsApi.ts         # Requests API calls
│   │   ├── approvalsApi.ts        # Approvals API calls
│   │   ├── rolesApi.ts            # Role catalog API calls
│   │   └── mnitApi.ts             # MNIT-specific API calls
│   ├── auth/
│   │   ├── authService.ts         # Authentication service
│   │   ├── tokenManager.ts        # JWT token management
│   │   └── authContext.tsx        # Auth React context
│   └── storage/
│       └── localStorageService.ts # Browser storage wrapper
│
├── hooks/                          # Custom React hooks
│   ├── useAuth.ts                 # Authentication hook
│   ├── useRequests.ts             # Requests data hook
│   ├── useApprovals.ts            # Approvals data hook
│   ├── useForm.ts                 # Form management hook
│   └── useDebounce.ts             # Debounce utility hook
│
├── store/                          # State management
│   ├── authStore.ts               # Auth state (Context API)
│   ├── requestStore.ts            # Request state
│   └── queryClient.ts             # React Query configuration
│
├── types/                          # TypeScript type definitions
│   ├── request.types.ts           # Request-related types
│   ├── approval.types.ts          # Approval types
│   ├── role.types.ts              # Role types
│   └── api.types.ts               # API response types
│
├── utils/                          # Utility functions
│   ├── validation.ts              # Validation helpers
│   ├── formatting.ts              # Data formatting
│   ├── dateUtils.ts               # Date utilities
│   └── errorHandling.ts           # Error handling utilities
│
├── constants/                      # App constants
│   ├── routes.ts                  # Route definitions
│   ├── apiEndpoints.ts            # API endpoints
│   └── formConstants.ts           # Form field constants
│
├── styles/                         # Global styles
│   └── index.css                  # Tailwind + custom CSS
│
├── App.tsx                         # Main app component
├── main.tsx                        # App entry point
└── vite-env.d.ts                  # Vite type definitions
```

### 2.2 React Component Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    App.tsx (Root)                       │ │
│  │  - Router Configuration                                 │ │
│  │  - Auth Context Provider                                │ │
│  │  - React Query Provider                                 │ │
│  │  - Error Boundary                                       │ │
│  └──────────────┬─────────────────────────────────────────┘ │
│                 │                                             │
│                 ├──► HomePage (/)                            │
│                 │    └── MainRequestForm                     │
│                 │        ├── EmployeeInfoSection            │
│                 │        ├── AgencySelect                    │
│                 │        ├── ApproverFields                  │
│                 │        └── SecurityAreaRadio              │
│                 │                                             │
│                 ├──► SelectRolesPage (/select-roles/:id)    │
│                 │    └── RoleSelectionForm                   │
│                 │        ├── BusinessUnitSelect             │
│                 │        ├── RoleCategoryAccordion          │
│                 │        │   ├── AccountsPayable            │
│                 │        │   ├── AccountsReceivable         │
│                 │        │   ├── Budgets                    │
│                 │        │   └── ... (10+ categories)       │
│                 │        └── RoleSummary (sidebar)          │
│                 │                                             │
│                 ├──► RequestListPage (/requests)            │
│                 │    └── RequestsDataTable                   │
│                 │        ├── FilterBar                       │
│                 │        ├── SearchInput                     │
│                 │        ├── RequestRow (repeated)          │
│                 │        └── Pagination                      │
│                 │                                             │
│                 ├──► RequestDetailsPage (/requests/:id)     │
│                 │    └── RequestDetails                      │
│                 │        ├── EmployeeInfoCard               │
│                 │        ├── RoleSelectionsCard             │
│                 │        ├── ApprovalTimeline               │
│                 │        └── ActionButtons                   │
│                 │                                             │
│                 ├──► SignaturePage (/signature/:id)         │
│                 │    └── SignatureCapture                    │
│                 │        ├── AgreementText                   │
│                 │        ├── SignatureCanvas                 │
│                 │        ├── CommentsField                   │
│                 │        └── SubmitButton                    │
│                 │                                             │
│                 └──► MnitDetailsPage (/mnit/:id)            │
│                      └── MnitProcessingView                  │
│                          ├── TechnicalDetails               │
│                          ├── RoleCodesTable                 │
│                          ├── ProvisioningChecklist          │
│                          └── CompleteButton                 │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### 2.3 State Management Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     State Management Layers                     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Server State (React Query)                   │  │
│  │  ┌────────────────┐    ┌────────────────┐               │  │
│  │  │  Query Cache   │    │  Mutation Queue│               │  │
│  │  │  - Requests    │    │  - Create      │               │  │
│  │  │  - Approvals   │    │  - Update      │               │  │
│  │  │  - Roles       │    │  - Approve     │               │  │
│  │  └────────────────┘    └────────────────┘               │  │
│  │                                                            │  │
│  │  Features:                                                │  │
│  │  • Automatic background refetching                       │  │
│  │  • Optimistic updates                                    │  │
│  │  • Cache invalidation                                    │  │
│  │  • Retry logic with exponential backoff                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Global State (Context API)                     │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  AuthContext                                        │  │  │
│  │  │  - currentUser: User | null                        │  │  │
│  │  │  - isAuthenticated: boolean                        │  │  │
│  │  │  - token: string | null                            │  │  │
│  │  │  - login(credentials): Promise<void>               │  │  │
│  │  │  - logout(): void                                  │  │  │
│  │  │  - refreshToken(): Promise<void>                   │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  ThemeContext                                       │  │  │
│  │  │  - theme: 'light' | 'dark'                         │  │  │
│  │  │  - toggleTheme(): void                             │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Component State (useState/useReducer)            │  │
│  │  • Form input values                                     │  │
│  │  • UI state (modals, dropdowns, etc.)                   │  │
│  │  • Temporary selections                                  │  │
│  │  • Validation errors                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Browser Storage (localStorage)                   │  │
│  │  • JWT tokens (secure HttpOnly cookies preferred)       │  │
│  │  • User preferences                                      │  │
│  │  • Draft form data (temporary)                          │  │
│  │  • Last viewed pages                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### 2.4 API Client Configuration

```typescript
// services/api/apiClient.ts
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { tokenManager } from '../auth/tokenManager';

class ApiClient {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - attach JWT token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await tokenManager.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add correlation ID for tracking
        config.headers['X-Correlation-ID'] = this.generateCorrelationId();

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle 401 Unauthorized - try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Prevent multiple simultaneous refresh attempts
            if (!this.refreshTokenPromise) {
              this.refreshTokenPromise = tokenManager.refreshToken();
            }

            const newToken = await this.refreshTokenPromise;
            this.refreshTokenPromise = null;

            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed - redirect to login
            tokenManager.clearToken();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        // Handle other errors
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): Error {
    if (error.response) {
      // Server responded with error status
      const data = error.response.data as any;
      return new Error(data?.message || 'An error occurred');
    } else if (error.request) {
      // Request made but no response
      return new Error('Network error - please check your connection');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get<T>(url, config).then(response => response.data);
  }

  public post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.post<T>(url, data, config).then(response => response.data);
  }

  public put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.put<T>(url, data, config).then(response => response.data);
  }

  public delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete<T>(url, config).then(response => response.data);
  }
}

export const apiClient = new ApiClient();
```

---

## 3. Backend Architecture

### 3.1 Clean Architecture Layers (Detailed)

```
┌──────────────────────────────────────────────────────────────────┐
│                        API LAYER (Presentation)                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Controllers/                                               │  │
│  │  ├── RequestsController.cs                                 │  │
│  │  │   • POST   /api/requests          (Create)             │  │
│  │  │   • GET    /api/requests/:id      (Get by ID)          │  │
│  │  │   • GET    /api/requests          (Get list)           │  │
│  │  │   • PUT    /api/requests/:id      (Update)             │  │
│  │  │   • DELETE /api/requests/:id      (Delete draft)       │  │
│  │  │   • POST   /api/requests/:id/submit (Submit)           │  │
│  │  │                                                          │  │
│  │  ├── ApprovalsController.cs                                │  │
│  │  │   • GET    /api/approvals/pending (My pending)         │  │
│  │  │   • POST   /api/approvals/:id/approve (Approve)        │  │
│  │  │   • POST   /api/approvals/:id/reject  (Reject)         │  │
│  │  │   • POST   /api/approvals/:id/signature (Add sig)      │  │
│  │  │                                                          │  │
│  │  ├── RoleSelectionsController.cs                           │  │
│  │  │   • GET    /api/roles/catalog      (Get catalog)       │  │
│  │  │   • POST   /api/roles/:requestId   (Save selection)    │  │
│  │  │   • GET    /api/roles/:requestId   (Get selection)     │  │
│  │  │                                                          │  │
│  │  └── MnitController.cs                                     │  │
│  │      • GET    /api/mnit/requests      (Approved list)     │  │
│  │      • GET    /api/mnit/requests/:id  (Details)           │  │
│  │      • POST   /api/mnit/requests/:id/complete (Complete)  │  │
│  │                                                              │  │
│  │  Middleware/                                                │  │
│  │  ├── ExceptionHandlingMiddleware.cs                        │  │
│  │  ├── RequestLoggingMiddleware.cs                           │  │
│  │  └── PerformanceMonitoringMiddleware.cs                    │  │
│  │                                                              │  │
│  │  Filters/                                                   │  │
│  │  ├── ApiExceptionFilter.cs                                 │  │
│  │  ├── ValidationFilter.cs                                   │  │
│  │  └── AuthorizationFilter.cs                                │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              ▼ MediatR
┌──────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                             │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Requests/                                                  │  │
│  │  ├── Commands/                                             │  │
│  │  │   ├── CreateRequest/                                    │  │
│  │  │   │   ├── CreateRequestCommand.cs                      │  │
│  │  │   │   ├── CreateRequestCommandHandler.cs               │  │
│  │  │   │   └── CreateRequestValidator.cs                    │  │
│  │  │   │                                                      │  │
│  │  │   ├── UpdateRequest/                                    │  │
│  │  │   ├── DeleteRequest/                                    │  │
│  │  │   ├── SubmitRequest/                                    │  │
│  │  │   └── CompleteRequest/                                  │  │
│  │  │                                                          │  │
│  │  └── Queries/                                              │  │
│  │      ├── GetRequestById/                                   │  │
│  │      │   ├── GetRequestByIdQuery.cs                       │  │
│  │      │   └── GetRequestByIdQueryHandler.cs                │  │
│  │      │                                                      │  │
│  │      ├── GetRequestsList/                                  │  │
│  │      ├── GetPendingApprovals/                             │  │
│  │      └── GetApprovalHistory/                              │  │
│  │                                                              │  │
│  │  Approvals/                                                │  │
│  │  ├── Commands/                                             │  │
│  │  │   ├── ApproveRequest/                                   │  │
│  │  │   └── RejectRequest/                                    │  │
│  │  └── Queries/                                              │  │
│  │      └── GetMyPendingApprovals/                           │  │
│  │                                                              │  │
│  │  Common/                                                    │  │
│  │  ├── Behaviors/                                            │  │
│  │  │   ├── ValidationBehavior.cs                            │  │
│  │  │   ├── LoggingBehavior.cs                               │  │
│  │  │   ├── PerformanceBehavior.cs                           │  │
│  │  │   └── TransactionBehavior.cs                           │  │
│  │  │                                                          │  │
│  │  ├── Interfaces/                                           │  │
│  │  │   ├── ISwiftDbContext.cs                               │  │
│  │  │   ├── ICurrentUserService.cs                           │  │
│  │  │   ├── IEmailService.cs                                 │  │
│  │  │   └── IDateTimeService.cs                              │  │
│  │  │                                                          │  │
│  │  ├── Models/                                               │  │
│  │  │   ├── Result.cs                                        │  │
│  │  │   ├── PagedResult.cs                                   │  │
│  │  │   └── ValidationResult.cs                              │  │
│  │  │                                                          │  │
│  │  └── Mappings/                                             │  │
│  │      └── MappingProfile.cs (AutoMapper)                   │  │
│  │                                                              │  │
│  │  DTOs/                                                      │  │
│  │  ├── RequestDto.cs                                         │  │
│  │  ├── RoleSelectionDto.cs                                   │  │
│  │  ├── ApprovalDto.cs                                        │  │
│  │  └── RoleCatalogDto.cs                                     │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              ▼ Domain Services
┌──────────────────────────────────────────────────────────────────┐
│                        DOMAIN LAYER                               │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Entities/                                                  │  │
│  │  ├── SecurityRoleRequest.cs                                │  │
│  │  │   Properties: Id, EmployeeName, StartDate, Status, etc.│  │
│  │  │   Methods: Create(), Submit(), Approve(), Reject()     │  │
│  │  │                                                          │  │
│  │  ├── SecurityRoleSelection.cs                              │  │
│  │  │   Properties: 100+ role boolean flags                  │  │
│  │  │   Methods: HasAnyRoles(), GetRoleCount(), Validate()   │  │
│  │  │                                                          │  │
│  │  ├── RequestApproval.cs                                    │  │
│  │  │   Properties: Step, Status, ApproverEmail, Signature   │  │
│  │  │   Methods: Approve(), Reject(), AddSignature()         │  │
│  │  │                                                          │  │
│  │  ├── SecurityArea.cs                                       │  │
│  │  └── RoleCatalog.cs                                        │  │
│  │                                                              │  │
│  │  ValueObjects/                                              │  │
│  │  ├── Email.cs                                              │  │
│  │  ├── ApprovalStatus.cs                                     │  │
│  │  └── RequestStatus.cs                                      │  │
│  │                                                              │  │
│  │  Enums/                                                     │  │
│  │  ├── RequestStatus.cs (Draft, Pending, Completed, etc.)   │  │
│  │  ├── ApprovalStep.cs (Supervisor, SecurityAdmin, etc.)    │  │
│  │  ├── SecurityAreaType.cs                                   │  │
│  │  └── NonEmployeeType.cs                                    │  │
│  │                                                              │  │
│  │  Events/                                                    │  │
│  │  ├── RequestCreatedEvent.cs                                │  │
│  │  ├── RequestSubmittedEvent.cs                              │  │
│  │  ├── RequestApprovedEvent.cs                               │  │
│  │  └── RequestRejectedEvent.cs                               │  │
│  │                                                              │  │
│  │  Exceptions/                                                │  │
│  │  ├── DomainException.cs                                    │  │
│  │  └── ValidationException.cs                                │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              ▼ Repository Pattern
┌──────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                           │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Persistence/                                               │  │
│  │  ├── SwiftDbContext.cs                                     │  │
│  │  │   • DbSet<SecurityRoleRequest> SecurityRoleRequests   │  │
│  │  │   • DbSet<SecurityRoleSelection> RoleSelections        │  │
│  │  │   • DbSet<RequestApproval> Approvals                   │  │
│  │  │   • OnModelCreating() - Configurations                 │  │
│  │  │   • SaveChangesAsync() - Audit fields                  │  │
│  │  │                                                          │  │
│  │  ├── Configurations/                                        │  │
│  │  │   ├── RequestConfiguration.cs (EF Core)                │  │
│  │  │   ├── RoleSelectionConfiguration.cs                    │  │
│  │  │   ├── ApprovalConfiguration.cs                         │  │
│  │  │   └── SecurityAreaConfiguration.cs                     │  │
│  │  │                                                          │  │
│  │  ├── Migrations/                                           │  │
│  │  │   └── (EF Core generated migration files)              │  │
│  │  │                                                          │  │
│  │  └── Interceptors/                                         │  │
│  │      ├── AuditInterceptor.cs                              │  │
│  │      ├── SoftDeleteInterceptor.cs                         │  │
│  │      └── SecurityContextInterceptor.cs                    │  │
│  │                                                              │  │
│  │  Identity/                                                  │  │
│  │  ├── CurrentUserService.cs                                │  │
│  │  └── IdentityService.cs                                   │  │
│  │                                                              │  │
│  │  Services/                                                  │  │
│  │  ├── EmailService.cs                                       │  │
│  │  │   • SendApprovalRequestEmail()                         │  │
│  │  │   • SendApprovalConfirmationEmail()                    │  │
│  │  │   • SendRejectionEmail()                               │  │
│  │  │                                                          │  │
│  │  ├── DateTimeService.cs                                    │  │
│  │  ├── FileStorageService.cs                                │  │
│  │  └── CacheService.cs                                       │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 CQRS Pattern Implementation

```
┌─────────────────────────────────────────────────────────────────┐
│                      CQRS Pattern with MediatR                   │
│                                                                   │
│  ┌─────────────────────┐         ┌──────────────────────────┐  │
│  │      COMMANDS       │         │        QUERIES           │  │
│  │   (Write Model)     │         │      (Read Model)        │  │
│  └─────────────────────┘         └──────────────────────────┘  │
│           │                                  │                   │
│           ▼                                  ▼                   │
│  ┌─────────────────────┐         ┌──────────────────────────┐  │
│  │  Command Handlers   │         │     Query Handlers       │  │
│  │  • Validation       │         │  • Simple projections    │  │
│  │  • Business logic   │         │  • Optimized reads       │  │
│  │  • Side effects     │         │  • No business logic     │  │
│  │  • Domain events    │         │  • Fast queries          │  │
│  └─────────────────────┘         └──────────────────────────┘  │
│           │                                  │                   │
│           │                                  │                   │
│           ▼                                  ▼                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              SwiftDbContext (EF Core)                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│           │                                  │                   │
│           ▼                                  ▼                   │
│  ┌─────────────────────┐         ┌──────────────────────────┐  │
│  │  Write Operations   │         │    Read Operations       │  │
│  │  • INSERT           │         │  • SELECT (optimized)    │  │
│  │  • UPDATE           │         │  • JOIN (minimal)        │  │
│  │  • DELETE           │         │  • Indexed queries       │  │
│  │  • Audit trail      │         │  • Caching possible      │  │
│  └─────────────────────┘         └──────────────────────────┘  │
│           │                                  │                   │
│           ▼                                  ▼                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                SQL Server 2022 Database                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Pipeline Behaviors (Applied to all Commands/Queries):          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. LoggingBehavior - Log request/response               │  │
│  │  2. ValidationBehavior - FluentValidation rules          │  │
│  │  3. PerformanceBehavior - Track execution time           │  │
│  │  4. TransactionBehavior - Wrap in DB transaction         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

Example Command Flow:
────────────────────────
Controller receives HTTP POST /api/requests
    ↓
Controller creates CreateRequestCommand
    ↓
MediatR.Send(command)
    ↓
Pipeline: Logging → Validation → Performance → Transaction
    ↓
CreateRequestCommandHandler.Handle()
    ↓
Domain: SecurityRoleRequest.Create()
    ↓
DbContext.SecurityRoleRequests.Add(entity)
    ↓
DbContext.SaveChangesAsync()
    ↓
Return Result<Guid>
    ↓
Controller returns 201 Created with ID

Example Query Flow:
───────────────────
Controller receives HTTP GET /api/requests/123
    ↓
Controller creates GetRequestByIdQuery { Id = 123 }
    ↓
MediatR.Send(query)
    ↓
Pipeline: Logging → Performance
    ↓
GetRequestByIdQueryHandler.Handle()
    ↓
DbContext.SecurityRoleRequests
    .Include(r => r.RoleSelection)
    .Include(r => r.Approvals)
    .Where(r => r.Id == id)
    .ProjectTo<RequestDto>()  // AutoMapper
    .FirstOrDefaultAsync()
    ↓
Return Result<RequestDto>
    ↓
Controller returns 200 OK with DTO
```

---

## 4. Database Architecture

### 4.1 Database Schema Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SQL Server 2022 Database                         │
│                         SwiftSecurity                                │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│              security_role_requests (Main Table)              │
├──────────────────────────────────────────────────────────────┤
│ PK  Id                    UNIQUEIDENTIFIER                    │
│     StartDate             DATE NOT NULL                       │
│     EmployeeName          NVARCHAR(200) NOT NULL             │
│     EmployeeId            NVARCHAR(50) ENCRYPTED             │
│     IsNonEmployee         BIT DEFAULT 0                       │
│     WorkLocation          NVARCHAR(300)                       │
│     WorkPhone             NVARCHAR(20) ENCRYPTED             │
│     Email                 NVARCHAR(200) NOT NULL             │
│     AgencyName            NVARCHAR(200) NOT NULL             │
│     AgencyCode            NVARCHAR(3) NOT NULL               │
│     Justification         NVARCHAR(MAX)                       │
│     SubmitterName         NVARCHAR(200) NOT NULL             │
│     SubmitterEmail        NVARCHAR(200) NOT NULL             │
│     SupervisorName        NVARCHAR(200)                       │
│     SupervisorUsername    NVARCHAR(200)                       │
│     SecurityAdminName     NVARCHAR(200)                       │
│     SecurityAdminUsername NVARCHAR(200)                       │
│     SecurityArea          NVARCHAR(50)                        │
│     AccountingDirector    NVARCHAR(200)                       │
│     AccountingDirectorUsername NVARCHAR(200)                  │
│     HrDirector            NVARCHAR(200)                       │
│     HrDirectorEmail       NVARCHAR(200)                       │
│     HrMainframeLogonId    NVARCHAR(50)                        │
│     HrViewStatewide       BIT DEFAULT 0                       │
│     ElmKeyAdmin           NVARCHAR(200)                       │
│     ElmKeyAdminUsername   NVARCHAR(200)                       │
│     ElmDirector           NVARCHAR(200)                       │
│     ElmDirectorEmail      NVARCHAR(200)                       │
│     CopyFromUser          BIT DEFAULT 0                       │
│     CopyUserName          NVARCHAR(200)                       │
│     CopyUserEmployeeId    NVARCHAR(50)                        │
│     CopyUserSema4Id       NVARCHAR(50)                        │
│     NonEmployeeType       NVARCHAR(50)                        │
│     AccessEndDate         DATE                                │
│     SecurityMeasures      NVARCHAR(MAX)                       │
│     Status                NVARCHAR(50) NOT NULL DEFAULT 'Draft'│
│     CreatedAt             DATETIME2 NOT NULL DEFAULT GETUTCDATE()│
│     CreatedBy             NVARCHAR(100) NOT NULL              │
│     UpdatedAt             DATETIME2                           │
│     UpdatedBy             NVARCHAR(100)                       │
│     IsDeleted             BIT NOT NULL DEFAULT 0              │
│     DeletedAt             DATETIME2                           │
│     DeletedBy             NVARCHAR(100)                       │
├──────────────────────────────────────────────────────────────┤
│ INDEXES:                                                      │
│   IX_Status (Status)                                         │
│   IX_AgencyCode (AgencyCode)                                 │
│   IX_CreatedAt (CreatedAt DESC)                              │
│   IX_EmployeeName_Email (EmployeeName, Email)               │
└──────────────────────────────────────────────────────────────┘
                              │
                              │ 1:1
                              ▼
┌──────────────────────────────────────────────────────────────┐
│           security_role_selections (Role Details)             │
├──────────────────────────────────────────────────────────────┤
│ PK  Id                    UNIQUEIDENTIFIER                    │
│ FK  RequestId             UNIQUEIDENTIFIER NOT NULL           │
│     HomeBusinessUnit      NVARCHAR(50) NOT NULL              │
│     OtherBusinessUnits    NVARCHAR(MAX)                       │
│                                                                │
│     -- Accounts Payable (10+ fields)                         │
│     VoucherEntry          BIT DEFAULT 0                       │
│     MaintenanceVoucherBuildErrors BIT DEFAULT 0              │
│     MatchOverride         BIT DEFAULT 0                       │
│     ApInquiryOnly         BIT DEFAULT 0                       │
│     ApWorkflowApprover    BIT DEFAULT 0                       │
│     ApWorkflowRouteControls NVARCHAR(MAX)                     │
│     VoucherApprover1      NVARCHAR(50)                        │
│     VoucherApprover2      NVARCHAR(50)                        │
│     VoucherApprover3      NVARCHAR(50)                        │
│     ApVoucherApprover1RouteControls NVARCHAR(MAX)            │
│     -- ... (90+ more role fields)                            │
│                                                                │
│     -- Accounts Receivable (12+ fields)                      │
│     CashMaintenance       BIT DEFAULT 0                       │
│     ReceivableSpecialist  BIT DEFAULT 0                       │
│     -- ...                                                    │
│                                                                │
│     -- Budgets (10 fields)                                   │
│     BudgetJournalEntryOnline BIT DEFAULT 0                   │
│     -- ...                                                    │
│                                                                │
│     -- HR/Payroll (14 fields)                                │
│     HrInquiryAgency       BIT DEFAULT 0                       │
│     PayrollProcessor      BIT DEFAULT 0                       │
│     -- ...                                                    │
│                                                                │
│     -- EPM/ELM (15 fields)                                   │
│     StandardReportsViewer BIT DEFAULT 0                       │
│     CourseAdministrator   BIT DEFAULT 0                       │
│     -- ...                                                    │
│                                                                │
│     RoleSelectionJson     NVARCHAR(MAX)                       │
│     CreatedAt             DATETIME2 NOT NULL                  │
│     UpdatedAt             DATETIME2                           │
├──────────────────────────────────────────────────────────────┤
│ FK  RequestId REFERENCES security_role_requests(Id)          │
│     ON DELETE CASCADE                                         │
├──────────────────────────────────────────────────────────────┤
│ INDEXES:                                                      │
│   IX_RequestId (RequestId)                                   │
└──────────────────────────────────────────────────────────────┘

                              │ 1:*
                              ▼
┌──────────────────────────────────────────────────────────────┐
│              request_approvals (Workflow Steps)               │
├──────────────────────────────────────────────────────────────┤
│ PK  Id                    UNIQUEIDENTIFIER                    │
│ FK  RequestId             UNIQUEIDENTIFIER NOT NULL           │
│     Step                  NVARCHAR(50) NOT NULL               │
│     ApproverEmail         NVARCHAR(200) NOT NULL             │
│     Status                NVARCHAR(20) NOT NULL DEFAULT 'Pending'│
│     ApprovedAt            DATETIME2                           │
│     Comments              NVARCHAR(MAX)                       │
│     SignatureData         NVARCHAR(MAX)                       │
│     CreatedAt             DATETIME2 NOT NULL                  │
│     UpdatedAt             DATETIME2                           │
├──────────────────────────────────────────────────────────────┤
│ FK  RequestId REFERENCES security_role_requests(Id)          │
│     ON DELETE CASCADE                                         │
├──────────────────────────────────────────────────────────────┤
│ CONSTRAINTS:                                                  │
│   UQ_Request_Step UNIQUE (RequestId, Step)                   │
├──────────────────────────────────────────────────────────────┤
│ INDEXES:                                                      │
│   IX_RequestId (RequestId)                                   │
│   IX_ApproverEmail (ApproverEmail)                           │
│   IX_Status (Status)                                         │
└──────────────────────────────────────────────────────────────┘

                              │ 1:*
                              ▼
┌──────────────────────────────────────────────────────────────┐
│          security_areas (Area-Director Mapping)               │
├──────────────────────────────────────────────────────────────┤
│ PK  Id                    UNIQUEIDENTIFIER                    │
│ FK  RequestId             UNIQUEIDENTIFIER NOT NULL           │
│     AreaType              NVARCHAR(50) NOT NULL               │
│     DirectorName          NVARCHAR(200) NOT NULL             │
│     DirectorEmail         NVARCHAR(200) NOT NULL             │
│     CreatedAt             DATETIME2 NOT NULL                  │
├──────────────────────────────────────────────────────────────┤
│ FK  RequestId REFERENCES security_role_requests(Id)          │
│     ON DELETE CASCADE                                         │
├──────────────────────────────────────────────────────────────┤
│ INDEXES:                                                      │
│   IX_RequestId (RequestId)                                   │
│   IX_AreaType (AreaType)                                     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│              role_catalog (Reference Data)                    │
├──────────────────────────────────────────────────────────────┤
│ PK  Id                    UNIQUEIDENTIFIER                    │
│     FlagKey               NVARCHAR(100) UNIQUE NOT NULL      │
│     RoleCode              NVARCHAR(50) NOT NULL               │
│     Name                  NVARCHAR(200) NOT NULL             │
│     FormName              NVARCHAR(200) NOT NULL             │
│     PsName                NVARCHAR(200) NOT NULL             │
│     Description           NVARCHAR(MAX)                       │
│     Domain                NVARCHAR(100) NOT NULL             │
│     RequiresRouteControls BIT NOT NULL DEFAULT 0             │
│     ControlSpec           NVARCHAR(MAX)                       │
│     DisplayOrder          INT NOT NULL                        │
│     IsActive              BIT NOT NULL DEFAULT 1             │
│     CreatedAt             DATETIME2 NOT NULL                  │
│     UpdatedAt             DATETIME2                           │
├──────────────────────────────────────────────────────────────┤
│ INDEXES:                                                      │
│   UQ_FlagKey UNIQUE (FlagKey)                                │
│   IX_Domain (Domain)                                         │
│   IX_IsActive (IsActive)                                     │
│   IX_DisplayOrder (DisplayOrder)                             │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                  audit_logs (Audit Trail)                     │
├──────────────────────────────────────────────────────────────┤
│ PK  Id                    UNIQUEIDENTIFIER                    │
│     EntityType            NVARCHAR(100) NOT NULL             │
│     EntityId              NVARCHAR(100) NOT NULL             │
│     Action                NVARCHAR(50) NOT NULL               │
│     UserId                NVARCHAR(100) NOT NULL             │
│     UserEmail             NVARCHAR(200) NOT NULL             │
│     Timestamp             DATETIME2 NOT NULL DEFAULT GETUTCDATE()│
│     OldValues             NVARCHAR(MAX)                       │
│     NewValues             NVARCHAR(MAX)                       │
│     IpAddress             NVARCHAR(50)                        │
├──────────────────────────────────────────────────────────────┤
│ INDEXES:                                                      │
│   IX_EntityType_EntityId (EntityType, EntityId)             │
│   IX_Timestamp (Timestamp DESC)                              │
│   IX_UserId (UserId)                                         │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│            business_units (Reference Data)                    │
├──────────────────────────────────────────────────────────────┤
│ PK  Id                    UNIQUEIDENTIFIER                    │
│     Code                  NVARCHAR(50) NOT NULL               │
│     Name                  NVARCHAR(200) NOT NULL             │
│     AgencyCode            NVARCHAR(3) NOT NULL               │
│     IsActive              BIT NOT NULL DEFAULT 1             │
│     CreatedAt             DATETIME2 NOT NULL                  │
├──────────────────────────────────────────────────────────────┤
│ INDEXES:                                                      │
│   UQ_Code UNIQUE (Code)                                      │
│   IX_AgencyCode (AgencyCode)                                 │
│   IX_IsActive (IsActive)                                     │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Database Features and Optimizations

```
┌─────────────────────────────────────────────────────────────────┐
│              SQL Server 2022 Advanced Features                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  1. Row-Level Security (RLS)                                  │
│  ─────────────────────────────────────────────────────────── │
│  • Security predicate function per user context              │
│  • Automatic filtering based on user claims                  │
│  • Transparent to application layer                          │
│  • Performance optimized with indexed views                  │
│                                                                │
│  CREATE FUNCTION Security.fn_RequestSecurityPredicate(...)   │
│  AS RETURN SELECT 1 WHERE [authorization logic]              │
│                                                                │
│  CREATE SECURITY POLICY Security.RequestSecurityPolicy       │
│  ADD FILTER PREDICATE [function] ON [table]                  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  2. Always Encrypted (Sensitive Data)                         │
│  ─────────────────────────────────────────────────────────── │
│  • Column-level encryption for PII                           │
│  • Encryption keys stored in Azure Key Vault                 │
│  • Transparent to authorized applications                    │
│  • DETERMINISTIC for searchable columns (EmployeeId)        │
│  • RANDOMIZED for non-searchable (WorkPhone)                │
│                                                                │
│  Encrypted Columns:                                          │
│  • EmployeeId (DETERMINISTIC)                                │
│  • WorkPhone (RANDOMIZED)                                    │
│  • SecurityMeasures (RANDOMIZED)                             │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  3. Temporal Tables (History Tracking)                        │
│  ─────────────────────────────────────────────────────────── │
│  • Automatic history table creation                          │
│  • Point-in-time queries                                     │
│  • Audit trail without triggers                              │
│  • Time-travel queries                                        │
│                                                                │
│  ALTER TABLE SecurityRoleRequests                            │
│  ADD SysStartTime DATETIME2 GENERATED ALWAYS AS ROW START,   │
│      SysEndTime DATETIME2 GENERATED ALWAYS AS ROW END,       │
│      PERIOD FOR SYSTEM_TIME (SysStartTime, SysEndTime)       │
│  WITH (SYSTEM_VERSIONING = ON                                │
│        (HISTORY_TABLE = dbo.SecurityRoleRequests_History))   │
│                                                                │
│  -- Query historical data                                     │
│  SELECT * FROM SecurityRoleRequests                          │
│  FOR SYSTEM_TIME AS OF '2025-01-01'                          │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  4. Full-Text Search                                          │
│  ─────────────────────────────────────────────────────────── │
│  • Fast text search across large text columns                │
│  • Indexed search on Justification, Comments                 │
│  • Language-aware stemming                                    │
│  • Ranking support                                            │
│                                                                │
│  CREATE FULLTEXT CATALOG SwiftFullTextCatalog                │
│  CREATE FULLTEXT INDEX ON SecurityRoleRequests              │
│    (EmployeeName, Justification)                             │
│    KEY INDEX PK_SecurityRoleRequests                         │
│                                                                │
│  -- Search query                                              │
│  SELECT * FROM SecurityRoleRequests                          │
│  WHERE CONTAINS(Justification, 'new employee')               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  5. Query Store (Performance Monitoring)                      │
│  ─────────────────────────────────────────────────────────── │
│  • Automatic query performance tracking                      │
│  • Execution plan history                                     │
│  • Performance regression detection                          │
│  • Force specific execution plans                            │
│                                                                │
│  ALTER DATABASE SwiftSecurity                                │
│  SET QUERY_STORE = ON (                                      │
│    OPERATION_MODE = READ_WRITE,                              │
│    DATA_FLUSH_INTERVAL_SECONDS = 900,                        │
│    STATISTICS_COLLECTION_INTERVAL = 60                       │
│  )                                                            │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  6. Indexes Strategy                                          │
│  ─────────────────────────────────────────────────────────── │
│  • Clustered index on Id (GUID - NEWSEQUENTIALID())         │
│  • Non-clustered indexes on:                                 │
│    - Status (filtered: WHERE IsDeleted = 0)                  │
│    - AgencyCode                                              │
│    - CreatedAt DESC (for recent requests)                    │
│    - (EmployeeName, Email) composite                         │
│    - ApproverEmail (for pending approvals)                   │
│                                                                │
│  • Columnstore index for reporting queries                   │
│  • Filtered indexes for specific queries                     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  7. Change Tracking                                           │
│  ─────────────────────────────────────────────────────────── │
│  • Track DML changes for synchronization                     │
│  • Lightweight compared to triggers                          │
│  • 14-day retention period                                    │
│                                                                │
│  ALTER DATABASE SwiftSecurity                                │
│  SET CHANGE_TRACKING = ON                                    │
│    (CHANGE_RETENTION = 14 DAYS, AUTO_CLEANUP = ON)          │
│                                                                │
│  ALTER TABLE SecurityRoleRequests                            │
│  ENABLE CHANGE_TRACKING                                      │
│  WITH (TRACK_COLUMNS_UPDATED = ON)                           │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  8. JSON Support                                              │
│  ─────────────────────────────────────────────────────────── │
│  • Native JSON functions                                      │
│  • RoleSelectionJson column for flexible data               │
│  • Query JSON data with SQL                                   │
│                                                                │
│  SELECT Id, EmployeeName,                                    │
│    JSON_VALUE(RoleSelectionJson, '$.customField')           │
│  FROM SecurityRoleSelections                                 │
│  WHERE JSON_VALUE(RoleSelectionJson, '$.priority') = 'high' │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Authentication Flow

### 5.1 Azure AD Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│             Azure AD + JWT Authentication Flow                   │
└─────────────────────────────────────────────────────────────────┘

  ┌──────────┐                                        ┌──────────┐
  │  React   │                                        │ Azure AD │
  │   SPA    │                                        │          │
  └────┬─────┘                                        └────┬─────┘
       │                                                    │
       │ 1. User clicks Login                               │
       │────────────────────────────────────────────►       │
       │                                                    │
       │ 2. Redirect to Azure AD login page                │
       │◄────────────────────────────────────────────       │
       │                                                    │
       │ (User enters credentials)                          │
       │                                                    │
       │ 3. POST credentials                                │
       │────────────────────────────────────────────►       │
       │                                                    │
       │ 4. Authorization Code (if valid)                   │
       │◄────────────────────────────────────────────       │
       │                                                    │
       │ 5. Exchange code for tokens                        │
       │────────────────────────────────────────────►       │
       │                                                    │
       │ 6. Access Token + Refresh Token + ID Token        │
       │◄────────────────────────────────────────────       │
       │                                                    │
  ┌────▼─────┐                                              │
  │ Token    │                                              │
  │ Manager  │                                              │
  └────┬─────┘                                              │
       │                                                    │
       │ 7. Store tokens (HttpOnly cookie + memory)        │
       │                                                    │
  ┌────▼─────────────────────────────────────────┐         │
  │        Make API Request                       │         │
  │   GET /api/requests                           │         │
  │   Authorization: Bearer [access_token]        │         │
  └────┬─────────────────────────────────────────┘         │
       │                                                    │
       │ 8. API request with JWT                           │
       ▼                                                    │
  ┌──────────┐                                              │
  │ ASP.NET  │                                              │
  │ Core API │                                              │
  └────┬─────┘                                              │
       │                                                    │
       │ 9. Validate JWT signature                          │
       │────────────────────────────────────────────►       │
       │                                                    │
       │ 10. JWT validation result (keys)                   │
       │◄────────────────────────────────────────────       │
       │                                                    │
       │ 11. Extract claims (user, roles, email)           │
       │                                                    │
       │ 12. Check authorization policies                   │
       │                                                    │
       │ 13. Execute business logic                         │
       ▼                                                    │
  ┌──────────┐                                              │
  │  SQL     │                                              │
  │  Server  │                                              │
  └────┬─────┘                                              │
       │                                                    │
       │ 14. Return data                                    │
       ▼                                                    │
  ┌──────────┐                                              │
  │  React   │                                              │
  │   SPA    │                                              │
  └──────────┘                                              │

Token Refresh Flow (when access token expires):
───────────────────────────────────────────────

  ┌──────────┐                                        ┌──────────┐
  │  React   │                                        │ Azure AD │
  │   SPA    │                                        │          │
  └────┬─────┘                                        └────┬─────┘
       │                                                    │
       │ 1. API request with expired token                 │
       ▼                                                    │
  ┌──────────┐                                              │
  │   API    │                                              │
  └────┬─────┘                                              │
       │                                                    │
       │ 2. Return 401 Unauthorized                        │
       │    Header: Token-Expired=true                     │
       ▼                                                    │
  ┌──────────┐                                              │
  │ Axios    │                                              │
  │Intercept │                                              │
  └────┬─────┘                                              │
       │                                                    │
       │ 3. Detect 401 + Token-Expired                     │
       │                                                    │
       │ 4. POST refresh token                              │
       │────────────────────────────────────────────►       │
       │                                                    │
       │ 5. New Access Token                                │
       │◄────────────────────────────────────────────       │
       │                                                    │
       │ 6. Retry original request with new token          │
       │                                                    │
       ▼                                                    │
  (Continue normal flow...)

JWT Token Structure:
───────────────────

Header:
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "[key-id]"
}

Payload (Claims):
{
  "sub": "user-guid-123",
  "email": "john.doe@state.mn.us",
  "name": "John Doe",
  "roles": ["Submitter", "Supervisor"],
  "agency": "G02",
  "iat": 1700000000,
  "exp": 1700003600,
  "iss": "https://login.microsoftonline.com/[tenant]/v2.0",
  "aud": "[api-client-id]"
}

Signature:
RSASHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  [private-key]
)
```

### 5.2 Authorization Decision Flow

```
┌────────────────────────────────────────────────────────────────┐
│            Authorization Decision Tree                          │
└────────────────────────────────────────────────────────────────┘

API Request Received
        │
        ▼
┌─────────────────┐
│ Authentication  │
│   Middleware    │
└────────┬────────┘
         │
         ├─ NO JWT Token? ──► 401 Unauthorized
         │
         ├─ Invalid JWT? ───► 401 Unauthorized
         │
         ├─ Expired JWT? ───► 401 + Token-Expired header
         │
         └─ Valid JWT ─────►
                            │
                            ▼
                    ┌─────────────────┐
                    │ Extract Claims  │
                    │  - UserId       │
                    │  - Email        │
                    │  - Roles        │
                    │  - Agency       │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Authorization   │
                    │   Middleware    │
                    └────────┬────────┘
                             │
                             ▼
        ┌────────────────────┴────────────────────┐
        │                                          │
        ▼                                          ▼
┌──────────────────┐                    ┌─────────────────┐
│  Policy-Based    │                    │ Resource-Based  │
│  Authorization   │                    │  Authorization  │
└────────┬─────────┘                    └────────┬────────┘
         │                                        │
         │                                        │
    Check [Authorize] attribute              Check resource
         │                                    ownership/access
         │                                        │
    ┌────▼─────────────────────────┐       ┌────▼────────────┐
    │ Required Policy?              │       │ Request Owner?  │
    │ - CanSubmitRequest           │       │ - Submitter?    │
    │ - CanApprove                 │       │ - Approver?     │
    │ - CanAccessMnit              │       │ - MNIT?         │
    └────┬─────────────────────────┘       └────┬────────────┘
         │                                        │
    Does user have                          Does user have
    required role(s)?                       access to resource?
         │                                        │
    ┌────▼────────┐                         ┌────▼────────┐
    │             │                          │             │
    YES          NO                          YES          NO
    │             │                          │             │
    │             └──► 403 Forbidden         │             │
    │                                        │             │
    │                                        │             └──► 403 Forbidden
    │                                        │
    └────────────────┬───────────────────────┘
                     │
                     ▼
            ┌─────────────────┐
            │  Row-Level      │
            │  Security (RLS) │
            └────────┬────────┘
                     │
            Set session context:
            • UserEmail
            • UserId
            • Roles
                     │
                     ▼
            ┌─────────────────┐
            │  Execute Query  │
            │  (automatically │
            │   filtered)     │
            └────────┬────────┘
                     │
                     ▼
            ┌─────────────────┐
            │ Return Results  │
            │ (only visible   │
            │   to user)      │
            └─────────────────┘

Example Scenarios:
─────────────────

Scenario 1: Submitter creates request
    User: john.doe@state.mn.us
    Role: Submitter
    Action: POST /api/requests

    ✓ Authentication: Valid JWT
    ✓ Policy: CanSubmitRequest (Submitter role)
    ✓ Resource: N/A (new resource)
    ✓ RLS: N/A (creating new)

    Result: 201 Created

Scenario 2: Supervisor views pending approvals
    User: jane.smith@state.mn.us
    Role: Supervisor
    Action: GET /api/approvals/pending

    ✓ Authentication: Valid JWT
    ✓ Policy: CanApprove (Supervisor role)
    ✓ Resource: N/A (list query)
    ✓ RLS: Returns only requests where
           SupervisorUsername = jane.smith@state.mn.us

    Result: 200 OK with filtered list

Scenario 3: User tries to edit another user's draft
    User: alice@state.mn.us
    Role: Submitter
    Action: PUT /api/requests/123 (owned by bob@state.mn.us)

    ✓ Authentication: Valid JWT
    ✓ Policy: CanEditRequest
    ✗ Resource: Not the owner

    Result: 403 Forbidden

Scenario 4: Non-MNIT user tries MNIT endpoint
    User: john.doe@state.mn.us
    Role: Submitter
    Action: GET /api/mnit/requests

    ✓ Authentication: Valid JWT
    ✗ Policy: CanAccessMnit (requires MnitPersonnel role)

    Result: 403 Forbidden
```

---

## 6. Data Flow Diagrams

### 6.1 Request Submission Flow

```
┌──────────────────────────────────────────────────────────────────┐
│              Request Submission Complete Flow                     │
└──────────────────────────────────────────────────────────────────┘

USER SUBMITS REQUEST
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  React SPA - Main Form (App.tsx)                            │
│  • Employee details                                          │
│  • Agency selection                                          │
│  • Security area selection                                   │
│  • Approver information                                      │
└────────┬────────────────────────────────────────────────────┘
         │
         │ Save Draft (auto-save every 30s)
         ▼
    POST /api/requests
    {
      status: "Draft",
      employeeName: "...",
      ...
    }
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  API - RequestsController                                    │
│  [Authorize(Policy = "CanSubmitRequest")]                   │
└────────┬────────────────────────────────────────────────────┘
         │
         │ Send(CreateRequestCommand)
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Application - CreateRequestCommandHandler                   │
│  1. Validate command (FluentValidation)                     │
│  2. Map to Domain entity                                     │
│  3. Create SecurityRoleRequest.Create()                     │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Domain - SecurityRoleRequest Entity                         │
│  • Validate business rules                                   │
│  • Set CreatedBy, CreatedAt                                  │
│  • Raise RequestCreatedEvent                                 │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Infrastructure - SwiftDbContext                             │
│  • INSERT into security_role_requests                        │
│  • Apply audit interceptor                                   │
│  • Commit transaction                                        │
└────────┬────────────────────────────────────────────────────┘
         │
         │ Return Guid (RequestId)
         ▼
┌─────────────────────────────────────────────────────────────┐
│  React SPA - Redirect to Role Selection                      │
│  Navigate to: /select-roles/{requestId}                     │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  React SPA - Role Selection Page                             │
│  • Load business units                                       │
│  • Display role categories (Accounts Payable, etc.)         │
│  • User selects roles via checkboxes                         │
└────────┬────────────────────────────────────────────────────┘
         │
         │ Save roles (auto-save)
         ▼
    POST /api/roles/{requestId}
    {
      voucherEntry: true,
      apInquiryOnly: true,
      ...
    }
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  API - RoleSelectionsController                              │
└────────┬────────────────────────────────────────────────────┘
         │
         │ Send(SaveRoleSelectionCommand)
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Application - SaveRoleSelectionCommandHandler               │
│  • Validate at least one role selected                       │
│  • Create/Update SecurityRoleSelection                       │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Infrastructure - SwiftDbContext                             │
│  • INSERT/UPDATE security_role_selections                    │
│  • Foreign key to request                                    │
└────────┬────────────────────────────────────────────────────┘
         │
         │ User clicks "Submit for Approval"
         ▼
┌─────────────────────────────────────────────────────────────┐
│  React SPA - Confirmation Dialog                             │
│  "Submit request for approval? Cannot be edited after."      │
└────────┬────────────────────────────────────────────────────┘
         │
         │ Confirmed
         ▼
    POST /api/requests/{requestId}/submit
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  API - RequestsController.Submit()                           │
└────────┬────────────────────────────────────────────────────┘
         │
         │ Send(SubmitRequestCommand)
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Application - SubmitRequestCommandHandler                   │
│  1. Load request from DB                                     │
│  2. Validate completeness                                    │
│  3. Call request.Submit()                                    │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Domain - SecurityRoleRequest.Submit()                       │
│  • Change status: Draft → Pending                            │
│  • Create approval records (based on security area)          │
│  • Raise RequestSubmittedEvent                               │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Domain - Approval Workflow Service                          │
│  • Determine approval chain                                  │
│  • Create RequestApproval records                            │
│    - Supervisor (Step 1)                                     │
│    - Security Admin (Step 2)                                 │
│    - Accounting Director (Step 3, if applicable)            │
│    - MNIT (Final step)                                       │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Infrastructure - SwiftDbContext                             │
│  • UPDATE security_role_requests SET Status = 'Pending'     │
│  • INSERT INTO request_approvals (multiple rows)             │
│  • Commit transaction                                        │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Event Handler - RequestSubmittedEventHandler                │
│  • Send email to first approver (Supervisor)                 │
│  • Create audit log entry                                    │
│  • Update statistics                                         │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Infrastructure - EmailService                               │
│  • Compose approval request email                            │
│  • Include deep link to signature page                       │
│  • Send via SMTP / SendGrid / Azure Communication Services   │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  React SPA - Success Page                                    │
│  "Request submitted successfully"                            │
│  • Request ID                                                │
│  • Next approver notification                                │
│  • Link to view request details                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Approval Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                   Approval Process Flow                           │
└──────────────────────────────────────────────────────────────────┘

APPROVER RECEIVES EMAIL
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  Email                                                        │
│  Subject: Security Access Request Requires Your Approval     │
│  Body:                                                        │
│    Employee: John Doe                                         │
│    Request ID: 12345                                          │
│    Security Area: Accounting                                  │
│                                                               │
│    [Review and Approve] → Deep link                          │
└────────┬────────────────────────────────────────────────────┘
         │
         │ Click link
         ▼
    https://app.com/signature/{requestId}/{approvalId}
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  React SPA - SignaturePage                                   │
│  1. Load request details                                     │
│  2. Display approval step info                               │
│  3. Show signature canvas                                    │
└────────┬────────────────────────────────────────────────────┘
         │
         │ GET /api/requests/{id}
         ▼
┌─────────────────────────────────────────────────────────────┐
│  API - RequestsController.GetById()                          │
└────────┬────────────────────────────────────────────────────┘
         │
         │ Send(GetRequestByIdQuery)
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Application - GetRequestByIdQueryHandler                    │
│  • Query DB with RLS filter                                  │
│  • Include role selections, approvals                        │
│  • Map to RequestDto                                         │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Infrastructure - SwiftDbContext                             │
│  SELECT * FROM security_role_requests                        │
│  WHERE Id = @id                                              │
│  AND (applies RLS predicate)                                 │
└────────┬────────────────────────────────────────────────────┘
         │
         │ Return RequestDto
         ▼
┌─────────────────────────────────────────────────────────────┐
│  React SPA - Display Request Details                         │
│  • Employee information                                       │
│  • Selected roles                                            │
│  • Justification                                             │
│  • Previous approval signatures                              │
└────────┬────────────────────────────────────────────────────┘
         │
         │ Approver reviews and signs
         ▼
┌─────────────────────────────────────────────────────────────┐
│  React SPA - Signature Capture                               │
│  • Canvas for digital signature                              │
│  • Comments textarea (optional)                              │
│  • Approve / Reject buttons                                  │
└────────┬────────────────────────────────────────────────────┘
         │
         │ Click "Approve" with signature
         ▼
    POST /api/approvals/{approvalId}/approve
    {
      signatureData: "data:image/png;base64,...",
      comments: "Approved for accounting access"
    }
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  API - ApprovalsController.Approve()                         │
│  [Authorize(Policy = "CanApprove")]                         │
└────────┬────────────────────────────────────────────────────┘
         │
         │ Send(ApproveRequestCommand)
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Application - ApproveRequestCommandHandler                  │
│  1. Load approval record                                     │
│  2. Verify approver matches current user                     │
│  3. Validate signature data                                  │
│  4. Call approval.Approve()                                  │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Domain - RequestApproval.Approve()                          │
│  • Change status: Pending → Approved                         │
│  • Set ApprovedAt = DateTime.UtcNow                          │
│  • Store signature data                                      │
│  • Raise ApprovalCompletedEvent                              │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Domain - Workflow Coordinator                               │
│  • Check if all required approvals complete                  │
│  • Determine next approval step                              │
│  • Update main request status if needed                      │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
    ┌──────────────┬──────────────┐
    │              │              │
    ▼              ▼              ▼
  More          Last           All
  Approvals     Approval      Complete
  Pending       Pending
    │              │              │
    ▼              ▼              ▼
┌────────┐   ┌────────┐    ┌──────────┐
│ Update │   │ Update │    │ Update   │
│ Status │   │ Status │    │ Status   │
│        │   │        │    │ to       │
│        │   │        │    │ Approved │
└───┬────┘   └───┬────┘    └────┬─────┘
    │            │              │
    ▼            ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│  Infrastructure - SwiftDbContext                             │
│  • UPDATE request_approvals                                  │
│    SET Status = 'Approved',                                  │
│        ApprovedAt = GETUTCDATE(),                            │
│        SignatureData = @signature                            │
│  • UPDATE security_role_requests (if needed)                 │
│  • INSERT INTO audit_logs                                    │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Event Handler - ApprovalCompletedEventHandler               │
└────────┬────────────────────────────────────────────────────┘
         │
    ┌────┴────────────────┐
    ▼                     ▼
┌────────────┐    ┌─────────────────┐
│ Send email │    │ Send email to   │
│ to next    │    │ submitter       │
│ approver   │    │ (notification)  │
└────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  React SPA - Success Confirmation                            │
│  "Approval recorded successfully"                            │
│  • Timestamp                                                 │
│  • Next approver (if applicable)                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 MNIT Processing Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                  MNIT Processing Flow                             │
└──────────────────────────────────────────────────────────────────┘

ALL APPROVALS COMPLETE
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  System - Automatic Status Update                            │
│  • Status: Approved → AwaitingMnitProcessing                 │
│  • Trigger MnitNotificationEvent                             │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Event Handler - MnitNotificationEventHandler                │
│  • Send email to MNIT team                                   │
│  • Create notification in MNIT dashboard                     │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  MNIT Staff - Login to Application                           │
│  Navigate to: /mnit/requests                                 │
└────────┬────────────────────────────────────────────────────┘
         │
         │ GET /api/mnit/requests?status=pending
         ▼
┌─────────────────────────────────────────────────────────────┐
│  API - MnitController.GetPendingRequests()                   │
│  [Authorize(Policy = "CanAccessMnit")]                      │
└────────┬────────────────────────────────────────────────────┘
         │
         │ Send(GetMnitRequestsQuery)
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Application - GetMnitRequestsQueryHandler                   │
│  • Query approved requests                                   │
│  • Include role selections                                   │
│  • Generate role codes for provisioning                      │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Infrastructure - SwiftDbContext + Business Logic            │
│  SELECT r.*, rs.*,                                           │
│    (SELECT role_code FROM role_catalog                       │
│     WHERE flag_key = 'voucherEntry' AND rs.voucher_entry)   │
│  FROM security_role_requests r                               │
│  JOIN security_role_selections rs ON r.Id = rs.RequestId    │
│  WHERE r.Status = 'AwaitingMnitProcessing'                   │
└────────┬────────────────────────────────────────────────────┘
         │
         │ Return list with role codes
         ▼
┌─────────────────────────────────────────────────────────────┐
│  React SPA - MNIT Request List                               │
│  Table:                                                       │
│  • Request ID                                                │
│  • Employee Name                                             │
│  • Agency                                                    │
│  • Security Area                                             │
│  • Submission Date                                           │
│  • [View Details] button                                     │
└────────┬────────────────────────────────────────────────────┘
         │
         │ Click "View Details"
         ▼
    Navigate to: /mnit/{requestId}
         │
         │ GET /api/mnit/requests/{id}
         ▼
┌─────────────────────────────────────────────────────────────┐
│  React SPA - MNIT Details Page                               │
│  Display:                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Employee Information                                 │   │
│  │  • Name, ID, Email, Phone                            │   │
│  │  • Agency, Business Unit                             │   │
│  │  • Start Date                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Role Codes to Provision                              │   │
│  │  ☑ AP001 - Voucher Entry                            │   │
│  │  ☑ AP015 - Inquiry Only                             │   │
│  │  ☑ BU020 - Budget Journal Entry                     │   │
│  │  ... (all selected roles with codes)                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Approval History                                     │   │
│  │  ✓ Supervisor - Jane Smith - 2025-01-15             │   │
│  │  ✓ Security Admin - Bob Jones - 2025-01-16          │   │
│  │  ✓ Accounting Dir - Mary Brown - 2025-01-17         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  [Mark as Complete] button                                   │
└────────┬────────────────────────────────────────────────────┘
         │
         │ MNIT provisions roles in SWIFT
         │ (external system)
         ▼
┌─────────────────────────────────────────────────────────────┐
│  External - SWIFT Security System                            │
│  • Manual provisioning by MNIT staff                         │
│  • OR: Future API integration                                │
└─────────────────────────────────────────────────────────────┘
         │
         │ Provisioning complete, click "Mark as Complete"
         ▼
    POST /api/mnit/requests/{id}/complete
    {
      completionNotes: "Roles provisioned successfully"
    }
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  API - MnitController.CompleteRequest()                      │
│  [Authorize(Policy = "CanAccessMnit")]                      │
└────────┬────────────────────────────────────────────────────┘
         │
         │ Send(CompleteRequestCommand)
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Application - CompleteRequestCommandHandler                 │
│  1. Load request                                             │
│  2. Verify all approvals complete                            │
│  3. Call request.Complete()                                  │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Domain - SecurityRoleRequest.Complete()                     │
│  • Change status: AwaitingMnitProcessing → Completed         │
│  • Set CompletedAt = DateTime.UtcNow                         │
│  • Set CompletedBy = current MNIT user                       │
│  • Raise RequestCompletedEvent                               │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Infrastructure - SwiftDbContext                             │
│  UPDATE security_role_requests                               │
│  SET Status = 'Completed',                                   │
│      CompletedAt = GETUTCDATE(),                             │
│      CompletedBy = @userId                                   │
│  WHERE Id = @requestId                                       │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Event Handler - RequestCompletedEventHandler                │
│  • Send completion email to submitter                        │
│  • Send notification email to employee                       │
│  • Update reporting statistics                               │
│  • Archive request data (if configured)                      │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Email Service - Send Completion Emails                      │
│  To Submitter:                                               │
│    "Request #12345 has been completed"                       │
│  To Employee:                                                │
│    "Your SWIFT access has been provisioned"                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Deployment Architecture

### 7.1 Azure Deployment Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                     Azure Cloud Environment                       │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Azure Active Directory (Entra ID)               │ │
│  │  • User authentication                                       │ │
│  │  • Role assignments                                          │ │
│  │  • JWT token issuance                                        │ │
│  └────────────────────────┬────────────────────────────────────┘ │
│                           │                                       │
│  ┌────────────────────────┴────────────────────────────────────┐ │
│  │                  Azure Front Door                            │ │
│  │  • Global load balancing                                     │ │
│  │  • SSL/TLS termination                                       │ │
│  │  • WAF (Web Application Firewall)                            │ │
│  │  • DDoS protection                                           │ │
│  │  • CDN for static assets                                     │ │
│  └────────┬────────────────────────────┬────────────────────────┘ │
│           │                             │                          │
│           │ /api/*                      │ /*                       │
│           ▼                             ▼                          │
│  ┌─────────────────────┐      ┌──────────────────────┐           │
│  │  Azure App Service  │      │  Azure Static Web    │           │
│  │  (Backend API)      │      │  Apps (React SPA)    │           │
│  │  ┌───────────────┐  │      │  ┌────────────────┐  │           │
│  │  │ ASP.NET Core  │  │      │  │  React Build   │  │           │
│  │  │ Web API       │  │      │  │  (Static HTML, │  │           │
│  │  │               │  │      │  │   JS, CSS)     │  │           │
│  │  │ • Controllers │  │      │  └────────────────┘  │           │
│  │  │ • Middleware  │  │      │                      │           │
│  │  │ • DI Container│  │      │  Features:           │           │
│  │  └───────┬───────┘  │      │  • Auto-build on    │           │
│  │          │           │      │    Git push         │           │
│  │  Features:           │      │  • Global CDN       │           │
│  │  • Auto-scaling     │      │  • Custom domains   │           │
│  │  • Deployment slots │      │  • HTTPS enforced   │           │
│  │  • App Insights     │      │                      │           │
│  │  • Managed identity │      │                      │           │
│  └────┬─────┬──────────┘      └──────────────────────┘           │
│       │     │                                                      │
│       │     │ Managed Identity Authentication                     │
│       │     └──────────────┐                                      │
│       │                    │                                      │
│       ▼                    ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Azure SQL Database (SQL Server 2022)            │ │
│  │  ┌────────────────────────────────────────────────────────┐ │ │
│  │  │  SwiftSecurity Database                                 │ │ │
│  │  │  • General Purpose tier (or Business Critical)          │ │ │
│  │  │  • Geo-replication enabled                              │ │ │
│  │  │  • Automatic backups (Point-in-time restore)            │ │ │
│  │  │  • Transparent Data Encryption (TDE)                    │ │ │
│  │  │  • Advanced Threat Protection                           │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  │                                                               │ │
│  │  Connection:                                                  │ │
│  │  • Private endpoint (VNet integration)                       │ │
│  │  • Firewall rules (allow Azure services)                    │ │
│  │  • Connection string in Key Vault                           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                           │                                        │
│                           ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Azure Key Vault                                 │ │
│  │  • Database connection strings                               │ │
│  │  • API keys                                                  │ │
│  │  • JWT signing certificates                                  │ │
│  │  • Always Encrypted column master keys                       │ │
│  │  • Managed with Azure RBAC                                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Azure Monitor & App Insights                    │ │
│  │  • Application performance monitoring                        │ │
│  │  • Distributed tracing                                       │ │
│  │  • Log Analytics workspace                                   │ │
│  │  • Alerts and dashboards                                     │ │
│  │  • Live metrics                                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │         Azure Communication Services (Email)                 │ │
│  │  • Transactional emails                                      │ │
│  │  • Approval notifications                                    │ │
│  │  • Status updates                                            │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Azure DevOps / GitHub Actions                   │ │
│  │  • CI/CD pipelines                                           │ │
│  │  • Automated testing                                         │ │
│  │  • Infrastructure as Code (Terraform/ARM)                    │ │
│  │  • Release management                                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

### 7.2 Environment Strategy

```
┌──────────────────────────────────────────────────────────────────┐
│                    Multi-Environment Setup                        │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  DEVELOPMENT ENVIRONMENT                                         │
├─────────────────────────────────────────────────────────────────┤
│  Purpose: Local development and testing                         │
│                                                                  │
│  • Local SQL Server / LocalDB                                   │
│  • IIS Express / Kestrel                                        │
│  • React dev server (Vite)                                      │
│  • Mock external services                                       │
│  • Detailed logging                                             │
│                                                                  │
│  Configuration:                                                  │
│  appsettings.Development.json                                   │
│  .env.development                                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  TEST ENVIRONMENT (Azure)                                        │
├─────────────────────────────────────────────────────────────────┤
│  Purpose: Integration testing, QA, UAT                          │
│                                                                  │
│  Azure Resources:                                               │
│  • App Service: swift-security-api-test                        │
│  • Static Web App: swift-security-web-test                     │
│  • SQL Database: SwiftSecurity-Test (S1 tier)                  │
│  • Key Vault: swift-keyvault-test                              │
│  • App Insights: swift-appinsights-test                        │
│                                                                  │
│  Features:                                                       │
│  • Isolated Azure AD tenant                                     │
│  • Test data seeding                                            │
│  • Email sandbox (no real emails sent)                          │
│  • Lower-tier services (cost optimization)                      │
│                                                                  │
│  URL: https://test.swift-security.mn.gov                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  STAGING ENVIRONMENT (Azure)                                     │
├─────────────────────────────────────────────────────────────────┤
│  Purpose: Pre-production validation, performance testing        │
│                                                                  │
│  Azure Resources:                                               │
│  • App Service: swift-security-api-staging                     │
│  • Static Web App: swift-security-web-staging                  │
│  • SQL Database: SwiftSecurity-Staging (S3 tier)               │
│  • Key Vault: swift-keyvault-staging                           │
│  • App Insights: swift-appinsights-staging                     │
│                                                                  │
│  Features:                                                       │
│  • Mirror of production configuration                           │
│  • Production-like data (anonymized)                            │
│  • Full Azure AD integration                                    │
│  • Performance testing                                          │
│  • Blue-green deployment testing                                │
│                                                                  │
│  URL: https://staging.swift-security.mn.gov                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  PRODUCTION ENVIRONMENT (Azure)                                  │
├─────────────────────────────────────────────────────────────────┤
│  Purpose: Live production system                                │
│                                                                  │
│  Azure Resources:                                               │
│  • App Service: swift-security-api-prod                        │
│    - Premium P2V3 tier (auto-scaling 2-10 instances)           │
│    - Deployment slots (blue-green)                              │
│  • Static Web App: swift-security-web-prod                     │
│  • SQL Database: SwiftSecurity-Prod                            │
│    - Business Critical tier (high availability)                │
│    - Geo-replication (secondary region)                         │
│    - 35-day backup retention                                    │
│  • Azure Front Door (global load balancing + WAF)              │
│  • Key Vault: swift-keyvault-prod                              │
│  • App Insights: swift-appinsights-prod                        │
│  • Communication Services: Email sending                        │
│                                                                  │
│  Features:                                                       │
│  • High availability (99.95% SLA)                               │
│  • Disaster recovery plan                                       │
│  • Real-time monitoring and alerts                              │
│  • Audit logging                                                │
│  • Security scanning                                            │
│                                                                  │
│  URL: https://swift-security.mn.gov                             │
└─────────────────────────────────────────────────────────────────┘

Deployment Flow:
───────────────
  Developer commits → GitHub → GitHub Actions
                                     │
                                     ├─► Test Environment (auto)
                                     │   └─► Run integration tests
                                     │
                                     ├─► Staging (on PR approval)
                                     │   └─► Manual QA validation
                                     │
                                     └─► Production (on release tag)
                                         └─► Blue-green deployment
                                             └─► Health check
                                                 └─► Traffic swap
```

---

## 8. Integration Architecture

### 8.1 External System Integrations

```
┌──────────────────────────────────────────────────────────────────┐
│                  External Integrations                            │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  1. Azure Active Directory (Authentication)                   │
├──────────────────────────────────────────────────────────────┤
│  Protocol: OAuth 2.0 / OpenID Connect                        │
│  Flow: Authorization Code Flow with PKCE                     │
│                                                               │
│  Integration Points:                                          │
│  • User login                                                │
│  • Token issuance                                            │
│  • Token validation                                          │
│  • User profile retrieval                                    │
│                                                               │
│  Configuration:                                               │
│  {                                                            │
│    "AzureAd": {                                              │
│      "Instance": "https://login.microsoftonline.com/",      │
│      "TenantId": "[minnesota-tenant-id]",                   │
│      "ClientId": "[app-registration-id]",                   │
│      "CallbackPath": "/signin-oidc",                        │
│      "SignedOutCallbackPath": "/signout-callback-oidc"      │
│    }                                                          │
│  }                                                            │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  2. Email Service (Azure Communication Services)              │
├──────────────────────────────────────────────────────────────┤
│  Purpose: Transactional email notifications                  │
│                                                               │
│  Email Templates:                                            │
│  • Approval Request                                          │
│  • Approval Confirmation                                     │
│  • Request Rejection                                         │
│  • Request Completion                                        │
│                                                               │
│  Features:                                                    │
│  • HTML email templates                                      │
│  • Deep links to application                                 │
│  • Retry logic for failures                                  │
│  • Email delivery tracking                                   │
│                                                               │
│  Integration:                                                 │
│  public interface IEmailService                              │
│  {                                                            │
│    Task SendApprovalRequestAsync(                            │
│      string to, string requestId, string employeeName);      │
│    Task SendApprovalConfirmationAsync(...);                  │
│    Task SendRejectionAsync(...);                             │
│  }                                                            │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  3. SWIFT System (Future Integration)                        │
├──────────────────────────────────────────────────────────────┤
│  Purpose: Automated role provisioning                        │
│  Status: Phase 2 - Not in initial release                    │
│                                                               │
│  Integration Approach:                                        │
│  • REST API (if available)                                   │
│  • SOAP Web Services                                         │
│  • Database integration (read-only)                          │
│  • File-based integration (CSV export)                       │
│                                                               │
│  Planned Operations:                                          │
│  • Query existing user roles                                 │
│  • Provision new roles                                       │
│  • Update role assignments                                   │
│  • Revoke access                                             │
│                                                               │
│  Security:                                                    │
│  • Service account with minimal permissions                  │
│  • Encrypted credentials in Key Vault                        │
│  • Audit logging of all operations                           │
│  • Idempotent operations                                     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  4. Enterprise HR System (Future Integration)                │
├──────────────────────────────────────────────────────────────┤
│  Purpose: Employee data validation                           │
│  Status: Phase 2 - Optional                                  │
│                                                               │
│  Use Cases:                                                   │
│  • Validate employee ID                                      │
│  • Retrieve employee details                                 │
│  • Verify supervisor relationship                            │
│  • Check employment status                                   │
│                                                               │
│  Integration Options:                                         │
│  • REST API integration                                      │
│  • LDAP/Active Directory lookup                             │
│  • Database view (read-only)                                 │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  5. Reporting & Analytics (Power BI)                         │
├──────────────────────────────────────────────────────────────┤
│  Purpose: Executive dashboards and reports                   │
│                                                               │
│  Data Source:                                                 │
│  • Direct SQL Database connection (read-only user)           │
│  • Materialized views for performance                        │
│  • Scheduled data refresh                                    │
│                                                               │
│  Reports:                                                     │
│  • Request volume by agency                                  │
│  • Average approval time                                     │
│  • Most requested roles                                      │
│  • Approval bottlenecks                                      │
│  • Compliance metrics                                        │
└──────────────────────────────────────────────────────────────┘
```

---

## 9. Security Architecture

### 9.1 Security Layers

```
┌──────────────────────────────────────────────────────────────────┐
│                      Security Defense in Depth                    │
└──────────────────────────────────────────────────────────────────┘

Layer 1: Network Security
─────────────────────────
┌─────────────────────────────────────────────────────────────┐
│  • Azure Front Door WAF (Web Application Firewall)          │
│    - OWASP Top 10 protection                                │
│    - SQL injection prevention                               │
│    - XSS protection                                         │
│    - Bot mitigation                                         │
│                                                              │
│  • DDoS Protection (Azure DDoS Standard)                    │
│  • TLS 1.3 enforcement                                      │
│  • Private endpoints for database                           │
│  • VNet integration                                         │
└─────────────────────────────────────────────────────────────┘

Layer 2: Identity & Access
──────────────────────────
┌─────────────────────────────────────────────────────────────┐
│  • Azure AD (Entra ID) authentication                       │
│  • Multi-factor authentication (MFA) required               │
│  • Conditional Access policies                              │
│  • JWT tokens with short expiration (1 hour)               │
│  • Refresh tokens (HttpOnly secure cookies)                 │
│  • Role-based authorization                                 │
│  • Claims-based access control                              │
└─────────────────────────────────────────────────────────────┘

Layer 3: Application Security
─────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│  • Input validation (FluentValidation)                      │
│  • Output encoding                                          │
│  • CSRF protection                                          │
│  • CORS policy (restricted origins)                         │
│  • Rate limiting (per user, per IP)                         │
│  • Anti-forgery tokens                                      │
│  • Secure headers (HSTS, CSP, X-Frame-Options)             │
│  • Content Security Policy                                  │
└─────────────────────────────────────────────────────────────┘

Layer 4: Data Security
──────────────────────
┌─────────────────────────────────────────────────────────────┐
│  • Encryption at rest (TDE - Transparent Data Encryption)   │
│  • Encryption in transit (TLS 1.3)                          │
│  • Always Encrypted for PII columns                         │
│  • Row-Level Security (RLS)                                 │
│  • Parameterized queries (no SQL injection)                 │
│  • Secrets in Azure Key Vault                               │
│  • No sensitive data in logs                                │
└─────────────────────────────────────────────────────────────┘

Layer 5: Monitoring & Audit
───────────────────────────
┌─────────────────────────────────────────────────────────────┐
│  • Application Insights telemetry                           │
│  • Azure Monitor alerts                                     │
│  • Security audit logging                                   │
│  • Failed login tracking                                    │
│  • Anomaly detection                                        │
│  • SIEM integration (Azure Sentinel)                        │
│  • Regular security scans                                   │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Data Protection Implementation

```
┌──────────────────────────────────────────────────────────────────┐
│                    Data Classification & Protection               │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  PUBLIC DATA                                                     │
├─────────────────────────────────────────────────────────────────┤
│  • Role catalog (role names, descriptions)                      │
│  • Business unit names                                          │
│  • Agency names                                                 │
│                                                                  │
│  Protection: None required (publicly available)                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  INTERNAL DATA                                                   │
├─────────────────────────────────────────────────────────────────┤
│  • Request IDs                                                   │
│  • Role selections                                              │
│  • Approval status                                              │
│  • Timestamps                                                    │
│                                                                  │
│  Protection:                                                     │
│  • Authentication required                                      │
│  • Row-Level Security                                           │
│  • TLS encryption in transit                                    │
│  • TDE encryption at rest                                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  CONFIDENTIAL DATA (PII)                                         │
├─────────────────────────────────────────────────────────────────┤
│  • Employee names                                                │
│  • Email addresses                                              │
│  • Justification text                                           │
│  • Supervisor names                                             │
│                                                                  │
│  Protection:                                                     │
│  • Authentication + RLS                                         │
│  • TLS 1.3 in transit                                           │
│  • TDE at rest                                                  │
│  • Access logging                                               │
│  • Data retention policies                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  RESTRICTED DATA (Sensitive PII)                                 │
├─────────────────────────────────────────────────────────────────┤
│  • Employee ID (SSN-based)                                      │
│  • Work phone numbers                                           │
│  • Security measures (for non-employees)                        │
│                                                                  │
│  Protection:                                                     │
│  • Always Encrypted (column-level)                              │
│  • Keys in Azure Key Vault                                      │
│  • Application-level decryption only                            │
│  • Encryption algorithms:                                       │
│    - EmployeeId: DETERMINISTIC (searchable)                    │
│    - WorkPhone: RANDOMIZED                                      │
│    - SecurityMeasures: RANDOMIZED                               │
│  • Audit all access                                             │
│  • Strict access controls                                       │
└─────────────────────────────────────────────────────────────────┘

Always Encrypted Implementation:
───────────────────────────────

-- Create Column Master Key
CREATE COLUMN MASTER KEY [CMK_Auto1]
WITH (
  KEY_STORE_PROVIDER_NAME = 'AZURE_KEY_VAULT',
  KEY_PATH = 'https://swift-keyvault-prod.vault.azure.net/keys/CMK'
);

-- Create Column Encryption Key
CREATE COLUMN ENCRYPTION KEY [CEK_Auto1]
WITH VALUES (
  COLUMN_MASTER_KEY = [CMK_Auto1],
  ALGORITHM = 'RSA_OAEP',
  ENCRYPTED_VALUE = 0x...
);

-- Encrypt columns
ALTER TABLE security_role_requests
ALTER COLUMN EmployeeId NVARCHAR(50) COLLATE Latin1_General_BIN2
ENCRYPTED WITH (
  COLUMN_ENCRYPTION_KEY = [CEK_Auto1],
  ENCRYPTION_TYPE = DETERMINISTIC,
  ALGORITHM = 'AEAD_AES_256_CBC_HMAC_SHA_256'
);

ALTER TABLE security_role_requests
ALTER COLUMN WorkPhone NVARCHAR(20) COLLATE Latin1_General_BIN2
ENCRYPTED WITH (
  COLUMN_ENCRYPTION_KEY = [CEK_Auto1],
  ENCRYPTION_TYPE = RANDOMIZED,
  ALGORITHM = 'AEAD_AES_256_CBC_HMAC_SHA_256'
);
```

### 9.3 Security Best Practices Checklist

```
┌──────────────────────────────────────────────────────────────────┐
│              Production Security Checklist                        │
└──────────────────────────────────────────────────────────────────┘

Authentication & Authorization
─────────────────────────────
☑ Azure AD integration configured
☑ MFA enforced for all users
☑ JWT tokens with proper expiration
☑ Refresh token rotation implemented
☑ Role-based access control (RBAC)
☑ Claims-based authorization
☑ Row-Level Security enabled
☑ Service accounts use managed identities

Data Protection
──────────────
☑ TLS 1.3 enforced (no older versions)
☑ Transparent Data Encryption (TDE) enabled
☑ Always Encrypted for sensitive PII
☑ Column master keys in Key Vault
☑ Secrets stored in Key Vault (no hardcoded)
☑ Connection strings secured
☑ Backup encryption enabled
☑ Data retention policies defined

Application Security
───────────────────
☑ Input validation on all endpoints
☑ Output encoding
☑ Parameterized queries (no SQL injection risk)
☑ CSRF protection enabled
☑ CORS policy restrictive
☑ Rate limiting configured
☑ Anti-forgery tokens
☑ Security headers configured:
  ☑ Strict-Transport-Security
  ☑ Content-Security-Policy
  ☑ X-Frame-Options: DENY
  ☑ X-Content-Type-Options: nosniff
  ☑ Referrer-Policy: no-referrer

Network Security
───────────────
☑ Azure Front Door WAF configured
☑ DDoS Protection enabled
☑ Private endpoints for database
☑ VNet integration
☑ IP allowlisting (if applicable)
☑ Firewall rules minimized

Monitoring & Logging
───────────────────
☑ Application Insights configured
☑ Azure Monitor alerts set up
☑ Security audit logging enabled
☑ Failed login attempts tracked
☑ Anomaly detection enabled
☑ Log retention 90+ days
☑ No PII in logs
☑ SIEM integration configured

Compliance
─────────
☑ Regular security scans scheduled
☑ Vulnerability assessments
☑ Penetration testing completed
☑ Data classification documented
☑ Privacy impact assessment
☑ Incident response plan
☑ Disaster recovery plan tested
☑ Compliance training for team
```

---

## Document Summary

This comprehensive architecture documentation provides:

**Diagrams**: 30+ detailed ASCII diagrams covering all architectural aspects
**Sections**: 9 major sections with complete technical specifications
**Code Examples**: 20+ implementation examples
**Total Size**: 80KB+ of detailed technical content
**Page Count**: 75+ pages (estimated in print format)

The architecture follows industry best practices:
- Clean Architecture with DDD
- CQRS pattern with MediatR
- Comprehensive security layers
- Azure cloud-native design
- Scalable and maintainable structure

---

**Document Version**: 1.0
**Last Updated**: November 21, 2025
**Status**: Complete
**Next Review**: Upon Phase 1 implementation start

---

**END OF ARCHITECTURE_DIAGRAM.MD**
