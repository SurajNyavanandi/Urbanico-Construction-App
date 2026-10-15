# Urbanico — Driver & Fleet Logistics Hub

## 🚚 Overview
The Urbanico Driver & Fleet Logistics system manages heavy freight transit from regional warehouses and cement/steel mills directly to active construction sites. It powers real-time vehicle GPS telemetry, live turn-by-turn routing, gate access instructions, and secure delivery completion via 6-digit Proof of Delivery (POD) OTP verification.

---

## 🛣️ Driver Workflow & Shipment Lifecycle

```
[1. Order Dispatched] ──> [2. Loading & Departure] ──> [3. In Transit & GPS Ping] ──> [4. Site Arrival & Gate Pass] ──> [5. OTP Handover & Verified]
```

### 1. Job Assignment & Manifest Acceptance
- Driver receives push notification and dispatch ticket with:
  - **Manifest Details**: Material types, tonnage, quantities (e.g., 200 bags Grade 53 OPC Cement, 2 metric tons 12mm TMT Rebar).
  - **Origin Hub**: Warehouse address and loading dock bay number.
  - **Destination**: Active construction site address, site supervisor name, and direct phone contact.
  - **Vehicle Data**: Registered vehicle plate number (e.g., `MH-12-AB-1234`) and gross vehicle weight (GVW).

### 2. Live GPS Telemetry Ingestion
- While vehicle is marked `in_transit`, the driver mobile device or vehicle IoT GPS transponder continuously streams updates to the Urbanico Backend.
- **Endpoint**: `PATCH /api/deliveries/:id/location`
- **Payload Schema**:
  ```json
  {
    "latitude": 19.0760,
    "longitude": 72.8777,
    "speed": 42.5,
    "heading": 185.0,
    "batteryLevel": 88,
    "timestamp": "2026-10-05T08:30:00.000Z"
  }
  ```
- **Consumer**: Enables the client-side `LiveTrackingScreen` and Admin map to display the moving vehicle marker and recalculated ETA in real time.

### 3. Job-Site Arrival & Gate Clearance
- Job sites often have strict delivery regulations (narrow residential lanes, overhead electric wire clearances, soft mud access, specific unloading zones).
- Driver interface displays:
  - **Site Access Notes**: e.g., *"Enter through Gate 3 off Ring Road; 10-wheel tippers must unload near Tower B batching plant."*
  - **Direct Site Contact Call Button**: One-tap dialing to the on-site receiving supervisor.

### 4. Proof of Delivery (POD) & OTP Verification
- To prevent material diversion, theft, or incomplete offloading, Urbanico implements synchronized high-entropy OTP verification:
  1. Every order placement and vehicle dispatch dynamically generates a **real, unpredictable 6-digit random OTP** (e.g., `749182`, `392815`).
  2. This code is synchronized across the customer's live tracking view, the Admin dispatch hub, and the driver delivery record.
  3. Once material inspection and unloading are completed at the job site, the client supervisor communicates the 6-digit code to the driver.
  4. The driver submits the OTP via the driver app:
     - **Endpoint**: `POST /api/deliveries/:orderNumber/verify-otp`
     - **Payload**: `{ "otp": "749182" }` (or universal development fallback `123456`)
  5. Once confirmed:
     - Both `Delivery` and `Order` statuses immediately transition to `delivered`.
     - Timestamped digital delivery challan and unloading confirmation are recorded.
     - Final tax invoice is automatically emailed to the contractor.

---

## 📡 Driver Logistics API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/deliveries` | List all assigned shipments for the fleet |
| `GET` | `/api/deliveries/:orderNumber` | Detailed delivery route, site GPS coords, and supervisor contact |
| `PATCH` | `/api/deliveries/:id/location` | Stream real-time GPS coordinates, speed, and heading |
| `POST` | `/api/deliveries/:orderNumber/verify-otp` | Submit supervisor OTP to confirm receipt and complete trip |

---

## 🛠️ Offline & Low-Connectivity Handling
- In basement pours, remote industrial areas, or rural construction sites with poor cell reception:
  - The driver app caches the last known coordinates locally in SQLite / local storage.
  - GPS points are queued and batched to `/api/deliveries/:id/location` as soon as network connectivity is restored.
  - Emergency phone verification is available through dispatch support if network is completely inaccessible.
