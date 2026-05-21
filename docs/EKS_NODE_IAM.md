# EKS node IAM role — beginner steps (DynamoDB, S3, SES, Secrets, X-Ray)

Your worker nodes use an **IAM role**. Pods (complaint-service, notification-service) use that role to call AWS APIs.

**Your node role name (from cluster `complaint-eks`):**

```text
eksctl-complaint-eks-nodegroup-wor-NodeInstanceRole-HUbjmdorVsjv
```

**Account:** `167217327938`  
**Region:** `ap-south-1`

---

## How to open the role (2 ways)

### Way A — from EKS (easiest)

1. AWS Console → top-right region: **Asia Pacific (Mumbai) ap-south-1**
2. Search **EKS** → open **Elastic Kubernetes Service**
3. Click cluster **`complaint-eks`**
4. Tab **Resources** (or **Compute**)
5. Under **Node groups**, click **`workers`**
6. Find **Node IAM role ARN** → click the **role name** link (opens IAM)

### Way B — from IAM directly

1. AWS Console → search **IAM** → **Roles**
2. Search: `eksctl-complaint-eks-nodegroup`
3. Click role: **`eksctl-complaint-eks-nodegroup-wor-NodeInstanceRole-HUbjmdorVsjv`**

---

## What to attach (evaluation demo)

You can use **one combined inline policy** (simplest) or separate policies.

### Option 1 — ONE inline policy (recommended for beginners)

1. On the role page, click **Add permissions** → **Create inline policy**
2. Click tab **JSON**
3. Delete everything in the box
4. Paste this **entire** JSON:

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
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "ses:SendEmail",
        "ses:SendRawEmail",
        "comprehend:DetectSentiment",
        "comprehend:DetectKeyPhrases",
        "secretsmanager:GetSecretValue",
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords",
        "lambda:InvokeFunction"
      ],
      "Resource": "*"
    },
    {
      "Sid": "InvokeComplaintStatsLambda",
      "Effect": "Allow",
      "Action": ["lambda:InvokeFunction"],
      "Resource": "arn:aws:lambda:ap-south-1:167217327938:function:complaint-stats-lambda"
    },
    {
      "Sid": "SecretsManagerNotificationSecret",
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:ap-south-1:167217327938:secret:complaint-management/notification*"
    }
  ]
}
```

5. Click **Next**
6. Policy name: **`ComplaintEKSNodePolicy`**
7. Click **Create policy**

**Note:** `Resource: "*"` on the first statement is a **student demo shortcut**. For production you would restrict each service to specific ARNs.

---

### Option 2 — AWS managed policies (faster but broader)

On the role → **Add permissions** → **Attach policies** → search and attach:

| Policy | Purpose |
|--------|---------|
| `AmazonDynamoDBFullAccess` | Complaints table |
| `AmazonS3FullAccess` | Attachments bucket |
| `AmazonSESFullAccess` | Email |
| `ComprehendReadOnly` | AI sentiment/phrases (optional) |
| `AWSXRayDaemonWriteAccess` | X-Ray traces |
| `SecretsManagerReadWrite` | Secrets (broader than needed) |

If you already attached DynamoDB/S3/SES earlier, **only add** what is missing (Secrets + X-Ray + Comprehend).

---

## Check what is already attached

On the role page:

1. Tab **Permissions**
2. Look under **Permissions policies**
3. You might already see:
   - `AmazonEC2ContainerRegistryReadOnly` (for ECR pull — from eksctl)
   - Policies you added before for DynamoDB

If DynamoDB already works after your last fix, you may only need to **add** Secrets Manager + X-Ray (+ Comprehend if AI should work on EKS).

### Small add-on policy (only Secrets + X-Ray)

If you do not want to touch existing policies, create **second** inline policy named `ComplaintEKSExtras`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:ap-south-1:167217327938:secret:complaint-management/notification*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "comprehend:DetectSentiment",
        "comprehend:DetectKeyPhrases"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## After saving IAM — restart pods (important)

IAM changes apply to the **role** immediately, but restart pods so apps retry AWS calls:

```powershell
kubectl config use-context complaint-project-user@complaint-eks.ap-south-1.eksctl.io

kubectl rollout restart deployment/complaint-service
kubectl rollout restart deployment/notification-service

kubectl get pods -w
```

Wait until all show **1/1 Running** (`Ctrl+C`).

---

## Verify each permission

### DynamoDB + complaint API

```powershell
kubectl port-forward svc/complaint-service 5000:5000
```

Other terminal:

```powershell
curl.exe http://localhost:5000/api/complaints
```

**Expected:** `"success":true` — **not** Access denied.

### Secrets Manager (notification)

```powershell
kubectl logs -l app=notification-service --tail=20
```

**Expected:** message like `Loaded configuration from Secrets Manager` with `secretsSource: secrets-manager`.

If you see `using .env fallback` — secret missing or `GetSecretValue` denied; fix secret + IAM.

### X-Ray (optional)

1. `kubectl apply -f k8s/eks/xray-daemon.yaml`
2. Create a complaint
3. Console → **CloudWatch** → **X-Ray traces** → **Service map**

---

## Common mistakes

| Mistake | Result |
|---------|--------|
| Edited **IAM user** instead of **node role** | EKS pods still denied |
| Wrong region for secret | Secrets Manager fails → .env fallback |
| Forgot to restart pods | Old errors until restart |
| Secret name typo | Must be exactly `complaint-management/notification` |

---

## Quick reference

| AWS service | Used by | IAM action |
|-------------|---------|------------|
| DynamoDB | complaint-service | dynamodb:* (table access) |
| S3 | complaint-service | s3:Get/PutObject |
| SES | notification-service | ses:SendEmail |
| Secrets Manager | notification-service | secretsmanager:GetSecretValue |
| Comprehend | complaint-service | comprehend:Detect* |
| X-Ray | complaint-service | xray:Put* |
| Lambda | complaint-service (Phase 17) | lambda:InvokeFunction → `complaint-stats-lambda` |
