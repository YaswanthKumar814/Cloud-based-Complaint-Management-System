# Role-based dashboards (beginner guide)

## How roles work

| Email | Dashboard |
|-------|-----------|
| `yaswanthkumarpulapa@gmail.com` | **Admin** — all complaints, update status |
| Any other Cognito user | **User** — submit + view own complaints only |

Checked in frontend only (`frontend/src/auth/roles.js`). No Cognito groups.

## userEmail filtering

1. User submits form → POST includes `userEmail` from Cognito login.
2. DynamoDB stores `userEmail` on each complaint.
3. User dashboard calls `GET /api/complaints?userEmail=their@email.com`.
4. Admin calls `GET /api/complaints` (no filter) → sees everything.

## Demo flow

1. Login as **admin** → Admin Dashboard, all cards, status dropdowns.
2. Logout → Login as **another Cognito user** (or incognito).
3. User Dashboard → submit complaint → appears in "Your submitted complaints".
4. Login as admin again → see the new complaint, change status to Resolved.

## Common issues

| Issue | Fix |
|-------|-----|
| Everyone sees admin dashboard | Check `VITE_ADMIN_EMAIL` in `frontend/.env` |
| User sees no complaints | Old complaints lack `userEmail` — submit a new one while logged in as that user |
| Create fails `userEmail required` | Frontend must send `userEmail`; restart frontend after pull |
| User sees all complaints | Should not happen — user page uses `?userEmail=` filter |
