# ReachInbox Full-Stack Email Scheduler

A production-style asynchronous email scheduling and sending service with rate limiting, concurrency controls, idempotency, and automated retries.

## Architecture Overview

- **Frontend:** React, TypeScript, Tailwind CSS, Vite, Axios, Google OAuth, React Router.
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, MySQL, BullMQ, Redis, Nodemailer (Ethereal SMTP).
- **Infrastructure:** Docker Compose running MySQL and Redis instances locally.

## Project Structure

```
ReachInbox/
├── docker-compose.yml          # Infrastructure configuration (MySQL, Redis)
├── README.md                   # Project documentation
├── backend/                    # Express.js REST API and BullMQ Workers
│   ├── src/                    # Source files
│   ├── prisma/                 # Database schema definitions
│   └── package.json            # Dependencies & scripts
└── frontend/                   # React Single Page App
    ├── src/                    # UI code and styles
    └── package.json            # Dependencies & scripts
```

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Docker and Docker Compose
- Google Client ID (for OAuth setup)

### Running Infrastructure
1. Start the Docker containers:
   ```bash
   docker compose up -d
   ```

### Running Backend
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Copy the template env file:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run Prisma database migrations:
   ```bash
   npx prisma db push
   ```
5. Start development server:
   ```bash
   npm run dev
   ```

### Running Frontend
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Copy the template env file:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start development server:
   ```bash
   npm run dev
   ```
