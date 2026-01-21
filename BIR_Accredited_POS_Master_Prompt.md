# BIR-Accredited POS System – Master Compliance Prompt (Philippines)

## Overview

This document is a **master prompt** for designing, validating, and documenting a **BIR-accredited Point of Sale (POS) system in the Philippines**, fully compliant with:

- **Revenue Memorandum Order (RMO) No. 24-2023**
- **Revenue Regulations No. 17-2013**
- Related BIR issuances governing POS and CAS accreditation

This prompt is intended for use with:
- AI engineers
- Software architects
- POS system developers
- Compliance consultants

The goal is to produce a **tamper-proof, audit-ready, and accreditation-ready POS system**.

---

## Master Prompt

>You are a **senior POS systems architect and compliance engineer** specializing in **Philippine BIR-accredited POS and CAS systems**.
>
>Your task is to **design, validate, and document a Point of Sale (POS) system** that is **fully compliant with BIR Revenue Memorandum Order (RMO) No. 24-2023**, Revenue Regulations No. 17-2013, and all related BIR issuances governing POS accreditation in the Philippines.
>
>The system **must be tamper-proof, audit-ready, tax-compliant, and accreditation-ready**.

---

## Objectives

The POS system must:

1. Qualify for **BIR POS Accreditation**
2. Prevent **suppression of sales or income**
3. Ensure **full audit transparency**
4. Support **BIR eSales reporting**
5. Support **10-year data retention**
6. Be legally safe for **Notarized Sworn Statement submission**

---

## Mandatory BIR Core Features

### 1. Accumulated Grand Total Sales (AGTS)

- Maintain a **lifetime cumulative total of all sales**
- AGTS must **never decrease**
- AGTS reset must:
  - Reset value to zero
  - Increment a **Reset Counter**
  - Log the reset permanently
- AGTS data must be **immutable and auditable**

---

### 2. Activity / Transaction Logs

- Log **all system activities**, including:
  - Sales
  - Voids
  - Refunds
  - Reprints
  - Logins / logouts
  - Configuration changes
- Logs must be:
  - Read-only
  - Timestamped
  - User-attributed
  - Stored in **non-volatile storage**

---

### 3. Non-Volatile Memory

- Persist all sales and logs during:
  - Power failure
  - Crashes
  - Forced shutdowns
- No single point of data loss allowed

---

### 4. Electronic Journal (E-Journal / Audit Journal)

- Generate a **complete electronic journal**
- Reflect **all transactions and system activities**
- Must be:
  - Viewable
  - Exportable
  - Printable
- Must be **unalterable**

---

### 5. Sales Readings & Reports

- Generate:
  - X-Readings
  - Z-Readings
  - Period-based summaries
- Reports must reconcile with **AGTS**

---

### 6. Backend & Compliance Reports

- Generate audit-ready reports:
  - Daily sales
  - Tax breakdowns
  - Receipt ranges
  - User activity logs

---

## Receipt & Invoice Compliance

Each receipt or invoice must include:

- Registered business name
- Taxpayer Identification Number (TIN)
- BIR Permit to Use (PTU) number
- POS serial number
- Machine identification
- Sequential receipt number (no gaps)
- Date and time
- Itemized transaction details
- VAT / Non-VAT breakdown
- Total payable amount

**Receipt deletion or resequencing is prohibited.**

---

## Sequential Accountable Forms

- Receipts and invoices must:
  - Follow strict sequential numbering
  - Never skip numbers
  - Never reuse numbers
- Voided receipts must:
  - Appear in logs and reports
  - Be marked clearly as **VOID**

---

## Reprint Functionality

- Allow reprinting of issued receipts and invoices
- Reprints must:
  - Be logged
  - Be labeled **REPRINT**
  - Preserve original transaction data

---

## Verification / Validation Seal

- Implement a verification mechanism such as:
  - Hash-based integrity seal
  - Digital signature
  - QR-based verification reference
- Purpose:
  - Detect tampering
  - Validate authenticity during audits

---

## Push & Data Transmission

- Support manual or automated sales data transmission
- Must be compatible with **BIR eSales portal formats**
- Support **per-machine monthly reporting**

---

## BIR eSales Compliance

- Generate monthly sales reports per POS machine
- Submission deadlines:
  - **8th day** – even TIN ending
  - **10th day** – odd TIN ending
- Reports must reconcile with:
  - POS totals
  - AGTS
  - Audit journals

---

## Data Retention & Archiving

- Retain all data for **10 years**, including:
  - Sales records
  - Databases
  - Logs
  - Backups
- Data must remain:
  - Readable
  - Exportable
  - Recoverable

---

## Anti-Suppression & Security Controls

The POS system must not:

- Suppress sales
- Modify completed transactions
- Delete historical data
- Allow hidden overrides

Required safeguards:
- Role-based access control
- Immutable logs
- Configuration change tracking
- Audit-safe database design

---

## Downtime & Contingency Mode

- Allow fallback to pre-printed receipts
- Maximum **1,000 sets**
- POS must:
  - Record downtime events
  - Reconcile manual receipts post-restoration

---

## User Roles & Access Enforcement

Define roles such as:
- Owner
- Manager
- Cashier
- Auditor

Each role must have:
- Explicit permissions
- Enforced access boundaries
- Fully logged actions

---

## Accreditation & Legal Readiness

The system must support:

- Notarized Sworn Statement submission
- BIR inspections and audits
- Re-accreditation for major system updates

Clarify:
- Changes requiring re-accreditation
- Changes requiring BIR notification only

---

## Required Output When Using This Prompt

The responding system must produce:

1. System architecture overview
2. Feature-to-BIR requirement mapping table
3. Compliance-focused data models
4. Security and anti-tampering strategy
5. Audit-readiness checklist
6. eSales reporting workflow
7. Accreditation-readiness summary

---

## Final Instruction

> Design the POS system **as if it will be submitted to the BIR for accreditation immediately and audited within the year**.
>
> **Compliance correctness takes priority over convenience, speed, or UX.**
