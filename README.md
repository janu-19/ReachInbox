# ReachInbox - Scalable Email Scheduling & Dispatching Platform

ReachInbox is a high-performance, production-ready email scheduling and automated dispatching platform designed to orchestrate outbound email campaigns. It supports multiple sender SMTP credentials, dynamic personalization merge tags, precise delay spacing between sends, strict hourly rate limits, idempotency guarantees, and resilient task recovery.

---

## 🏗️ System Architecture

The platform is structured into a modular, decoupled workspace separating client-side and server-side runtimes:

```mermaid
flowchart TD
    subgraph Client [React Frontend - Port 80/5173]
        A[Vite Client SPA] --> B[Axios API Handler]
        B --> C[OAuth Auth Context]
    end

    subgraph Server [Express Backend - Port 5000]
        D[Router REST Endpoints] --> E[Zod Schema Validator]
        E --> F[Prisma client ORM]
        D --> G[BullMQ Queue Manager]
    end

    subgraph Storage [Databases & Cache]
        F --> H[(MySQL - Port 3307)]
        G --> I[(Redis Cache - Port 6379)]
    end

    subgraph Worker [Background Processors]
        J[BullMQ Worker Daemon] --> I
        J --> F
        J --> K[Nodemailer Dispatcher]
    end
```

### Core Stack Components:
* **Frontend:** React, TypeScript, TailwindCSS/Vanilla CSS, Vite (client-side compiler), and Lucide icons.
* **Backend:** Node.js, Express, TypeScript, Zod validations, JWT sessions, and winston logger.
* **Database & ORM:** MySQL 8 storing structural relationships, handled via Prisma ORM.
* **Queue & Scheduler:** Redis-backed BullMQ processing background email worker loops.
* **SMTP Delivery:** Nodemailer managing dynamic Ethereal, Gmail, Outlook, or custom SMTP configurations.

---

## 📁 Workspace Folder Structure

```
ReachInbox/
├── docker-compose.yml           # Multi-container orchestration configurations
├── README.md                    # Project documentation
├── backend/
│   ├── Dockerfile               # Backend TS build and database push containerization
│   ├── prisma/
│   │   └── schema.prisma        # Prisma relational database definitions and index ledgers
│   ├── src/
│   │   ├── app.ts               # Express bootstrapper & worker mounts
│   │   ├── config/              # Prisma & Redis client instantiations
│   │   ├── middleware/          # JWT auth, Zod validation, and Express error handlers
│   │   ├── services/            # Google OAuth, Nodemailer, and Campaign Scheduler services
│   │   ├── workers/             # BullMQ background worker loops
│   │   ├── queue/               # Redis queue definitions & logger event listeners
│   │   ├── controllers/         # REST API request handlers
│   │   ├── routes/              # Express route mappings
│   │   └── tests/               # Backend integration testing suite
│   ├── tsconfig.json
│   └── package.json
└── frontend/
    ├── Dockerfile               # Vite build asset pipeline and Nginx server bundle
    ├── src/
    │   ├── main.tsx             # Route setups and global contexts wrap
    │   ├── services/            # Axios API proxy configs
    │   ├── context/             # Auth state provider and mock logins handler
    │   ├── components/          # Layout sidebar, inspect modals, and reusable table components
    │   ├── pages/               # Senders SMTP link, Compose campaign, and Emails dashboard logs
    │   └── index.css            # Stylesheets
    ├── tsconfig.json
    └── package.json
```

---

## 🛠️ Environment Variables

### Backend Configuration (`backend/.env`)
Create a file at `backend/.env` containing:
```env
PORT=5000
NODE_ENV=production
DATABASE_URL="mysql://scheduler_user:scheduler_password_123@localhost:3307/email_scheduler"
REDIS_URL="redis://127.0.0.1:6379"
JWT_SECRET="your_secure_jwt_secret_key_change_me"

# Test SMTP Credentials
ETHEREAL_USER="your_ethereal_user"
ETHEREAL_PASS="your_ethereal_password"

# Google Authentication
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
```

### Frontend Configuration (`frontend/.env`)
Create a file at `frontend/.env` containing:
```env
VITE_API_URL="http://localhost:5000/api"
VITE_GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
```

---

## 🚀 Quick Setup & Run

### Method 1: Start the Entire Project with One Command (Recommended)
Make sure Docker is active and run the following command at the root of the workspace directory:
```bash
docker compose up --build
```
This builds and boots the entire stack:
* **Frontend Workspace:** Access it at `http://localhost:80`
* **Backend API Gateway:** Access endpoints at `http://localhost:5000`
* **MySQL Database:** Local port mapping exposed on `127.0.0.1:3307`
* **Redis Instance:** Access caching at `127.0.0.1:6379`

### Method 2: Local Developer Startup (Step-by-Step)
If you prefer running services directly on your host machine:

1. **Start Docker Containers (Databases Only):**
   ```bash
   docker compose up mysql redis -d
   ```
2. **Setup and Boot Backend Service:**
   ```bash
   cd backend
   npm install
   npx prisma db push
   npm run dev
   ```
3. **Setup and Boot Frontend Client:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 🧪 Running the Test Suite
The backend contains a dedicated integration test suite verifying APIs, validations, delayed queues, idempotency, and hourly rate checks. Run it with:
```bash
cd backend
npm run test
```

---

## 📖 API Documentation

All routes require a JWT bearer token injected as `Authorization: Bearer <token>` (except authentication paths).

### 1. Authentication
* **`POST /api/auth/google`**
  * Exchange a Google credential token (idToken) for a backend session JWT.
  * *Request Body:* `{ "token": "google_id_token" }`
  * *Response:* `{ "token": "jwt_token", "user": { "id": "...", "email": "..." } }`

### 2. Connected SMTP Senders
* **`POST /api/senders`**
  * Link a new SMTP outbound sender account.
  * *Request Body:*
    ```json
    {
      "name": "Outbox Agent",
      "email": "agent@company.com",
      "provider": "CUSTOM_SMTP",
      "smtpHost": "smtp.company.com",
      "smtpPort": 587,
      "smtpUser": "agent@company.com",
      "smtpPass": "password123"
    }
    ```
* **`GET /api/senders`**
  * List all linked sender SMTP accounts.

### 3. Campaign Scheduling
* **`POST /api/schedule`**
  * Schedule a campaign with automated delay spacing, merge variables, and rate limiters.
  * *Request Body:*
    ```json
    {
      "name": "Summer Sales Campaign",
      "subject": "Hi {{ firstname }}, check our deals!",
      "body": "Hi {{ firstname }}, check out Acme Inc deals.",
      "senderAccountId": "sender-uuid-value",
      "startTime": "2026-07-28T12:00:00.000Z",
      "delaySeconds": 5,
      "hourlyLimit": 100,
      "recipients": [
        { "email": "alice@client.com", "variables": { "firstname": "Alice" } },
        { "email": "bob@client.com", "variables": { "firstname": "Bob" } }
      ]
    }
    ```
  * *Response (201 Created):* `{ "campaignId": "...", "totalScheduled": 2 }`

### 4. Emails Audit Logs
* **`GET /api/emails`**
  * Fetch and paginate audit logs. Supports query parameters `search` (recipient email) and `status` (`SCHEDULED`, `SENDING`, `SENT`, `FAILED`).
* **`GET /api/scheduled`**
  * Returns paginated list of scheduled/pending emails.
* **`GET /api/sent`**
  * Returns paginated list of sent/failed emails.
* **`GET /api/emails/:id`**
  * Fetch a detailed log record including dynamic variable payloads and SMTP error traces.

---

## ⚡ Core Platform Algorithms

### 1. Scheduler and Queue Workflow
1. When `POST /schedule` is called, the system creates a parent `Campaign` record.
2. It breaks the recipient list down:
   - Evaluates `hourlyLimit` to determine which hour block each recipient falls into.
   - Accumulates `delaySeconds` to stagger dispatches.
3. The scheduled items are batch-inserted into MySQL under the `ScheduledEmail` table with status `SCHEDULED`.
4. The system calculates `delay = email.scheduledTime - Date.now()` and registers a delayed job in BullMQ with `jobId: email.id`.

### 2. Configurable Hourly Rate Limiting
To enforce sending limits per sender without dropping jobs or failing executions:
* **Key Design:** Redis keeps atomic counters for each hour slot under `sender:rate:<senderAccountId>:<YYYY-MM-DDTHH>`.
* **Atomic Validation:** When a worker processes an email, it increments (`INCR`) the Redis key. If the count exceeds the campaign's `hourlyLimit`, it triggers the **Reschedule Flow**.
* **Order Preservation:** 
  1. We update the MySQL record's `scheduledTime` by adding exactly `1 hour`. This shifts the entire exceeding batch forwards by one hour, preserving their relative delay spacing and execution sequence.
  2. The database status reverts to `SCHEDULED`.
  3. The active BullMQ job is moved back to the delayed set using `job.moveToDelayed(timestamp, token)`. This halts current execution without triggering job failures or consuming retry attempts.

### 3. Idempotency Safeguards
We block duplicate dispatches at three layers:
* **Unique SQL Key:** `ScheduledEmail` has a unique composite index constraint on `(campaignId, recipientEmail)` mapped to `idempotencyKey`. Bulk insert commands skip duplicates automatically.
* **Unique Queue Job ID:** BullMQ jobs are registered in Redis using `jobId: email.id`. Redis automatically drops duplicate submissions with the same jobId.
* **Worker State Guard:** The worker checks: `if (email.status === EmailStatus.SENT) return;`. This acts as an execution gate if a job is retried or double-submitted.

### 4. Restart Persistence
BullMQ delayed jobs are saved in Redis Sorted Sets (`ZSET`). The score of the set represents the target Unix execution timestamp. Because Redis runs inside an isolated container:
* Restarting or crashing the Node backend server does not affect cached Redis data.
* Upon startup, the worker polls the Redis queue and resumes processing delayed jobs immediately.

---

## 🔮 Future Improvements

* **Analytics Dashboard:** Charting email opens, click-through rates (CTR), and bounce/spam category distributions.
* **Visual Template Builder:** A drag-and-drop HTML builder to design rich campaign newsletters.
* **Automatic IP Rotation:** Rotate outbound dispatches across multiple linked server IPs to avoid blacklisting.
* **External API Hooks:** Connect platforms like HubSpot, Salesforce, or Google Sheets directly to import recipient lists.
