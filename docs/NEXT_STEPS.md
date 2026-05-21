# What to do next — simple checklist

Pick **one path**. For learning the microservices split, do **Path A** first.

---

## Path A — Run on your PC (recommended first)

Your two `.env` files are **already configured**. You can skip all `copy .env` steps.

| File | Already has |
|------|-------------|
| Root `.env` | DynamoDB, S3, `NOTIFICATION_SERVICE_URL=http://localhost:5001` |
| `services\notification-service\.env` | `SES_FROM_EMAIL`, `ADMIN_EMAIL` |

### Step A1 — One-time: install packages (if you never did)

Open **one** PowerShell window:

```powershell
cd "C:\yaswanth\BTECH\Sem 6\Cloud Computing\Project\complaint-management-system"
npm install
cd services\notification-service
npm install
cd ..\..
```

### Step A2 — Terminal 1 (Notification) — open a NEW PowerShell window

```powershell
cd "C:\yaswanth\BTECH\Sem 6\Cloud Computing\Project\complaint-management-system\services\notification-service"
npm run dev
```

**Success looks like:**

```text
Notification service running on http://localhost:5001
```

**Do not close this window.**

Uses file: `services\notification-service\.env`

---

### Step A3 — Terminal 2 (Complaint) — open another NEW PowerShell window

```powershell
cd "C:\yaswanth\BTECH\Sem 6\Cloud Computing\Project\complaint-management-system"
npm run dev
```

**Success looks like:**

```text
Complaint service running on http://localhost:5000
```

**Do not close this window.**

Uses file: **root** `.env` (the `.env` next to `package.json` — **not** the notification folder)

---

### Step A4 — Terminal 3 (Frontend) — open a third PowerShell window (optional)

```powershell
cd "C:\yaswanth\BTECH\Sem 6\Cloud Computing\Project\complaint-management-system\frontend"
npm run dev
```

Browser: **http://localhost:5173** → log in → submit a complaint.

---

### Step A5 — Test that it works

Open a **fourth** PowerShell window (tests only):

**Test 1 — Notification is alive**

```powershell
curl http://localhost:5001/
```

You should see: `"Notification Service Running"`

**Test 2 — Complaint is alive**

```powershell
curl http://localhost:5000/
```

You should see: `"Complaint Service Running"`

**Test 3 — Email path (after you submit a complaint in the browser)**

Look at the **windows**, not curl:

| Window | What you should see |
|--------|---------------------|
| Terminal 1 (notification) | `[notification] Email sent: [New Complaint] ...` |
| Terminal 2 (complaint) | `[notification] Sent via notification-service: /api/notifications/complaint-created` |
| Your Gmail (admin email) | New complaint email |

**If Terminal 2 says `fetch failed`:** Terminal 1 is not running — go back to Step A2.

---

### What happens when you create a complaint? (simple)

1. Browser talks to **Complaint Service** (port 5000) only.
2. Complaint Service saves to **DynamoDB**.
3. Complaint Service sends an **HTTP POST** to **Notification Service** (port 5001).
4. Notification Service sends **email** via SES.

You do not call port 5001 from the browser. Only the Complaint Service does that internally.

---

## Path B — Docker Compose (all 3 containers: frontend + backends)

Full guide: [THREE_CONTAINERS.md](./THREE_CONTAINERS.md)

```powershell
cd "C:\yaswanth\BTECH\Sem 6\Cloud Computing\Project\complaint-management-system"
docker compose up --build
```

- Frontend UI: http://localhost:5173/
- Complaint API: http://localhost:5000/
- Notification API: http://localhost:5001/

Stop with `Ctrl+C`, then `docker compose down`.

---

## Path C — Minikube (Kubernetes on your PC)

Only if Minikube is installed and you finished Path A.

```powershell
cd "C:\yaswanth\BTECH\Sem 6\Cloud Computing\Project\complaint-management-system"
minikube start
.\scripts\apply-minikube.ps1
kubectl get pods
```

Wait until **3** pods show **Running** (`complaint-frontend`, `complaint-service`, `notification-service`).

Port-forward (two terminals):

```powershell
kubectl port-forward svc/complaint-service 5000:5000
kubectl port-forward svc/complaint-frontend 5173:80
```

Open http://localhost:5173

---

## Path D — EKS (your AWS cluster `complaint-eks`)

Only if the cluster is still running. Do Path A first so you understand the two services.

### D1 — Create ECR repos (once, skip if they exist)

```powershell
aws ecr create-repository --repository-name notification-service --region ap-south-1
aws ecr create-repository --repository-name complaint-frontend --region ap-south-1
```

### D2 — Push all 3 Docker images to ECR

```powershell
cd "C:\yaswanth\BTECH\Sem 6\Cloud Computing\Project\complaint-management-system"
.\scripts\push-to-ecr.ps1
.\scripts\push-to-ecr.ps1 -Service notification
.\scripts\push-to-ecr.ps1 -Service frontend
```

### D3 — Deploy all 3 services to Kubernetes

```powershell
.\scripts\apply-eks.ps1
kubectl get pods
```

Wait until **3** pods Running.

### D4 — Use the app

```powershell
kubectl port-forward svc/complaint-service 5000:5000
kubectl port-forward svc/complaint-frontend 5173:80
```

Open **http://localhost:5173**

Inside the cluster, complaint pods call `http://notification-service:5001` (not visible to the browser).

### D5 — If notification pod crashes

EKS nodes need **SES** permission on the **node IAM role** (see `docs/EKS.md`).

---

## Quick reference — which `.env` when?

| You run… | `.env` file |
|----------|-------------|
| `npm run dev` in **root** | `complaint-management-system\.env` |
| `npm run dev` in **services\notification-service** | `services\notification-service\.env` |
| `npm run dev` in **frontend** | `frontend\.env` |

---

## Common problems

| What you see | What to do |
|--------------|------------|
| `fetch failed` in Terminal 2 | Start Terminal 1 first (Step A2) |
| No email | Read Terminal 1 logs; check SES verified emails in notification `.env` |
| `emailSent: false` in API test | Same — SES config in **notification** `.env` only |
| Confused which `.env` | Terminal 2 = **root** `.env` always |

---

## After evaluation — save money

```powershell
eksctl delete cluster -f eks/cluster.yaml
```

Wait until the cluster is deleted in AWS Console.
