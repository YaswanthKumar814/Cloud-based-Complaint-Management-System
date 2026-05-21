# Phase 16 — Do this in order (simple guide)

**Goal:** Turn on Secrets Manager, better logs, and X-Ray on your **existing EKS cluster**.

**Do NOT delete the cluster.**

You need **4 PowerShell windows** at the end (for testing). For now, use **one window** and do Steps 1–6 in order.

---

## Before you start

Open PowerShell and run:

```powershell
cd "C:\yaswanth\BTECH\Sem 6\Cloud Computing\Project\complaint-management-system"
kubectl config use-context complaint-project-user@complaint-eks.ap-south-1.eksctl.io
```

If that works, you are talking to **AWS EKS** (not Minikube).

---

# STEP 1 — Save emails in AWS Secrets Manager

**Why:** Notification service reads admin/SES emails from AWS instead of only from files.

### Option A — Script (easiest)

Make sure this file exists and has your emails:

`services\notification-service\.env`

Then run:

```powershell
.\scripts\create-notification-secret.ps1
```

**Success:** prints `Done. Secret name: complaint-management/notification`

### Option B — AWS Console (if script fails)

1. Open https://console.aws.amazon.com — region **Mumbai (ap-south-1)** top-right.
2. Search bar: type **Secrets Manager** → open it.
3. Click orange button **Store a new secret**.
4. Choose **Other type of secret**.
5. Click **+ Add row** twice:
   - Row 1: Key = `SES_FROM_EMAIL` , Value = your email (same as in `.env`)
   - Row 2: Key = `ADMIN_EMAIL` , Value = same or admin email
6. Click **Next**.
7. Secret name: type exactly **`complaint-management/notification`**
8. Click **Next** → **Next** → **Store**.
9. You should see the secret in the list.

**Screenshot for report:** secret name on screen.

---

# STEP 2 — Give EKS permission to use AWS (IAM)

**Why:** Pods on EKS use a special AWS role. That role must be allowed to read DynamoDB, S3, SES, Secrets, etc.

**Important:** Edit the **NODE role**, NOT your user `complaint-project-user`.

### Open the role

1. AWS Console → search **EKS** → open **Elastic Kubernetes Service**.
2. Click **`complaint-eks`**.
3. Click tab **Resources** (left side or top).
4. Click node group **`workers`**.
5. Find line **Node IAM role** → click the **blue link** (role name starts with `eksctl-complaint-eks...`).

You are now on an IAM **Role** page.

### Add policy

1. Click **Add permissions** (big button).
2. Click **Create inline policy**.
3. Click tab **JSON**.
4. Select all text in the box → Delete.
5. Paste everything below:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ComplaintAppAWSAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Scan",
        "dynamodb:Query",
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket",
        "ses:SendEmail",
        "ses:SendRawEmail",
        "comprehend:DetectSentiment",
        "comprehend:DetectKeyPhrases",
        "secretsmanager:GetSecretValue",
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ],
      "Resource": "*"
    },
    {
      "Sid": "NotificationSecretOnly",
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:ap-south-1:167217327938:secret:complaint-management/notification*"
    }
  ]
}
```

6. Click **Next**.
7. Policy name: **`ComplaintEKSNodePolicy`**
8. Click **Create policy**.

**Done with AWS Console for IAM.**

---

# STEP 3 — Build and upload new app code to ECR

**Why:** Phase 16 changed the code. EKS must pull new Docker images.

Run these **one at a time** (each can take a few minutes):

```powershell
cd "C:\yaswanth\BTECH\Sem 6\Cloud Computing\Project\complaint-management-system"

.\scripts\push-to-ecr.ps1
```

Wait until it finishes. Then:

```powershell
.\scripts\push-to-ecr.ps1 -Service notification
```

**Success:** each command ends with a line like:

`167217327938.dkr.ecr.ap-south-1.amazonaws.com/complaint-service:latest`

---

# STEP 4 — Deploy to EKS

Run:

```powershell
kubectl apply -f k8s\eks\xray-daemon.yaml
```

**Note:** On a single **t3.small** EKS node, skip X-Ray daemon if you installed the **CloudWatch Observability** add-on and it shows **Degraded** — see `docs/EVALUATOR_CONSOLE.md` (FIX 2).

Then:

```powershell
.\scripts\apply-eks.ps1
```

Then:

```powershell
kubectl get pods
```

### What you should see

| Pod name starts with | Status |
|----------------------|--------|
| complaint-service | Running, READY 1/1 |
| notification-service | Running, READY 1/1 |
| complaint-frontend | Running, READY 1/1 |
| xray-daemon | Running (optional for X-Ray) |

If something says `ImagePullBackOff`, run Step 3 again for that service.

### Restart pods (after Step 2 IAM)

```powershell
kubectl rollout restart deployment/complaint-service
kubectl rollout restart deployment/notification-service
kubectl get pods
```

Wait 1–2 minutes until all are **Running** again.

---

# STEP 5 — Open the app on your PC (port-forward)

You need **2 terminals** that stay open.

### Terminal 1

```powershell
kubectl port-forward svc/complaint-service 5000:5000
```

Leave it open. Text should say `Forwarding from 127.0.0.1:5000`.

### Terminal 2

```powershell
kubectl port-forward svc/complaint-frontend 5173:80
```

Leave it open. Text should say `Forwarding from 127.0.0.1:5173`.

### Terminal 3 — quick test

```powershell
curl.exe http://localhost:5000/
curl.exe http://localhost:5000/api/complaints
```

**Good:**

- First line: `Complaint Service Running`
- Second: `"success":true` and list of complaints

**Bad:**

- `Access denied` → go back to **Step 2** (IAM), then restart pods again.

### Browser

Open: **http://localhost:5173**

Log in → you should see complaints.

---

# STEP 6 — Check Phase 16 features

### A) Secrets Manager worked?

```powershell
kubectl logs -l app=notification-service --tail=20
```

Look for:

- **Good:** `Secrets Manager` or `secrets-manager`
- **OK for demo:** `env fallback` (still works, uses `.env` backup)

### B) CloudWatch-style logs worked?

Create one complaint in the browser. Then:

```powershell
kubectl logs -l app=complaint-service --tail=10
```

Look for a line with **`Complaint created`** (may be JSON text).

**AWS Console (optional screenshot):**

1. **CloudWatch** → **Log groups**
2. Search `eks` or `complaint`
3. Open a recent log stream

### C) X-Ray (optional — skip if tired)

1. Create a complaint in the UI.
2. AWS Console → **CloudWatch** → left menu **X-Ray traces** → **Service map**
3. Screenshot if you see **complaint-service**

If empty: X-Ray is optional; your app still works.

---

# What each Phase 16 piece does (one sentence each)

| Piece | Simple meaning |
|-------|----------------|
| **Secrets Manager** | Hides email addresses in AWS, not only in files |
| **Structured logs** | Easier to read in CloudWatch / `kubectl logs` |
| **X-Ray** | Picture of which service called which (complaint → notification) |

---

# If something breaks

| Problem | Fix |
|---------|-----|
| `aws` not recognized | Open the terminal where AWS CLI worked before |
| `Access denied` on complaints | Repeat **Step 2**, then restart pods |
| Port-forward fails | Something else uses port 5000 or 5173 — close other apps |
| Only 1 pod on EKS | Run `.\scripts\apply-eks.ps1` again |
| Secret error | Check secret name is exactly `complaint-management/notification` |

Paste error text + which step number you are on.

---

# Screenshots checklist (evaluation)

1. Secrets Manager — secret `complaint-management/notification`
2. IAM — role with policy `ComplaintEKSNodePolicy`
3. `kubectl get pods` — 3–4 Running
4. `curl.exe` complaints JSON success
5. Browser — dashboard
6. (Optional) CloudWatch log or X-Ray map

---

# You are finished when

- [ ] Step 1 secret exists  
- [ ] Step 2 IAM policy created  
- [ ] Step 3–4 pods Running  
- [ ] Step 5 curl shows `"success":true`  
- [ ] Step 5 browser works  
- [ ] Step 6 logs look OK  

**Cluster stays running** — do not delete `complaint-eks`.
