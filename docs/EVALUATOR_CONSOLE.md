# Show project in AWS Console (for evaluator)

Region: **ap-south-1 (Mumbai)** for everything below.

Your app **already works** (`kubectl` proves it). The Console needs **two fixes** so an evaluator can click around:

1. **EKS access** for your IAM user  
2. **CloudWatch logs** (optional add-on — one-time install)

---

# FIX 1 — EKS Console says “no access to Kubernetes objects”

**Problem:** Your IAM user can own the cluster but cannot open **Pods / Services** in the EKS web UI.

**Fix:** Add an **EKS access entry** (AWS’s way to allow Console + kubectl).

## Steps in AWS Console

1. Region: **ap-south-1**
2. Search **EKS** → open **Elastic Kubernetes Service**
3. Click cluster **`complaint-eks`**
4. Open tab **Access** (top menu on cluster page)
5. Click **Create access entry**
6. **IAM principal ARN** — paste your user ARN:

   ```text
   arn:aws:iam::167217327938:user/complaint-project-user
   ```

   (If different user name, find it: **IAM** → **Users** → your user → copy **ARN**)

7. **Type:** Standard
8. Click **Create**
9. Still on **Access** tab → select the entry you created → **Associate access policy**
10. Choose policy: **AmazonEKSClusterAdminPolicy** (for demo / full view)
11. **Access scope:** Cluster
12. Click **Create**

Wait 1 minute. Refresh the cluster page.

## Check it worked

1. **EKS** → **complaint-eks** → tab **Resources** (or **Workloads**)
2. You should see **Pods** like `complaint-service`, `notification-service`, `complaint-frontend`
3. No red “no access” banner

## If “Create access entry” is greyed out

Use terminal (PowerShell) as admin user:

```powershell
eksctl create accessentry --cluster complaint-eks --region ap-south-1 --principal-arn arn:aws:iam::167217327938:user/complaint-project-user --type STANDARD

eksctl associate accesspolicy --cluster complaint-eks --region ap-south-1 --principal-arn arn:aws:iam::167217327938:user/complaint-project-user --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy --access-scope type=cluster
```

Then refresh the EKS Console page.

---

# FIX 2 — CloudWatch (evaluator wants to see logs)

**Problem:** EKS page asks to **Install CloudWatch Observability add-on** — without it, app logs may not appear in Log groups.

**What still works without add-on:** Secrets Manager, ECR, EKS cluster info (after Fix 1), X-Ray (sometimes).

**For logs in Console:** install the add-on **once** (recommended for evaluation).

## Install CloudWatch Observability add-on (simple path)

1. **EKS** → **complaint-eks**
2. Tab **Observability** (or **Add-ons**)
3. Section **CloudWatch Observability** (or **Install CloudWatch Observability add-on**)
4. Click **Install** or **Enable**
5. Leave defaults if unsure → confirm **Install**
6. Wait **5–15 minutes** until status **Active / Healthy**

## If status stays **Degraded** (single t3.small node)

**Cause:** One `t3.small` node allows only **11 pods**. The add-on needs the **controller** pod plus **fluent-bit** and **cloudwatch-agent**. With your 3 app pods + system pods, the controller stays **Pending** (`Too many pods`) and the Console shows **Degraded**.

**Fix (already applied on your cluster — run again if it happens):**

```powershell
kubectl config use-context complaint-project-user@complaint-eks.ap-south-1.eksctl.io

# Free one pod slot (optional X-Ray daemon uses a slot)
kubectl delete daemonset xray-daemon -n default --ignore-not-found

# Free another slot (metrics-server does not need 2 replicas on 1 node)
kubectl scale deployment metrics-server -n kube-system --replicas=1

# Wait until controller is Running
kubectl get pods -n amazon-cloudwatch

# Refresh add-on health in AWS (status should become Active)
aws eks update-addon --cluster-name complaint-eks --addon-name amazon-cloudwatch-observability --region ap-south-1 --resolve-conflicts OVERWRITE
```

**Do not delete** cluster `complaint-eks`. For evaluation, **Active** add-on + `kubectl logs` backup is enough.

**Alternative (costs more):** scale the node group to 2 nodes in `eks/cluster.yaml` and `eksctl scale nodegroup`.

## After install — where to see YOUR logs

1. Open **CloudWatch** (search bar)
2. Left menu → **Application monitoring** → **Container Insights**  
   OR **Logs** → **Log groups**
3. Search log groups for: **`complaint-eks`** or **`/aws/containerinsights`**
4. Open a log group → **Log streams** → pick recent stream
5. Search (**Ctrl+F**) for: **`Complaint created`** or **`secrets-manager`**

### Logs Insights (nice screenshot)

1. CloudWatch → **Logs** → **Logs Insights**
2. Select log groups that contain `complaint-eks` / `containerinsights`
3. Query:

```sql
fields @timestamp, @message
| filter @message like /Complaint created/ or @message like /Secrets Manager/
| sort @timestamp desc
| limit 25
```

4. **Run query** → screenshot results

**Backup for evaluator:** If add-on is slow, show the same JSON lines from:

```powershell
kubectl logs -l app=complaint-service --tail=20
```

Print/screenshot terminal — that is valid proof logs exist.

---

# Where each feature appears in Console (evaluator map)

| Your feature | Console path | What to screenshot |
|--------------|--------------|-------------------|
| **EKS cluster** | EKS → **complaint-eks** → Overview (Active) | Cluster status |
| **Pods / services** | EKS → complaint-eks → **Resources** / Workloads | 3 app pods Running |
| **ECR images** | **ECR** → Repositories → `complaint-service`, `notification-service`, `complaint-frontend` | `latest` tag |
| **Secrets Manager** | **Secrets Manager** → `complaint-management/notification` | Secret name + retrieve value (blur email if needed) |
| **CloudWatch logs** | CloudWatch → Log groups or Container Insights (after add-on) | Line with `Complaint created` |
| **X-Ray** | CloudWatch → **X-Ray traces** → **Service map** | `complaint-service` node (optional) |
| **DynamoDB** | **DynamoDB** → Tables → **Complaints** → Explore items | Sample complaint row |
| **S3** | **S3** → bucket `complaint-system-files-yaswanth` | Bucket exists |
| **Cognito** | **Cognito** → User pool → App client | Hosted UI (optional) |

---

# X-Ray in Console (step by step)

1. **CloudWatch** (not a separate X-Ray old homepage)
2. Left: **Application monitoring** → **X-Ray traces**
3. Click **Service map**
4. Time: **Last 1 hour**
5. Create one complaint on http://localhost:5173 (port-forwards on)
6. Wait 2–3 min → refresh

If empty: optional; mention X-Ray daemon + ENABLE_XRAY in report.

---

# What to tell evaluator (one sentence each)

- **EKS:** “Three microservices run as pods on cluster complaint-eks.”
- **ECR:** “Docker images are stored in private ECR and pulled by EKS.”
- **Secrets Manager:** “Notification emails are loaded from secret complaint-management/notification.”
- **CloudWatch:** “Structured JSON logs from pods are in CloudWatch Log groups (Container Insights add-on).”
- **X-Ray:** “Request traces show complaint-service handling API calls.”

---

# Order to do today

1. **Fix 1** — EKS access entry (5 min)  
2. Open **Secrets Manager** + **ECR** — screenshots (already works)  
3. **Fix 2** — Install CloudWatch add-on on cluster (wait 15 min)  
4. Screenshot **Log groups** or **Logs Insights**  
5. Optional: **X-Ray Service map**  
6. Keep terminal screenshots (`kubectl get pods`, `kubectl logs`) as backup  

**Do not delete** cluster `complaint-eks`.
