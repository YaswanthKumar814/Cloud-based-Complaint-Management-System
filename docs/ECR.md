# Amazon ECR — push your backend Docker image

## What is Amazon ECR?

**ECR** = AWS **container image registry** (like a private Docker Hub in your AWS account).

| Concept | Meaning |
|---------|---------|
| Local image | `complaint-service:latest` on your laptop |
| ECR repository | Named folder in AWS for your images |
| Image URI | Address Kubernetes/EKS will pull from later |

**Why before EKS?** Clusters on AWS (EKS) pull images from ECR — not from your laptop. This phase stores your built image in AWS.

---

## What you already have

- `Dockerfile` in project root (unchanged)
- Local image name: **`complaint-service:latest`**
- Region: **`ap-south-1`** (Mumbai)

---

## Part 1 — Create ECR repository (AWS Console)

1. Open [AWS Console](https://console.aws.amazon.com/)
2. Top-right region: **Asia Pacific (Mumbai) `ap-south-1`**
3. Search bar → type **ECR** → click **Elastic Container Registry**
4. Left menu → **Repositories**
5. Click orange button **Create repository**
6. Settings:
   - **Visibility:** Private
   - **Repository name:** `complaint-service` (exactly this, lowercase with hyphen)
   - Leave other defaults
7. Click **Create repository**
8. Click the new repo **`complaint-service`**
9. Copy the **URI** at the top. It looks like:

   ```
   167217327938.dkr.ecr.ap-south-1.amazonaws.com/complaint-service
   ```

   (`167217327938` is an example account ID — yours may differ.)

Save that URI — you need it for every push.

---

## Part 2 — IAM permission (if CLI fails)

Your IAM user needs ECR push permissions. Inline policy example:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:PutImage"
      ],
      "Resource": "*"
    }
  ]
}
```

**IAM** → **Users** → your user → **Add permissions** → **Create inline policy** → **JSON** → paste → name `ECRPush` → **Create**.

---

## Part 3 — AWS CLI: login, tag, push

Open PowerShell in the **project root** (where `Dockerfile` is).

### Step 0 — set variables (replace account ID)

```powershell
$AWS_REGION = "ap-south-1"
$AWS_ACCOUNT_ID = "167217327938"
$ECR_REPO = "complaint-service"
$ECR_REGISTRY = "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
$IMAGE_URI = "$ECR_REGISTRY/${ECR_REPO}:latest"
```

Check account ID in console: top-right username dropdown → account ID.

### Step 1 — build local image (if not already built)

```powershell
cd "c:\yaswanth\BTECH\Sem 6\Cloud Computing\Project\complaint-management-system"
docker build -t complaint-service:latest .
```

### Step 2 — authenticate Docker to ECR

```powershell
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
```

**Expected:** `Login Succeeded`

> If `aws` is not recognized: install [AWS CLI](https://aws.amazon.com/cli/) and run `aws configure` with the same credentials as your project.

### Step 3 — tag image for ECR

```powershell
docker tag complaint-service:latest $IMAGE_URI
```

### Step 4 — push to ECR

```powershell
docker push $IMAGE_URI
```

**Expected:** layers upload, ends with `latest: digest: sha256:... size: ...`

---

## Part 4 — verify in AWS Console

1. **ECR** → **Repositories** → **complaint-service**
2. Click tab **Images**
3. You should see image tag **`latest`**
4. Status **Active**, with **Pushed at** timestamp and size (~100–200 MB)

---

## Repeat later (helper script)

Copy `scripts/ecr.env.example` → `scripts/ecr.env`, edit your account ID, then:

```powershell
cd "c:\yaswanth\BTECH\Sem 6\Cloud Computing\Project\complaint-management-system"
.\scripts\push-to-ecr.ps1
```

(`scripts/ecr.env` is gitignored — do not commit account-specific values if you prefer.)

---

## Common errors and fixes

| Error | Fix |
|-------|-----|
| `aws: command not found` | Install AWS CLI, restart terminal |
| `Unable to locate credentials` | Run `aws configure` (Access Key + Secret + region ap-south-1) |
| `Login Succeeded` but push fails 403 | Add IAM ECR policy (Part 2) |
| `repository does not exist` | Create repo in **same region** (ap-south-1) |
| `no basic auth credentials` | Run `docker login` step again (token expires ~12 hours) |
| Wrong digest / old code | Re-run `docker build` then tag + push again |

---

## How this fits your project

```text
Your code → docker build → complaint-service:latest (local)
                ↓
         docker tag + push
                ↓
    ECR: ...amazonaws.com/complaint-service:latest (AWS)
                ↓
    (Future) EKS pulls this URI — not implemented in this phase
```

Local **Minikube** still uses `minikube image load` — separate from ECR.

---

## Quick reference

| Item | Value |
|------|--------|
| Repository name | `complaint-service` |
| Local image | `complaint-service:latest` |
| Region | `ap-south-1` |
| Remote tag | `<account>.dkr.ecr.ap-south-1.amazonaws.com/complaint-service:latest` |
