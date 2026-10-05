# Urbanico — Admin Portal & Operations Hub

## 🛠️ Overview
The Urbanico Admin Hub provides platform managers, inventory controllers, and logistics dispatchers with centralized controls to oversee procurement orders, real-time inventory levels, dynamic bulk pricing, trade contractors, driver fleet assignments, and company-wide financial metrics.

---

## 💼 Core Administrative Capabilities

### 1. Operations & Financial Metrics Dashboard
- **Revenue Analytics**: Daily, weekly, and monthly gross merchandise value (GMV) with currency formatting (₹ INR).
- **Order Volume Metrics**: Total orders placed, active shipments currently in transit, completed deliveries, and cancellation rates.
- **User & Fleet Counts**: Total registered contractors, active supervisors, site clients, and available transport vehicles.
- **Database & System Health**: Real-time MongoDB connection status, cache hit rates, and server uptime.

### 2. Catalog & Inventory Management
- **Material Lifecycle**: Add, update, or archive construction materials (Cement, Bricks, Sand, Steel TMT, Aggregates, Formwork).
- **Price & MOQ Controls**: Modify standard wholesale pricing, bulk tier discount thresholds (e.g., 50+ bags = 5% off, 100+ bags = 10% off), and minimum order quantities.
- **Stock Depletion Warnings**: Monitor regional warehouse stock levels with low-stock alerts before fulfillment bottlenecks occur.
- **Tax Classification**: Configure HSN/SAC codes and GST rates (5%, 12%, 18%, 28%) per product line.

### 3. Order Processing & Dispatch Management
- **Order State Machine**:
  - `confirmed` → Order accepted and inventory reserved.
  - `processing` → Material bagged, bundled, or loaded onto pallets at warehouse/mill.
  - `dispatched` → Shipment assigned to transport truck and driver.
  - `in_transit` → Vehicle en route to customer's active construction site.
  - `delivered` → Verified on-site via 6-digit handover OTP.
  - `cancelled` → Order voided with automated refund trigger.
- **Dispatch Scheduling**: Select expected delivery arrival windows based on site accessibility restrictions.

### 4. Fleet & Driver Assignment
- Allocate specific heavy vehicles (e.g., 10-wheel tippers, flatbed trucks, mini-trucks) and drivers to orders.
- Record driver names, verified contact phone numbers, and vehicle registration plates.
- Generate or reset customer delivery verification OTPs.

### 5. Role-Based Access Control (RBAC)
- User classifications:
  - `admin`: Full unrestricted control across all catalog, financial, and system settings.
  - `supervisor`: Site-level manager permitted to dispatch and verify orders.
  - `contractor`: Verified commercial builder with negotiated volume terms and credit lines.
  - `client` / `user`: Standard retail or renovation customer.

---

## 📂 Architecture & Endpoints (`/urbanico_admin` & `/Backend/routers/adminRouter.ts`)

```typescript
export const ADMIN_API_ENDPOINTS = {
  // Metrics & System Health
  GET_METRICS: '/api/admin/metrics',

  // Order Management
  GET_ORDERS: '/api/admin/orders',
  UPDATE_ORDER_STATUS: (id: string) => `/api/admin/orders/${id}/status`,
  UPDATE_ORDER_DISPATCH: (id: string) => `/api/admin/orders/${id}/dispatch`,

  // Materials & Stock Catalog
  CREATE_MATERIAL: '/api/admin/materials',
  UPDATE_MATERIAL: (id: string) => `/api/admin/materials/${id}`,
  DELETE_MATERIAL: (id: string) => `/api/admin/materials/${id}`,

  // User Accounts & Permissions
  GET_USERS: '/api/admin/users',
  UPDATE_USER_ROLE: (id: string) => `/api/admin/users/${id}/role`,
  DELETE_USER: (id: string) => `/api/admin/users/${id}`,
};
```

---

## 🔒 Security & Verification
- Admin endpoints require JWT authentication with `role: "admin"`.
- Requests from unauthorized roles are rejected with `403 Forbidden`.
- Critical destructive operations (such as catalog item deletion or order cancellation) require explicit confirmation and are audit-logged.
