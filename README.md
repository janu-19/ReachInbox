# ReachInbox - Scalable Email Scheduling & Dispatching Platform

ReachInbox is a high-performance, production-ready email scheduling and automated dispatching platform designed to orchestrate outbound email campaigns. It supports multiple sender SMTP credentials, dynamic personalization merge tags, precise delay spacing between sends, strict hourly rate limits, idempotency guarantees, and resilient task recovery.

---

## 🔒 Submission & Repository Access

- **GitHub Repository**: [`https://github.com/janu-19/ReachInbox`](https://github.com/janu-19/ReachInbox)
- **Collaborator Access Granted**: `Mitrajit` and `sarvagya-chaudhary`

*(To manage access: Go to GitHub Repo -> Settings -> Collaborators -> Add `Mitrajit` and `sarvagya-chaudhary`)*

---

## 📹 Demo Video Checklist (Max 5 Minutes)

Link to Demo Video: **[Insert Demo Video Link Here - Loom / YouTube / Google Drive]**

### Key Scenarios Demonstrated in Video:
1. **Creating & Scheduling Emails**: Creating campaign from Frontend Compose view (with recipient CSV import & merge variables).
2. **Dashboard Monitoring**: Inspecting real-time **Scheduled** and **Sent/Failed** email tables & logs.
3. **Server Restart Persistence Test**:
   - Schedule emails for future execution.
   - Kill/stop the backend Node server process.
   - Restart the backend server.
   - Observe that BullMQ and Redis restore all scheduled jobs and execute them at the exact intended timestamps without data loss.
4. **Rate Limiting & Concurrency Behavior**: Demonstrating hourly rate limit enforcement and staggered queue worker concurrency.

---

## 🏗️ Architecture Overview

The platform is structured as a decoupled monorepo workspace separating client-side UI and server-side worker runtimes:

```mermaid
flowchart TD
    subgraph Client [React Frontend - Port 80/5173]
        A[Vite Client SPA] --> B[Axios API Handler]
        B --> C[OAuth / Auth Context]
    end

    subgraph Server [Express Backend - Port 5001]
        D[Router REST Endpoints] --> E[Zod Schema Validator]
        E --> F[Prisma ORM Client]
        D --> G[BullMQ Queue Manager]
    end

    subgraph Storage [Databases & Cache]
        F --> H[(MySQL Database - Port 3307)]
        G --> I[(Redis Cache & Queue - Port 6379)]
    end

    subgraph Worker [Background Processors]
        J[BullMQ Worker Daemon] --> I
        J --> F
        J --> K[Nodemailer SMTP Dispatcher]
    end
```

### Core Architecture Components:

1. **How Scheduling Works**:
   - When a campaign is submitted via `POST /api/schedule`, the backend parses recipient data, applies template variable substitutions (`{{ firstname }}`), calculates initial send timestamps using `startTime` + `delaySeconds`, and assigns hourly batches based on `hourlyLimit`.
   - Records are created in MySQL database with status `SCHEDULED`.
   - Delayed jobs are registered in BullMQ Redis queue with `jobId = scheduledEmail.id` and `delay = scheduledTime - currentTime`.

2. **How Rate Limiting & Concurrency Are Implemented**:
   - **Concurrency**: BullMQ workers are configured with configurable worker concurrency (default `5` concurrent dispatches), processing jobs asynchronously.
   - **Rate Limiting**: Redis tracks hourly send counts per sender account using atomic keys `sender:rate:<senderAccountId>:<YYYY-MM-DDTHH>`.
   - When a worker processes an email, it increments (`INCR`) the Redis key. If the counter exceeds the sender's configured `hourlyLimit`, the worker automatically reschedules the job by adding `+1 hour` to `scheduledTime`, preserving job order without failing execution.

3. **How Persistence on Restart is Handled**:
   - BullMQ stores delayed jobs in Redis **Sorted Sets (`ZSET`)**, scored by execution Unix timestamp.
   - All email records and audit trails are persisted in MySQL database.
   - If the backend server stops or crashes, all pending jobs remain safe in Redis and MySQL. Upon backend startup, the worker reconnects to Redis and resumes dispatching due jobs immediately.

---

## 📌 Features Implemented Matrix

| Component | Feature Implemented | Technical Details |
| :--- | :--- | :--- |
| **Backend** | **Campaign Email Scheduler** | Staggered delay spacing, dynamic recipient merge tags (`{{ firstname }}`), subject/body interpolation |
| **Backend** | **Restart Persistence** | Redis Sorted Sets (`ZSET`) + MySQL database state recovery on server restart |
| **Backend** | **Hourly Rate Limiting** | Redis atomic counter (`INCR`) with automatic 1-hour delay shift when limit is exceeded |
| **Backend** | **Queue Concurrency** | BullMQ multi-worker processing with configurable concurrency limits |
| **Backend** | **Idempotency Safeguards** | Unique composite SQL key `(campaignId, recipientEmail)` + BullMQ `jobId` lock |
| **Backend** | **Ethereal SMTP Integration** | Dynamic Ethereal test account generation + Custom/Gmail/Outlook SMTP support |
| **Backend** | **Authentication & Security** | Google OAuth token verification, JWT sessions, Zod request body validation |
| **Backend** | **Integration Testing Suite** | Automated backend integration test runner testing endpoints, queues & rate limits |
| **Frontend** | **Authentication & Dev Mode** | Google OAuth login + One-click unauthenticated Developer Mode for evaluation |
| **Frontend** | **Analytics Dashboard** | Real-time campaign stats (Total Scheduled, Total Sent, Failed, Active Senders) |
| **Frontend** | **Compose Campaign UI** | Rich editor, recipient CSV upload parser, merge variable helper, live preview modal |
| **Frontend** | **Senders Configuration** | Connect/test custom SMTP credentials & dynamic Ethereal test account creation |
| **Frontend** | **Emails & Audit Logs** | Paginated tables for **Scheduled** & **Sent** emails, search by recipient, detail inspect modal |

---

## 📁 Workspace Folder Structure

```
ReachInbox/
├── docker-compose.yml           # Multi-container orchestration configurations
├── README.md                    # Project documentation
├── backend/
│   ├── Dockerfile               # Backend TS build and containerization
│   ├── prisma/
│   │   └── schema.prisma        # Database schema definitions & indexes
│   ├── src/
│   │   ├── app.ts               # Express bootstrapper & worker mounts
│   │   ├── config/              # Database & Redis connection setups
│   │   ├── middleware/          # JWT auth, Zod validations, error handlers
│   │   ├── services/            # Google OAuth, Nodemailer, Campaign services
│   │   ├── workers/             # BullMQ background worker loops
│   │   ├── queue/               # Redis queue setup & event listeners
│   │   ├── controllers/         # REST API request controllers
│   │   ├── routes/              # Express API endpoints
│   │   └── tests/               # Backend integration test suite
│   ├── tsconfig.json
│   └── package.json
└── frontend/
    ├── Dockerfile               # Vite production bundle and Nginx setup
    ├── src/
    │   ├── main.tsx             # Application entrypoint & routes
    │   ├── services/            # Axios API proxy service
    │   ├── context/             # Auth context & session provider
    │   ├── components/          # Reusable tables, modals, layout sidebar
    │   └── pages/               # Dashboard, Compose, Senders, Scheduled, Sent views
    ├── tsconfig.json
    └── package.json
```

---

## 🛠️ Environment Variables & Ethereal Email Setup

### Setting up Ethereal Email for Testing:
1. **Option A (Automatic - Recommended)**: Click **"Create Ethereal Account"** on the Senders page in the frontend dashboard. The app will generate credentials automatically.
2. **Option B (Manual)**: Visit [ethereal.email](https://ethereal.email), click **"Create Ethereal Account"**, and copy the Username and Password into your `backend/.env`.

### Backend Configuration (`backend/.env`)
Create a file at `backend/.env`:
```env
PORT=5001
NODE_ENV=production
DATABASE_URL="mysql://scheduler_user:scheduler_password_123@localhost:3307/email_scheduler"
REDIS_URL="redis://127.0.0.1:6379"
JWT_SECRET="your_secure_jwt_secret_key_change_me"

# Optional: Static Test SMTP Credentials (Ethereal)
ETHEREAL_USER="your_ethereal_user"
ETHEREAL_PASS="your_ethereal_password"

# Google Authentication
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"

# Bypass SMTP live network verification if local ports are blocked by firewall
BYPASS_SMTP_VERIFICATION=false
```

### Frontend Configuration (`frontend/.env`)
Create a file at `frontend/.env`:
```env
VITE_API_URL="http://localhost:5001/api"
VITE_GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
```

---

## 🚀 Quick Setup & Run

### Method 1: Docker (One Command Launch - Recommended)
Make sure Docker Desktop is running and execute:
```bash
docker compose up --build
```
- **Frontend SPA**: `http://localhost:80` (or `http://localhost:5173`)
- **Backend API**: `http://localhost:5001`
- **MySQL Database**: `localhost:3307`
- **Redis Cache**: `localhost:6379`

### Method 2: Local Developer Setup
1. **Start Database Services**:
   ```bash
   docker compose up mysql redis -d
   ```
2. **Run Backend**:
   ```bash
   cd backend
   npm install
   npx prisma db push
   npm run dev
   ```
3. **Run Frontend**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
   Access client at `http://localhost:5173`.

---

## 🧪 Integration Test Suite

Run the full integration test suite covering API validation, queue scheduling, rate limits, and idempotency:
```bash
cd backend
npm run test
```

---

## ⚠️ Assumptions, Shortcuts & Trade-Offs

1. **Sandboxed SMTP Dispatching**: Ethereal Email is used as the primary testing gateway to allow real message inspection without sending accidental spam to external domains.
2. **Rate Limit Rescheduling vs Failing**: When a sender hits their hourly limit, jobs are rescheduled by `+1 hour` instead of failing or being dropped. This guarantees zero message loss while respecting sender thresholds.
3. **Queue State Persistence**: Redis Sorted Sets are used for job delay queues. In production setups, Redis AOF/RDB snapshot persistence should be enabled to guarantee zero queue state loss on host hardware restarts.
4. **Developer Mode Authentication**: Implemented a one-click Developer Auth bypass alongside Google OAuth to allow evaluators to inspect all dashboard features without needing Google OAuth setup.
