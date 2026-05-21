# Amazon EKS — lightweight evaluation deployment

**Temporary cluster** — create for screenshots, then **delete** to stop charges.

---

## What is EKS?

| Term | Simple meaning |
|------|----------------|
| **EKS** | Kubernetes managed by AWS (control plane in AWS, you add worker nodes) |
| **Minikube** | Kubernetes on your laptop (free, local) |
| **ECR** | Where your Docker image lives in AWS |
| **eksctl** | CLI tool that creates EKS clusters easily |
| **kubectl** | CLI tool that talks to any Kubernetes cluster |

**How ECR + EKS connect:**

```text
Your code → Docker → push to ECR
                         ↓
              EKS worker node pulls image from ECR
                         ↓
              Pod runs complaint-service container
```

Minikube used `imagePullPolicy: Never` + local image. **EKS must pull from ECR.**

---

## Cost note (important)

While the cluster exists you pay roughly for:

- EKS control plane (~$0.10/hour per cluster)
- 1× **t3.small** EC2 worker node
- Small EBS disk

**Delete the cluster when done** (Step 8 below).

---

## Prerequisites (install once)

1. **AWS CLI** — configured (`aws configure`, region `ap-south-1`)
2. **kubectl** — [Install guide](https://kubernetes.io/docs/tasks/tools/)
3. **eksctl** — [Install guide](https://eksctl.io/installation/)

Verify:

```powershell
aws sts get-caller-identity
kubectl version --client
eksctl version
```

---

## Step 0 — IAM permissions for `eksctl` (fix AccessDenied)

If you see:

```text
not authorized to perform: eks:DescribeClusterVersions
```

your IAM user **`complaint-project-user`** cannot create EKS yet. **This is IAM, not a project code bug.**

### Option A — student / evaluation (simplest)

1. AWS Console → search **IAM** → open **IAM**
2. Left menu → **Users** → click **`complaint-project-user`**
3. Tab **Permissions** → **Add permissions** → **Attach policies directly**
4. Search: **`AdministratorAccess`**
5. Check the box → **Next** → **Add permissions**
6. Wait **1 minute**
7. Retry in PowerShell:

```powershell
eksctl create cluster -f eks/cluster.yaml
```

**After evaluation:** you may remove `AdministratorAccess` and delete the cluster. Use only on your own AWS account for this project.

### Option B — narrower (if admin will not give AdministratorAccess)

Ask your instructor to attach an **EKS admin** policy to your user, or use the official list:  
https://eksctl.io/usage/minimum-iam-policies/

`eksctl` needs many actions (EKS, EC2, IAM, CloudFormation), not just one permission.

### Verify IAM before create

```powershell
aws eks describe-cluster-versions --region ap-south-1 --output table
```

**Expected:** a table of Kubernetes versions (no `AccessDenied`).

---

## Before you start

- ECR image already pushed:  
  `167217327938.dkr.ecr.ap-south-1.amazonaws.com/complaint-service:latest`  
  (use **your** account ID if different)
- `scripts/ecr.env` filled in (same as ECR push)

---

## Step 1 — Create EKS cluster (eksctl)

Open PowerShell in **project root**.

### Option A — config file (recommended)

```powershell
cd "c:\yaswanth\BTECH\Sem 6\Cloud Computing\Project\complaint-management-system"
eksctl create cluster -f eks/cluster.yaml
```

### Option B — one command

```powershell
eksctl create cluster --name complaint-eks --region ap-south-1 --nodes 1 --node-type t3.small --managed
```

### Expected wait time

| Phase | Time |
|-------|------|
| Creating cluster + node group | **15–25 minutes** (normal) |
| First time in account | can be up to **30 minutes** |

If you see `1.29 is no longer supported`, edit `eks/cluster.yaml` → set `version` to a supported value (e.g. **1.32**). Check with:

```powershell
aws eks describe-cluster-versions --region ap-south-1 --query "clusterVersions[?versionStatus=='STANDARD_SUPPORT'].clusterVersion" --output table
```

### Expected output (end)

```text
[✓]  EKS cluster "complaint-eks" in "ap-south-1" region is ready
```

---

## Step 2 — Connect kubectl to EKS

```powershell
aws eks update-kubeconfig --region ap-south-1 --name complaint-eks
```

Test:

```powershell
kubectl get nodes
```

**Expected:**

```text
NAME                                          STATUS   ROLES    AGE   VERSION
ip-xxx.ap-south-1.compute.internal            Ready    <none>   5m    v1.29.x
```

Wait until **STATUS = Ready** (1–5 minutes after cluster ready).

---

## Step 3 — Let pods use AWS (DynamoDB, S3, SES)

EKS nodes need permission to call AWS APIs (same as your laptop IAM user).

1. AWS Console → **EKS** → cluster **complaint-eks**
2. Tab **Resources** → click **complaint-eks-workers-...** node group (or similar)
3. Note the **Node IAM role** name → open it in **IAM** → **Roles**
4. **Add permissions** → attach policies your app needs (evaluation; keep minimal if you know IAM):
   - Access to **DynamoDB** table Complaints
   - **S3** bucket `complaint-system-files-yaswanth`
   - **SES** send
   - **Comprehend** (optional)

**Beginner shortcut (demo only, broad):** attach `AmazonDynamoDBFullAccess`, `AmazonS3FullAccess`, `AmazonSESFullAccess` — remove after evaluation.

ECR pull is usually already allowed via **AmazonEC2ContainerRegistryReadOnly** on the node role (eksctl adds this).

---

## Step 4 — Deploy app from ECR

```powershell
.\scripts\apply-eks.ps1
```

Or manually edit `k8s/eks/deployment.yaml` — replace `REPLACE_WITH_ECR_IMAGE` with your ECR URI, then:

```powershell
kubectl apply -f k8s/eks/deployment.yaml
kubectl apply -f k8s/eks/service.yaml
```

### Watch rollout (1–3 minutes)

```powershell
kubectl get pods -l app=complaint-service -w
```

Press `Ctrl+C` when **READY** shows `1/1`.

---

## Step 5 — Verify deployment

```powershell
kubectl get deployments
kubectl get pods -l app=complaint-service
kubectl get svc complaint-service
kubectl describe deployment complaint-service
```

**Expected pods:**

```text
NAME                                 READY   STATUS    RESTARTS   AGE
complaint-service-xxxxxxxxxx-xxxxx   1/1     Running   0          2m
```

**Test API (port-forward):**

```powershell
kubectl port-forward svc/complaint-service 5000:5000
```

New terminal:

```powershell
curl http://localhost:5000/
```

**Expected:** `{"message":"Complaint Service Running"}`

---

## Step 6 — Screenshots for evaluation

Capture these (AWS Console + terminal):

| # | What to capture |
|---|-----------------|
| 1 | **EKS** → cluster **complaint-eks** → Overview (Active) |
| 2 | **EKS** → **Resources** → Node groups (1 node) |
| 3 | **ECR** → **complaint-service** → image `latest` |
| 4 | Terminal: `kubectl get nodes` |
| 5 | Terminal: `kubectl get pods` (Running, 1/1) |
| 6 | Terminal: `kubectl get svc` |
| 7 | Terminal: `kubectl describe deployment complaint-service` |
| 8 | Browser or curl: health JSON on localhost:5000 (with port-forward) |

Optional: `kubectl logs -l app=complaint-service --tail=30`

---

## Step 7 — Compare Minikube vs EKS

| | Minikube | EKS |
|---|----------|-----|
| Where it runs | Your PC | AWS |
| Image source | `minikube image load` | **ECR pull** |
| Cost | Free | Paid while cluster exists |
| For evaluation | Local dev | AWS-managed Kubernetes |

---

## Step 8 — DELETE cluster (do this after screenshots)

```powershell
eksctl delete cluster -f eks/cluster.yaml
```

Or:

```powershell
eksctl delete cluster --name complaint-eks --region ap-south-1
```

### Expected wait time

**5–15 minutes**

### Expected output

```text
[✓]  Kubernetes cluster "complaint-eks" in "ap-south-1" region is deleted
```

Verify in console: **EKS** → no cluster **complaint-eks** (only deleted clusters in history).

---

## Common errors and fixes

| Symptom | Cause | Fix |
|---------|--------|-----|
| `ImagePullBackOff` | Wrong ECR URI or no ECR on node role | Fix image in YAML; check node IAM ECR read |
| `CrashLoopBackOff` | App error (AWS creds on node) | `kubectl logs <pod>`; add IAM policies to **node role** |
| `NotReady` nodes | Still starting | Wait 5–10 min after cluster create |
| `Unable to connect` kubectl | Wrong kubeconfig | Re-run `aws eks update-kubeconfig` |
| `eks:DescribeClusterVersions` denied | IAM | Step 0 — attach **AdministratorAccess** (or minimum eksctl policies) to **complaint-project-user** |
| `AccessDenied` on eksctl create | IAM | Same as above — run `aws eks describe-cluster-versions --region ap-south-1` to test |
| Pending pods | No nodes / no capacity | `kubectl describe pod` → Events |
| Still charged after delete | Delete not finished | Wait for eksctl to finish; check EC2/EKS console |

---

## File map

| File | Purpose |
|------|---------|
| `eks/cluster.yaml` | Small 1-node cluster config |
| `k8s/eks/deployment.yaml` | Pod spec (ECR image placeholder) |
| `k8s/eks/service.yaml` | ClusterIP service |
| `k8s/deployment.yaml` | **Minikube only** (local image) |
| `scripts/apply-eks.ps1` | Apply manifests with ECR URI from `ecr.env` |

---

## Quick command cheat sheet

```powershell
# Create (15–25 min)
eksctl create cluster -f eks/cluster.yaml
aws eks update-kubeconfig --region ap-south-1 --name complaint-eks

# Deploy
.\scripts\apply-eks.ps1
kubectl get pods -w

# Test
kubectl port-forward svc/complaint-service 5000:5000

# Delete (5–15 min) — IMPORTANT
eksctl delete cluster -f eks/cluster.yaml
```
