# Complaint Management System — Backend

Phase 2 foundation: Node.js + Express with ES modules.

## Structure

```
src/
  config/       # Environment configuration
  controllers/  # Route handlers
  middleware/   # Error handling, etc.
  routes/       # Express routers
  services/     # DynamoDB complaint logic
  utils/        # Validation, async helpers
  app.js        # Express application
  server.js     # Entry point
```

## Run

```bash
npm install
npm run dev
```

Server listens on `process.env.PORT` (default **5000** from `.env`).

Set `AWS_REGION` and `DYNAMODB_TABLE` in `.env` (see `.env.example`). AWS credentials use the [default credential chain](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html) (e.g. `aws configure`).

Complaint REST API: **`/api/complaints`** — [docs/COMPLAINT_API.md](docs/COMPLAINT_API.md).

S3 pre-signed uploads: **`POST /api/uploads/presigned-url`** — [docs/S3_UPLOAD.md](docs/S3_UPLOAD.md).

## Frontend (React + Cognito)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** — Cognito: [docs/COGNITO_FRONTEND.md](docs/COGNITO_FRONTEND.md). Admin dashboard: [docs/DASHBOARD.md](docs/DASHBOARD.md).

Complaint AI (Amazon Comprehend): [docs/COMPREHEND_AI.md](docs/COMPREHEND_AI.md).

**What to do next (start here):** [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md)  
**3 containers (frontend + backends):** [docs/THREE_CONTAINERS.md](docs/THREE_CONTAINERS.md)  
**Which `.env` for each terminal:** [docs/LOCAL_RUN.md](docs/LOCAL_RUN.md)  
**Microservices architecture:** [docs/MICROSERVICES.md](docs/MICROSERVICES.md)  
**Email/SNS (AWS Console):** [docs/NOTIFICATIONS.md](docs/NOTIFICATIONS.md)

## Verify Phase 2

```bash
curl http://localhost:5000/
```

Expected:

```json
{ "message": "Complaint Service Running" }
```

## Docker

Build:

```bash
docker build -t complaint-service:latest .
```

Run (with AWS credentials for DynamoDB — mount your local `~/.aws` folder):

```powershell
docker build -t complaint-service:latest .
docker rm -f complaint-service 2>$null
docker run --rm -p 5000:5000 --name complaint-service `
  -v "${env:USERPROFILE}\.aws:/home/app/.aws:ro" `
  -e AWS_SDK_LOAD_CONFIG=1 `
  complaint-service:latest
```

Or pass keys explicitly (do not commit keys to git):

```powershell
docker run --rm -p 5000:5000 --name complaint-service `
  -e AWS_REGION=ap-south-1 `
  -e DYNAMODB_TABLE=Complaints `
  -e AWS_ACCESS_KEY_ID=your_key `
  -e AWS_SECRET_ACCESS_KEY=your_secret `
  complaint-service:latest
```

**Easiest for API testing:** skip Docker and use `npm run dev` — it uses your local AWS credentials automatically.

Verify:

```bash
curl http://localhost:5000/
```

## Amazon ECR (store Docker image in AWS)

Push `complaint-service:latest` to a private AWS registry (for future EKS; optional for local dev).

Full guide: **[docs/ECR.md](docs/ECR.md)**

Quick push (after creating repo in console + `scripts/ecr.env`):

```powershell
.\scripts\push-to-ecr.ps1
```

## Amazon EKS (temporary evaluation cluster)

Lightweight AWS-managed Kubernetes — **delete after screenshots** to save cost.

Guide: **[docs/EKS.md](docs/EKS.md)**

```powershell
eksctl create cluster -f eks/cluster.yaml
aws eks update-kubeconfig --region ap-south-1 --name complaint-eks
.\scripts\apply-eks.ps1
kubectl get pods -l app=complaint-service
# When finished:
eksctl delete cluster -f eks/cluster.yaml
```

## Kubernetes (Minikube — local)

```bash
minikube start
docker build -t complaint-service:latest .
minikube image load complaint-service:latest
kubectl apply -f k8s/
kubectl get pods -l app=complaint-service
kubectl port-forward svc/complaint-service 5000:5000
```

Then open `http://localhost:5000/`.
