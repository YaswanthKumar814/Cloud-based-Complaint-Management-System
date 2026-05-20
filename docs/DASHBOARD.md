# Admin Dashboard — testing guide

## Run (two terminals)

**Terminal 1 — backend:**

```powershell
cd "c:\yaswanth\BTECH\Sem 6\Cloud Computing\Project\complaint-management-system"
npm run dev
```

**Terminal 2 — frontend:**

```powershell
cd frontend
npm run dev
```

Open **http://localhost:5173** → Login with Cognito → **Admin** or **User** dashboard (by email). See [ROLES.md](ROLES.md).

---

## `frontend/.env`

```env
VITE_API_URL=http://localhost:5000
```

(Cognito vars unchanged.)

---

## Dashboard testing checklist

| Step | Action | Expected |
|------|--------|----------|
| 1 | Login | Dashboard header + your email |
| 2 | Backend running | Complaint cards appear |
| 3 | Search "fire" | Filters list |
| 4 | Status filter "Pending" | Only pending shown |
| 5 | Change status → Save | Badge updates, email sent (if SES configured) |
| 6 | Complaint with fileUrl | "View attachment" link works |

---

## CORS errors

Backend already uses `cors()`. If you still see CORS errors:

1. Confirm `VITE_API_URL=http://localhost:5000`
2. Restart both servers
3. Do not mix `127.0.0.1` and `localhost` — use **localhost** for both

---

## How it works (beginner)

1. **Cognito** — `useAuth()` knows if you are logged in.
2. **fetch** — `GET http://localhost:5000/api/complaints` loads data (no auth header yet; backend is open for demo).
3. **Status update** — `PUT .../status` with JSON `{ "status": "Resolved" }`.
4. **UI** — React `useState` holds list; filters run in `useMemo`.
