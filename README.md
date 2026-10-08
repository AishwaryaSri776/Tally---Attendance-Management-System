# Tally — Attendance Management System (MEAN)

MongoDB · Express · Angular 17 · Node.js, with JWT auth and two roles.

**Employees:** live clock-in / clock-out with an 8-hour progress ring, monthly calendar, daily log.
**Admins:** today's headcount, daily register (edit any status), monthly report with CSV export, employee management.

## Run it
Requires Node 18+ and MongoDB running locally (or an Atlas URI).

```bash
# 1. API
cd backend
npm install
# edit .env (MONGO_URI, JWT_SECRET, office rules)
npm run seed        # demo admin, 5 employees, 30 days of history
npm run dev         # http://localhost:5000

# 2. Web app (new terminal)
cd frontend
npm install
npm start           # http://localhost:4200 (proxies /api to :5000)
```

Demo logins: `admin@tally.dev / admin123` · `ravi@tally.dev / emp123`

## Production
`cd frontend && npm run build`, then `cd ../backend && npm start`. Express serves the built app and the API from one port.

## Rules (backend/.env)
- `WORK_START=09:30`, `GRACE_MINUTES=10`: clocking in after 09:40 is **late**.
- `HALF_DAY_MINUTES=240`: clocking out after under 4 hours becomes **half day**.
- Attendance % = (on time + late + ½ × half days) ÷ (working days − leave). Weekends are skipped.

## API
| Method | Route | Access |
|---|---|---|
| POST | /api/auth/login | public |
| GET | /api/auth/me | signed in |
| POST | /api/attendance/check-in, /check-out | signed in |
| GET | /api/attendance/today, /me?month=YYYY-MM | signed in |
| GET | /api/attendance/stats, /report?date=, /summary?month= | admin |
| POST | /api/attendance/mark | admin |
| GET/POST/PUT | /api/users, /api/users/:id | admin |

## Structure
```
backend/   server.js, seed.js, models/, routes/, middleware/, utils/
frontend/  src/app/core (api, auth, guards), src/app/pages (login, shell, punch, history, overview, monthly, employees)
```
