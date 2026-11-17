# Comparative Tool Exploration & Automated API Testing
> **Course:** Software Testing & Quality Assurance (SQTA)  
> **Tool Stack:** Postman v11, Newman CLI, `newman-reporter-htmlextra`  
> **SUT Stack:** Node.js, Express.js RESTful API  

---

## 📌 Project Overview
This project evaluates an automated API test harness built using **Postman** and **Newman** applied against a standalone **E-Commerce REST API (System Under Test - SUT)**. The test suite systematically covers functional correctness, **Boundary Value Analysis (BVA)**, Equivalence Partitioning (EP), security authorization, and response time Service Level Agreements (SLAs).

---

## 🏗️ System Under Test (SUT) Architecture
The SUT (`server.js`) is an authenticated REST service handling the e-commerce purchase lifecycle:
- `POST /api/auth/login` — Authenticates user and issues Bearer JWT token.
- `GET /api/products` — Catalog tracking available stock.
- `POST /api/cart/add` — Adds items with boundary checks (stock limits & non-negative quantities).
- `GET /api/cart` — Aggregates subtotal, applies single-use coupons, and computes 8% sales tax.
- `POST /api/cart/coupon` — Applies percentage discounts (`SAVE20`).
- `POST /api/checkout` — Requires Bearer authentication; commits order and clears cart.

---

## 📐 Boundary Value Analysis (BVA) Specification

### 1. What is Boundary Value Analysis?
**Boundary Value Analysis (BVA)** is a black-box test design technique based on the principle that defects cluster predominantly at the boundaries of input domains rather than in the center. For any given valid range $[Min, Max]$, BVA systematically tests:
- Just below minimum: $Min - 1$ *(Invalid)*
- Minimum boundary: $Min$ *(Valid)*
- Just above minimum: $Min + 1$ *(Valid)*
- Nominal (typical): Center value *(Valid)*
- Just below maximum: $Max - 1$ *(Valid)*
- Maximum boundary: $Max$ *(Valid)*
- Just above maximum: $Max + 1$ *(Invalid)*

---

### 2. SUT Input Domain & Boundary Mapping

For Product Item **"Wireless Mouse" (Product ID: 1, In-Stock: 10)**:
- **Valid Quantity Range:** $[1, 10]$

```text
  INVALID                  VALID QUANTITY DOMAIN                 INVALID
 (Negative)      (Min Boundary)             (Max Stock Boundary) (Exceeds Stock)
◄────────────┼───────────[ 1 ]───────────...──────────[ 10 ]──────────┼────────────►
   qty = -1    qty = 0    qty = 1      qty = 2       qty = 10     qty = 11 / 9999
   [400 Bad]  [422 Unproc] [200 OK]    [200 OK]      [200 OK]       [409 Conflict]
```

---

### 3. Detailed BVA Test Case Design Table

| Test Case ID | Parameter Under Test | Tested Value | Boundary Condition | Input Payload | Expected Status | Business Rule Validated |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- |
| **TC-BVA-01** | Quantity (`quantity`) | `-1` | Negative Boundary ($< 0$) | `{"productId": 1, "quantity": -1}` | `400 Bad Request` | Prevent negative balance injection |
| **TC-BVA-02** | Quantity (`quantity`) | `0` | Lower Boundary ($Min - 1$) | `{"productId": 1, "quantity": 0}` | `422 Unprocessable` | Prevent zero-quantity cart items |
| **TC-BVA-03** | Quantity (`quantity`) | `1` | Lower Valid Boundary ($Min$) | `{"productId": 1, "quantity": 1}` | `200 OK` | Smallest permissible order |
| **TC-BVA-04** | Quantity (`quantity`) | `2` | Just Above Minimum ($Min + 1$) | `{"productId": 1, "quantity": 2}` | `200 OK` | Standard multi-item order |
| **TC-BVA-05** | Quantity (`quantity`) | `9` | Just Below Maximum ($Max - 1$) | `{"productId": 1, "quantity": 9}` | `200 OK` | High-volume valid order |
| **TC-BVA-06** | Quantity (`quantity`) | `10` | Maximum Stock Boundary ($Max$) | `{"productId": 1, "quantity": 10}` | `200 OK` | Inventory exhaustion limit |
| **TC-BVA-07** | Quantity (`quantity`) | `11` | Upper Boundary ($Max + 1$) | `{"productId": 1, "quantity": 11}` | `409 Conflict` | Stock depletion rejection |
| **TC-BVA-08** | Quantity (`quantity`) | `9999` | Extreme Upper Boundary ($\gg Max$) | `{"productId": 1, "quantity": 9999}` | `409 Conflict` | Out-of-bounds inventory defense |

---

## 🧪 Complete Test Suite Execution Matrix

| Test ID | Endpoint | Objective | Technique | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-AUTH-01** | `POST /login` | Valid Login & Token Chaining | Happy Path | `200 OK`, JWT captured | **PASS** |
| **TC-AUTH-02** | `POST /login` | Missing Password Validation | Negative Testing | `400 Bad Request` | **PASS** |
| **TC-CART-01** | `POST /cart/add` | Valid Item Addition | Functional | `200 OK`, item in cart | **PASS** |
| **TC-CART-02** | `POST /cart/add` | Zero Quantity Boundary | BVA ($Min - 1$) | `422 Unprocessable` | **PASS** |
| **TC-CART-03** | `POST /cart/add` | Negative Quantity Check | BVA ($< 0$) | `400 Bad Request` | **PASS** |
| **TC-CART-04** | `POST /cart/add` | Exceed Stock Limit | BVA ($Max + 1$) | `409 Conflict` | **PASS** |
| **TC-DISC-01** | `POST /cart/coupon` | Apply 20% Discount | Equivalence Partitioning | `200 OK`, 20% deducted | **PASS** |
| **TC-CALC-01** | `GET /cart` | Mathematical Verification | Business Logic Assertion | `(Sub - Disc) + Tax == Total` | **PASS** |
| **TC-CHK-01** | `POST /checkout` | Unauthorized Checkout | Security Validation | `401 Unauthorized` | **PASS** |
| **TC-CHK-02** | `POST /checkout` | Authorized Order Commit | End-to-End Workflow | `201 Created`, Order ID | **PASS** |
| **TC-SLA-01** | All Endpoints | Response Time SLA Check | Performance Benchmark | Latency `< 300 ms` | **PASS** |

---

## 📊 Execution Metrics (Newman Run)
- **Total Requests:** 10
- **Total Assertions:** 16
- **Pass Rate:** 100% (16/16 Passed, 0 Failed, 0 Skipped)
- **Total Execution Duration:** 1007 ms (~1.0s)
- **Average Response Latency:** 8 ms
- **Automated Report:** Generated via `newman-reporter-htmlextra` as an interactive HTML dashboard.

---

## 🚀 Setup & Execution Guide

### 1. Install Dependencies
```bash
npm install
npm install -g newman newman-reporter-htmlextra
```

### 2. Start the Backend API (SUT)
```bash
node server.js
```

### 3. Run Automated Tests via Newman CLI
In a second terminal:
```bash
npm test
```
*Or directly via Newman:*
```bash
npx newman run ecommerce.postman_collection.json --env-var "baseUrl=http://localhost:5000" -r "cli,htmlextra" --reporter-htmlextra-export ./ExecutionReport.html
```

---

## 👥 Team Work Division
- **Student A (Lead Tool Architect & Framework Specialist - 50%):**
  - Collection variable architecture and dynamic Bearer token chaining.
  - Newman CLI test runner pipeline setup and `htmlextra` reporting configuration.
  - Non-functional SLA assertions and latency benchmark evaluation.

- **Student B (Lead Test Designer & SUT Engineer - 50%):**
  - Backend API architecture and specification in Node.js/Express (`server.js`).
  - Formal Test Specification Matrix design (BVA, Equivalence Partitioning, Negative).
  - Chai assertion logic implementation and Defect Discovery root cause analysis.
