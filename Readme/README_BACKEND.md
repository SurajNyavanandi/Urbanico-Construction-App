# Urbanico Core Backend & REST API Specification
**Version:** 3.4.0  
**Runtime:** Node.js (v20+) • Express.js • TypeScript • Mongoose (MongoDB Atlas)  
**Security Standard:** Enterprise RBAC • HMAC-SHA256 JWT • Zod Mass-Assignment Defense • Rate Limiting

---

## 1. System Architecture Overview

```
                          ┌────────────────────────┐
                          │   Client Applications  │
                          │ • Contractor Web App   │
                          │ • Urbanico Partner App │
                          │ • Executive Admin Web  │
                          └───────────┬────────────┘
                                      │ HTTPS / WSS / REST
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │       Express.js Edge Security & Gateway         │
             │ • Request Logger & 15s Timeout Shield            │
             │ • Sliding Window Rate Limiters                   │
             │ • NoSQL Injection & Prototype Sanitizer          │
             │ • HMAC-SHA256 JWT & RBAC Auth Middleware         │
             └────────────────────────┬─────────────────────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            │                         │                         │
            ▼                         ▼                         ▼
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│ Catalog & Pricing Svc │ │ Order & Delivery Svc  │ │ Payments & Billing    │
│ • Materials & Bundles │ │ • Live Consignment    │ │ • Razorpay Gateway    │
│ • Trade Services BOQ  │ │ • 4-Digit Handover OTP│ │ • 18% GST Invoice Eng │
│ • Instant Memory Cache│ │ • Driver Telemetry    │ │ • Penny-Drop Refund   │
└───────────┬───────────┘ └───────────┬───────────┘ └───────────┬───────────┘
            │                         │                         │
            └─────────────────────────┼─────────────────────────┘
                                      │
                                      ▼
                      ┌───────────────────────────────┐
                      │    MongoDB Atlas Cluster      │
                      │ • Materials • Services • Users│
                      │ • Orders • Deliveries • Audit │
                      └───────────────────────────────┘
```

---

## 2. Brand Identity & Design System Tokens

All external client apps connecting to this backend must share the **Urbanico Core Design System**:

| Token Key | Color Code | Purpose / Usage |
| :--- | :--- | :--- |
| **Primary Brand Accent** | `#FCB026` | Construction amber / gold; primary CTA buttons, active radio dots, brand badges |
| **Primary Soft Tint** | `#FFF8EB` | Light mode hover states, soft card badges, highlighted table rows |
| **Light Background** | `#F8FAFC` | Main application background in light mode (Slate 50) |
| **Light Card Surface** | `#FFFFFF` | Primary card containers, modals, and input fields |
| **Light Card Highlight** | `#F0F9FF` | Selected delivery sites, active consignments (Sky 50) |
| **Dark Background** | `#0F172A` | High-contrast dark viewport background (Slate 900) |
| **Dark Card Surface** | `#1E293B` | Elevation surface cards in dark mode (Slate 800) |
| **Dark Border** | `#334155` | 1px subtle divider lines in dark mode (Slate 700) |
| **Text Primary** | `#18181B` (light) / `#F8FAFC` (dark) | Main headings, material names, prices |
| **Text Secondary** | `#64748B` (light) / `#94A3B8` (dark) | Subtitles, specifications, helper text |
| **Status - Success** | `#10B981` | Delivered status, verified GSTIN badge, OTP confirmed |
| **Status - Danger** | `#EF4444` | Out of stock, payment failed, validation error |
| **Status - Warning** | `#F59E0B` | In-transit consignment, inspection required |
| **Status - Logistics** | `#0284C7` | Dispatch assigned, vehicle en-route |
| **Squircle Radius** | `14px` (cards) • `10px` (buttons) • `6px` (badges) | Apple-style rounded squircle geometry |

---

## 3. Environment Variables Configuration (`.env`)

```ini
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/urbanico?retryWrites=true&w=majority
JWT_SECRET=super_secret_cryptographic_key_min_64_chars_urbanico_2026
ADMIN_EMAILS=admin@urbanico.in,kanukulashekhar15@gmail.com,operations@urbanico.in
ADMIN_API_SECRET=urbanico_ops_secret_token_998822
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
MSG91_AUTH_KEY=xxxxxxxxxxxxxxxxxxxx
CORS_ORIGIN=https://urbanico.in,https://admin.urbanico.in,https://partner.urbanico.in
```

---

## 4. Authentication, Authorization & Security Hardening

### 4.1 Token Structure & Generation
- Tokens are standard JSON Web Tokens signed with HMAC-SHA256 (`HS256`).
- Session validity: **30 days** (`exp: Date.now() + 30 days`).
- Headers: `Authorization: Bearer <JWT_TOKEN>` or `x-admin-secret: <SECRET>` for machine-to-machine integrations.

### 4.2 Role-Based Access Control (RBAC) Matrix

| User Role | Public Catalog | Create Orders | Edit Own Profile | Confirm Handover OTP | Update Material/Price | Manage Users |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Guest / Public** | `READ ONLY` | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Contractor / Client** | `READ ONLY` | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Driver / Logistics** | `READ ONLY` | ❌ | ✅ | ✅ (Delivery) | ❌ | ❌ |
| **Trade Partner / Tech**| `READ ONLY` | ❌ | ✅ | ✅ (Visit BOQ) | ❌ | ❌ |
| **Admin (In Allowlist)**| `FULL CRUD` | ✅ | ✅ | ✅ | ✅ (`FULL CRUD`) | ✅ |

### 4.3 Mass-Assignment & NoSQL Injection Defense
Every incoming mutating payload is validated via Zod schemas (`Backend/validators/adminValidator.ts`). All unwhitelisted fields are automatically stripped, and keys containing `$` or `.` are rejected with `HTTP 400 (Security Violation)`.

---

## 5. REST API Endpoints Specification

### 5.1 Materials & Catalog (Public Read-Only)

#### `GET /api/materials`
Retrieve paginated construction materials with optional category and search filters.
```bash
curl -X GET "http://localhost:3000/api/materials?category=Cement&page=1&limit=20"
```
**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 35,
    "count": 20,
    "page": 1,
    "totalPages": 2,
    "materials": [
      {
        "id": "ultra_tech_ppc",
        "name": "UltraTech PPC Cement (50kg Bag)",
        "category": "Cement",
        "defaultPrice": 385,
        "unit": "Bag",
        "stockQuantity": 1500,
        "inStock": true,
        "densityTonsPerUnit": 0.05,
        "gstRate": 18,
        "imageUrl": "https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614395/cement2_s1pf60.jpg"
      }
    ]
  }
}
```

---

### 5.2 Admin Material CRUD Operations (Strictly Authenticated)

#### `POST /api/admin/materials`
Create a new construction material in the catalog.
```bash
curl -X POST http://localhost:3000/api/admin/materials \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "M-Sand (Zone II Manufactured Sand)",
    "category": "Sand & Aggregates",
    "categoryId": "sand",
    "defaultPrice": 1650,
    "unit": "Ton",
    "stockQuantity": 5000,
    "densityTonsPerUnit": 1.0,
    "gstRate": 18,
    "description": "Triple washed manufactured sand for high strength slab casting"
  }'
```
**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "message": "New construction material added to catalog",
    "material": {
      "id": "m_sand_zone_ii",
      "name": "M-Sand (Zone II Manufactured Sand)",
      "defaultPrice": 1650,
      "unit": "Ton"
    }
  }
}
```

#### `PUT /api/admin/materials/:id`
Update material price, stock, or specifications. **Automatically triggers an Audit Log record with old vs. new price**.
```bash
curl -X PUT http://localhost:3000/api/admin/materials/m_sand_zone_ii \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "defaultPrice": 1720,
    "stockQuantity": 4200
  }'
```
**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Material updated successfully in catalog",
    "material": {
      "id": "m_sand_zone_ii",
      "name": "M-Sand (Zone II Manufactured Sand)",
      "defaultPrice": 1720
    }
  }
}
```

#### `DELETE /api/admin/materials/:id`
Deactivate or remove a material item from the catalog.
```bash
curl -X DELETE http://localhost:3000/api/admin/materials/m_sand_zone_ii \
  -H "Authorization: Bearer <ADMIN_JWT>"
```

---

### 5.3 Trade Services & Site Visit Endpoints

#### `GET /api/services`
Retrieve trade services and machinery rentals.
```bash
curl -X GET http://localhost:3000/api/services
```
**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "count": 6,
    "services": [
      {
        "id": "slab_casting_crew",
        "name": "Concrete Slab Casting Crew",
        "rate": "₹850 / Day / Mason",
        "ratePerWorkerDay": 850,
        "minHeadcount": 4,
        "description": "Certified RCC slab casting squad with vibration needles and safety kits."
      }
    ]
  }
}
```

#### `POST /api/admin/services` & `PUT /api/admin/services/:id`
Create or modify trade service rates, descriptions, and headcount minimums.

---

### 5.4 Partner App Endpoints (Drivers & Service Technicians)

#### `GET /api/deliveries/assigned`
Fetch pending dispatches for the logged-in driver's phone number.
```bash
curl -X GET http://localhost:3000/api/deliveries/assigned \
  -H "Authorization: Bearer <PARTNER_JWT>"
```

#### `POST /api/deliveries/update-location`
Push real-time vehicle GPS coordinates during active shipment.
```bash
curl -X POST http://localhost:3000/api/deliveries/update-location \
  -H "Authorization: Bearer <PARTNER_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "deliveryId": "del_99812",
    "latitude": 17.4435,
    "longitude": 78.3772,
    "speedKmph": 34
  }'
```

#### `POST /api/deliveries/verify-handover`
Confirm material unloading using the customer's secret 4-digit OTP.
```bash
curl -X POST http://localhost:3000/api/deliveries/verify-handover \
  -H "Authorization: Bearer <PARTNER_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "ORD-2026-8812",
    "otp": "4912"
  }'
```
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Delivery verified successfully. Order marked as DELIVERED."
}
```

#### `POST /api/services/update-visit-quote`
Allows a verified field technician to update the final measurement and Bill of Quantities (BOQ) price after inspecting the project site.
```bash
curl -X POST http://localhost:3000/api/services/update-visit-quote \
  -H "Authorization: Bearer <PARTNER_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceOrderId": "SRV-ORD-7712",
    "siteInspectionNotes": "Roof area measured at 2,400 sq.ft. Requires 6 masons and 2 mixer units.",
    "revisedMaterialEstimate": 48500,
    "revisedLaborEstimate": 18000,
    "totalPayable": 66500,
    "customerConfirmationRequested": true
  }'
```

---

### 5.5 Audit Trail API (`/api/admin/audit-logs`)
Retrieve tamper-proof audit trails of price alterations, dispatches, and role elevations.
```bash
curl -X GET "http://localhost:3000/api/admin/audit-logs?limit=50" \
  -H "Authorization: Bearer <ADMIN_JWT>"
```
**Response Item:**
```json
{
  "action": "admin.material_update",
  "actorType": "admin",
  "actorId": "admin@urbanico.in",
  "targetType": "material",
  "targetId": "m_sand_zone_ii",
  "details": {
    "materialName": "M-Sand (Zone II)",
    "oldPrice": 1650,
    "newPrice": 1720,
    "priceChanged": true,
    "modifiedFields": ["defaultPrice"]
  },
  "ip": "203.0.113.195",
  "createdAt": "2026-10-19T09:15:20.112Z"
}
```

---

## 6. Database Schemas (Mongoose)

### 6.1 `Material` Schema
```typescript
{
  id: { type: String, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, index: true },
  defaultPrice: { type: Number, required: true },
  basePrice: { type: Number },
  unit: { type: String, default: 'Unit' },
  hsnCode: { type: String },
  gstRate: { type: Number, default: 18 },
  inStock: { type: Boolean, default: true },
  stockQuantity: { type: Number, default: 1000 },
  densityTonsPerUnit: { type: Number, default: 1.0 },
  imageUrl: { type: String },
  timestamps: true
}
```

### 6.2 `AuditLog` Schema
```typescript
{
  action: { type: String, required: true, index: true },
  actorType: { type: String, enum: ['user', 'admin', 'system', 'gateway'], required: true },
  actorId: { type: String, index: true },
  targetType: { type: String, required: true },
  targetId: { type: String, index: true },
  details: { type: Schema.Types.Mixed },
  ip: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now, index: -1 }
}
```

---

## 7. Development & Deployment Instructions

```bash
# 1. Install dependencies
npm install

# 2. Run developer environment with hot-reload and MongoDB connection
npm run dev

# 3. Production build
npm run build

# 4. Start production node process
npm start
```
