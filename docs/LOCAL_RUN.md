# Run locally — step by step (3 terminals)

**Easiest checklist:** [NEXT_STEPS.md](./NEXT_STEPS.md) — start with **Path A**.

This page explains **which `.env` file** each terminal uses.

---

## Two `.env` files (do not mix them up)

| File | Full path | Used by | What goes inside |
|------|-----------|---------|------------------|
| **Root `.env`** | `complaint-management-system\.env` | Complaint Service (port **5000**) | `PORT`, `AWS_REGION`, `DYNAMODB_TABLE`, `S3_BUCKET_NAME`, `NOTIFICATION_SERVICE_URL` |
| **Notification `.env`** | `complaint-management-system\services\notification-service\.env` | Notification Service (port **5001**) | `PORT`, `AWS_REGION`, `SES_FROM_EMAIL`, `ADMIN_EMAIL` |

**Rule:**

- **Email settings** → only `services\notification-service\.env`
- **Database / S3** → only **root** `.env`
- **NOTIFICATION_SERVICE_URL** → only **root** `.env` (points to `http://localhost:5001`)

There is also **`frontend\.env`** for React/Cognito — separate from both backend services.

---

## Before you start (one-time)

Open PowerShell and go to the project root:

```powershell
cd "C:\yaswanth\BTECH\Sem 6\Cloud Computing\Project\complaint-management-system"
```

### 1) Root `.env` (Complaint Service)

If you do not have it yet:

```powershell
copy .env.example .env
```

Edit **`complaint-management-system\.env`** so it looks like this (use your real bucket name):

```env
PORT=5000
NODE_ENV=development
AWS_REGION=ap-south-1
DYNAMODB_TABLE=Complaints
S3_BUCKET_NAME=complaint-system-files-yaswanth
NOTIFICATION_SERVICE_URL=http://localhost:5001
```

**Do not** put `SES_FROM_EMAIL` or `ADMIN_EMAIL` in this file.

### 2) Notification `.env`

```powershell
copy services\notification-service\.env.example services\notification-service\.env
```

Edit **`services\notification-service\.env`**:

```env
PORT=5001
NODE_ENV=development
AWS_REGION=ap-south-1
SES_FROM_EMAIL=yaswanthkumarpulapa@gmail.com
ADMIN_EMAIL=yaswanthkumarpulapa@gmail.com
```

### 3) Install dependencies (one-time per folder)

```powershell
npm install
cd services\notification-service
npm install
cd ..\..
```

AWS credentials: use `aws configure` on your PC (both services read the same `~/.aws` credentials).

---

## Terminal 1 — Notification Service (start this FIRST)

**Folder:** `services\notification-service`  
**Reads:** `services\notification-service\.env`  
**Port:** 5001

```powershell
cd "C:\yaswanth\BTECH\Sem 6\Cloud Computing\Project\complaint-management-system\services\notification-service"
npm run dev
```

**You must see:**

```text
Notification service running on http://localhost:5001
```

Leave this terminal open.

**Quick test (optional, new PowerShell window):**

```powershell
curl http://localhost:5001/
```

Expected: `"message":"Notification Service Running"`

---

## Terminal 2 — Complaint Service

**Folder:** project **root** (`complaint-management-system`)  
**Reads:** **root** `.env` (NOT the notification folder)  
**Port:** 5000

```powershell
cd "C:\yaswanth\BTECH\Sem 6\Cloud Computing\Project\complaint-management-system"
npm run dev
```

**You must see:**

```text
Complaint service running on http://localhost:5000
```

Leave this terminal open.

**Quick test:**

```powershell
curl http://localhost:5000/
```

Expected: `"message":"Complaint Service Running"`

---

## Terminal 3 — Frontend (optional)

**Folder:** `frontend`  
**Reads:** `frontend\.env`

```powershell
cd "C:\yaswanth\BTECH\Sem 6\Cloud Computing\Project\complaint-management-system\frontend"
npm run dev
```

Open **http://localhost:5173**, log in, submit a complaint.

**Where to look for email logs:**

- **Terminal 1** (notification) → `[notification] Email sent`
- **Terminal 2** (complaint) → `[notification] Sent via notification-service`

---

## Order matters

| Step | Terminal | Why |
|------|----------|-----|
| 1 | Notification (5001) first | Complaint Service calls it over HTTP |
| 2 | Complaint (5000) second | Needs `NOTIFICATION_SERVICE_URL=http://localhost:5001` in **root** `.env` |
| 3 | Frontend last | Talks only to Complaint Service on 5000 |

If you start Complaint before Notification, complaints still save, but **no email** (you will see `fetch failed` in Terminal 2).

---

## Which `.env` for Terminal 2? (your question)

**Terminal 2 = Complaint Service = ROOT `.env`**

```
complaint-management-system\
├── .env                    ← Terminal 2 uses THIS file
├── package.json
├── src\
└── services\
    └── notification-service\
        └── .env            ← Terminal 1 uses THIS file (not Terminal 2)
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Terminal 2 still has SES in root `.env` | Move `SES_FROM_EMAIL` / `ADMIN_EMAIL` to `services\notification-service\.env` only |
| `fetch failed` in Terminal 2 | Start Terminal 1 first; check `NOTIFICATION_SERVICE_URL=http://localhost:5001` in **root** `.env` |
| No email | Check **Terminal 1** logs; verify SES emails in **notification** `.env` |
| DynamoDB errors | Fix **root** `.env` (`DYNAMODB_TABLE`, `AWS_REGION`) and `aws configure` |

---

## Other ways to run

- **Docker both services:** [MICROSERVICES.md](./MICROSERVICES.md) — section Docker Compose  
- **Minikube / EKS:** [MICROSERVICES.md](./MICROSERVICES.md) — Kubernetes sections
