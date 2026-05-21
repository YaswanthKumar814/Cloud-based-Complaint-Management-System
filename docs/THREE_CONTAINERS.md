# Three-container architecture (frontend + complaint + notification)

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│  YOUR BROWSER (on your PC)                                   │
│  Opens: http://localhost:5173  →  Frontend container (nginx) │
│  Calls: http://localhost:5000  →  Complaint container        │
└─────────────────────────────────────────────────────────────┘

Inside Docker / Kubernetes network (not visible to browser):
  Complaint Service  ──HTTP──►  Notification Service :5001
```

| Container | Port (you use) | Job |
|-----------|----------------|-----|
| **complaint-frontend** | **5173** → container 80 | React UI (nginx serves built files) |
| **complaint-service** | **5000** | API, DynamoDB, S3, AI |
| **notification-service** | **5001** (optional to open) | SES email |

**Important:** The browser always uses `http://localhost:5000` for the API — not `http://complaint-service:5000`. Service names only work **between containers**, not from Chrome/Edge on your laptop.

---

## Files added

| File | Purpose |
|------|---------|
| `frontend/Dockerfile` | Build React + serve with nginx |
| `frontend/nginx.conf` | Static file server |
| `frontend/.dockerignore` | Smaller build context |
| `docker-compose.yml` | All 3 services |
| `k8s/frontend-deployment.yaml` | Minikube frontend |
| `k8s/frontend-service.yaml` | Minikube frontend Service |
| `k8s/eks/frontend-deployment.yaml` | EKS frontend |
| `k8s/eks/frontend-service.yaml` | EKS frontend Service |
| `scripts/build-frontend-image.ps1` | Build with `frontend/.env` Cognito vars |

---

## Path 1 — Docker Compose (easiest demo)

### Before first run

1. **AWS credentials on your PC** (required for complaint + notification containers):

   ```powershell
   aws configure
   ```

   Check this folder exists: `C:\Users\<you>\.aws\credentials`

2. Root `.env` — DynamoDB table, S3 bucket (see `.env.example`)
3. `services/notification-service/.env` — SES emails
4. Cognito is baked into `docker-compose.yml` build args (or edit there if your pool changed)

### Commands

```powershell
cd "C:\yaswanth\BTECH\Sem 6\Cloud Computing\Project\complaint-management-system"
docker compose up --build
```

Wait until you see all three services started (no crash loop).

### Test

| Test | Command / action | Expected |
|------|------------------|----------|
| Frontend | Open http://localhost:5173 | Login page / app UI |
| Complaint API | `curl.exe http://localhost:5000/` | `"Complaint Service Running"` |
| Complaints list | `curl.exe http://localhost:5000/api/complaints` | `"success":true,"count":...` |
| Notification | `curl.exe http://localhost:5001/` | `"Notification Service Running"` |

**Windows PowerShell:** `curl` is an alias and may prompt you — use `curl.exe` instead, or:

```powershell
Invoke-RestMethod http://localhost:5000/api/complaints
```
| End-to-end | Log in, create complaint | Email in admin inbox; `docker compose logs notification-service` shows email sent |

### Stop

```powershell
docker compose down
```

### Build frontend image only (optional)

```powershell
.\scripts\build-frontend-image.ps1
docker run --rm -p 5173:80 complaint-frontend:latest
```

---

## Path 2 — Minikube (3 pods)

### Commands

```powershell
cd "C:\yaswanth\BTECH\Sem 6\Cloud Computing\Project\complaint-management-system"
minikube start
.\scripts\apply-minikube.ps1
kubectl get pods
```

**Expected pods (all Running):**

- `complaint-frontend-...`
- `complaint-service-...`
- `notification-service-...`

### Port-forward (two terminals)

**Terminal 1:**

```powershell
kubectl port-forward svc/complaint-service 5000:5000
```

**Terminal 2:**

```powershell
kubectl port-forward svc/complaint-frontend 5173:80
```

Open **http://localhost:5173** (frontend was built with `VITE_API_URL=http://localhost:5000`).

---

## Path 3 — Amazon EKS

### One-time: ECR repo for frontend

```powershell
aws ecr create-repository --repository-name complaint-frontend --region ap-south-1
```

### Push all 3 images

```powershell
cd "C:\yaswanth\BTECH\Sem 6\Cloud Computing\Project\complaint-management-system"
.\scripts\push-to-ecr.ps1
.\scripts\push-to-ecr.ps1 -Service notification
.\scripts\push-to-ecr.ps1 -Service frontend
```

### Deploy

```powershell
.\scripts\apply-eks.ps1
kubectl get pods
```

### Port-forward (same as Minikube)

```powershell
kubectl port-forward svc/complaint-service 5000:5000
kubectl port-forward svc/complaint-frontend 5173:80
```

Open http://localhost:5173

**Node IAM role:** needs DynamoDB/S3/Comprehend (complaint) + SES (notification). Frontend pod needs **no** AWS permissions.

---

## How containers communicate (beginner)

1. **Browser → Frontend container**  
   You map port `5173:80`. Nginx returns HTML/JS.

2. **Browser → Complaint container**  
   JavaScript uses `VITE_API_URL=http://localhost:5000` (baked in at **build** time). Your browser calls the published port 5000.

3. **Complaint → Notification**  
   Inside the cluster/network, complaint uses `http://notification-service:5001`. The browser never calls 5001 directly.

---

## How Kubernetes runs all three

| K8s object | One per… |
|------------|----------|
| **Deployment** | Runs pods for an app |
| **Service** | Stable DNS name (`complaint-service`, `complaint-frontend`, `notification-service`) |

You still use **port-forward** for a simple demo (no Ingress). That forwards a port on your PC to a Service inside the cluster.

---

## Common issues

| Problem | Cause | Fix |
|---------|--------|-----|
| **AWS credentials are missing** (in browser/UI) | Complaint **container** has no AWS keys | Run `aws configure` on PC, then `docker compose down` and `docker compose up --build` again. Compose mounts `%USERPROFILE%\.aws` into containers. |
| Same error after mount | No `credentials` file | `dir $env:USERPROFILE\.aws` — must show `credentials` |
| Frontend loads, API fails | Complaint not running or wrong port | `curl http://localhost:5000/` |
| Cognito redirect error | `VITE_APP_URL` ≠ Cognito callback | Use `http://localhost:5173` in Cognito app client + rebuild frontend image |
| API URL wrong in container | Used `complaint-service:5000` in Vite build | Rebuild with `VITE_API_URL=http://localhost:5000` |
| `docker compose` Cognito empty | Build args missing | Edit `docker-compose.yml` frontend build args or use `build-frontend-image.ps1` |
| Frontend ImagePullBackOff on EKS | Image not pushed | `.\scripts\push-to-ecr.ps1 -Service frontend` |
| CORS error | Rare — complaint uses open CORS | Ensure complaint pod is Running |

---

## Evaluation screenshots

1. `docker compose ps` or `kubectl get pods` — **3** services Running  
2. Browser on http://localhost:5173 — logged-in dashboard  
3. `curl http://localhost:5000/` — complaint health  
4. AWS ECR — 3 repositories (optional)  
5. EKS/Minikube workload view — 3 deployments  

---

## After evaluation — delete EKS cluster

```powershell
eksctl delete cluster -f eks/cluster.yaml
```
