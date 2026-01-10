# Product Requirements Document (PRD)

## Product Name

Ingredients & Stocks Monitoring, Menu Calculator, Expenses & Profit Reports

## Product Vision

Provide restaurant owners and managers with a **single, accurate source of truth** for inventory, menu profitability, expenses, and financial performance—enabling data‑driven decisions that improve margins, reduce waste, and maintain operational control.

The system must be **multi‑tenant**, **audit‑ready**, and **scalable** for growing restaurant operations.

---

## Goals & Objectives

### Primary Goals

* Track ingredient inventory across multiple locations
* Calculate true menu profitability including waste and labor
* Monitor expenses and generate accurate P&L reports
* Maintain strong financial and inventory audit trails

### Success Metrics

* Accurate stock variance ≤ 2% after stocktakes
* Menu cost accuracy within ±1% of actual COGS
* Ability to identify unprofitable menu items instantly
* Reduction in stockouts and over‑purchasing

---

## Target Users (User Personas)

### Owner

* Business owner or primary decision maker
* Full access to all modules and data
* Views and exports all financial reports
* Manages users, roles, and access
* Can deactivate users and transfer ownership

### Manager

* Oversees daily operations
* Manages ingredients, stocks, recipes, purchases, sales, and expenses
* Views operational and financial reports
* Cannot manage users, roles, or tenant-level settings

### Staff

* Operational data entry role
* Can create sales, purchases, and stock counts
* Cannot view financial reports
* Cannot manage ingredients, recipes, users, or settings

---

## User Management

### Overview

The User Management module allows secure control of **who can access the system and what actions they can perform**, enforced consistently across UI, server logic, and database layers.

### Core Capabilities

#### 1. User Invites

* Owners can invite new users via email
* Invited users automatically inherit the same tenant ID
* Role is assigned at the time of invitation
* Invitation expires after a configurable period

#### 2. Role Changes

* Owners can promote or demote users between **manager** and **staff**
* Ownership transfer is supported (owner → manager)
* Managers and staff cannot modify roles

#### 3. User Deactivation

* Owners can deactivate users
* Deactivated users:

  * Lose login access immediately
  * Retain historical records for audit purposes
* Deactivation does not delete user data

#### 4. Access Enforcement

Access control is enforced at multiple layers:

* **UI Level**

  * Navigation items rendered based on role
  * Restricted pages hidden or blocked

* **Server Actions**

  * Role checks before mutations or sensitive reads

* **Database (Supabase RLS)**

  * Tenant isolation via `tenant_id`
  * Role-aware policies where applicable

### Pages

```
/dashboard/users            # User list
/dashboard/users/invite     # Invite new user
/dashboard/users/[id]       # View / edit user
```

### User Fields

* Name
* Email
* Role (owner / manager / staff)
* Status (active / deactivated)
* Last login
* Created date

---

## Functional Requirements

### 1. Authentication & Tenant Isolation

* Email/password authentication via Supabase Auth
* Each user belongs to exactly one tenant
* All data queries filtered by `tenant_id`

---

### 2. Dashboard

**KPIs**

* Total stock value
* Low stock items count
* Today’s sales
* Net profit (YTD)

**Quick Views**

* Low stock ingredients
* Top selling menu items

---

### 3. Ingredients Management

**Features**

* Create, update, deactivate ingredients
* Categorize ingredients
* Track cost per unit and reorder level
* View usage and purchase history

**Business Rules**

* Ingredient cost uses moving average
* Deactivated ingredients cannot be used in new recipes

---

### 4. Stock Monitoring

**Features**

* Ingredient × Location stock matrix
* Low/critical stock indicators
* Manual stock adjustments

**Stocktakes**

* Periodic physical counts
* Automatic variance calculation
* Immutable audit records

---

### 5. Menu & Recipe Calculator

**Recipe Builder**

* Assign ingredients and quantities
* Define waste percentage
* Define labor cost per serving

**Live Calculations**

```
food_cost = Σ(qty × cost/unit) × (1 + waste%)
total_cost = food_cost + labor
contribution_margin = selling_price - total_cost
total_cost% = total_cost / selling_price × 100
```

**Simulator**

* Test pricing and cost changes
* Instantly see margin impact

---

### 6. Purchases

**Features**

* Multi‑line purchase entry
* Supplier and invoice tracking
* Automatically updates stock and ingredient cost

---

### 7. Sales

**Features**

* Manual sales entry
* Supports dine‑in, delivery, takeout
* Automatically deducts ingredients based on recipes

---

### 8. Expenses

**Features**

* Categorized expense tracking
* Included in P&L computation

---

### 9. Reports

**Profit & Loss (P&L)**

```
Revenue
- Cost of Goods Sold
- Operating Expenses
= Net Profit
```

**Additional Reports**

* Menu performance ranking
* Ingredient cost trends

---

## Non‑Functional Requirements

### Security

* Supabase RLS on all tables
* Tenant isolation enforced at database level
* Role‑based access checks in server actions

### Performance

* Server Components by default
* Indexed foreign keys and tenant_id columns
* Optimized reporting queries

### Auditability

* Immutable purchase, sales, and stock count records
* Full stock movement history

### Scalability

* Supports multiple locations per tenant
* Ready for multi‑branch expansion

---

## Technical Constraints

* NextJS 15 App Router
* Supabase (Postgres + Auth)
* TailwindCSS v4
* TypeScript (strict)

No Prisma. No Redux. No client‑side business logic.

---

## Milestones

### Week 1

* Auth & user management
* Ingredients & stocks CRUD

### Week 2

* Menu calculator
* Purchases & sales

### Week 3

* Reports
* UI polish
* Performance optimization

---

## Out of Scope (for v1)

* POS integrations
* Accounting system export
* Forecasting & AI predictions
* Multi‑currency

---

## Approval

This PRD defines the complete scope for **Version 1** of the restaurant back‑office system and serves as the baseline for development, testing, and release.
