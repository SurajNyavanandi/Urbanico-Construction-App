# Urbanico Central Admin Console & Operations Portal
**Application Name:** **Urbanico Ops Console** (`admin.urbanico.in`)  
**Target Platform:** Desktop Web SPA (React 18+ • Vite • Tailwind CSS • Lucide Icons)  
**Primary Users:** Operations Directors, Fleet Dispatchers, Catalog Pricing Managers, Finance Auditors  
**Security Clearance:** Admin RBAC (`ADMIN_EMAILS` verified allowlist only)  
**Version:** 3.0.0  

---

## 1. Executive Operations Architecture

```
                               ┌──────────────────────────────────┐
                               │   Urbanico Central Operations    │
                               │        admin.urbanico.in         │
                               └────────────────┬─────────────────┘
                                                │
         ┌───────────────────┬──────────────────┼──────────────────┬───────────────────┐
         │                   │                  │                  │                   │
         ▼                   ▼                  ▼                  ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Fleet Control   │ │ Catalog Pricing │ │ Partner KYC   │ │ Financials & GST│ │ Security Audit  │
│ • Live GPS Map  │ │ • Per-Ton Rates │ │ • Technicians │ │ • 18% ITC Recon │ │ • Price Alter Log│
│ • Tipper Status │ │ • Cache Purge   │ │ • Driver KYC  │ │ • Razorpay Settle│ │ • Admin Activity│
│ • Waybill Docs  │ │ • Instant BOQ   │ │ • Payout Ledger││ • Refund Engine │ │ • IP & Device ID│
└─────────────────┘ └─────────────────┘ └───────────────┘ └─────────────────┘ └─────────────────┘
```

The **Urbanico Central Admin Console** is the mission-critical operations tower for managing large-scale bulk construction material delivery and skilled trade services across Hyderabad and Telangana.

---

## 2. Urbanico Enterprise Design System Tokens

The Admin Portal enforces a high-density, professional enterprise design language:

| Design Token | Color Hex | Usage in Admin Console |
| :--- | :--- | :--- |
| **Primary Brand Accent** | `#FCB026` | Active navigation tabs, primary CTA buttons, selection checkboxes, highlighted KPI cards |
| **Primary Soft Tint** | `#FFF8EB` | Selected table row highlights, filter badge backgrounds, active pill outlines |
| **Sidebar Background** | `#0F172A` | Left collapsible navigation rail (Slate 900) |
| **Main Viewport Background**| `#F8FAFC` | Light mode workspace background (Slate 50) |
| **Data Table & Card Surface**| `#FFFFFF` | Elevation cards, high-density data tables, modal dialogs |
| **Divider & Table Border** | `#E2E8F0` | 1px clean gridlines between table rows and columns |
| **Text - Primary Header** | `#18181B` | Table headers, customer names, rupee amounts |
| **Text - Secondary / Muted**| `#64748B` | Order numbers, timestamps, vehicle registration numbers |
| **Monospace Font** | `Consolas, Menlo, monospace` | Used exclusively for Order IDs (`ORD-2026-XXXX`), GSTINs, and e-Way Bill numbers |
| **Status - Delivered** | `#10B981` | Delivered orders, verified GSTIN, approved partner |
| **Status - Transit** | `#0284C7` | Fleet on road, live GPS ping active |
| **Status - Warning** | `#F59E0B` | Pending review, dispatch delayed |
| **Status - Cancelled** | `#EF4444` | Order rejected, refund initiated, out of zone |
| **Squircle Radius** | `14px` | Standard border radius for metric cards, charts, and modal sheets |
| **Component Radius** | `10px` | Form inputs, buttons, search bars, filter dropdowns |
| **Tag / Badge Radius** | `6px` | Compact table status badges (`10px` bold uppercase text) |

---

## 3. Core Admin Modules & Functional Specifications

### 3.1 Live Fleet & Dispatch Operations Tower (`/admin/fleet`)
- **Interactive Geospatial Map**: Renders live tipper trucks and tractor-trailer locations across Hyderabad clusters (Patancheru, Miyapur, Shamshabad, Financial District, ORR).
- **Vehicle Status Pills**:
  - `LOADING AT QUARRY` (Yellow)
  - `EN-ROUTE TO SITE` (Blue)
  - `UNLOADING AT DESTINATION` (Purple)
  - `DISPATCH COMPLETE` (Green)
- **Manual Fleet Reassignment**: Drag-and-drop or select alternative drivers if a breakdown occurs.
- **e-Way Bill Generator**: Generates and uploads mandatory Indian GST e-Way bills for consignments over `₹50,000`.

---

### 3.2 Dynamic Material Catalog & Real-Time Price Controller (`/admin/materials`)
Allows authorized administrators to update live prices across quarries and distributors in seconds.

#### Features:
1. **Instant Price Override Modal**:
   - Form field for `Default Price (₹ per Unit)`.
   - Toggle for `In Stock` / `Fast Dispatch`.
   - Minimum Order Quantity (MOQ) and Density calculation factor (`Tons/cft`).
2. **Instant Memory Cache Invalidation**:
   - Updating any price immediately flushes `materialCache.clear()` so customer apps see the revised price on their next render.
3. **Automatic Audit Trail Trigger**:
   - The backend records the old price, new price, admin email, IP address, and timestamp into `AuditLog`.

---

### 3.3 Trade Partner & Field Technician Management (`/admin/partners`)
- **KYC Verification Queue**: Review submitted Aadhaar cards, trade certifications (ITI, RCC masonry licenses), and bank account passbooks.
- **Skill Classification**: Tag partners by specialty (`Concrete Casting`, `Electrical Wiring`, `Excavator Operator`, `Structural Plumber`).
- **Performance Rating & Payouts**: Monitor customer review ratings (1.0 to 5.0 stars) and calculate weekly settlements based on verified jobs.

---

### 3.4 Order Lifecycle & Billing Reconciliation (`/admin/orders`)
- **Filterable Table Columns**: Order Number, Customer Name, Mobile, Site Location, Cargo Summary, Total Amount, 18% GST Component, Payment Status, Delivery OTP.
- **Order State Progression**:
  ```
  RECEIVED ➔ CONFIRMED ➔ PROCESSING ➔ DISPATCHED ➔ IN TRANSIT ➔ DELIVERED
  ```
- **Automated Tax Invoice Re-dispatch**: Single click to regenerate and email the official 18% GST tax invoice to the contractor's business email via Resend Mailer.

---

### 3.5 Security & Compliance Audit Log Viewer (`/admin/audit-logs`)
- Provides an immutable ledger of every administrative action taken on the system.
- Searchable by actor email, action type, date range, and IP address.
- Table highlights:
  - Material Price Modifications (Green/Red delta indicator showing `₹1,650 ➔ ₹1,720`)
  - User Role Elevations (`contractor ➔ admin`)
  - Order Cancellations & Manual Refunds
  - System Data Purges

---

## 4. UI Component Architecture & Layout Wireframe

### 4.1 Master Dashboard Layout
```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                                 TOP EXECUTIVE HEADER                                  │
│  [ Urbanico Ops ]      Search Consignments, GSTIN, Site...     (🔔)  [ Ramesh (Admin) ]│
├───────────────┬───────────────────────────────────────────────────────────────────────┤
│ SIDEBAR       │ MAIN CONTENT AREA                                                     │
│               │ ┌───────────────────────────────────────────────────────────────────┐ │
│ 📊 Dashboard  │ │ KPI CARDS:                                                        │ │
│ 🚚 Fleet Map  │ │ [ Total Revenue ]  [ Active Tippers ]  [ Delivered ]  [ Total SKU]│ │
│ 🧱 Catalog    │ │   ₹48,20,500           14 Vehicles         128 Orders      35 Items │ │
│ 🛠️ Services   │ └───────────────────────────────────────────────────────────────────┘ │
│ 📦 Orders     │                                                                       │
│ 👥 Partners   │ ┌───────────────────────────────────────────────────────────────────┐ │
│ 🛡️ Audit Logs │ │ HIGH-DENSITY DATA TABLE (Materials & Pricing)                      │ │
│ ⚙️ Settings   │ │ Material Name        Category       Price / Unit   Stock   Actions │ │
│               │ │ ───────────────────────────────────────────────────────────────── │ │
│               │ │ M-Sand (Zone II)     Aggregates     ₹1,720 / Ton   4,200T  [Edit]  │ │
│               │ │ UltraTech PPC 50kg   Cement         ₹385 / Bag     1,500B  [Edit]  │ │
│               │ └───────────────────────────────────────────────────────────────────┘ │
└───────────────┴───────────────────────────────────────────────────────────────────────┘
```

### 4.2 Tailwind CSS Configuration & Tokens (`tailwind.config.js`)
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        urbanico: {
          primary: '#FCB026',
          primaryLight: '#FFF8EB',
          darkBg: '#0F172A',
          cardDark: '#1E293B',
          borderDark: '#334155',
          textDark: '#18181B',
          textMuted: '#64748B',
          success: '#10B981',
          danger: '#EF4444',
          logistics: '#0284C7',
        },
      },
      borderRadius: {
        squircle: '14px',
        btn: '10px',
        badge: '6px',
      },
    },
  },
};
```

---

## 5. Security & Permission Guarding

All frontend Admin routes (`/admin/*`) implement an authentication wrapper that inspects the logged-in user's profile:

```tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AdminRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();

  // 1. Verify token exists
  if (!token || !user) {
    return <Navigate to="/admin/login" replace />;
  }

  // 2. Client-side sanity check against known admin role
  if (user.role !== 'admin') {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <div className="rounded-2xl border border-red-500/30 bg-slate-800 p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-red-400 mb-2">Access Denied</h2>
          <p className="text-sm text-slate-400">
            Your account ({user.email || user.phone}) is not authorized for executive administrative operations.
          </p>
        </div>
      </div>
    );
  }

  // 3. Render secure administrative workspace
  return <>{children}</>;
};
```

---

## 6. Development Setup & Launch

```bash
# 1. Enter admin portal project directory
cd urbanico-admin-web

# 2. Install dependencies
npm install

# 3. Configure environment
echo "VITE_API_BASE_URL=https://api.urbanico.in" > .env

# 4. Start local development server
npm run dev
```
