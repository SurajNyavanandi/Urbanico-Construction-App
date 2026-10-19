# Urbanico Partner Mobile Application Specification
**Application Name:** **Urbanico Partner** (`com.urbanico.partner`)  
**Target Platform:** React Native (Expo SDK 51+ / Android & iOS) & PWA Mobile Web  
**Primary Users:** Heavy Tipper Drivers, Cement Logistics Fleet, Trade Contractors & Field Service Technicians  
**Version:** 2.1.0  

---

## 1. Application Purpose & User Personas

```
                              ┌───────────────────────────────────┐
                              │     Urbanico Partner Mobile       │
                              │       com.urbanico.partner        │
                              └─────────────────┬─────────────────┘
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       │                                                 │
                       ▼                                                 ▼
        ┌─────────────────────────────┐                   ┌─────────────────────────────┐
        │   Role 1: Fleet & Drivers   │                   │  Role 2: Trade Technicians  │
        │ • Tipper & Transit Mixers   │                   │ • Masonry & Slab Cast Crews │
        │ • Quarry to Site Logistics  │                   │ • Plumbers, Electricians    │
        │ • 4-Digit Handover OTP      │                   │ • Post-Visit BOQ Re-pricing │
        └──────────────┬──────────────┘                   └──────────────┬──────────────┘
                       │                                                 │
                       └────────────────────────┬────────────────────────┘
                                                │
                                                ▼
                               ┌─────────────────────────────────┐
                               │     Core Shared Capabilities    │
                               │ • Secure Mobile OTP Auth        │
                               │ • Real-time GPS Fleet Beacon    │
                               │ • Low-Connectivity Offline Sync │
                               │ • E-Way Bill & Camera Ingestion │
                               └─────────────────────────────────┘
```

The **Urbanico Partner App** bridges physical logistics and on-site technical services with the central backend engine:
1. **Material Logistics Drivers**: Pick up materials from direct quarries or factories, navigate to the contractor's site, and complete digital handover verification via 4-digit PIN.
2. **Field Trade Technicians**: Visit project sites for inspection/demo visits, measure physical dimensions, and calculate **final post-visit quotes** for materials and labor before work begins.

---

## 2. Urbanico Design System Tokens (Mobile)

All screens in the Partner App must adhere strictly to the Urbanico design language:

| Design Token | Color Hex | Usage in Partner App |
| :--- | :--- | :--- |
| **Primary Brand Accent** | `#FCB026` | Action buttons (`Start Trip`, `Verify OTP`), active tab icons, status badges |
| **Primary Soft Tint** | `#FFF8EB` | Background for current consignment card, badge backgrounds |
| **Dark Header & Background** | `#0F172A` | Top navigation bar, night-mode driving interface |
| **Card Surface (Light)** | `#FFFFFF` | Dispatches, inspection cards, form inputs |
| **Card Surface (Dark)** | `#1E293B` | Night driving cards and low-glare dark mode |
| **Card Border** | `#E2E8F0` / `#334155` | 1px subtle divider lines |
| **Text - Primary** | `#18181B` / `#F8FAFC` | Consignment title, client name, site location |
| **Text - Secondary** | `#64748B` / `#94A3B8` | Kilometers remaining, tonnage, timestamps |
| **Success / Verified** | `#10B981` | Delivery confirmed, payment received, OTP match |
| **Alert / Attention** | `#EF4444` | Delay warning, out of zone, OTP mismatch |
| **Logistics Action** | `#0284C7` | Navigate via Google Maps, phone site supervisor |
| **Corner Radius** | `14px` | Standard squircle radius for cards, modals, and sheets |
| **Button Radius** | `10px` | Primary touch targets (minimum 48px height) |
| **Badge Radius** | `6px` | Status indicators (`IN TRANSIT`, `SITE VISITED`) |

---

## 3. Application Navigation & Screen Workflows

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SPLASH & ROLE-AWARE LOGIN                       │
│ • Phone Number Input (+91) -> MSG91 SMS OTP (4 Digits)                 │
│ • Backend auto-detects role: 'driver' OR 'trade_partner'               │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
           (Role: 'driver')               (Role: 'trade_partner')
                    ▼                                ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────────────┐
│          DRIVER DASHBOARD             │ │       SERVICE PARTNER DASHBOARD       │
│ 1. Assigned Consignment Queue         │ │ 1. Today's Site Inspection Visits     │
│ 2. Load & Weighbridge Slip Preview    │ │ 2. Customer & Site Incharge Details   │
│ 3. Navigation & Turn-by-Turn GPS      │ │ 3. "Arrived on Site" GPS Check-in     │
│ 4. 4-Digit Handover OTP Modal         │ │ 4. Post-Visit BOQ Pricing Estimator   │
│ 5. Delivery Signed Acknowledgment     │ │ 5. Trigger Real-time Customer Payment │
└───────────────────────────────────────┘ └───────────────────────────────────────┘
```

---

## 4. Driver Module Specifications

### 4.1 Consignment Overview Card
- **Tonnage & Cargo Details**: `10 Tons • 20mm Granite Metal (Blue Aggr.)`
- **Pickup Source**: `Quarry #4, Patancheru Cluster`
- **Destination**: `Site #42, Financial District, Near ORR Exit 1`
- **Site Supervisor Contact**: One-tap phone button (`tel:+918317594246`)

### 4.2 Live GPS Tracking Beacon
- During transit (`status === 'in_transit'`), the app fires a background location ping every 30 seconds to:
  ```http
  POST /api/deliveries/update-location
  Authorization: Bearer <PARTNER_TOKEN>
  Content-Type: application/json

  {
    "deliveryId": "DEL-2026-9912",
    "latitude": 17.4435,
    "longitude": 78.3772,
    "speedKmph": 38.5
  }
  ```

### 4.3 4-Digit Handover OTP Verification (Delivery Handshake)
- When the truck arrives at the construction site, the driver requests the **4-Digit Delivery OTP** from the site incharge.
- The app renders an auto-focused, numeric 4-box input:
  ```http
  POST /api/deliveries/verify-handover
  Authorization: Bearer <PARTNER_TOKEN>
  Content-Type: application/json

  {
    "orderNumber": "ORD-2026-8812",
    "otp": "4912"
  }
  ```
- **Success State**: Displays a green confirmation checkmark (`#10B981`), marks the shipment as `delivered`, and enables digital pod/weighbridge photo upload.

---

## 5. Field Service Technician Module (Post-Visit Pricing)

### 5.1 The Field Problem It Solves
When a customer orders a trade service (e.g. *Concrete Slab Casting*, *Site Electrical Rough-in*, *Shoring & Excavation*), initial online bookings are only demo/inspection visits (`₹99` or base day rate).  
**After the technician visits the physical site, measurements and site safety hazards dictate the final price.**

### 5.2 Post-Visit Bill of Quantities (BOQ) Screen Flow
1. **Site Arrival & Check-In**: Technician taps `Arrived at Site`. GPS coordinates verify physical arrival within 200m of site pincode.
2. **Measurement Input Form**:
   - Area / Volume (e.g. `2,400 sq.ft.` or `45 Running Meters`)
   - Required Crew Size (e.g. `6 Masons, 4 Helpers`)
   - Machinery Requirements (e.g. `1x Needle Vibrator, 1x Mini Batch Mixer`)
   - Material Requisitions (e.g. `80 Bags PPC Cement, 4 Tons M-Sand`)
3. **Calculated Quote Adjustment API**:
   ```http
   POST /api/services/update-visit-quote
   Authorization: Bearer <PARTNER_TOKEN>
   Content-Type: application/json

   {
     "serviceOrderId": "SRV-ORD-7712",
     "siteInspectionNotes": "Foundation bedrock verified. Excavation requires heavy rock breaker attachment.",
     "revisedMaterialEstimate": 38400,
     "revisedLaborEstimate": 14500,
     "machineryRental": 6000,
     "totalPayable": 58900,
     "customerConfirmationRequested": true
   }
   ```
4. **Instant Customer Notification**:
   - The backend triggers an SMS and In-App Push to the customer showing the detailed breakdown.
   - The customer can tap **Approve & Pay via Razorpay** directly from their main Urbanico app.

---

## 6. Offline Support & Sync Queue (Construction Site Resilience)

Construction sites, basements, and quarries frequently lose cellular connectivity. The Partner App implements an offline synchronization engine:

1. **Local State Store**: SQLite / WatermelonDB / IndexedDB stores:
   - Today's assigned tasks and site details.
   - Cached geofences and customer phone numbers.
2. **Offline Handover**:
   - If the driver enters the OTP while offline, the app validates the SHA-256 hash of `(orderNumber + OTP + salt)` locally.
   - The completion event is placed in an `OfflineSyncQueue` and automatically dispatched as soon as 4G/5G connection resumes.

---

## 7. UI Screen Mockups & Component Specs

### 7.1 Dispatch Card Component (`React Native`)
```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin, Navigation, Phone, CheckCircle } from 'lucide-react-native';

export const ConsignmentCard = ({ consignment, onStartTrip, onVerifyOtp }) => (
  <View style={styles.card}>
    <View style={styles.headerRow}>
      <Text style={styles.orderNo}>{consignment.orderNumber}</Text>
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>{consignment.status.toUpperCase()}</Text>
      </View>
    </View>

    <Text style={styles.cargoTitle}>{consignment.cargoDescription}</Text>

    <View style={styles.locationRow}>
      <MapPin size={16} color="#FCB026" />
      <Text style={styles.locationText} numberOfLines={2}>
        {consignment.destinationAddress}
      </Text>
    </View>

    <View style={styles.actionsRow}>
      <TouchableOpacity style={styles.callBtn} onPress={consignment.onCall}>
        <Phone size={15} color="#18181B" />
        <Text style={styles.callBtnText}>Call Site</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.primaryBtn} onPress={onVerifyOtp}>
        <CheckCircle size={15} color="#18181B" />
        <Text style={styles.primaryBtnText}>Confirm Handover</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNo: {
    fontSize: 14,
    fontWeight: '800',
    color: '#18181B',
  },
  statusBadge: {
    backgroundColor: '#FFF8EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCB026',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#18181B',
  },
  cargoTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
    lineHeight: 17,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 10,
  },
  callBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#18181B',
  },
  primaryBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FCB026',
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#18181B',
  },
});
```

---

## 8. Development Setup & Launch

```bash
# 1. Clone & install mobile dependencies
cd urbanico-partner-app
npm install

# 2. Configure mobile env
echo "EXPO_PUBLIC_API_URL=https://api.urbanico.in" > .env

# 3. Start Expo development client
npx expo start --clear
```
