# Hospital WhatsApp CRM Backend & Admin System

An enterprise-ready, production-grade CRM backend and chatbot system designed for hospitals. Built using clean architecture (Repository Pattern + Service Layer + MVC), Node.js, Express.js, TypeScript, PostgreSQL (Neon), and Prisma ORM.

It includes a stateful WhatsApp Chatbot simulator that handles appointment bookings, stores complete conversations, and allows hospital receptionists to review bookings, assign doctors, and send real-time confirmation notifications back to patients.

---

## Architecture & Design Pattern

The codebase enforces a highly structured, scalable MVC + Service + Repository layout adhering to **SOLID** principles:

```
src/
  ├── config/         # Server logs and database pool initializers
  ├── controllers/    # Express controllers (validates request body via Zod, sends API responses)
  ├── interfaces/     # Service contracts (like IMessagingService)
  ├── middlewares/    # Express HTTP pipeline (JWT auth, RBAC, Rate-limit, Global Error Handler)
  ├── repositories/   # Data access logic (fully decouples Prisma schema from services)
  ├── routes/         # Router mounting per domain
  ├── services/       # Core business logic & Chatbot state machine orchestrator
  ├── types/          # TypeScript declarations (Request context expansions)
  ├── utils/          # Standard response structures
  ├── app.ts          # Express application setup
  └── server.ts       # Server boot, Socket.io integration and shutdown handlers
```

- **Repository Pattern**: Prevents business logic from directly communicating with Prisma. This makes the database layer mockable and easily replaceable.
- **Service Layer**: House for pure business requirements (appointment confirmation, authentication, dashboard metric computation).
- **Controller MVC Layer**: Responsible for mapping HTTP verbs, running Zod validation schemas, and returning standard REST envelopes.
- **Dependency Abstraction**: The messaging client is resolved via `MessagingServiceFactory`. To switch providers (e.g. from Mock logging to real Meta WhatsApp APIs), you only change `MESSAGE_PROVIDER` in `.env` without modifying a single line of business logic.

---

## Database Schema (Prisma Models)

- **User**: System staff (roles: `ADMIN`, `RECEPTIONIST`).
- **Patient**: Registered patients (full name, phone, address, coordinates).
- **Doctor**: Medical staff with department, specialization, and availability parameters.
- **Appointment**: Tracks patient bookings. Receptionists assign doctors to pending bookings, advancing status: `PENDING` ➔ `ASSIGNED` ➔ `CONFIRMED` ➔ `CHECKED_IN` ➔ `CONSULTATION_STARTED` ➔ `COMPLETED` / `CANCELLED` / `NO_SHOW`.
- **Conversation**: Complete chronological chat log tracking sender, messageType (`TEXT`, `IMAGE`, `DOCUMENT`, `LOCATION`), message content, and deliveryStatus.
- **ChatSession**: Manages temporary chatbot questionnaire state machine to prevent writing junk records into patient/appointment tables until completion.
- **HospitalSettings**: Single-record settings (emergency number, maps link, hours of operation).
- **AuditLog**: Fully tracks user logins, doctor assignments, status updates, settings edits, and chatbot actions.

---

## Setup & Running Guide

### 1. Prerequisites
- Node.js (v20+)
- PostgreSQL database (or Neon cloud database instance)
- Docker & Docker Compose (optional for local database container)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Copy `.env.example` into a new file `.env` and adjust the variables:
```bash
cp .env.example .env
```
Ensure you set your PostgreSQL URL in `DATABASE_URL`.

### 4. Database Setup & Seeding
Deploy database schemas and seed initial data (contains 14 hospital departments, 15 pre-configured doctors, receptionist credentials, and settings):
```bash
# Push schema definition to PostgreSQL
npx prisma db push

# Seed the database
npm run prisma:seed
```

### 5. Running the Application
```bash
# Start development server with hot-reload (nodemon)
npm run dev

# Build TypeScript to production JavaScript
npm run build

# Start production server
npm run start
```

### 6. Run via Docker Compose
To boot both the Node backend and an isolated local PostgreSQL container:
```bash
docker-compose up --build
```

---

## API Documentation

### 1. Authentication APIs
- **POST** `/api/auth/login`
  - Body: `{ "email": "admin@hospital.com", "password": "AdminPass123!" }`
  - Returns JWT Bearer token and user details.
- **POST** `/api/auth/register` (Protected - Admin only)
  - Body: `{ "name": "Sarah Nurse", "email": "sarah@hospital.com", "password": "SafePassword123", "role": "RECEPTIONIST" }`
- **GET** `/api/auth/me` (Protected - Staff only)
  - Returns authenticated staff user payload.

### 2. Patient Profile APIs
- **GET** `/api/patients` (Protected - Staff only, supports pagination, filtering, search)
  - Query params: `page=1&limit=10&search=John`
- **POST** `/api/patients` (Protected - Staff only)
- **GET** `/api/patients/:id` (Protected - Staff only)
- **PUT** `/api/patients/:id` (Protected - Staff only)
- **DELETE** `/api/patients/:id` (Protected - Staff only)

### 3. Doctor Roster APIs
- **GET** `/api/doctors` (Protected - Staff only, supports filters and search)
  - Query params: `department=Cardiology&search=Ramesh`
- **POST** `/api/doctors` (Protected - Admin only)
- **PUT** `/api/doctors/:id` (Protected - Admin only)
- **DELETE** `/api/doctors/:id` (Protected - Admin only)

### 4. Appointment Management APIs
- **GET** `/api/appointments` (Protected - Staff only, supports pagination, filtering)
  - Query params: `status=PENDING&department=ENT`
- **POST** `/api/appointments` (Protected - Staff only - manual booking)
- **PATCH** `/api/appointments/:id/assign` (Protected - Staff only - manual doctor assignment)
  - Body: `{ "doctorId": "<doctor-uuid>" }`
  - *Note*: Assigning a doctor automatically shifts status to `CONFIRMED` and logs/triggers a WhatsApp message confirmation to the patient.
- **PATCH** `/api/appointments/:id/status` (Protected - Staff only - lifecycle state updates)
  - Body: `{ "status": "CHECKED_IN" }`
- **DELETE** `/api/appointments/:id` (Protected - Staff only)

### 5. Chat History & CRM Inbox APIs
- **GET** `/api/conversations/inbox` (Protected - Staff only)
  - Returns active patient threads sorted by latest message timestamp for the WhatsApp Inbox list.
- **GET** `/api/conversations/history/:patientId` (Protected - Staff only)
  - Returns complete chronological conversation log for the patient.
- **POST** `/api/conversations/send` (Protected - Staff only - Manual reply)
  - Body: `{ "patientId": "<uuid>", "message": "Your lab report is ready.", "messageType": "TEXT" }`
  - Sends a direct message to the patient (simulated via Mock or sent via WhatsApp API).

### 6. Admin Dashboard & Reports APIs
- **GET** `/api/dashboard/stats` (Protected - Staff only)
  - Returns core metrics: total patients/doctors, pending bookings, active schedules, and completion/cancellation rates.
- **GET** `/api/dashboard/reports` (Protected - Staff only)
  - Returns daily trends, booking rates.
- **GET** `/api/dashboard/audit-logs` (Protected - Admin only)
  - Returns system audit trail log records.

### 7. Settings APIs
- **GET** `/api/settings` (Protected - Staff only)
- **PUT** `/api/settings` (Protected - Admin only)
  - Updates hospital contact details and hours of operation.

---

## Chatbot Webhook & Simulator

### Real / Meta API Configuration
- **GET** `/api/webhook/whatsapp`
  - Meta Webhook Validation endpoint. Once you configure your Meta Webhook, use your custom `hub.verify_token` defined in `.env` to register.
- **POST** `/api/webhook/whatsapp`
  - Handles incoming WhatsApp payloads. Supports parsing real Meta Cloud API messages (`entry[0].changes[0].value.messages[0]`) or REST simulation payloads.

### Local Simulation Curl Steps
To test the stateful chatbot step-by-step without Meta setup, run these consecutive POST curl requests simulating a patient from phone number `+919999988888`:

1. **Step 1: Initiate Flow**
   ```bash
   curl -X POST http://localhost:5000/api/webhook/whatsapp \
     -H "Content-Type: application/json" \
     -d '{"phone": "+919999988888", "message": "hi"}'
   # Response: Welcome to Linelekunda Hospital Booking Bot! May I know your name?
   ```

2. **Step 2: Submit Name**
   ```bash
   curl -X POST https://website-test-b3gv.onrender.com/api/webhook/whatsapp \
     -H "Content-Type: application/json" \
     -d '{"phone": "+919999988888", "message": "Alice Johnson"}'
   # Response: What department do you need? (Lists departments)
   ```

3. **Step 3: Select Department**
   ```bash
   curl -X POST http://localhost:5000/api/webhook/whatsapp \
     -H "Content-Type: application/json" \
     -d '{"phone": "+919999988888", "message": "Cardiology"}'
   # Response: What is the reason for your visit in Cardiology?
   ```

4. **Step 4: Submit Reason**
   ```bash
   curl -X POST http://localhost:5000/api/webhook/whatsapp \
     -H "Content-Type: application/json" \
     -d '{"phone": "+919999988888", "message": "Routine checkup"}'
   # Response: What is your preferred date? (Format: YYYY-MM-DD or Today/Tomorrow)
   ```

5. **Step 5: Submit Date**
   ```bash
   curl -X POST http://localhost:5000/api/webhook/whatsapp \
     -H "Content-Type: application/json" \
     -d '{"phone": "+919999988888", "message": "2026-08-15"}'
   # Response: What is your preferred slot/time? (e.g. 10:00 AM)
   ```

6. **Step 6: Submit Time**
   ```bash
   curl -X POST http://localhost:5000/api/webhook/whatsapp \
     -H "Content-Type: application/json" \
     -d '{"phone": "+919999988888", "message": "11:00 AM"}'
   # Response: Could you please provide your residential address?
   ```

7. **Step 7: Submit Address**
   ```bash
   curl -X POST http://localhost:5000/api/webhook/whatsapp \
     -H "Content-Type: application/json" \
     -d '{"phone": "+919999988888", "message": "A-45 Green Park, New Delhi"}'
   # Response: Please share your location or say "skip"
   ```

8. **Step 8: Submit Coordinates / Location**
   ```bash
   curl -X POST http://localhost:5000/api/webhook/whatsapp \
     -H "Content-Type: application/json" \
     -d '{"phone": "+919999988888", "message": "skip"}'
   # Response: Thank you, Alice! Your appointment request has been submitted successfully (PENDING).
   ```

Once Step 8 completes:
1. `Patient` profile is saved.
2. `Appointment` is saved in status `PENDING`.
3. Audit Log registers the action.
4. Socket.IO emits a `new_appointment` event to the admin dashboard.
5. In the CRM admin, the receptionist calls `PATCH /api/appointments/:id/assign` with a selected doctor ID. This transitions the appointment status to `CONFIRMED` and logs the confirmation message.

---

## Real-Time Notifications
The backend uses **Socket.IO** to feed the dashboard in real time.
### Emitted Events:
- `new_appointment`: Fired when a chatbot finishes booking, broadcasting the patient and booking details.
- `update_appointment`: Fired when a status updates or a doctor is assigned.
- `delete_appointment`: Fired when a booking is deleted.
- `new_message`: Fired when a patient or bot logs a chat message, synchronizing the WhatsApp Inbox console real-time.
# hospitalcrm
# linelekuda-web
# linelekunda-web-backend
