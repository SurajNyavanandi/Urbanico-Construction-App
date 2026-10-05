# Urbanico — Backend REST API & Services Architecture

## ⚙️ Overview
The Urbanico Backend is an enterprise-grade RESTful API built on **Express 5** and **Node.js** with TypeScript. It provides resilient endpoints for material catalog indexing, trade service booking, order lifecycle management, cryptographic payment verification via Razorpay, real-time fleet delivery coordinates, and automated database seeding.

---

## 🏗️ Architecture & Highlights
- **Runtime**: Node.js (via `tsx` in development, compiled to single bundle via ESBuild for production).
- **Framework**: Express 5.x with CORS, gzip compression, and body-parser middleware.
- **Database Engine**: MongoDB via **Mongoose 8** with robust connection pooling.
- **Resilient Fallback**: Built-in memory cache and seed fallback ensures seamless operation even if MongoDB Atlas URI is temporarily offline or unconfigured.
- **Security & Integrity**:
  - JWT token-based authentication with expiration headers.
  - Razorpay cryptographic HMAC-SHA256 signature verification.
  - Input sanitization, XSS protection, and rate-limiting middleware.
  - Universal development OTP (`DEV_OTP=123456`) for local testing.

---

## 📂 Directory Structure (`/Backend`)

```
Backend/
├── config/
│   └── db.ts                   # MongoDB Atlas Mongoose connection with reconnection logic
├── controllers/
│   ├── materialController.ts   # Catalog querying, filtering, search & detail endpoints
│   ├── serviceController.ts    # Trade service contractors & inspection bookings
│   ├── orderController.ts      # Cart checkout, order creation, and status transitions
│   ├── deliveryController.ts   # Live GPS telemetry, ETA calculation, and OTP verification
│   ├── paymentController.ts    # Razorpay order generation & webhook HMAC verification
│   ├── userController.ts       # Profile management, GSTIN validation, and address book
│   └── adminController.ts      # Analytics, fleet metrics, and inventory CRUD
├── middleware/
│   ├── auth.ts                 # JWT token decoding and role-based access checks
│   ├── errorHandler.ts         # Centralized error handler with standardized JSON output
│   ├── rateLimiter.ts          # Window-based request rate throttling
│   ├── requestLogger.ts        # Color-coded HTTP request performance logging
│   └── sanitizer.ts            # Sanitizes query strings and payload parameters
├── models/
│   ├── Category.ts             # Material hierarchy and trade categories
│   ├── Material.ts             # Product schema: SKU, grades, unit pricing & stock
│   ├── Service.ts              # Trade service schema: tradesperson details & pricing
│   ├── Order.ts                # Master order: line items, GST breakdown, and billing details
│   ├── Delivery.ts             # Shipment tracking: vehicle #, driver info, coordinates & OTP
│   └── User.ts                 # User profile: phone, role, GSTIN, addresses & credentials
├── routers/
│   ├── materialRouter.ts       # /api/materials/*
│   ├── serviceRouter.ts        # /api/services/*
│   ├── orderRouter.ts          # /api/orders/*
│   ├── deliveryRouter.ts       # /api/deliveries/*
│   ├── paymentRouter.ts        # /api/payments/*
│   ├── userRouter.ts           # /api/users/*
│   └── adminRouter.ts          # /api/admin/*
├── services/
│   ├── databaseSeeder.ts       # Auto-seeds catalog from master JSON on fresh boot
│   ├── materialService.ts      # Material query optimizations & stock level adjustments
│   ├── orderService.ts         # Order calculation & status state machines
│   ├── deliveryService.ts      # Driver assignment, GPS ping aggregation, and POD OTP
│   └── razorpayService.ts      # Razorpay order creation and signature validation
├── lib/
│   ├── mailer/                 # Nodemailer transport for automated PDF invoices
│   └── notifications/          # Push & SMS notification adapters
└── utils/
    ├── apiResponse.ts          # Unified standard response structure `{ success, data, error }`
    ├── memoryCache.ts          # In-memory LRU cache for high-throughput read operations
    └── dataStructures.ts       # B-Tree and graph utilities for rapid spatial/SKU lookups
```

---

## 📡 Key REST API Endpoints

### Materials & Catalog
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/materials` | Fetch paginated catalog with category, price & search filters |
| `GET` | `/api/materials/:id` | Fetch specific material by ID or SKU |
| `GET` | `/api/materials/categories` | List all material categories with product counts |

### Trade Services
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/services` | List all available skilled trade services (Masons, Plumbers, etc.) |
| `POST` | `/api/services/book` | Book on-site trade contractor inspection |

### Orders & Payments
| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/api/orders` | Create a new order with line items, tax, and site address |
| `GET` | `/api/orders/:orderNumber` | Get comprehensive order details, receipt & status |
| `POST` | `/api/payments/create-razorpay-order` | Generate Razorpay order ID for client checkout |
| `POST` | `/api/payments/verify` | Verify cryptographic HMAC signature for payment confirmation |

### Logistics & Deliveries
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/deliveries` | List active fleet shipments |
| `GET` | `/api/deliveries/:orderNumber` | Get delivery status, driver info, and live GPS coordinates |
| `PATCH` | `/api/deliveries/:id/location` | Ingest driver GPS telemetry update (latitude, longitude, speed) |
| `POST` | `/api/deliveries/:orderNumber/verify-otp` | Verify contractor OTP and mark order delivered |

---

## 🔐 Environment Configuration (`.env`)
```bash
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/urbanico?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key
DEV_OTP=123456
RAZORPAY_KEY_ID=rzp_test_YourKey
RAZORPAY_KEY_SECRET=YourSecretKey
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=procurement@urbanico.in
SMTP_PASS=app_password
```

---

## 🚀 Running the Backend
```bash
# Development (runs server with live TypeScript reload)
npm run dev

# Production Build & Start
npm run build
npm start
```
