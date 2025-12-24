# 📚 FINANCE21 - COMPLETE DOCUMENTATION

**Version:** 0.1.0  
**Last Updated:** December 14, 2025  
**Status:** Production Ready

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Getting Started](#3-getting-started)
4. [Development Guide](#4-development-guide)
5. [Backend (API) Documentation](#5-backend-api-documentation)
6. [Frontend (Web) Documentation](#6-frontend-web-documentation)
7. [E-IMZO Integration](#7-eimzo-integration)
8. [Security & Multi-Tenancy](#8-security--multi-tenancy)
9. [Deployment](#9-deployment)
10. [Testing](#10-testing)
11. [Troubleshooting](#11-troubleshooting)
12. [Maintenance](#12-maintenance)

---

## 1. PROJECT OVERVIEW

### 1.1 What is Finance21?

Finance21 is a modern **multi-tenant SaaS accounting platform** built specifically for Uzbekistan businesses. It provides comprehensive financial management, document handling, inventory tracking, and workflow automation.

### 1.2 Key Features

- ✅ **Multi-Company Support** - One user can manage multiple companies
- ✅ **E-IMZO Authentication** - Uzbekistan's official digital signature integration
- ✅ **Role-Based Access Control** - DIRECTOR, ACCOUNTANT, VIEWER roles
- ✅ **Company Context Enforcement** - Secure multi-tenant data isolation
- ✅ **Audit Logging** - Complete trail of all user actions
- ✅ **Modern UI/UX** - Clean, responsive design with Tailwind CSS

### 1.3 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js (App Router) | 14.2.14 |
| **Backend** | NestJS | 11.x |
| **Database** | PostgreSQL | 15 |
| **ORM** | Prisma | 5.18.0 |
| **Package Manager** | pnpm | 10.25.0 |
| **Auth** | JWT + E-IMZO | - |
| **Styling** | Tailwind CSS | 3.4.x |
| **Icons** | Lucide React | 0.561.0 |
| **Animations** | Framer Motion | 12.23.26 |

### 1.4 Project Structure

```
finance21/
├── apps/
│   ├── web/               # Next.js frontend (port 3000)
│   ├── api/               # NestJS backend (port 3001)
│   └── admin/             # Admin panel (future)
├── packages/
│   ├── ui/                # Shared React components
│   ├── config/            # Shared configuration
│   └── tsconfig/          # Shared TypeScript configs
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
├── infra/
│   ├── docker/            # Docker Compose files
│   ├── nginx/             # Nginx configs (legacy)
│   └── scripts/           # Deployment scripts
├── pnpm-workspace.yaml    # Monorepo configuration
├── package.json           # Root dependencies
└── DOCUMENTATION.md       # This file
```

---

## 2. ARCHITECTURE

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   Next.js Frontend (port 3000)                       │   │
│  │   - App Router                                       │   │
│  │   - Auth Context (JWT + activeCompanyId)            │   │
│  │   - API Client (axios with auto-headers)            │   │
│  └──────────────┬───────────────────────────────────────┘   │
└─────────────────┼───────────────────────────────────────────┘
                  │ HTTP/HTTPS
                  │ Headers: Authorization, X-Company-Id
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                   System Nginx (port 80/443)                 │
│   - Reverse proxy to Next.js                                │
│   - SSL/TLS termination                                      │
│   - Static file serving                                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │
┌─────────────────▼───────────────────────────────────────────┐
│              NestJS Backend (port 3001)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   Auth Layer                                         │   │
│  │   - JWT Validation (JwtAuthGuard)                   │   │
│  │   - E-IMZO PKCS7 Verification                       │   │
│  └──────────────┬───────────────────────────────────────┘   │
│  ┌──────────────▼───────────────────────────────────────┐   │
│  │   Company Context Middleware                        │   │
│  │   - Validates X-Company-Id header                   │   │
│  │   - Checks user belongs to company                  │   │
│  │   - Verifies company status (ACTIVE/BLOCKED)        │   │
│  └──────────────┬───────────────────────────────────────┘   │
│  ┌──────────────▼───────────────────────────────────────┐   │
│  │   RBAC Layer (RolesGuard)                           │   │
│  │   - Enforces role requirements                      │   │
│  │   - DIRECTOR / ACCOUNTANT / VIEWER                  │   │
│  └──────────────┬───────────────────────────────────────┘   │
│  ┌──────────────▼───────────────────────────────────────┐   │
│  │   Business Logic (Services)                         │   │
│  │   - AuthService, CompanyService, EimzoService       │   │
│  └──────────────┬───────────────────────────────────────┘   │
│  ┌──────────────▼───────────────────────────────────────┐   │
│  │   Prisma ORM                                        │   │
│  │   - Type-safe database queries                      │   │
│  │   - Migration management                            │   │
│  └──────────────┬───────────────────────────────────────┘   │
└─────────────────┼───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│           PostgreSQL Database (port 5433)                    │
│   - Multi-tenant data (isolated by company)                 │
│   - User, Company, CompanyUser, AuditLog                    │
│   - Certificate storage (public keys only)                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│         E-IMZO (localhost:64443) - Client-Side Only          │
│   - Certificate management                                   │
│   - Private key storage                                      │
│   - Digital signature creation                               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Multi-Tenant Data Flow

```
1. User Login
   → POST /auth/login { login, password }
   → Backend verifies credentials
   → Returns { accessToken, user, companies[] }
   → Frontend stores token + companies

2. Company Selection
   → User selects company from list
   → Frontend stores activeCompanyId in localStorage
   → All subsequent requests include X-Company-Id header

3. Protected Request
   → Frontend: axios.get('/endpoint', { headers: { X-Company-Id } })
   → Backend: JwtAuthGuard validates token
   → Backend: CompanyContextMiddleware validates:
      - Company exists
      - Company is ACTIVE
      - User belongs to company
      - Attaches req.company and req.companyUser
   → Backend: RolesGuard checks role requirements
   → Backend: Business logic executes with company context
   → Returns company-specific data

4. Company Switch
   → User clicks different company
   → Frontend updates activeCompanyId
   → All new requests use new X-Company-Id
   → Backend validates new company access
```

### 2.3 Security Layers

| Layer | Purpose | Implementation |
|-------|---------|----------------|
| **HTTPS** | Transport security | System Nginx with Let's Encrypt |
| **JWT** | User authentication | JwtAuthGuard + passport-jwt |
| **X-Company-Id** | Company context | CompanyContextMiddleware |
| **RBAC** | Permission control | RolesGuard + @Roles decorator |
| **Audit Log** | Action tracking | AuditLog model + service hooks |
| **Input Validation** | Data integrity | class-validator + DTOs |
| **SQL Injection** | Query safety | Prisma ORM (parameterized queries) |
| **CORS** | Cross-origin control | NestJS CORS configuration |

---

## 3. GETTING STARTED

### 3.1 Prerequisites

**Required:**
- Node.js 18+
- pnpm 10.25.0+
- PostgreSQL 15+
- Docker & Docker Compose (recommended)

**Optional:**
- E-IMZO v5 (for testing E-IMZO auth)

### 3.2 Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd finance21

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 4. Start PostgreSQL
cd infra/docker
docker compose up -d postgres
cd ../..

# 5. Set up database
pnpm prisma:generate
pnpm prisma db push

# 6. Start development servers
# Terminal 1: API
pnpm dev:api

# Terminal 2: Web
pnpm dev:web

# 7. Open browser
open http://localhost:3000
```

### 3.3 Environment Variables

**Root `.env` file:**
```env
# Database
DATABASE_URL="postgresql://finance21:finance21@localhost:5433/finance21?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# API URL
API_URL="http://localhost:3001"
```

**Frontend `.env.local` file:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3.4 Quick Start Commands

```bash
# Development
pnpm dev:web         # Start Next.js (port 3000)
pnpm dev:api         # Start NestJS (port 3001)

# Database
pnpm prisma:generate # Generate Prisma client
pnpm prisma:migrate  # Run migrations
pnpm prisma:studio   # Open Prisma GUI (port 5555)

# Docker
cd infra/docker
docker compose up -d              # Start all services
docker compose down               # Stop all services
docker compose logs -f web        # View web logs
docker compose restart postgres   # Restart PostgreSQL
```

---

## 4. DEVELOPMENT GUIDE

### 4.1 Monorepo Structure

Finance21 uses **pnpm workspaces** for monorepo management.

**Workspace configuration (`pnpm-workspace.yaml`):**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**Running commands in specific workspaces:**
```bash
# Install package in specific app
pnpm add axios --filter @finance21/web

# Run script in specific app
pnpm --filter @finance21/api dev

# Build specific app
pnpm --filter @finance21/web build
```

### 4.2 Shared UI Components

**Location:** `packages/ui/src/`

**Available components:**
- `Button` - Multi-variant button with loading states
- `Input` - Styled input with validation states
- `Alert` - Toast notification system
- `AlertProvider` - Context provider for alerts

**Usage in apps:**
```typescript
import { Button, Input, useAlert } from "@finance21/ui";

function MyComponent() {
  const { showSuccess, showError } = useAlert();
  
  return (
    <div>
      <Input label="Name" placeholder="Enter name" />
      <Button onClick={() => showSuccess("Success!")}>
        Submit
      </Button>
    </div>
  );
}
```

### 4.3 Database Workflow

**Schema changes:**
```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
pnpm prisma migrate dev --name describe_change

# 3. Prisma client auto-regenerates
# 4. Commit both schema.prisma and migration files
```

**Reset database (development only):**
```bash
pnpm prisma migrate reset
# This will:
# - Drop database
# - Recreate database
# - Run all migrations
# - Run seed (if exists)
```

### 4.4 Code Style

**TypeScript:**
- Strict mode enabled
- ESModuleInterop enabled
- Explicit return types preferred

**Naming conventions:**
- Components: PascalCase (`LoginCard.tsx`)
- Hooks: camelCase with 'use' prefix (`useAuth.tsx`)
- Files: kebab-case for non-components (`api-client.ts`)
- CSS classes: Tailwind utility classes

**File organization:**
```
apps/web/src/
├── app/              # Next.js App Router pages
├── components/       # React components
├── contexts/         # React contexts
├── lib/              # Utility functions
└── types/            # TypeScript type definitions
```

---

## 5. BACKEND (API) DOCUMENTATION

### 5.1 API Structure

```
apps/api/src/
├── auth/                    # Authentication module
│   ├── auth.controller.ts   # Login, me endpoints
│   ├── auth.service.ts      # Auth business logic
│   ├── jwt.guard.ts         # JWT validation guard
│   ├── jwt.strategy.ts      # Passport JWT strategy
│   └── dto/                 # Data transfer objects
├── company/                 # Company management
│   ├── company.controller.ts
│   ├── company.service.ts
│   └── dto/
├── eimzo/                   # E-IMZO integration
│   ├── eimzo.controller.ts  # Challenge, login endpoints
│   ├── eimzo.service.ts     # PKCS7 verification
│   └── dto/
├── common/                  # Shared utilities
│   ├── decorators/          # Custom decorators
│   ├── guards/              # Custom guards
│   └── middleware/          # Custom middleware
├── prisma/                  # Prisma service
│   └── prisma.service.ts
├── utils/                   # Helper functions
│   └── pkcs7-verifier.ts    # PKCS7 signature verification
├── app.module.ts            # Root module
└── main.ts                  # Application entry point
```

### 5.2 Authentication Endpoints

#### POST /auth/login
**Public endpoint** - User login with credentials

**Request:**
```json
{
  "login": "director_123456789",
  "password": "generated_password"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "clx123...",
    "login": "director_123456789"
  },
  "companies": [
    {
      "id": "clx456...",
      "name": "FINANCE21 XUSUSIY KORXONA",
      "stir": "123456789",
      "role": "DIRECTOR"
    }
  ]
}
```

#### GET /auth/me
**Protected endpoint** - Get current user info

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "user": {
    "id": "clx123...",
    "login": "director_123456789",
    "certificateCN": "JOHN DOE",
    "certificateTIN": "12345678901234",
    "certificateOrg": "MY COMPANY LLC",
    "certificateValidFrom": "2024-01-01T00:00:00Z",
    "certificateValidTo": "2026-01-01T00:00:00Z"
  },
  "companies": [...]
}
```

### 5.3 Company Endpoints

#### POST /company/register-by-key
**Public endpoint** - Register new company (generates credentials)

**Request:**
```json
{
  "key": "unique-company-key-123"
}
```

**Response:**
```json
{
  "company": {
    "id": "clx789...",
    "name": "FINANCE21 XUSUSIY KORXONA",
    "stir": "123456789",
    "status": "ACTIVE"
  },
  "directorLogin": "director_123456789",
  "passwordGenerated": true
}
```

**Note:** Check server console for generated password.

#### POST /company/add-accountant
**Protected endpoint** - Add accountant to company (DIRECTOR only)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
X-Company-Id: <COMPANY_ID>
```

**Request:**
```json
{
  "login": "accountant1"
}
```

**Response:**
```json
{
  "companyId": "clx456...",
  "accountantLogin": "accountant1",
  "passwordGenerated": true
}
```

### 5.4 E-IMZO Endpoints

#### POST /auth/eimzo/challenge
**Public endpoint** - Get challenge for E-IMZO signing

**Request:** None

**Response:**
```json
{
  "challenge": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Note:** Challenge expires in 5 minutes.

#### POST /auth/eimzo/login
**Public endpoint** - Authenticate with E-IMZO signature

**Request:**
```json
{
  "pkcs7": "MIIGFgYJKoZIhvcNAQcCoIIGBzCC...",
  "challenge": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:** Same as `/auth/login`

**Process:**
1. Verify PKCS7 signature against challenge
2. Extract certificate info (STIR, CN, org)
3. Find or create user by certificate serial
4. Auto-create company if new user
5. Assign DIRECTOR role
6. Return JWT token

### 5.5 Middleware & Guards

#### JwtAuthGuard
- Validates JWT token from `Authorization` header
- Attaches `req.user` with `{ userId, login }`
- Returns 401 if token invalid/missing

#### CompanyContextMiddleware
- Applied to protected routes
- Reads `X-Company-Id` header
- Validates:
  - Company exists
  - Company status is ACTIVE
  - User belongs to company
- Attaches `req.company` and `req.companyUser`
- Returns 400/403 if validation fails

#### RolesGuard
- Checks user role from `req.companyUser.role`
- Compares against required roles from `@Roles()` decorator
- Returns 403 if insufficient permissions

### 5.6 Audit Logging

**Automatic audit logs for:**
- USER_LOGIN - Every successful login
- COMPANY_CREATED - Company registration
- USER_INVITED - Adding accountant
- EIMZO_LOGIN - E-IMZO authentication
- SETTINGS_UPDATED - Company settings changes

**AuditLog model:**
```typescript
{
  id: string
  action: AuditAction
  userId: string
  companyId: string | null
  meta: Json | null
  createdAt: DateTime
}
```

**Query audit logs:**
```bash
# Via Prisma Studio
pnpm prisma:studio
# Navigate to AuditLog table

# Or via SQL
psql -U finance21 -d finance21 -h localhost -p 5433
SELECT * FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT 10;
```

---

## 6. FRONTEND (WEB) DOCUMENTATION

### 6.1 Frontend Structure

```
apps/web/src/
├── app/                      # Next.js App Router
│   ├── app/                  # Protected app routes
│   │   ├── dashboard/        # Dashboard page
│   │   ├── settings/         # Settings pages
│   │   └── layout.tsx        # App layout with RouteGuard
│   ├── login/                # Login page
│   ├── select-company/       # Company selection
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Landing page
├── components/               # React components
│   ├── layout/               # Layout components
│   │   ├── Sidebar.tsx       # Left navigation
│   │   ├── TopBar.tsx        # Top bar with company switcher
│   │   ├── CompanySwitcher.tsx
│   │   └── AppLayout.tsx     # Main app layout wrapper
│   ├── LoginCard.tsx         # Login form
│   ├── EImzoModal.tsx        # E-IMZO not installed modal
│   ├── CertificateSelectionModal.tsx
│   ├── RouteGuard.tsx        # Auth route protection
│   ├── Navbar.tsx            # Public navbar
│   └── ClientProviders.tsx   # Context providers wrapper
├── contexts/                 # React contexts
│   └── AuthContext.tsx       # Auth state management
├── lib/                      # Utilities
│   ├── api-client.ts         # Axios instance with interceptors
│   └── eimzo.ts              # E-IMZO API wrapper
├── types/                    # TypeScript types
│   └── eimzo.d.ts            # E-IMZO type definitions
└── styles/
    └── globals.css           # Global CSS + Tailwind
```

### 6.2 Auth Context

**Provider:** Wraps entire app in `ClientProviders.tsx`

**State:**
```typescript
{
  user: User | null
  companies: Company[]
  activeCompanyId: string | null
  activeCompany: Company | null
  isLoading: boolean
}
```

**Methods:**
```typescript
{
  login: (login: string, password: string) => Promise<void>
  logout: () => void
  setActiveCompany: (companyId: string) => void
  fetchUserData: () => Promise<void>
}
```

**Usage:**
```typescript
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { user, activeCompany, logout } = useAuth();
  
  if (!user) return <div>Please login</div>;
  
  return (
    <div>
      <p>Welcome {user.login}</p>
      <p>Company: {activeCompany?.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 6.3 API Client

**File:** `apps/web/src/lib/api-client.ts`

**Features:**
- Axios instance configured for backend
- Auto-attaches `Authorization` header
- Auto-attaches `X-Company-Id` header
- Handles 401 errors (auto-logout)

**Usage:**
```typescript
import apiClient from "@/lib/api-client";

// GET request
const response = await apiClient.get('/endpoint');

// POST request
const response = await apiClient.post('/endpoint', {
  data: 'value'
});

// Headers automatically included:
// Authorization: Bearer <token>
// X-Company-Id: <activeCompanyId>
```

### 6.4 Route Guards

**File:** `apps/web/src/components/RouteGuard.tsx`

**Protection logic:**
1. Check if token exists in localStorage
2. If no token → redirect to `/login`
3. Fetch user data from `/auth/me`
4. Check if activeCompanyId exists
5. If no activeCompanyId → redirect to `/select-company`
6. Render children (protected content)

**Applied to:** `/app/*` routes via layout wrapper

**Bypass:** Public routes (`/`, `/login`, `/select-company`)

### 6.5 Key Pages

#### Landing Page (`/`)
- Public marketing page
- Navbar with login button
- Hero section
- Feature highlights
- Uzbek language

#### Login Page (`/login`)
- Email/password login form
- E-IMZO login button
- Calls `POST /auth/login` or `/auth/eimzo/login`
- Redirects based on company count:
  - 1 company → `/app/dashboard`
  - Multiple → `/select-company`

#### Company Selection (`/select-company`)
- Lists all user's companies
- Shows role for each
- On selection:
  - Saves `activeCompanyId`
  - Redirects to `/app/dashboard`

#### Dashboard (`/app/dashboard`)
- Protected by RouteGuard
- Shows financial overview cards
- Placeholder for future data visualization

#### Settings Pages (`/app/settings/*`)
- `/app/settings` - Settings tiles
- `/app/settings/profile` - User profile (shows E-IMZO cert if used)
- `/app/settings/company` - Company tax settings
- `/app/settings/telegram` - Telegram integration

### 6.6 UI Components (Shared)

**From `@finance21/ui` package:**

#### Button
```typescript
<Button 
  variant="primary" 
  color="blue" 
  size="md"
  isLoading={loading}
  leftIcon={<Icon />}
  onClick={handleClick}
>
  Click Me
</Button>
```

**Variants:** primary, secondary, danger, success, outline, ghost  
**Colors:** blue, indigo, green, red, yellow, purple, pink, gray  
**Sizes:** sm, md, lg

#### Input
```typescript
<Input
  label="Email"
  type="email"
  placeholder="you@example.com"
  variant="default"
  inputSize="md"
  leftIcon={<MailIcon />}
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

**Variants:** default, error, success  
**Sizes:** sm, md, lg

#### Alert System
```typescript
import { useAlert } from "@finance21/ui";

function MyComponent() {
  const { showSuccess, showError, showInfo, showWarning } = useAlert();
  
  const handleAction = async () => {
    try {
      await apiCall();
      showSuccess("Operation successful!");
    } catch (error) {
      showError("Operation failed!");
    }
  };
}
```

**Alert types:** success, error, warning, info  
**Features:** Auto-dismiss (2s default), progress bar, close button

---

## 7. SECURITY & MULTI-TENANCY

### 8.1 Multi-Tenant Architecture

Finance21 uses **row-level multi-tenancy**:
- Single database, single schema
- Data isolated by `companyId` foreign key
- Enforced at application level (not database triggers)

**Key principles:**
1. **Every protected route requires company context**
2. **Backend validates company access on every request**
3. **Frontend cannot bypass security (server enforces)**
4. **Users can only access companies they belong to**

### 8.2 Company Context Enforcement

**File:** `apps/api/src/common/middleware/company-context.middleware.ts`

**Applied to:** All protected routes except auth endpoints

**Validation steps:**
1. Read `X-Company-Id` header
2. Check header exists (400 if missing)
3. Find company in database
4. Check company status is ACTIVE (403 if BLOCKED)
5. Find CompanyUser linking user to company
6. Check membership exists (403 if not member)
7. Attach `req.company` and `req.companyUser`
8. Continue to next middleware/handler

**Result:** Every protected endpoint has guaranteed access to:
- `req.user` (from JWT)
- `req.company` (validated company)
- `req.companyUser` (validated membership with role)

### 8.3 Role-Based Access Control (RBAC)

**Roles:**
```typescript
enum CompanyUserRole {
  DIRECTOR   // Full access, can invite users
  ACCOUNTANT // Financial operations, no user management
  VIEWER     // Read-only access (future)
}
```

**Implementation:**
```typescript
// In controller
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(CompanyUserRole.DIRECTOR)
@Post('add-accountant')
addAccountant(@CurrentCompanyId() companyId: string, ...) {
  // Only DIRECTOR can execute this
}
```

**Guard logic:**
```typescript
// apps/api/src/common/guards/roles.guard.ts
canActivate(context: ExecutionContext): boolean {
  const requiredRoles = this.reflector.get<CompanyUserRole[]>('roles', ...);
  const request = context.switchToHttp().getRequest();
  const userRole = request.companyUser?.role;
  
  return requiredRoles.includes(userRole);
}
```

### 8.4 Security Best Practices

**Authentication:**
- ✅ JWT with 7-day expiration
- ✅ Bcrypt password hashing (10 rounds)
- ✅ E-IMZO challenge-response for passwordless auth
- ⚠️ TODO: Refresh token mechanism
- ⚠️ TODO: Password complexity requirements

**Authorization:**
- ✅ Company context validated on every request
- ✅ Role-based endpoint protection
- ✅ User-company membership verified
- ✅ Company status checked (ACTIVE/BLOCKED)

**Data Protection:**
- ✅ HTTPS enforced in production
- ✅ CORS configured for allowed origins
- ✅ SQL injection prevented (Prisma ORM)
- ✅ Input validation on all DTOs (class-validator)
- ✅ No sensitive data in logs

**Audit & Compliance:**
- ✅ All user actions logged (AuditLog)
- ✅ Login tracking (IP, timestamp)
- ✅ Company creation logged
- ✅ User invitation logged
- ⚠️ TODO: Log retention policy
- ⚠️ TODO: GDPR compliance tools

### 8.5 Attack Prevention

| Attack Vector | Prevention |
|--------------|------------|
| SQL Injection | Prisma ORM (parameterized queries) |
| XSS | React auto-escaping, CSP headers |
| CSRF | SameSite cookies, token validation |
| Session Hijacking | Short JWT expiry, secure storage |
| Replay Attacks | Challenge-response (E-IMZO) |
| Brute Force | Rate limiting (TODO) |
| Data Leaks | Company context enforcement |
| Privilege Escalation | Role guards, server-side checks |

---

## 8. DEPLOYMENT

### 9.1 Deployment Architecture

**Production setup:**
```
Internet
   ↓
System Nginx (port 80/443)
   ↓
Docker Network
   ├─ Next.js Container (port 3000)
   └─ PostgreSQL Container (port 5432)
```

**Note:** Backend API can run on same or separate server.

### 9.2 Prerequisites

**Server requirements:**
- Ubuntu 22.04 LTS
- 4 CPU cores
- 8GB RAM
- 50GB SSD
- Static IP or domain

**Software:**
- Docker 20+
- Docker Compose v2+
- Nginx 1.18+
- Certbot (for SSL)
- Git

### 9.3 Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# Install Nginx
sudo apt install -y nginx

# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Install Git
sudo apt install -y git

# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 9.4 Application Deployment

```bash
# 1. Clone repository
cd /opt
sudo git clone <repository-url> finance21
sudo chown -R $USER:$USER finance21
cd finance21

# 2. Configure environment
cp .env.example .env
nano .env
# Update DATABASE_URL, JWT_SECRET, etc.

# 3. Build and start containers
cd infra/docker
docker compose build
docker compose up -d

# 4. Apply database migrations
cd /opt/finance21
docker exec -it finance21_postgres psql -U finance21 -d finance21
# Run migrations manually or via Prisma in container

# 5. Configure Nginx
sudo nano /etc/nginx/sites-available/finance21
# Copy configuration from section 9.5

sudo ln -s /etc/nginx/sites-available/finance21 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 6. Get SSL certificate
sudo certbot --nginx -d finance21.uz -d www.finance21.uz

# 7. Verify deployment
curl https://finance21.uz
```

### 9.5 Nginx Configuration

**File:** `/etc/nginx/sites-available/finance21`

```nginx
# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name finance21.uz www.finance21.uz;
    return 301 https://$host$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name finance21.uz www.finance21.uz;

    # SSL Configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/finance21.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/finance21.uz/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Proxy to Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Optional: API on subdomain or path
    location /api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Logging
    access_log /var/log/nginx/finance21_access.log;
    error_log /var/log/nginx/finance21_error.log;
}
```

### 9.6 Docker Compose Configuration

**File:** `infra/docker/docker-compose.yml`

```yaml
services:
  web:
    build:
      context: ../../
      dockerfile: apps/web/Dockerfile
    container_name: finance21_web
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=${API_URL}
    restart: always
    networks:
      - finance21_net

  postgres:
    image: postgres:15-alpine
    container_name: finance21_postgres
    restart: always
    environment:
      POSTGRES_USER: finance21
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: finance21
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - finance21_net

networks:
  finance21_net:
    driver: bridge

volumes:
  postgres_data:
```

### 9.7 Deployment Script

**File:** `infra/scripts/deploy.sh`

```bash
#!/bin/bash
set -e

echo "🚀 Deploying Finance21..."

# Navigate to project root
cd /opt/finance21

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
# (Dependencies installed in Docker build)

# Build Docker images
echo "🐳 Building Docker images..."
cd infra/docker
docker compose build

# Stop old containers
echo "🛑 Stopping old containers..."
docker compose down

# Start new containers
echo "✅ Starting new containers..."
docker compose up -d

# Wait for services
echo "⏳ Waiting for services..."
sleep 10

# Check health
echo "🏥 Checking health..."
curl -f http://localhost:3000 || echo "Warning: Web not responding"

# Reload Nginx
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ Deployment complete!"
echo "🌐 Web: https://finance21.uz"
```

**Make executable:**
```bash
chmod +x infra/scripts/deploy.sh
```

### 9.8 Environment Variables (Production)

**Production `.env` file:**
```env
# Database (use strong password!)
DATABASE_URL="postgresql://finance21:STRONG_PASSWORD_HERE@localhost:5433/finance21?schema=public"

# JWT (use random 32+ character secret)
JWT_SECRET="generate-with-openssl-rand-base64-32"

# API
API_URL="https://api.finance21.uz"

# Node
NODE_ENV="production"
```

**Generate strong secrets:**
```bash
# JWT Secret
openssl rand -base64 32

# PostgreSQL Password
openssl rand -base64 24
```

### 9.9 SSL Certificate Management

**Initial setup:**
```bash
sudo certbot --nginx -d finance21.uz -d www.finance21.uz
```

**Auto-renewal:**
Certbot installs a cron job automatically. Verify:
```bash
sudo certbot renew --dry-run
```

**Manual renewal:**
```bash
sudo certbot renew
sudo systemctl reload nginx
```

### 9.10 Monitoring & Logs

**View application logs:**
```bash
# Docker logs
docker logs -f finance21_web
docker logs -f finance21_postgres

# Nginx logs
sudo tail -f /var/log/nginx/finance21_access.log
sudo tail -f /var/log/nginx/finance21_error.log
```

**Database backups:**
```bash
# Manual backup
docker exec finance21_postgres pg_dump -U finance21 finance21 | gzip > backup_$(date +%Y%m%d).sql.gz

# Automated (cron)
0 2 * * * docker exec finance21_postgres pg_dump -U finance21 finance21 | gzip > /backups/finance21_$(date +\%Y\%m\%d).sql.gz
```

**Health checks:**
```bash
# Check containers
docker ps

# Check disk space
df -h

# Check memory
free -h

# Check Nginx status
sudo systemctl status nginx

# Check SSL certificate expiry
sudo certbot certificates
```

---

## 9. TESTING

### 9.1 Manual Testing

#### Test 1: Registration & Login
```bash
# 1. Register company
curl -X POST http://localhost:3001/company/register-by-key \
  -H "Content-Type: application/json" \
  -d '{"key": "test-key-123"}'

# Note the director login and password

# 2. Login via web interface
open http://localhost:3000/login
# Enter credentials
# Should redirect to /app/dashboard

# 3. Check localStorage
# Open browser DevTools Console:
localStorage.getItem('token')
localStorage.getItem('user')
localStorage.getItem('activeCompanyId')
```

#### Test 2: Company Context Enforcement
```bash
# 1. Login as director
TOKEN="<your-jwt-token>"
COMPANY_ID="<your-company-id>"

# 2. Try without X-Company-Id (should fail)
curl -X POST http://localhost:3001/company/add-accountant \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"login": "accountant1"}'

# Expected: 400 Bad Request

# 3. Try with X-Company-Id (should succeed)
curl -X POST http://localhost:3001/company/add-accountant \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Company-Id: $COMPANY_ID" \
  -H "Content-Type: application/json" \
  -d '{"login": "accountant1"}'

# Expected: 200 OK
```

#### Test 3: Role Enforcement
```bash
# 1. Login as accountant (from Test 2)
# Use generated password from console

# 2. Try to add another accountant (should fail)
curl -X POST http://localhost:3001/company/add-accountant \
  -H "Authorization: Bearer $ACCOUNTANT_TOKEN" \
  -H "X-Company-Id: $COMPANY_ID" \
  -H "Content-Type: application/json" \
  -d '{"login": "accountant2"}'

# Expected: 403 Forbidden (insufficient role)
```

#### Test 4: Company Switching
```bash
# 1. Login to web interface
# 2. Click company name in top bar
# 3. Select different company
# 4. Verify page refreshes
# 5. Check localStorage.getItem('activeCompanyId')
# Should be new company ID
```

### 9.2 Database Verification

**Check data after operations:**

```sql
-- Connect to database
psql -U finance21 -d finance21 -h localhost -p 5433

-- View users
SELECT id, login, "isActive", "createdAt" FROM "User";

-- View companies
SELECT id, name, stir, status FROM "Company";

-- View company-user relationships
SELECT u.login, c.name, cu.role 
FROM "CompanyUser" cu
JOIN "User" u ON cu."userId" = u.id
JOIN "Company" c ON cu."companyId" = c.id;

-- View audit logs
SELECT action, "userId", "companyId", meta, "createdAt"
FROM "AuditLog"
ORDER BY "createdAt" DESC
LIMIT 10;

-- View E-IMZO users
SELECT login, "certificateCN", "certificateTIN", "certificateOrg"
FROM "User"
WHERE "certificateSerial" IS NOT NULL;
```

### 9.3 Frontend Testing Checklist

- [ ] Landing page loads
- [ ] Login page renders
- [ ] Login with valid credentials succeeds
- [ ] Login with invalid credentials shows error
- [ ] Successful login redirects appropriately
- [ ] Company selection page shows all companies
- [ ] Selecting company redirects to dashboard
- [ ] Dashboard page loads with user data
- [ ] Sidebar navigation works
- [ ] Settings pages accessible
- [ ] Company switcher shows companies
- [ ] Switching company updates context
- [ ] Logout clears auth and redirects
- [ ] Protected routes redirect when not logged in
- [ ] E-IMZO button visible on login
- [ ] E-IMZO flow completes successfully

### 9.4 Backend Testing Checklist

- [ ] Server starts without errors
- [ ] Database connection successful
- [ ] POST /auth/login returns JWT
- [ ] GET /auth/me returns user data
- [ ] Protected routes require JWT
- [ ] Protected routes require X-Company-Id
- [ ] Invalid company ID returns 403
- [ ] User not in company returns 403
- [ ] Role guard enforces permissions
- [ ] Audit logs created correctly
- [ ] POST /company/register-by-key creates company
- [ ] POST /company/add-accountant works for DIRECTOR
- [ ] POST /company/add-accountant fails for ACCOUNTANT
- [ ] E-IMZO challenge generation works
- [ ] E-IMZO login with valid signature succeeds
- [ ] E-IMZO login with invalid signature fails

---

## 11. TROUBLESHOOTING

### 11.1 Common Issues

#### Issue: Port already in use
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find process using port
lsof -i :3000
# Or
netstat -tulpn | grep 3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 pnpm dev:web
```

#### Issue: Database connection failed
```
Error: Can't reach database server at localhost:5433
```

**Solution:**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Start PostgreSQL
cd infra/docker
docker compose up -d postgres

# Check connection
PGPASSWORD=finance21 psql -h localhost -p 5433 -U finance21 -d finance21

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

#### Issue: Prisma client out of sync
```
Error: The Prisma Client is out of sync with your Prisma schema
```

**Solution:**
```bash
pnpm prisma:generate
```

#### Issue: JWT token invalid
```
Error: 401 Unauthorized
```

**Solution:**
- Check JWT_SECRET matches between services
- Token may have expired (7 days default)
- Login again to get new token
- Clear localStorage and re-login

#### Issue: X-Company-Id header missing
```
Error: 400 Bad Request: X-Company-Id header is required
```

**Solution:**
```javascript
// Ensure activeCompanyId is set
localStorage.getItem('activeCompanyId')

// If null, redirect to company selection
window.location.href = '/select-company'

// Or set manually in API call
apiClient.post('/endpoint', data, {
  headers: { 'X-Company-Id': 'your-company-id' }
})
```

#### Issue: User not member of company
```
Error: 403 Forbidden: User is not a member of this company
```

**Solution:**
- User trying to access company they don't belong to
- Check CompanyUser table in database
- Verify correct activeCompanyId selected
- Admin may need to add user to company

#### Issue: E-IMZO not detected
```
Modal: "E-IMZO topilmadi"
```

**Solution:**
1. Install E-IMZO from https://e-imzo.uz
2. Start E-IMZO application
3. Check service running: `curl -k https://127.0.0.1:64443/`
4. Accept self-signed certificate in browser

#### Issue: No E-IMZO certificates
```
"Hech qanday sertifikat topilmadi"
```

**Solution:**
1. Open E-IMZO application
2. Add PFX certificate file
3. Or insert ID card with certificate
4. Refresh web page
5. Retry login

#### Issue: Docker build fails
```
Error: failed to compute cache key
```

**Solution:**
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker compose build --no-cache

# Check Dockerfile paths are correct
```

#### Issue: Nginx 502 Bad Gateway
```
502 Bad Gateway
```

**Solution:**
```bash
# Check upstream service is running
curl http://localhost:3000

# Check Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### 11.2 Debugging Tips

**Enable verbose logging:**

Backend:
```typescript
// In main.ts
app.useLogger(['log', 'error', 'warn', 'debug', 'verbose']);
```

Frontend:
```javascript
// Already has console.log statements
// Check browser console (F12)
```

**Check request/response:**

Browser DevTools:
1. Open DevTools (F12)
2. Go to Network tab
3. Perform action
4. Click request to see:
   - Headers (Authorization, X-Company-Id)
   - Request payload
   - Response data
   - Status code

**Database inspection:**
```bash
# Open Prisma Studio GUI
pnpm prisma:studio

# Or use psql
psql -U finance21 -d finance21 -h localhost -p 5433
```

**Check running processes:**
```bash
# Check all Docker containers
docker ps -a

# Check Node processes
ps aux | grep node

# Check Nginx
sudo systemctl status nginx
```

### 11.3 Getting Help

**Resources:**
- Next.js Docs: https://nextjs.org/docs
- NestJS Docs: https://docs.nestjs.com
- Prisma Docs: https://www.prisma.io/docs
- E-IMZO Docs: https://e-imzo.uz

**Check logs:**
```bash
# Backend logs
docker logs -f finance21_api

# Frontend logs  
docker logs -f finance21_web

# Database logs
docker logs -f finance21_postgres

# Nginx logs
sudo tail -f /var/log/nginx/finance21_error.log
```

---

## 12. MAINTENANCE

### 12.1 Regular Maintenance Tasks

**Daily:**
- [ ] Check service health (`docker ps`, `systemctl status nginx`)
- [ ] Monitor disk space (`df -h`)
- [ ] Review error logs
- [ ] Check SSL certificate validity

**Weekly:**
- [ ] Backup database
- [ ] Review audit logs for suspicious activity
- [ ] Update packages if security patches available
- [ ] Test backup restoration

**Monthly:**
- [ ] Review and archive old logs
- [ ] Database optimization (VACUUM, REINDEX)
- [ ] Security audit
- [ ] Performance review

### 12.2 Database Backups

**Automated backup script:**

```bash
#!/bin/bash
# File: /opt/scripts/backup-finance21.sh

BACKUP_DIR="/opt/backups/finance21"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="finance21_${DATE}.sql.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker exec finance21_postgres pg_dump -U finance21 finance21 | gzip > "${BACKUP_DIR}/${FILENAME}"

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${FILENAME}"
```

**Schedule with cron:**
```bash
# Edit crontab
crontab -e

# Add line (backup daily at 2 AM)
0 2 * * * /opt/scripts/backup-finance21.sh >> /var/log/finance21-backup.log 2>&1
```

**Restore from backup:**
```bash
# Stop application
docker compose down

# Restore database
gunzip -c backup_file.sql.gz | docker exec -i finance21_postgres psql -U finance21 -d finance21

# Start application
docker compose up -d
```

### 12.3 Updates & Upgrades

**Update application code:**
```bash
cd /opt/finance21
git pull origin main
cd infra/docker
docker compose build
docker compose down
docker compose up -d
```

**Update dependencies:**
```bash
# Update npm packages
pnpm update

# Update Docker images
docker compose pull

# Update system packages
sudo apt update && sudo apt upgrade -y
```

**Database migrations:**
```bash
# Apply new migrations
pnpm prisma migrate deploy

# Or with Docker
docker exec -it finance21_web npx prisma migrate deploy
```

### 12.4 Monitoring

**Set up monitoring tools:**

**Option 1: Simple script monitoring**
```bash
#!/bin/bash
# File: /opt/scripts/monitor-finance21.sh

# Check web service
if ! curl -f http://localhost:3000 > /dev/null 2>&1; then
  echo "Web service down!" | mail -s "Finance21 Alert" admin@finance21.uz
fi

# Check database
if ! docker exec finance21_postgres pg_isready -U finance21 > /dev/null 2>&1; then
  echo "Database down!" | mail -s "Finance21 Alert" admin@finance21.uz
fi
```

**Option 2: Use external services**
- **Uptime monitoring:** UptimeRobot, Pingdom
- **Error tracking:** Sentry
- **Performance:** New Relic, DataDog
- **Logs:** Logtail, Papertrail

### 12.5 Security Updates

**Check for vulnerabilities:**
```bash
# Check npm packages
pnpm audit

# Fix vulnerabilities
pnpm audit fix

# Check Docker images
docker scan finance21_web
```

**Update SSL certificates:**
```bash
# Auto-renewed by Certbot
# Check renewal:
sudo certbot renew --dry-run

# Manual renewal if needed:
sudo certbot renew
sudo systemctl reload nginx
```

### 12.6 Performance Optimization

**Database optimization:**
```sql
-- Vacuum and analyze
VACUUM ANALYZE;

-- Reindex
REINDEX DATABASE finance21;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Clear logs:**
```bash
# Clear old Docker logs
docker system prune --volumes

# Clear Nginx logs
sudo truncate -s 0 /var/log/nginx/*.log

# Rotate logs
sudo logrotate /etc/logrotate.conf
```

### 12.7 Scaling Considerations

**Horizontal scaling:**
- Deploy multiple Next.js instances behind load balancer
- Use Redis for session/cache storage (replace in-memory challenge store)
- Database read replicas for heavy read workloads

**Vertical scaling:**
- Increase server resources (CPU, RAM)
- Optimize database queries
- Add caching layer (Redis, Memcached)

**Future improvements:**
- CDN for static assets
- Database connection pooling
- API rate limiting
- WebSocket for real-time features
- Queue system for background jobs (Bull, BullMQ)

---

## APPENDIX

### A. Database Schema

```prisma
// Current schema as of December 14, 2025

enum CompanyStatus {
  ACTIVE
  BLOCKED
}

enum CompanyUserRole {
  DIRECTOR
  ACCOUNTANT
  VIEWER
}

enum AuditAction {
  COMPANY_CREATED
  COMPANY_UPDATED
  USER_INVITED
  USER_LOGIN
  SETTINGS_UPDATED
  EIMZO_LOGIN
}

model User {
  id                   String        @id @default(cuid())
  login                String        @unique
  passwordHash         String?
  isActive             Boolean       @default(true)
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt

  // E-IMZO fields
  certificateSerial    String?       @unique
  certificateCN        String?
  certificateTIN       String?       @unique
  certificateOrg       String?
  certificateValidFrom DateTime?
  certificateValidTo   DateTime?

  companies            CompanyUser[]
  auditLogs            AuditLog[]

  @@index([login])
  @@index([certificateSerial])
  @@index([certificateTIN])
}

model Company {
  id           String            @id @default(cuid())
  name         String
  stir         String            @unique
  status       CompanyStatus     @default(ACTIVE)
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt

  users        CompanyUser[]
  settings     CompanySettings?
  auditLogs    AuditLog[]

  @@index([stir])
}

model CompanyUser {
  id        String           @id @default(cuid())
  userId    String
  companyId String
  role      CompanyUserRole
  createdAt DateTime         @default(now())

  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  company   Company          @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@unique([userId, companyId])
  @@index([companyId])
}

model CompanySettings {
  id               String   @id @default(cuid())
  companyId        String   @unique
  language         String   @default("uz")
  currency         String   @default("UZS")
  telegramPhone    String?
  billingEnabled   Boolean  @default(false)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  company          Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
}

model AuditLog {
  id         String       @id @default(cuid())
  action     AuditAction
  userId     String
  companyId  String?
  meta       Json?
  createdAt  DateTime     @default(now())

  user       User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  company    Company?     @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@index([companyId])
  @@index([action])
}
```

### B. API Endpoints Reference

| Method | Endpoint | Auth | Company Context | Role | Description |
|--------|----------|------|----------------|------|-------------|
| POST | /auth/login | No | No | - | Login with credentials |
| GET | /auth/me | Yes | No | - | Get current user |
| POST | /auth/eimzo/challenge | No | No | - | Get E-IMZO challenge |
| POST | /auth/eimzo/login | No | No | - | E-IMZO authentication |
| POST | /company/register-by-key | No | No | - | Register new company |
| POST | /company/add-accountant | Yes | Yes | DIRECTOR | Add accountant to company |

### C. Frontend Routes

| Route | Auth Required | Company Required | Description |
|-------|---------------|------------------|-------------|
| / | No | No | Landing page |
| /login | No | No | Login page |
| /select-company | Yes | No | Company selection |
| /app/dashboard | Yes | Yes | Main dashboard |
| /app/settings | Yes | Yes | Settings tiles |
| /app/settings/profile | Yes | Yes | User profile |
| /app/settings/company | Yes | Yes | Company settings |
| /app/settings/telegram | Yes | Yes | Telegram integration |

### D. Environment Variables Reference

**Backend (.env):**
```env
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your-secret-key
NODE_ENV=development|production
PORT=3001
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### E. Useful Commands

```bash
# Monorepo
pnpm dev:web         # Start Next.js dev server
pnpm dev:api         # Start NestJS dev server
pnpm prisma:generate # Generate Prisma client
pnpm prisma:migrate  # Run database migrations
pnpm prisma:studio   # Open Prisma Studio

# Docker
docker compose up -d              # Start services
docker compose down               # Stop services
docker compose logs -f [service]  # View logs
docker compose restart [service]  # Restart service
docker ps                         # List containers
docker exec -it [container] bash  # Access container shell

# Database
psql -U finance21 -d finance21 -h localhost -p 5433
pg_dump -U finance21 finance21 > backup.sql
psql -U finance21 -d finance21 < backup.sql

# Nginx
sudo nginx -t                    # Test configuration
sudo systemctl reload nginx      # Reload config
sudo systemctl status nginx      # Check status
sudo tail -f /var/log/nginx/error.log  # View errors

# SSL
sudo certbot certificates        # List certificates
sudo certbot renew              # Renew certificates
sudo certbot renew --dry-run    # Test renewal
```

---

## CHANGELOG

### Version 0.1.0 - December 14, 2025

**Added:**
- Initial project structure (monorepo with Next.js + NestJS)
- User authentication (JWT + password)
- E-IMZO authentication (digital signature)
- Multi-company support
- Role-based access control (DIRECTOR, ACCOUNTANT, VIEWER)
- Company context enforcement (X-Company-Id header)
- Audit logging for all key actions
- Modern UI with Tailwind CSS + Lucide icons
- Alert/toast notification system
- Docker deployment setup
- System Nginx reverse proxy configuration
- PostgreSQL database with Prisma ORM
- Comprehensive documentation

**Security:**
- JWT authentication with 7-day expiration
- Bcrypt password hashing
- E-IMZO challenge-response authentication
- Company context middleware
- Role guards
- Audit logging
- HTTPS enforcement

**Known Issues:**
- In-memory challenge store (needs Redis for multi-instance)
- No certificate revocation checking
- No rate limiting
- No refresh token mechanism

**Future Roadmap:**
- Phase 2.4: Settings CRUD integration
- Phase 3: Document management
- Phase 4: Approval workflows
- Phase 5: Billing system
- Phase 6: Analytics & reporting

---

**End of Documentation**

*This is a living document. Update as the project evolves.*

*Last Updated: December 14, 2025*
*Maintained by: Finance21 Development Team*

