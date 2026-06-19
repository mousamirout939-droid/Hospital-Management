# MediCare — Hospital Management System

A full-stack MERN (MongoDB, Express, React, Node.js) Hospital Management System.
Patients can register, find doctors, book appointments, and view their medical
records, prescriptions, lab reports, and invoices online. Admins manage doctors,
appointments, patients, prescriptions, lab reports, and billing from a single
dashboard.

## Tech Stack

**Backend:** Node.js, Express, MongoDB (Mongoose), JWT auth, bcrypt, Nodemailer
**Frontend:** React 18, React Router v6, Axios, Vite, plain CSS (no framework)

## Project Structure

```
Hospital_Management_System/
├── backend/                 # Express REST API
│   ├── config/               # DB + email configuration
│   ├── controllers/          # Route handlers / business logic
│   ├── middleware/           # Auth, error handling, validation, uploads
│   ├── models/                # Mongoose schemas
│   ├── routes/                # Express routers
│   ├── utils/                 # Helpers, JWT, notifications, seed script
│   ├── uploads/                # Local file storage (avatars, attachments)
│   ├── app.js                  # Express app configuration
│   ├── server.js               # Entry point
│   ├── render.yaml              # Render deployment blueprint
│   └── .env.example
│
└── frontend/                 # React SPA
    ├── src/
    │   ├── components/         # Reusable + feature components
    │   ├── pages/                # Route-level pages (auth, admin, patient)
    │   ├── layouts/               # Dashboard shell (sidebar + topbar)
    │   ├── context/               # Auth + Notification global state
    │   ├── services/               # Axios API call modules
    │   ├── routes/                  # Route guards
    │   ├── styles/                  # Design system CSS
    │   └── utils/                    # Formatters / helpers
    ├── vercel.json                 # Vercel SPA rewrite rule
    └── .env.example
```

## Features

- **Authentication**: JWT-based auth (httpOnly cookie + Bearer token fallback), register/login/logout, forgot/reset password, change password.
- **Roles**: Admin and Patient. Admin manages the platform; patients self-serve.
- **Doctors**: Admin CRUD with weekly availability scheduling; patients browse/search/filter by department.
- **Appointments**: Real-time slot availability (auto-generated from doctor schedule, excludes already-booked slots), booking, cancellation, admin status workflow (pending → confirmed → completed/cancelled/no-show).
- **Medical Records**: Diagnosis, symptoms, treatment plan, and vitals per visit, viewable by the patient and managed by admin.
- **Pharmacy (Prescriptions)**: Multi-medicine prescriptions with dosage/frequency/duration/instructions; status tracking (active/fulfilled/cancelled).
- **Lab Reports**: Parameterized test results with normal ranges and flags (normal/low/high), status workflow, automatic "ready" notification.
- **Billing**: Itemized invoices with tax/discount, partial/full payment recording, per-patient billing history.
- **Notifications**: In-app notification center (bell icon) for appointments, prescriptions, lab results, invoices, and payments — polled every 30s.
- **Security**: helmet, mongo-sanitize, xss-clean, rate limiting, CORS allowlist, bcrypt password hashing, centralized error handling.

## Local Development Setup

### Prerequisites
- Node.js 18+
- A MongoDB connection string (use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier, or a local `mongod`)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env and set MONGO_URI, JWT_SECRET, CLIENT_URL, etc.
npm install
npm run seed     # creates an admin account + sample doctors (run once)
npm run dev      # starts on http://localhost:5000
```

Default seeded admin login (override via .env before seeding):
- Email: `admin@hms.com`
- Password: `Admin@12345`

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api
npm install
npm run dev      # starts on http://localhost:5173
```

Visit `http://localhost:5173`, register a patient account, and log in to the
admin console at `/login` using the seeded admin credentials.

## Deployment

### Backend → Render

1. Push the `backend/` folder to its own GitHub repository (or push the whole monorepo and point Render at the `backend` directory).
2. On [Render](https://render.com), create a **New Web Service** from your repo.
   - Root directory: `backend` (if monorepo)
   - Build command: `npm install`
   - Start command: `npm start`
   - Health check path: `/api/health`
3. Add environment variables (see `.env.example`):
   - `MONGO_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — a long random string (Render can auto-generate this)
   - `CLIENT_URL` — your deployed Vercel frontend URL (e.g. `https://your-app.vercel.app`) — **required for CORS to work**
   - `NODE_ENV=production`
   - SMTP variables if you want real emails (optional — the app degrades gracefully without them)
4. Deploy. Render will give you a URL like `https://hms-backend.onrender.com`.
5. Run the seed script once via Render's Shell tab: `npm run seed`.

A `render.yaml` blueprint is included in `backend/` if you prefer Render's
"Deploy from Blueprint" flow — just set the `sync: false` variables in the
Render dashboard after the first deploy.

### Frontend → Vercel

1. Push the `frontend/` folder to GitHub (same repo or separate).
2. On [Vercel](https://vercel.com), import the project.
   - Root directory: `frontend` (if monorepo)
   - Framework preset: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
3. Add an environment variable:
   - `VITE_API_URL` = `https://hms-backend.onrender.com/api` (your Render backend URL + `/api`)
4. Deploy. Vercel will give you a URL like `https://your-app.vercel.app`.
5. Go back to Render and set `CLIENT_URL` to this exact Vercel URL, then redeploy/restart the backend so CORS allows it.

The included `vercel.json` ensures all client-side routes (e.g. `/patient/dashboard`)
correctly fall back to `index.html` instead of 404ing on refresh.

### Post-deploy checklist
- [ ] Backend `/api/health` returns `{ "success": true }`
- [ ] Frontend can register/login (check browser network tab for CORS errors)
- [ ] `CLIENT_URL` on Render exactly matches your Vercel domain (no trailing slash)
- [ ] Seed script has been run at least once on the production database
- [ ] Change the default admin password after first login

## API Overview

All routes are prefixed with `/api`. Key resource groups:

| Resource | Base Path | Notes |
|---|---|---|
| Auth | `/auth` | register, login, logout, me, password reset/update |
| Users | `/users` | profile, admin patient management |
| Doctors | `/doctors` | public listing + admin CRUD + available slots |
| Appointments | `/appointments` | booking, cancellation, admin status updates |
| Medical Records | `/medical-records` | admin-created, patient-readable |
| Prescriptions | `/prescriptions` | pharmacy module |
| Invoices | `/invoices` | billing + payment recording |
| Lab Reports | `/lab-reports` | parameterized results |
| Notifications | `/notifications` | in-app notification center |
| Dashboard | `/dashboard` | aggregated stats for admin/patient |
| Uploads | `/uploads` | generic file upload endpoint |

## License

This project was generated as a starter/reference implementation. Use and modify freely for your own deployment.
