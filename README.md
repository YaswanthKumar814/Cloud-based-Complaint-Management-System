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

## Kubernetes (Minikube)

```bash
minikube start
docker build -t complaint-service:latest .
minikube image load complaint-service:latest
kubectl apply -f k8s/
kubectl get pods -l app=complaint-service
kubectl port-forward svc/complaint-service 5000:5000
```

Then open `http://localhost:5000/`.
