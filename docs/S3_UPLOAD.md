# S3 pre-signed upload guide

## Concepts (beginner)

### What is a pre-signed URL?

A **temporary, secure link** AWS generates so a client (Postman, browser, mobile app) can upload **directly to S3** without sending the file through your Express server. It expires after **5 minutes**.

### Why upload directly to S3?

- Your API stays fast (no large file in memory)
- Scales better in the cloud
- Standard pattern for microservices

### How S3 stores files

Files live in a **bucket** (folder in the cloud). Each file has a **key** (path), e.g. `complaints/uuid-image.png`. DynamoDB stores only `fileKey` and `fileUrl` metadata on the complaint.

---

## IAM permissions needed

Your AWS user/role needs at least:

- `s3:PutObject` on `arn:aws:s3:::YOUR_BUCKET/complaints/*`
- `s3:GetObject` on `arn:aws:s3:::YOUR_BUCKET/complaints/*` (view attachments in dashboard)

DynamoDB permissions unchanged.

---

## Postman flow (3 steps)

### Step 1 — Get pre-signed URL

- **POST** `http://localhost:5000/api/uploads/presigned-url`
- Body → raw → JSON:

```json
{
  "fileName": "image.png",
  "contentType": "image/png"
}
```

Copy from response: `uploadUrl`, `fileKey`, `fileUrl`.

### Step 2 — Upload file to S3

- **PUT** paste `uploadUrl` as the URL (full long URL from Step 1)
- Body → **binary** → select your `image.png` file
- Headers: `Content-Type: image/png` (must match Step 1)

Success: HTTP **200** from S3.

### Step 3 — Create complaint with attachment

- **POST** `http://localhost:5000/api/complaints`
- Body:

```json
{
  "title": "Water leakage",
  "description": "Water leaking in hostel room",
  "category": "Hostel",
  "fileUrl": "<fileUrl from step 1>",
  "fileKey": "<fileKey from step 1>"
}
```

---

## curl (PowerShell)

### Step 1 — Presigned URL

```powershell
$presign = Invoke-RestMethod -Uri http://localhost:5000/api/uploads/presigned-url -Method POST -ContentType "application/json" -Body '{"fileName":"image.png","contentType":"image/png"}'
$presign.data
```

### Step 2 — Upload to S3

```powershell
Invoke-WebRequest -Uri $presign.data.uploadUrl -Method PUT -InFile "C:\path\to\image.png" -ContentType "image/png"
```

### Step 3 — Create complaint

```powershell
$body = @{
  title = "Water leakage"
  description = "Water leaking in hostel room"
  category = "Hostel"
  fileUrl = $presign.data.fileUrl
  fileKey = $presign.data.fileKey
} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:5000/api/complaints -Method POST -ContentType "application/json" -Body $body
```

---

## Verify in S3 console

1. Region: **ap-south-1**
2. **S3** → your bucket → prefix **`complaints/`**
3. Open the object matching `fileKey`

---

## View attachment shows "Access Denied" XML

Your bucket is **private** (correct for security). The stored `fileUrl` cannot be opened directly in the browser.

The dashboard now calls **`GET /api/uploads/download-url?fileKey=...`** to get a temporary view link (presigned GET, 5 minutes).

Add IAM permission: **`s3:GetObject`** on `complaints/*` (see IAM section above).

---

## Fix browser "Failed to fetch" (React dashboard upload)

Postman works without CORS. **Browsers** need CORS on the S3 bucket.

1. AWS Console → **ap-south-1** → **S3** → bucket **`complaint-system-files-yaswanth`**
2. **Permissions** → **Cross-origin resource sharing (CORS)** → **Edit**
3. Paste JSON from `scripts/s3-cors.json` in the project (or copy from frontend error message docs)
4. **Save changes** → hard refresh React app (Ctrl+F5) → try upload again

---

## Common errors

| Error | Fix |
|-------|-----|
| Browser `Failed to fetch` | Add S3 CORS for `http://localhost:5173` (see above) |
| `S3_BUCKET_NAME is not set` | Add to `.env` |
| `AccessDenied` on PUT to S3 | IAM `s3:PutObject` on bucket |
| `403` on S3 PUT | `Content-Type` must match presign; URL expired (5 min) |
| `Unsupported contentType` | Use png, jpeg, webp, or pdf with matching extension |
