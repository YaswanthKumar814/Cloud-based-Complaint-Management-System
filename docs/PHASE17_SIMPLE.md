# Phase 17 — AWS Lambda (beginner guide)

**Goal:** Add one small **Lambda** function for **complaint statistics**, called from **complaint-service** on a new API route. Everything else stays the same.

**Region:** `ap-south-1` (Mumbai)  
**Function name:** `complaint-stats-lambda`  
**New API:** `GET /api/analytics/summary`

---

## What Lambda does (simple)

| Piece | Role |
|-------|------|
| **EKS / Docker** | Runs your main app (complaint, notification, frontend) |
| **Lambda** | Runs a **short** job on demand: count complaints by status from **DynamoDB** |
| **complaint-service** | Calls Lambda when you hit `/api/analytics/summary` |

Lambda is **serverless**: no server to manage; you pay only when it runs (very low cost for demos).

---

## Files added (project)

| Path | Purpose |
|------|---------|
| `lambda/complaint-stats/index.mjs` | Lambda handler (DynamoDB scan → counts) |
| `lambda/complaint-stats/package.json` | Lambda dependencies |
| `lambda/complaint-stats/iam-trust-policy.json` | Trust policy for Lambda role (Console) |
| `lambda/complaint-stats/iam-policy.json` | DynamoDB read + CloudWatch Logs |
| `scripts/deploy-complaint-stats-lambda.ps1` | Zip + create/update function |
| `src/services/lambdaAnalyticsService.js` | Invoke Lambda from Express |
| `src/controllers/analyticsController.js` | HTTP handler |
| `src/routes/analyticsRoutes.js` | Route registration |

**Updated:** `package.json`, `src/app.js`, `src/config/env.js`, `.env.example`, `k8s/deployment.yaml`, `k8s/eks/deployment.yaml`, `docs/EKS_NODE_IAM.md`

---

# PART 1 — AWS Console: IAM role for Lambda

1. Open **AWS Console** → region **ap-south-1**
2. Search **IAM** → **Roles** → **Create role**
3. **Trusted entity:** AWS service → **Lambda** → Next
4. **Permissions:** Skip managed policies for now → Next
5. **Role name:** `complaint-stats-lambda-role` → **Create role**
6. Open the role → **Trust relationships** → **Edit** → paste from `lambda/complaint-stats/iam-trust-policy.json` if needed (default Lambda trust is usually fine)
7. **Add permissions** → **Create inline policy** → **JSON** → paste from `lambda/complaint-stats/iam-policy.json`
8. Policy name: `ComplaintStatsLambdaPolicy` → **Create**

---

# PART 2 — Deploy Lambda (terminal)

From project root:

```powershell
cd "c:\yaswanth\BTECH\Sem 6\Cloud Computing\Project\complaint-management-system"
.\scripts\deploy-complaint-stats-lambda.ps1
```

**First time only:** function creation needs role `complaint-stats-lambda-role` from Part 1.

**Console check:** **Lambda** → **Functions** → `complaint-stats-lambda` → **Configuration** → Runtime **Node.js 20.x**, Handler `index.handler`.

---

# PART 3 — IAM: let complaint-service invoke Lambda

Your EKS pods use the **node IAM role** (same as Phase 15/16).

1. **IAM** → **Roles** → `eksctl-complaint-eks-nodegroup-wor-NodeInstanceRole-HUbjmdorVsjv`
2. Edit inline policy (or add statement):

```json
{
  "Sid": "InvokeComplaintStatsLambda",
  "Effect": "Allow",
  "Action": ["lambda:InvokeFunction"],
  "Resource": "arn:aws:lambda:ap-south-1:167217327938:function:complaint-stats-lambda"
}
```

Full example is in `docs/EKS_NODE_IAM.md`.

**Local Docker:** your `~/.aws` user also needs `lambda:InvokeFunction` on that function (attach same JSON to your IAM user or use admin for demo).

---

# PART 4 — Enable in complaint-service

**Local `.env`** (project root):

```env
LAMBDA_STATS_FUNCTION=complaint-stats-lambda
```

**EKS:** already set in `k8s/eks/deployment.yaml`. After code change:

```powershell
npm install
.\scripts\push-to-ecr.ps1
.\scripts\apply-eks.ps1
kubectl rollout restart deployment/complaint-service
```

**Docker Compose:**

```powershell
docker compose up --build
```

---

# PART 5 — Verification

### A) Direct Lambda invoke (AWS CLI)

```powershell
aws lambda invoke --function-name complaint-stats-lambda --region ap-south-1 --payload "{}" out.json
Get-Content out.json
```

**Expected (example):**

```json
{"total":5,"byStatus":{"Pending":3,"In Progress":1,"Resolved":1},"tableName":"Complaints","generatedAt":"2026-05-21T...","source":"complaint-stats-lambda"}
```

### B) API via complaint-service

**Local** (service on port 5000):

```powershell
curl http://localhost:5000/api/analytics/summary
```

**EKS** (port-forward first):

```powershell
kubectl port-forward svc/complaint-service 5000:5000
curl http://localhost:5000/api/analytics/summary
```

**Expected:**

```json
{
  "success": true,
  "source": "aws-lambda",
  "functionName": "complaint-stats-lambda",
  "data": {
    "total": 5,
    "byStatus": { "Pending": 3 },
    "tableName": "Complaints",
    "generatedAt": "...",
    "source": "complaint-stats-lambda"
  }
}
```

### C) CloudWatch Logs (Lambda)

1. **CloudWatch** → **Log groups**
2. Open `/aws/lambda/complaint-stats-lambda`
3. Open latest **Log stream** → see `START` / `END` / `REPORT` lines

### D) Existing APIs still work

```powershell
curl http://localhost:5000/
curl http://localhost:5000/api/complaints
```

Both should still return `success` / running message.

---

# Evaluation alignment (CO2 / CO3)

| Topic | How Phase 17 helps |
|-------|-------------------|
| **Cloud-native** | Mix of **containers (EKS)** and **serverless (Lambda)** — common real pattern |
| **CO2 (design)** | Shows you can offload a **read-only analytics** task without changing core CRUD |
| **CO3 (implementation)** | Working **invoke** path: API → Lambda → DynamoDB → JSON response |
| **Service count** | Adds **AWS Lambda** to ECR, EKS, DynamoDB, S3, SES, Cognito, CloudWatch, X-Ray, Secrets Manager |

**One sentence for evaluator:**  
“The complaint API invokes a Lambda function that aggregates complaint counts from DynamoDB for the analytics summary endpoint.”

---

# Console screenshots (evaluator)

| What | Where |
|------|--------|
| Lambda function | Lambda → Functions → `complaint-stats-lambda` |
| Test invoke | Function → **Test** tab → empty event `{}` → **Test** |
| Logs | Monitor → **View CloudWatch logs** |
| IAM role | IAM → Roles → `complaint-stats-lambda-role` |
| API proof | Terminal `curl .../api/analytics/summary` or EKS port-forward |

---

# Common issues

| Problem | Fix |
|---------|-----|
| `503 Lambda analytics not configured` | Set `LAMBDA_STATS_FUNCTION=complaint-stats-lambda` in `.env` or deployment |
| `502 Could not invoke Lambda` | Add `lambda:InvokeFunction` on node role / IAM user |
| `AccessDeniedException` in Lambda logs | Fix Lambda role policy — needs `dynamodb:Scan` on `Complaints` table |
| `ResourceNotFoundException` | Run `deploy-complaint-stats-lambda.ps1` or create function in Console |
| `ResourceConflictException` on update | Wait 30s and run deploy script again (script now waits for Lambda to be Active) |
| EKS still old code | `push-to-ecr.ps1` + `apply-eks.ps1` + `kubectl rollout restart deployment/complaint-service` |

---

# What we did NOT add (on purpose)

- API Gateway  
- EventBridge  
- SQS / Step Functions  
- Async pipelines  

Keeps the cluster **stable** and the demo **simple**.

---

# Phase 17 checklist

- [ ] IAM role `complaint-stats-lambda-role` + inline policy  
- [ ] Lambda `complaint-stats-lambda` deployed (script or Console)  
- [ ] Node IAM role can `lambda:InvokeFunction`  
- [ ] `LAMBDA_STATS_FUNCTION` set locally and on EKS  
- [ ] `curl /api/analytics/summary` returns counts  
- [ ] CloudWatch log group for Lambda shows invocations  
- [ ] `GET /api/complaints` still works  

When all boxes are checked, **Phase 17 is complete**.
