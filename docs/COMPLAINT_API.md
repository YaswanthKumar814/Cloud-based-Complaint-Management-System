# Complaint APIs (DynamoDB)

Beginner guide: testing, verification, and concepts.

## Table requirement (AWS)

Your table **Complaints** must use partition key:

| Attribute      | Type   |
|----------------|--------|
| `complaintId`  | String |

If your table uses a different key name, update `Key` / `Item` in `src/services/complaintService.js` to match.

---

## Major files (what each does)

| File | Role |
|------|------|
| `src/config/env.js` | Loads `.env` and exposes `PORT`, `AWS_REGION`, `DYNAMODB_TABLE`. |
| `src/config/dynamodb.js` | Builds `DynamoDBDocumentClient` (one shared client for the app). |
| `src/routes/complaintRoutes.js` | Maps URLs (`/api/complaints`, etc.) to controller functions. |
| `src/controllers/complaintController.js` | Parses request, calls service, sends JSON response + status code. |
| `src/services/complaintService.js` | Talks to DynamoDB (Put, Scan, Get, Update). |
| `src/utils/complaintValidation.js` | Checks required fields and allowed status values. |
| `src/utils/HttpError.js` | Small error type with HTTP status for the error middleware. |
| `src/utils/asyncHandler.js` | Catches async errors so Express can run `errorHandler`. |
| `src/middleware/errorHandler.js` | Turns errors into `{ success: false, error: { message } }`. |

---

## APIs

### `POST /api/complaints`

Creates one row. Server sets `complaintId`, `createdAt`, `status: "Pending"`.

### `GET /api/complaints`

Returns all items (Scan), newest first by `createdAt`.

### `GET /api/complaints/:id`

One item by `complaintId`.

### `PUT /api/complaints/:id/status`

Body: `{ "status": "Resolved" }`. Allowed: `Pending`, `In Progress`, `Resolved`, `Rejected` (case-insensitive input; stored with canonical spelling).

### `GET /`

Unchanged: health-style message for Docker/Kubernetes probes.

---

## `npm install` (after pulling code)

```bash
cd "c:\yaswanth\BTECH\Sem 6\Cloud Computing\Project\complaint-management-system"
npm install
```

---

## Restart Docker / Kubernetes (after code changes)

### Docker

```bash
docker build -t complaint-service:latest .
docker rm -f complaint-service 2>nul
docker run --rm -p 5000:5000 --name complaint-service complaint-service:latest
```

For AWS from the container, pass credentials (example — prefer IAM roles in real cloud):

```bash
docker run --rm -p 5000:5000 ^
  -e AWS_REGION=ap-south-1 ^
  -e DYNAMODB_TABLE=Complaints ^
  -e AWS_ACCESS_KEY_ID=... ^
  -e AWS_SECRET_ACCESS_KEY=... ^
  complaint-service:latest
```

On Windows PowerShell use `` ` `` for line continuation or a single line.

### Minikube (image loaded locally)

```bash
docker build -t complaint-service:latest .
minikube image load complaint-service:latest
kubectl rollout restart deployment/complaint-service
kubectl rollout status deployment/complaint-service
```

Add AWS credentials in cluster (example Secret + env) before DynamoDB calls will succeed from pods.

---

## Postman

1. **Create:** `POST` `http://localhost:5000/api/complaints` → Body → raw → JSON:

```json
{
  "title": "Water leakage",
  "description": "Water leaking in hostel room",
  "category": "Hostel"
}
```

2. **List:** `GET` `http://localhost:5000/api/complaints`

3. **Get one:** `GET` `http://localhost:5000/api/complaints/<complaintId>`

4. **Update status:** `PUT` `http://localhost:5000/api/complaints/<complaintId>/status`

```json
{ "status": "Resolved" }
```

---

## curl (Windows PowerShell)

Create (save `complaintId` from response):

```powershell
$body = '{"title":"Water leakage","description":"Water leaking in hostel room","category":"Hostel"}'
Invoke-RestMethod -Uri http://localhost:5000/api/complaints -Method POST -ContentType "application/json" -Body $body
```

List:

```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/complaints
```

Get by id:

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/complaints/YOUR-COMPLAINT-ID-HERE"
```

Update status:

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/complaints/YOUR-COMPLAINT-ID-HERE/status" -Method PUT -ContentType "application/json" -Body '{"status":"Resolved"}'
```

---

## Example JSON

**POST response (201):**

```json
{
  "success": true,
  "data": {
    "complaintId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "Water leakage",
    "description": "Water leaking in hostel room",
    "category": "Hostel",
    "status": "Pending",
    "createdAt": "2026-05-20T12:00:00.000Z"
  }
}
```

**GET list (200):**

```json
{
  "success": true,
  "count": 1,
  "data": [ { "...": "..." } ]
}
```

**PUT status (200):**

```json
{
  "success": true,
  "data": {
    "complaintId": "...",
    "status": "Resolved",
    "updatedAt": "2026-05-20T12:05:00.000Z",
    "...": "..."
  }
}
```

**Validation error (400):**

```json
{
  "success": false,
  "error": { "message": "title is required" }
}
```

---

## Verify data in DynamoDB console

1. Open **AWS Console** → **DynamoDB** → same region as `AWS_REGION` (e.g. `ap-south-1`).
2. **Tables** → open **Complaints**.
3. **Explore table items** (or **Scan**).
4. You should see items with `complaintId`, `title`, `description`, `category`, `status`, `createdAt`, and after update `updatedAt`.

---

## Common DynamoDB / AWS errors

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| Table not found | Wrong region or table name | Set `AWS_REGION` and `DYNAMODB_TABLE`; confirm in console |
| Access denied | IAM user lacks `dynamodb:GetItem`, `PutItem`, `Scan`, `UpdateItem` | Attach policy for your table ARN |
| Invalid credentials | Keys expired or wrong profile | `aws configure list`; refresh keys |
| ValidationException | Partition key name mismatch | Table must use `complaintId` (String) or change code |
| Empty list but items exist | Different region/account | Same account/region as CLI |

---

## Concepts (simple)

### What `DynamoDBDocumentClient` does

The low-level client expects DynamoDB’s `{ S: "text" }` style attributes. The **Document Client** converts normal JS objects automatically, so you write `{ title: "Leak" }` instead of `{ title: { S: "Leak" } }`.

### Why NoSQL fits complaints

Each complaint is a **document** (one row with flexible fields). You can add fields later without migrations. For large scale you’d add indexes; for learning, **Scan** all items is fine.

### How data is stored

One **item** per complaint. Primary key is **`complaintId`**. Other attributes live on the same item. **Update** changes `status` and adds `updatedAt`.
