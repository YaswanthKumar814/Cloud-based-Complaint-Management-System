# Phase 15 — Complete EKS verification (keep cluster)

**Do NOT delete cluster `complaint-eks`.**

Your EKS context name:

```text
complaint-project-user@complaint-eks.ap-south-1.eksctl.io
```

---

## Beginner concepts (read once)

### What is `kubectl context`?

Think of it as **which cluster** your commands go to.

- `minikube` = Kubernetes on your laptop  
- `complaint-project-user@complaint-eks...` = Kubernetes on AWS (EKS)

Check:

```powershell
kubectl config current-context
```

Switch to EKS:

```powershell
kubectl config use-context complaint-project-user@complaint-eks.ap-south-1.eksctl.io
```

### Minikube vs EKS

| | Minikube | EKS |
|---|----------|-----|
| Where | Your PC | AWS |
| Images | Built locally | Pulled from **ECR** |
| Demo access | Port-forward | Port-forward (same idea) |

### Why port-forward?

Pods are **inside** AWS. Your browser is **on your PC**. Port-forward bridges them:

```text
localhost:5000  →  complaint-service (in EKS)
localhost:5173  →  complaint-frontend (in EKS)
```

### Is port-forward only for demo?

**Yes, for this project.** It is normal for student projects. Production might use a Load Balancer or Ingress; you intentionally kept it simple.

---

## Step-by-step: complete Phase 15 on EKS

### Step 0 — Use EKS context

```powershell
cd "C:\yaswanth\BTECH\Sem 6\Cloud Computing\Project\complaint-management-system"
kubectl config use-context complaint-project-user@complaint-eks.ap-south-1.eksctl.io
kubectl config current-context
```

**Expected:** context name contains `complaint-eks`.

If error `aws not found`: open the terminal where `aws configure` works, or add AWS CLI to PATH.

---

### Step 1 — ECR repositories (AWS Console or CLI)

**Console:** AWS → **ECR** → **Repositories** → confirm these exist:

- `complaint-service`
- `notification-service`
- `complaint-frontend`

**CLI:**

```powershell
aws ecr describe-repositories --region ap-south-1 --query "repositories[].repositoryName" --output table
```

Create missing repo (safe if exists):

```powershell
aws ecr create-repository --repository-name notification-service --region ap-south-1
aws ecr create-repository --repository-name complaint-frontend --region ap-south-1
```

---

### Step 2 — Push all 3 images to ECR

```powershell
.\scripts\push-to-ecr.ps1
.\scripts\push-to-ecr.ps1 -Service notification
.\scripts\push-to-ecr.ps1 -Service frontend
```

**Expected end of each:** URI like:

```text
167217327938.dkr.ecr.ap-south-1.amazonaws.com/complaint-service:latest
167217327938.dkr.ecr.ap-south-1.amazonaws.com/notification-service:latest
167217327938.dkr.ecr.ap-south-1.amazonaws.com/complaint-frontend:latest
```

**Verify images:**

```powershell
aws ecr list-images --repository-name complaint-service --region ap-south-1
aws ecr list-images --repository-name notification-service --region ap-south-1
aws ecr list-images --repository-name complaint-frontend --region ap-south-1
```

Each should list tag `latest`.

---

### Step 3 — Deploy all 3 services to EKS

```powershell
.\scripts\apply-eks.ps1
```

**Expected output:** three "Applying ..." lines with ECR URIs, no errors.

---

### Step 4 — Verify Kubernetes

```powershell
kubectl get deployments
kubectl get svc
kubectl get pods
```

**Expected deployments:**

| NAME | READY |
|------|-------|
| complaint-service | 1/1 |
| notification-service | 1/1 |
| complaint-frontend | 1/1 |

**Expected services:**

| NAME | PORT |
|------|------|
| complaint-service | 5000 |
| notification-service | 5001 |
| complaint-frontend | 80 |

**Expected pods:** all `Running`, READY `1/1`.

**Automated check:**

```powershell
.\scripts\verify-eks-phase15.ps1
```

---

### Step 5 — Port-forward (presentation demo)

**Terminal A** (leave open):

```powershell
kubectl port-forward svc/complaint-service 5000:5000
```

**Terminal B** (leave open):

```powershell
kubectl port-forward svc/complaint-frontend 5173:80
```

---

### Step 6 — API tests (Terminal C)

```powershell
curl.exe http://localhost:5000/
curl.exe http://localhost:5001/
curl.exe http://localhost:5000/api/complaints
```

**Expected:**

- `/` → `Complaint Service Running`
- `:5001/` → `Notification Service Running`
- `/api/complaints` → `"success":true,"count":...`

---

### Step 7 — Browser / full flow

1. Open **http://localhost:5173**
2. Cognito login
3. Dashboard shows complaints
4. Create a complaint (optional)
5. Check notification logs:

```powershell
kubectl logs -l app=notification-service --tail=30
```

Look for `[notification] Email sent` after create/status change.

**Inter-service test:** Complaint pod calls `http://notification-service:5001` (set in EKS YAML). You do not open 5001 in the browser for normal use.

---

## Expected `kubectl get pods` (healthy)

```text
NAME                                    READY   STATUS    RESTARTS   AGE
complaint-frontend-xxxxx                1/1     Running   0          ...
complaint-service-xxxxx                 1/1     Running   0          ...
notification-service-xxxxx              1/1     Running   0          ...
```

---

## Phase 15 complete when

- [ ] 3 ECR repos with `latest` image  
- [ ] 3 EKS deployments READY  
- [ ] 3 pods Running  
- [ ] curl health + complaints OK  
- [ ] http://localhost:5173 works with both port-forwards  
- [ ] (Optional) email / notification logs on create  

---

## Presentation checklist

**Before presentation (15 min):**

1. `kubectl config use-context complaint-project-user@complaint-eks.ap-south-1.eksctl.io`
2. `kubectl get pods` — all Running
3. Start port-forward Terminal A + B
4. `curl.exe http://localhost:5000/api/complaints`
5. Open http://localhost:5173, login once

**Terminals to keep open:**

| Terminal | Command |
|----------|---------|
| A | `kubectl port-forward svc/complaint-service 5000:5000` |
| B | `kubectl port-forward svc/complaint-frontend 5173:80` |
| C | spare — for `kubectl get pods` or logs if asked |

**Screenshots for report:**

1. AWS ECR — 3 repositories with images  
2. AWS EKS — cluster `complaint-eks` Active  
3. EKS Workloads — 3 deployments / pods Running  
4. Terminal — `kubectl get pods`  
5. Terminal — `curl.exe` complaints JSON  
6. Browser — dashboard logged in  
7. (Optional) CloudWatch / pod logs — email sent  

---

## Common EKS problems

| Problem | Fix |
|---------|-----|
| `aws not found` when using kubectl | Use terminal with AWS CLI; `aws eks update-kubeconfig --region ap-south-1 --name complaint-eks` |
| `ImagePullBackOff` | Push image: `.\scripts\push-to-ecr.ps1 -Service <name>` then `kubectl rollout restart deployment/<name>` |
| Only complaint deployed | Run full `.\scripts\apply-eks.ps1` |
| API credentials error on EKS | Attach DynamoDB + S3 policies to **node group IAM role** (AWS Console → EKS → node group → IAM role) |
| No email on EKS | Attach **SES** policy to node IAM role; check `kubectl logs -l app=notification-service` |
| Frontend blank / API error | Both port-forwards must run; use `localhost` not `127.0.0.1` mix |
| Wrong cluster | `kubectl config current-context` |
| Cognito redirect error | Callback URL must include `http://localhost:5173` |

---

## Final architecture (EKS)

```text
Browser (your PC)
  → localhost:5173 → port-forward → complaint-frontend pod (nginx)
  → localhost:5000 → port-forward → complaint-service pod
        → DynamoDB, S3, Comprehend (AWS APIs via node IAM role)
        → http://notification-service:5001 → notification-service pod → SES
```

Images stored in **ECR**; EKS workers **pull** them when pods start.
