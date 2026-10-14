# Urbanico — Frontend Client Architecture & Documentation

## 📱 Overview
Urbanico Frontend is a modern, high-performance web and hybrid mobile interface built with **React 19**, **TypeScript**, and **Vite**, utilizing **React Native Web** shims and **Tailwind CSS v4** to deliver a responsive, tactile B2B/B2C construction materials and trade services procurement experience.

---

## 🏗️ Tech Stack
- **Framework**: React 19 (Strict Mode)
- **Language**: TypeScript (ES2022)
- **Bundler & Dev Server**: Vite 6 with `@tailwindcss/vite`
- **Component Shims**: Custom zero-dependency React Native Web compatibility layer (`react-native`, `react-native-safe-area-context`, `expo-status-bar`, `lucide-react-native`, `expo-location`)
- **Styling**: Tailwind CSS v4 + Global Design System CSS custom properties in `src/index.css`
- **Animations**: CSS keyframes (`pulseGlowRing`, `radarWave`, `heartPop`, `shimmerSlide`) and fluid transitions
- **Icons**: Lucide Icons (mapped seamlessly for mobile and desktop web)
- **Mapping**: Google Maps / OpenStreetMap interactive site location picker with GPS geolocation support

---

## 📂 Directory Structure (`/Urbanico/src`)

```
Urbanico/src/
├── App.tsx                     # Top-level application shell with providers & modal orchestration
├── main.tsx                    # Client entry point with web shims & strict-mode mounting
├── index.css                   # Tailwind v4 imports, CSS design tokens & mobile container constraints
├── components/
│   ├── HomeScreen.tsx          # Homepage with category grids, ticker, showcase, and project bundles
│   ├── ShopScreen.tsx          # Comprehensive catalog with dynamic filtering & quick-order actions
│   ├── BasketScreen.tsx        # Cart calculation, bulk volume tiering, coupon bar & checkout trigger
│   ├── ActivityDashboardScreen # Live orders timeline, active shipments, delivery status & receipts
│   ├── LiveTrackingScreen.tsx  # Interactive map tracking for in-transit transit concrete & trucks
│   ├── UserProfileScreen.tsx   # Account settings, GSTIN details, addresses, and saved payment methods
│   ├── Header.tsx              # Brand header with location selector, search bar & notifications
│   ├── BottomNav.tsx           # Floating modern mobile tab bar with live badge counters
│   ├── common/                 # Reusable atomic UI components:
│   │   ├── PriceTag.tsx        # Formatted Indian Rupee pricing with unit indicators
│   │   ├── QuantityStepper.tsx # Increment/decrement steppers with minimum volume step enforcement
│   │   ├── StatusBadge.tsx     # Color-coded pill tags for delivery and order statuses
│   │   ├── RazorpayModal.tsx   # Checkout overlay with UPI QR code, Cards, and NetBanking options
│   │   ├── GoogleMapPicker.tsx # Map pin selector for exact job-site coordinates
│   │   └── UrbanicoLoadingSpinner.tsx # Branded spinner with dynamic procurement progress steps
│   ├── features/               # Modular screen components (CartItemList, OrderSummaryCard, etc.)
│   └── modals/                 # AppModalsContainer for Auth, Address, Invoice, and Location popups
├── context/
│   ├── CartContext.tsx         # Persistent cart state, item mutations, bulk discounts & GST math
│   ├── LocationContext.tsx     # Selected delivery site address, city, and GPS coordinates
│   ├── ThemeContext.tsx        # Contrast themes, accent color customization & dark mode
│   ├── LanguageContext.tsx     # Multi-lingual localization support (English, Hindi, etc.)
│   └── ToastContext.tsx        # Lightweight floating feedback toasts
├── hooks/
│   ├── useUrbanicoApp.ts       # Unified facade hook connecting router, auth, cart, and modals
│   ├── useBasket.ts            # Cart operations, line items, and summary calculations
│   ├── useHomeFeed.ts          # Featured banners, hero cards, and promotional videos
│   ├── useCatalogFilter.ts     # Multi-attribute search, category selection, and price filtering
│   └── useOrderManager.ts      # Active order fetching, status polling, and invoice download
├── services/
│   ├── apiService.ts           # Axios/Fetch client wrapper with graceful offline fallback
│   ├── razorpayService.ts      # Razorpay client checkout script loader & handler
│   └── searchService.ts        # Instant catalog index search
└── utils/
    ├── cartCalculations.ts     # Bulk volume tier discount rules and state GST calculation
    ├── freightCalculator.ts    # Tonnage and distance-based job-site trucking freight estimates
    └── invoiceHelper.ts        # Proforma quotation and tax invoice PDF/printable renderer
```

---

## 💡 Core Features & Workflows

### 1. Catalog & Direct-from-Mill Procurement
- **Materials**: Cement (50kg bags/tons), Bricks & Blocks (per piece/pallet), Sand (M-Sand/P-Sand), Aggregates (10mm/20mm/40mm), Steel TMT Rebars (Fe-550D 8mm-16mm), Centring Plywood & Props, Tiles & Flooring.
- **Trade Services**: Licensed contractors (Masons, Painters, Fabricators, Electricians, Plumbers, Carpenters) with ₹99 on-site inspection booking.
- **Pre-Engineered Bundles**: Foundation & Slab Ready Bundle, Brickwork & Mortar Combo, Plastering Pack, and Steel Reinforcement Pack.

### 2. Smart Cart & Bulk Volume Pricing
- Automated tiered discounts when volume thresholds are met (e.g., 50+ cement bags or 3+ tons of steel).
- Itemized GST computation (5%, 12%, 18%, 28%) and live site-access freight calculations.
- Coupon engine supporting instant promo discount validation.

### 3. Native Job-Site Geolocation
- Captures exact GPS latitude and longitude coordinates.
- Stores delivery site instructions (e.g., "Enter via North gate, heavy 10-wheel tipper accessible").

### 4. Interactive Live Tracking & OTP Verification
- Map view tracking dispatched trucks in real time with driver vehicle number and ETA.
- Verification OTP displayed for contractor supervisor to hand over to driver upon arrival.

---

## 🚀 Running & Developing Frontend

### Start Dev Server
```bash
npm run dev
```
Runs at `http://localhost:3000`. Express server serves API endpoints and proxies frontend client in development.

### Type Check & Build
```bash
npm run lint    # Static TypeScript validation
npm run build   # Production client build via Vite
```
