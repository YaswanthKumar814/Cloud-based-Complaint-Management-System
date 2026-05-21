# Steps 5–7: Minikube, EKS, and testing

## Your pod list (what is normal)

After `.\scripts\apply-minikube.ps1` you should see **4 pods** (not 3):

| Pod | Why |
|-----|-----|
| `complaint-frontend-...` | Frontend |
| `complaint-service-...` (×2) | Complaint API — deployment uses **2 replicas** |
| `notification-service-...` | Notifications |

All should show **READY 1/1** (or **2/2** for the deployment). A pod briefly at **0/1** during restart is normal — wait 30 seconds and run `kubectl get pods` again.

---

## Step 5 — Minikube (complete walkthrough)

### 5.1 Start cluster and deploy (if not done)

```powershell
cd "C:\yaswanth\BTECH\Sem 6\Cloud Computing\Project\complaint-management-system"
minikube start
.\scripts\apply-minikube.ps1
```

### 5.2 AWS secret (Minikube only — like Docker mounting `.aws`)

```powershell
.\scripts\create-k8s-aws-secret.ps1
kubectl rollout restart deployment/complaint-service
kubectl rollout restart deployment/notification-service
kubectl get pods
```

Wait until every pod is **1/1** or **2/2** Ready.

### 5.3 Check pods

```powershell
kubectl get pods
```

**Expected:** 4 pods, all `Running`, none stuck at `0/1` for more than 1–2 minutes.

### 5.4 Port-forward (two terminals — leave both open)

**Terminal A:**

```powershell
kubectl port-forward svc/complaint-service 5000:5000
```

**Terminal B:**

```powershell
kubectl port-forward svc/complaint-frontend 5173:80
```

### 5.5 Test (Terminal C)

```powershell
curl.exe http://localhost:5000/
curl.exe http://localhost:5000/api/complaints
```

**Expected:**

- `/` → `"Complaint Service Running"`
- `/api/complaints` → `"success":true,"count":...` (not credentials error)

### 5.6 Browser

Open **http://localhost:5173** → Cognito login → dashboard with complaints.

---

## Step 6 — EKS (only if cluster `complaint-eks` still exists)

Switch kubectl to EKS (if you use eksctl, this is usually automatic after cluster create):

```powershell
kubectl config get-contexts
kubectl config use-context <your-eks-context>
```

### 6.1 ECR repos (skip if already created)

```powershell
aws ecr create-repository --repository-name complaint-frontend --region ap-south-1
aws ecr create-repository --repository-name notification-service --region ap-south-1
```

(`complaint-service` repo may already exist.)

### 6.2 Push all 3 images

```powershell
cd "C:\yaswanth\BTECH\Sem 6\Cloud Computing\Project\complaint-management-system"
.\scripts\push-to-ecr.ps1
.\scripts\push-to-ecr.ps1 -Service notification
.\scripts\push-to-ecr.ps1 -Service frontend
```

Each command ends with an image URI like `167217327938.dkr.ecr.ap-south-1.amazonaws.com/...`

### 6.3 Deploy to EKS

```powershell
.\scripts\apply-eks.ps1
kubectl get pods
```

Wait until pods are **Running** (pulling images can take 2–5 minutes first time).

**EKS AWS access:** node IAM role needs DynamoDB, S3, SES (not the Minikube secret). If complaints fail, attach policies to the **EKS node group IAM role** in AWS Console.

### 6.4 Port-forward (same as Minikube)

```powershell
kubectl port-forward svc/complaint-service 5000:5000
```

Second terminal:

```powershell
kubectl port-forward svc/complaint-frontend 5173:80
```

Open **http://localhost:5173**

---

## Step 7 — Expected outputs checklist

| # | What you run | Expected result |
|---|----------------|-----------------|
| 1 | `docker compose ps` | 3 services **running** (if using Docker) |
| 2 | `kubectl get pods` | 4 pods **Running**, all Ready |
| 3 | `curl.exe http://localhost:5000/` | `Complaint Service Running` |
| 4 | `curl.exe http://localhost:5000/api/complaints` | `"success":true`, `"count":` number |
| 5 | http://localhost:5173 | Login page → dashboard |
| 6 | Create complaint in UI | Saved; optional email |
| 7 | `kubectl logs -l app=notification-service --tail=20` | `[notification] Email sent` (if SES works) |

---

## Quick fixes

| Problem | Fix |
|---------|-----|
| Pod `0/1` long time | `kubectl describe pod <pod-name>` — often missing AWS secret on Minikube → run `create-k8s-aws-secret.ps1` |
| `credentials missing` in browser | Port-forward Terminal A must be running; secret applied on Minikube |
| Frontend works, API 401 | Same as Docker — AWS secret / `aws configure` |
| Old extra pods | `kubectl get pods` — old replicas terminate automatically; if stuck: `kubectl delete pod <name>` |
| Port-forward “address already in use” | Stop other app on 5000 or 5173, or use `5001:5000` and update frontend build (stick to 5000 for simplicity) |

---

## After evaluation — delete EKS (save money)

```powershell
eksctl delete cluster -f eks/cluster.yaml
```
