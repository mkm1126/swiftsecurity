# REST API Specification
## SWIFT Security Role Access Request System - ASP.NET Core Migration

**Document Version:** 1.0
**Last Updated:** November 21, 2025
**Document Type:** API Technical Specification
**Classification:** Technical Reference

---

## Table of Contents

1. [API Overview](#1-api-overview)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Common Patterns](#3-common-patterns)
4. [Requests API](#4-requests-api)
5. [Approvals API](#5-approvals-api)
6. [Role Selections API](#6-role-selections-api)
7. [MNIT API](#7-mnit-api)
8. [Reference Data API](#8-reference-data-api)
9. [Error Handling](#9-error-handling)
10. [API Testing](#10-api-testing)

---

## 1. API Overview

### 1.1 Base URL

```
Development:  https://localhost:5001/api
Test:         https://test.swift-security.mn.gov/api
Staging:      https://staging.swift-security.mn.gov/api
Production:   https://swift-security.mn.gov/api
```

### 1.2 API Versioning

The API uses URL path versioning:

```
/api/v1/requests
/api/v2/requests  (future version)
```

Current version: **v1** (default, can be omitted: `/api/requests`)

### 1.3 Content Types

**Request Headers:**
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer {jwt_token}
X-Correlation-ID: {unique-request-id}
```

**Response Content-Type:**
```
application/json
```

### 1.4 HTTP Status Codes

| Status Code | Meaning | Usage |
|------------|---------|-------|
| 200 OK | Success | GET, PUT successful |
| 201 Created | Resource created | POST successful |
| 204 No Content | Success, no body | DELETE successful |
| 400 Bad Request | Validation error | Invalid input data |
| 401 Unauthorized | Not authenticated | Missing/invalid token |
| 403 Forbidden | Not authorized | Insufficient permissions |
| 404 Not Found | Resource not found | Invalid ID |
| 409 Conflict | Business rule violation | Duplicate, state conflict |
| 422 Unprocessable Entity | Semantic error | Valid syntax, invalid business logic |
| 429 Too Many Requests | Rate limit exceeded | Too many requests |
| 500 Internal Server Error | Server error | Unexpected error |
| 503 Service Unavailable | Service down | Maintenance, overload |

### 1.5 Rate Limiting

```
Rate Limit: 100 requests per minute per user
            1000 requests per hour per user

Response Headers:
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700000000
```

### 1.6 Pagination

Standard pagination for list endpoints:

**Request Query Parameters:**
```
?page=1&pageSize=20&sortBy=createdAt&sortOrder=desc
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

## 2. Authentication & Authorization

### 2.1 Authentication Flow

**1. Obtain JWT Token (Azure AD):**

```http
POST https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id={client_id}
&redirect_uri={redirect_uri}
&code={authorization_code}
&code_verifier={code_verifier}
```

**Response:**
```json
{
  "token_type": "Bearer",
  "expires_in": 3600,
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "0.AXoA...",
  "id_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**2. Use Access Token:**

```http
GET /api/requests
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

### 2.2 Token Claims

JWT token includes:

```json
{
  "sub": "user-guid-123",
  "email": "john.doe@state.mn.us",
  "name": "John Doe",
  "roles": ["Submitter", "Supervisor"],
  "agency": "G02",
  "iat": 1700000000,
  "exp": 1700003600,
  "iss": "https://login.microsoftonline.com/.../v2.0",
  "aud": "api-client-id"
}
```

### 2.3 Authorization Policies

| Policy | Required Role(s) | Description |
|--------|-----------------|-------------|
| CanSubmitRequest | Submitter | Can create and submit requests |
| CanViewRequests | Submitter, Supervisor | Can view requests |
| CanApprove | Supervisor, SecurityAdmin, AccountingDirector, HRDirector, ELMDirector | Can approve requests |
| CanAccessMnit | MnitPersonnel | Can access MNIT processing pages |
| CanViewAllRequests | Administrator | Can view all requests system-wide |

---

## 3. Common Patterns

### 3.1 Standard Response Wrapper

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "employeeName": "John Doe"
  },
  "message": "Request created successfully",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "employeeName",
        "message": "Employee name is required"
      },
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "traceId": "00-4bf92f3577b34da6a3ce929d0e0e4736-00"
}
```

### 3.2 Filtering

**Query String Filters:**
```
GET /api/requests?status=Pending&agencyCode=G02&startDate=2025-01-01&endDate=2025-01-31
```

**Supported Operators:**
- Equals: `field=value`
- Contains: `field=*value*`
- Greater than: `field=>value`
- Less than: `field=<value`
- In: `field=value1,value2,value3`

### 3.3 Field Selection (Sparse Fieldsets)

```
GET /api/requests?fields=id,employeeName,status,createdAt
```

### 3.4 Expand/Include Related Data

```
GET /api/requests/123?include=roleSelection,approvals
```

---

## 4. Requests API

### 4.1 Create Request (Draft)

**Endpoint:** `POST /api/requests`

**Authorization:** `CanSubmitRequest` policy

**Request Body:**
```json
{
  "startDate": "2025-02-01",
  "employeeName": "John Doe",
  "employeeId": "12345",
  "isNonEmployee": false,
  "workLocation": "St Paul Office",
  "workPhone": "651-555-0100",
  "email": "john.doe@state.mn.us",
  "agencyName": "Minnesota Management and Budget",
  "agencyCode": "G02",
  "justification": "New employee needs access to accounting systems",
  "submitterName": "Jane Smith",
  "submitterEmail": "jane.smith@state.mn.us",
  "supervisorName": "Bob Johnson",
  "supervisorUsername": "bob.johnson@state.mn.us",
  "securityAdminName": "Alice Brown",
  "securityAdminUsername": "alice.brown@state.mn.us",
  "securityArea": "Accounting",
  "accountingDirector": "Mary Wilson",
  "accountingDirectorUsername": "mary.wilson@state.mn.us"
}
```

**Validation Rules:**
- `startDate`: Required, must be future date or today
- `employeeName`: Required, max 200 chars
- `employeeId`: Required if not non-employee, max 50 chars
- `email`: Required, valid email format
- `agencyCode`: Required, must exist in reference data
- `securityArea`: Required, one of: Accounting, HR_Payroll, ELM, EPM_DWH

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "Draft",
    "employeeName": "John Doe",
    "agencyCode": "G02",
    "createdAt": "2025-01-15T10:30:00Z",
    "createdBy": "jane.smith@state.mn.us"
  },
  "message": "Request created successfully",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### 4.2 Get Request by ID

**Endpoint:** `GET /api/requests/{id}`

**Authorization:** `CanViewRequests` policy + Row-Level Security

**Query Parameters:**
- `include` (optional): Comma-separated list of related entities to include
  - `roleSelection`: Include role selections
  - `approvals`: Include approval history
  - `all`: Include everything

**Example Request:**
```
GET /api/requests/123e4567-e89b-12d3-a456-426614174000?include=roleSelection,approvals
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "Pending",
    "startDate": "2025-02-01",
    "employeeName": "John Doe",
    "employeeId": "***45",
    "email": "john.doe@state.mn.us",
    "workPhone": "***-***-0100",
    "agencyName": "Minnesota Management and Budget",
    "agencyCode": "G02",
    "justification": "New employee needs access to accounting systems",
    "submitterName": "Jane Smith",
    "submitterEmail": "jane.smith@state.mn.us",
    "supervisorName": "Bob Johnson",
    "supervisorUsername": "bob.johnson@state.mn.us",
    "securityArea": "Accounting",
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:45:00Z",
    "roleSelection": {
      "id": "789e4567-e89b-12d3-a456-426614174000",
      "homeBusinessUnit": "G02-001",
      "voucherEntry": true,
      "apInquiryOnly": true,
      "matchOverride": false,
      "budgetJournalEntryOnline": true
    },
    "approvals": [
      {
        "id": "456e4567-e89b-12d3-a456-426614174000",
        "step": "Supervisor",
        "approverEmail": "bob.johnson@state.mn.us",
        "status": "Approved",
        "approvedAt": "2025-01-16T08:15:00Z",
        "comments": "Approved for accounting access",
        "signatureData": "data:image/png;base64,..."
      },
      {
        "id": "789e4567-e89b-12d3-a456-426614174000",
        "step": "SecurityAdmin",
        "approverEmail": "alice.brown@state.mn.us",
        "status": "Pending",
        "approvedAt": null,
        "comments": null,
        "signatureData": null
      }
    ]
  },
  "timestamp": "2025-01-17T14:22:00Z"
}
```

**Note:** Sensitive fields (EmployeeId, WorkPhone) are masked in responses unless user has specific permission.

### 4.3 Get Requests List

**Endpoint:** `GET /api/requests`

**Authorization:** `CanViewRequests` policy + Row-Level Security

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `pageSize` (optional, default: 20, max: 100): Items per page
- `status` (optional): Filter by status (Draft, Pending, Approved, Rejected, Completed)
- `agencyCode` (optional): Filter by agency
- `securityArea` (optional): Filter by security area
- `startDate` (optional): Filter by start date (from)
- `endDate` (optional): Filter by start date (to)
- `search` (optional): Full-text search on employee name, email
- `sortBy` (optional, default: createdAt): Field to sort by
- `sortOrder` (optional, default: desc): asc or desc

**Example Request:**
```
GET /api/requests?status=Pending&agencyCode=G02&page=1&pageSize=20&sortBy=createdAt&sortOrder=desc
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "employeeName": "John Doe",
      "email": "john.doe@state.mn.us",
      "agencyName": "Minnesota Management and Budget",
      "agencyCode": "G02",
      "status": "Pending",
      "securityArea": "Accounting",
      "startDate": "2025-02-01",
      "submitterName": "Jane Smith",
      "createdAt": "2025-01-15T10:30:00Z"
    },
    {
      "id": "456e4567-e89b-12d3-a456-426614174000",
      "employeeName": "Jane Williams",
      "email": "jane.williams@state.mn.us",
      "agencyName": "Department of Health",
      "agencyCode": "H01",
      "status": "Pending",
      "securityArea": "HR_Payroll",
      "startDate": "2025-02-05",
      "submitterName": "Mike Davis",
      "createdAt": "2025-01-14T15:20:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 45,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "timestamp": "2025-01-17T14:30:00Z"
}
```

### 4.4 Update Request (Draft Only)

**Endpoint:** `PUT /api/requests/{id}`

**Authorization:** `CanSubmitRequest` policy + Request must be in Draft status + User must be owner

**Request Body:** (Same as Create Request)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "Draft",
    "employeeName": "John Doe Updated",
    "updatedAt": "2025-01-15T11:00:00Z"
  },
  "message": "Request updated successfully",
  "timestamp": "2025-01-15T11:00:00Z"
}
```

**Error Response:** `409 Conflict` (if not Draft)
```json
{
  "success": false,
  "error": {
    "code": "REQUEST_NOT_EDITABLE",
    "message": "Request cannot be edited after submission",
    "details": []
  },
  "timestamp": "2025-01-15T11:00:00Z"
}
```

### 4.5 Delete Request (Draft Only)

**Endpoint:** `DELETE /api/requests/{id}`

**Authorization:** `CanSubmitRequest` policy + Request must be in Draft status + User must be owner

**Response:** `204 No Content`

### 4.6 Submit Request for Approval

**Endpoint:** `POST /api/requests/{id}/submit`

**Authorization:** `CanSubmitRequest` policy + Request must be in Draft status + User must be owner

**Request Body:** None

**Pre-submit Validation:**
- Request must have all required fields
- Role selection must be completed
- At least one role must be selected
- All approver information must be provided

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "Pending",
    "submittedAt": "2025-01-15T12:00:00Z",
    "nextApprover": {
      "step": "Supervisor",
      "email": "bob.johnson@state.mn.us",
      "name": "Bob Johnson"
    }
  },
  "message": "Request submitted successfully. Approval email sent to Bob Johnson.",
  "timestamp": "2025-01-15T12:00:00Z"
}
```

### 4.7 Get Request Statistics

**Endpoint:** `GET /api/requests/statistics`

**Authorization:** `CanViewAllRequests` policy

**Query Parameters:**
- `startDate` (optional): Start of date range
- `endDate` (optional): End of date range
- `agencyCode` (optional): Filter by agency

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "totalRequests": 1250,
    "byStatus": {
      "Draft": 45,
      "Pending": 123,
      "Approved": 982,
      "Rejected": 15,
      "Completed": 85
    },
    "bySecurityArea": {
      "Accounting": 650,
      "HR_Payroll": 350,
      "ELM": 150,
      "EPM_DWH": 100
    },
    "byAgency": [
      { "agencyCode": "G02", "agencyName": "MMB", "count": 250 },
      { "agencyCode": "H01", "agencyName": "Health", "count": 180 }
    ],
    "averageApprovalTime": "2.5 days",
    "dateRange": {
      "start": "2024-01-01",
      "end": "2025-01-17"
    }
  },
  "timestamp": "2025-01-17T15:00:00Z"
}
```

---

## 5. Approvals API

### 5.1 Get Pending Approvals for Current User

**Endpoint:** `GET /api/approvals/pending`

**Authorization:** `CanApprove` policy

**Query Parameters:**
- `page` (optional, default: 1)
- `pageSize` (optional, default: 20)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "456e4567-e89b-12d3-a456-426614174000",
      "requestId": "123e4567-e89b-12d3-a456-426614174000",
      "step": "Supervisor",
      "status": "Pending",
      "request": {
        "employeeName": "John Doe",
        "email": "john.doe@state.mn.us",
        "agencyName": "MMB",
        "securityArea": "Accounting",
        "startDate": "2025-02-01",
        "submittedAt": "2025-01-15T12:00:00Z"
      },
      "createdAt": "2025-01-15T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 5,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  },
  "timestamp": "2025-01-17T15:15:00Z"
}
```

### 5.2 Get Approval by ID

**Endpoint:** `GET /api/approvals/{id}`

**Authorization:** `CanApprove` policy + User must be the approver

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "456e4567-e89b-12d3-a456-426614174000",
    "requestId": "123e4567-e89b-12d3-a456-426614174000",
    "step": "Supervisor",
    "approverEmail": "bob.johnson@state.mn.us",
    "status": "Pending",
    "approvedAt": null,
    "comments": null,
    "signatureData": null,
    "request": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "employeeName": "John Doe",
      "email": "john.doe@state.mn.us",
      "agencyName": "Minnesota Management and Budget",
      "securityArea": "Accounting",
      "justification": "New employee needs access to accounting systems",
      "roleSelection": {
        "homeBusinessUnit": "G02-001",
        "voucherEntry": true,
        "apInquiryOnly": true
      }
    },
    "createdAt": "2025-01-15T12:00:00Z"
  },
  "timestamp": "2025-01-17T15:20:00Z"
}
```

### 5.3 Approve Request

**Endpoint:** `POST /api/approvals/{id}/approve`

**Authorization:** `CanApprove` policy + User must be the approver + Status must be Pending

**Request Body:**
```json
{
  "signatureData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA...",
  "comments": "Approved for accounting access"
}
```

**Validation Rules:**
- `signatureData`: Required, must be valid base64 image data, max 500KB
- `comments`: Optional, max 1000 chars

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "456e4567-e89b-12d3-a456-426614174000",
    "status": "Approved",
    "approvedAt": "2025-01-17T15:30:00Z",
    "nextApprover": {
      "step": "SecurityAdmin",
      "email": "alice.brown@state.mn.us",
      "name": "Alice Brown"
    }
  },
  "message": "Approval recorded successfully. Email sent to next approver.",
  "timestamp": "2025-01-17T15:30:00Z"
}
```

### 5.4 Reject Request

**Endpoint:** `POST /api/approvals/{id}/reject`

**Authorization:** `CanApprove` policy + User must be the approver + Status must be Pending

**Request Body:**
```json
{
  "signatureData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA...",
  "comments": "Insufficient justification provided. Please resubmit with more details.",
  "reason": "INSUFFICIENT_JUSTIFICATION"
}
```

**Validation Rules:**
- `signatureData`: Required
- `comments`: Required for rejection, min 20 chars, max 1000 chars
- `reason`: Required, one of: INSUFFICIENT_JUSTIFICATION, INCORRECT_INFORMATION, DUPLICATE_REQUEST, OTHER

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "456e4567-e89b-12d3-a456-426614174000",
    "status": "Rejected",
    "rejectedAt": "2025-01-17T15:35:00Z",
    "comments": "Insufficient justification provided. Please resubmit with more details.",
    "reason": "INSUFFICIENT_JUSTIFICATION"
  },
  "message": "Request rejected. Email notification sent to submitter.",
  "timestamp": "2025-01-17T15:35:00Z"
}
```

### 5.5 Get Approval History

**Endpoint:** `GET /api/approvals/history`

**Authorization:** `CanApprove` policy

**Query Parameters:**
- `page`, `pageSize`: Standard pagination
- `status`: Filter by status (Pending, Approved, Rejected)
- `startDate`, `endDate`: Date range

**Response:** `200 OK` (Same structure as pending approvals)

---

## 6. Role Selections API

### 6.1 Save Role Selection

**Endpoint:** `POST /api/requests/{requestId}/roles`

**Authorization:** `CanSubmitRequest` policy + Request must be in Draft status + User must be owner

**Request Body:**
```json
{
  "homeBusinessUnit": "G02-001",
  "otherBusinessUnits": ["G02-002", "G02-003"],

  "voucherEntry": true,
  "maintenanceVoucherBuildErrors": false,
  "matchOverride": true,
  "apInquiryOnly": false,
  "apWorkflowApprover": true,
  "apWorkflowRouteControls": [
    {
      "routeControlId": "RC001",
      "description": "Budget approval for amounts > $5000"
    }
  ],
  "voucherApprover1": "Level1",
  "voucherApprover2": null,
  "voucherApprover3": null,

  "budgetJournalEntryOnline": true,
  "budgetInquiryOnly": false,

  "hrInquiryAgency": false,
  "payrollProcessor": false,

  "standardReportsViewer": true,
  "courseAdministrator": false
}
```

**Note:** 100+ role fields available. Only include fields that are `true` or have values.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "789e4567-e89b-12d3-a456-426614174000",
    "requestId": "123e4567-e89b-12d3-a456-426614174000",
    "homeBusinessUnit": "G02-001",
    "selectedRolesCount": 8,
    "createdAt": "2025-01-15T10:45:00Z",
    "updatedAt": "2025-01-15T10:45:00Z"
  },
  "message": "Role selection saved successfully",
  "timestamp": "2025-01-15T10:45:00Z"
}
```

### 6.2 Get Role Selection

**Endpoint:** `GET /api/requests/{requestId}/roles`

**Authorization:** `CanViewRequests` policy

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "789e4567-e89b-12d3-a456-426614174000",
    "requestId": "123e4567-e89b-12d3-a456-426614174000",
    "homeBusinessUnit": "G02-001",
    "otherBusinessUnits": ["G02-002", "G02-003"],
    "selectedRoles": {
      "accountsPayable": {
        "voucherEntry": true,
        "matchOverride": true,
        "apWorkflowApprover": true,
        "apWorkflowRouteControls": [...]
      },
      "budgets": {
        "budgetJournalEntryOnline": true
      },
      "epm": {
        "standardReportsViewer": true
      }
    },
    "selectedRolesCount": 8,
    "createdAt": "2025-01-15T10:45:00Z",
    "updatedAt": "2025-01-15T10:45:00Z"
  },
  "timestamp": "2025-01-17T16:00:00Z"
}
```

### 6.3 Get Role Summary

**Endpoint:** `GET /api/requests/{requestId}/roles/summary`

**Authorization:** `CanViewRequests` policy

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "requestId": "123e4567-e89b-12d3-a456-426614174000",
    "homeBusinessUnit": "G02-001",
    "rolesByCategory": [
      {
        "category": "Accounts Payable",
        "roles": [
          { "name": "Voucher Entry", "flagKey": "voucherEntry", "roleCode": "AP001" },
          { "name": "Match Override", "flagKey": "matchOverride", "roleCode": "AP005" },
          { "name": "AP Workflow Approver", "flagKey": "apWorkflowApprover", "roleCode": "AP012" }
        ],
        "count": 3
      },
      {
        "category": "Budgets",
        "roles": [
          { "name": "Budget Journal Entry Online", "flagKey": "budgetJournalEntryOnline", "roleCode": "BU020" }
        ],
        "count": 1
      },
      {
        "category": "EPM",
        "roles": [
          { "name": "Standard Reports Viewer", "flagKey": "standardReportsViewer", "roleCode": "EPM001" }
        ],
        "count": 1
      }
    ],
    "totalRolesSelected": 5
  },
  "timestamp": "2025-01-17T16:05:00Z"
}
```

---

## 7. MNIT API

### 7.1 Get MNIT Pending Requests

**Endpoint:** `GET /api/mnit/requests`

**Authorization:** `CanAccessMnit` policy

**Query Parameters:**
- `page`, `pageSize`: Standard pagination
- `agencyCode` (optional): Filter by agency
- `securityArea` (optional): Filter by security area
- `sortBy`, `sortOrder`: Sorting

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "employeeName": "John Doe",
      "employeeId": "***45",
      "email": "john.doe@state.mn.us",
      "agencyName": "Minnesota Management and Budget",
      "agencyCode": "G02",
      "securityArea": "Accounting",
      "startDate": "2025-02-01",
      "status": "AwaitingMnitProcessing",
      "submittedAt": "2025-01-15T12:00:00Z",
      "allApprovalsCompletedAt": "2025-01-17T14:00:00Z",
      "rolesCount": 8
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 12,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  },
  "timestamp": "2025-01-17T16:10:00Z"
}
```

### 7.2 Get MNIT Request Details

**Endpoint:** `GET /api/mnit/requests/{id}`

**Authorization:** `CanAccessMnit` policy

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "request": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "employeeName": "John Doe",
      "employeeId": "***45",
      "email": "john.doe@state.mn.us",
      "workPhone": "***-***-0100",
      "agencyName": "Minnesota Management and Budget",
      "agencyCode": "G02",
      "homeBusinessUnit": "G02-001",
      "otherBusinessUnits": ["G02-002"],
      "securityArea": "Accounting",
      "startDate": "2025-02-01",
      "justification": "New employee needs access to accounting systems"
    },
    "rolesToProvision": [
      {
        "flagKey": "voucherEntry",
        "roleCode": "AP001",
        "roleName": "Voucher Entry",
        "formName": "Accounts Payable - Voucher Entry",
        "psName": "SWIFT_AP_VOUCHER_ENTRY",
        "description": "Allows entry of AP vouchers"
      },
      {
        "flagKey": "matchOverride",
        "roleCode": "AP005",
        "roleName": "Match Override",
        "formName": "Accounts Payable - Match Override",
        "psName": "SWIFT_AP_MATCH_OVERRIDE",
        "description": "Override matching requirements"
      },
      {
        "flagKey": "apWorkflowApprover",
        "roleCode": "AP012",
        "roleName": "AP Workflow Approver",
        "formName": "Accounts Payable - Workflow Approver",
        "psName": "SWIFT_AP_WORKFLOW_APPROVER",
        "description": "Approve AP workflow items",
        "routeControls": [
          {
            "routeControlId": "RC001",
            "description": "Budget approval for amounts > $5000"
          }
        ]
      },
      {
        "flagKey": "budgetJournalEntryOnline",
        "roleCode": "BU020",
        "roleName": "Budget Journal Entry Online",
        "formName": "Budgets - Journal Entry Online",
        "psName": "SWIFT_BU_JOURNAL_ENTRY",
        "description": "Enter budget journals online"
      }
    ],
    "approvalHistory": [
      {
        "step": "Supervisor",
        "approverName": "Bob Johnson",
        "approverEmail": "bob.johnson@state.mn.us",
        "status": "Approved",
        "approvedAt": "2025-01-16T08:15:00Z",
        "comments": "Approved for accounting access"
      },
      {
        "step": "SecurityAdmin",
        "approverName": "Alice Brown",
        "approverEmail": "alice.brown@state.mn.us",
        "status": "Approved",
        "approvedAt": "2025-01-16T14:30:00Z",
        "comments": "Security clearance verified"
      },
      {
        "step": "AccountingDirector",
        "approverName": "Mary Wilson",
        "approverEmail": "mary.wilson@state.mn.us",
        "status": "Approved",
        "approvedAt": "2025-01-17T10:45:00Z",
        "comments": "Director approval granted"
      }
    ]
  },
  "timestamp": "2025-01-17T16:15:00Z"
}
```

### 7.3 Complete MNIT Processing

**Endpoint:** `POST /api/mnit/requests/{id}/complete`

**Authorization:** `CanAccessMnit` policy

**Request Body:**
```json
{
  "completionNotes": "All roles provisioned successfully in SWIFT system. User can access systems starting 2025-02-01.",
  "provisionedRoles": [
    "AP001",
    "AP005",
    "AP012",
    "BU020"
  ]
}
```

**Validation Rules:**
- `completionNotes`: Required, min 20 chars, max 2000 chars
- `provisionedRoles`: Optional, array of role codes that were actually provisioned

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "Completed",
    "completedAt": "2025-01-17T16:20:00Z",
    "completedBy": "mnit.admin@state.mn.us",
    "completionNotes": "All roles provisioned successfully in SWIFT system."
  },
  "message": "Request marked as complete. Notification emails sent.",
  "timestamp": "2025-01-17T16:20:00Z"
}
```

### 7.4 Export MNIT Data

**Endpoint:** `GET /api/mnit/export`

**Authorization:** `CanAccessMnit` policy

**Query Parameters:**
- `format`: csv or xlsx
- `startDate`, `endDate`: Date range filter

**Response:** `200 OK`
```
Content-Type: text/csv
Content-Disposition: attachment; filename="mnit_export_20250117.csv"

RequestID,EmployeeName,EmployeeID,Email,Agency,BusinessUnit,RoleCode,RoleName,StartDate,CompletedDate
123e4567...,John Doe,***45,john.doe@state.mn.us,MMB,G02-001,AP001,Voucher Entry,2025-02-01,2025-01-17
123e4567...,John Doe,***45,john.doe@state.mn.us,MMB,G02-001,AP005,Match Override,2025-02-01,2025-01-17
```

---

## 8. Reference Data API

### 8.1 Get Role Catalog

**Endpoint:** `GET /api/reference/roles`

**Authorization:** Public (no authentication required)

**Query Parameters:**
- `domain` (optional): Filter by domain (AccountsPayable, AccountsReceivable, Budgets, etc.)
- `search` (optional): Search role name or description
- `includeInactive` (optional, default: false): Include inactive roles

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "role-001",
      "flagKey": "voucherEntry",
      "roleCode": "AP001",
      "name": "Voucher Entry",
      "formName": "Accounts Payable - Voucher Entry",
      "psName": "SWIFT_AP_VOUCHER_ENTRY",
      "description": "Allows entry of accounts payable vouchers in the SWIFT system",
      "domain": "AccountsPayable",
      "requiresRouteControls": false,
      "displayOrder": 1,
      "isActive": true
    },
    {
      "id": "role-002",
      "flagKey": "apWorkflowApprover",
      "roleCode": "AP012",
      "name": "AP Workflow Approver",
      "formName": "Accounts Payable - Workflow Approver",
      "psName": "SWIFT_AP_WORKFLOW_APPROVER",
      "description": "Approve accounts payable workflow items based on route controls",
      "domain": "AccountsPayable",
      "requiresRouteControls": true,
      "controlSpec": "Select budget ranges or dollar amounts",
      "displayOrder": 12,
      "isActive": true
    }
  ],
  "timestamp": "2025-01-17T16:30:00Z"
}
```

### 8.2 Get Business Units

**Endpoint:** `GET /api/reference/business-units`

**Authorization:** Public (no authentication required)

**Query Parameters:**
- `agencyCode` (optional): Filter by agency
- `search` (optional): Search by name or code

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "bu-001",
      "code": "G02-001",
      "name": "Minnesota Management and Budget - Central Office",
      "agencyCode": "G02",
      "agencyName": "Minnesota Management and Budget",
      "isActive": true
    },
    {
      "id": "bu-002",
      "code": "G02-002",
      "name": "Minnesota Management and Budget - Regional Office",
      "agencyCode": "G02",
      "agencyName": "Minnesota Management and Budget",
      "isActive": true
    }
  ],
  "timestamp": "2025-01-17T16:35:00Z"
}
```

### 8.3 Get Agencies

**Endpoint:** `GET /api/reference/agencies`

**Authorization:** Public (no authentication required)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "code": "G02",
      "name": "Minnesota Management and Budget",
      "abbreviation": "MMB",
      "isActive": true
    },
    {
      "code": "H01",
      "name": "Minnesota Department of Health",
      "abbreviation": "MDH",
      "isActive": true
    }
  ],
  "timestamp": "2025-01-17T16:40:00Z"
}
```

### 8.4 Get Security Areas

**Endpoint:** `GET /api/reference/security-areas`

**Authorization:** Public (no authentication required)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "code": "Accounting",
      "name": "Accounting & Procurement",
      "description": "Accounts Payable, Accounts Receivable, Budgets, Purchasing",
      "requiredApprovers": ["Supervisor", "SecurityAdmin", "AccountingDirector"]
    },
    {
      "code": "HR_Payroll",
      "name": "HR & Payroll",
      "description": "Human Resources and Payroll functions",
      "requiredApprovers": ["Supervisor", "SecurityAdmin", "HRDirector"]
    },
    {
      "code": "ELM",
      "name": "Enterprise Learning Management",
      "description": "Training and learning management",
      "requiredApprovers": ["Supervisor", "SecurityAdmin", "ELMKeyAdmin", "ELMDirector"]
    },
    {
      "code": "EPM_DWH",
      "name": "EPM & Data Warehouse",
      "description": "Enterprise Performance Management and Data Warehouse",
      "requiredApprovers": ["Supervisor", "SecurityAdmin"]
    }
  ],
  "timestamp": "2025-01-17T16:45:00Z"
}
```

---

## 9. Error Handling

### 9.1 Standard Error Response

All errors follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [
      {
        "field": "fieldName",
        "message": "Field-specific error message"
      }
    ],
    "traceId": "00-4bf92f3577b34da6a3ce929d0e0e4736-00"
  },
  "timestamp": "2025-01-17T17:00:00Z"
}
```

### 9.2 Error Codes

| Error Code | HTTP Status | Description |
|-----------|-------------|-------------|
| VALIDATION_ERROR | 400 | Input validation failed |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| REQUEST_NOT_EDITABLE | 409 | Request cannot be edited in current state |
| DUPLICATE_REQUEST | 409 | Duplicate request exists |
| INVALID_STATE_TRANSITION | 422 | Invalid workflow state transition |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_SERVER_ERROR | 500 | Unexpected server error |
| SERVICE_UNAVAILABLE | 503 | Service temporarily unavailable |

### 9.3 Validation Error Example

**Request:**
```http
POST /api/requests
{
  "employeeName": "",
  "email": "invalid-email",
  "startDate": "2020-01-01"
}
```

**Response:** `400 Bad Request`
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed for one or more fields",
    "details": [
      {
        "field": "employeeName",
        "message": "Employee name is required"
      },
      {
        "field": "email",
        "message": "Invalid email format"
      },
      {
        "field": "startDate",
        "message": "Start date must be today or in the future"
      }
    ],
    "traceId": "00-4bf92f3577b34da6a3ce929d0e0e4736-00"
  },
  "timestamp": "2025-01-17T17:05:00Z"
}
```

### 9.4 Authorization Error Example

**Response:** `403 Forbidden`
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this resource",
    "details": [],
    "traceId": "00-4bf92f3577b34da6a3ce929d0e0e4736-00"
  },
  "timestamp": "2025-01-17T17:10:00Z"
}
```

---

## 10. API Testing

### 10.1 Postman Collection

A comprehensive Postman collection is available with:
- All API endpoints
- Example requests
- Environment variables for dev/test/staging/prod
- Pre-request scripts for authentication
- Test assertions

**Import URL:**
```
https://github.com/mn-swift-security/api-docs/postman-collection.json
```

### 10.2 Sample cURL Commands

**Create Request:**
```bash
curl -X POST https://api.swift-security.mn.gov/api/requests \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2025-02-01",
    "employeeName": "John Doe",
    "email": "john.doe@state.mn.us",
    "agencyCode": "G02",
    "securityArea": "Accounting"
  }'
```

**Get Pending Approvals:**
```bash
curl -X GET https://api.swift-security.mn.gov/api/approvals/pending \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Approve Request:**
```bash
curl -X POST https://api.swift-security.mn.gov/api/approvals/456e4567-e89b-12d3-a456-426614174000/approve \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "signatureData": "data:image/png;base64,...",
    "comments": "Approved for accounting access"
  }'
```

### 10.3 OpenAPI/Swagger Specification

Interactive API documentation available at:

```
Development:  https://localhost:5001/swagger
Test:         https://test.swift-security.mn.gov/swagger
Staging:      https://staging.swift-security.mn.gov/swagger
Production:   https://swift-security.mn.gov/api-docs
```

---

## Document Summary

This API specification provides:

**Endpoints**: 25+ REST API endpoints with complete specifications
**Examples**: 50+ request/response examples
**Error Handling**: Comprehensive error codes and responses
**Security**: Complete authentication and authorization specifications
**Testing**: Postman collection and cURL examples

The API follows REST best practices:
- Resource-based URLs
- Standard HTTP methods and status codes
- Consistent response format
- Comprehensive error handling
- Proper authentication and authorization
- Pagination, filtering, and sorting support

---

**Document Version:** 1.0
**Last Updated:** November 21, 2025
**Status:** Complete
**API Version:** v1

---

**END OF API_SPECIFICATION.MD**
