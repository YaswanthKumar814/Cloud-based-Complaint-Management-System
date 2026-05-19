# Complaint Management Microservice

Production-ready Node.js Express API backed by Amazon DynamoDB (AWS SDK v3).

## Project structure

```
├── config/          # Environment and DynamoDB client
├── controllers/     # Request/response handling
├── middleware/      # Global error handling
├── routes/          # Express route definitions
├── services/        # DynamoDB business logic
├── utils/           # Shared helpers
├── app.js           # Express application
└── server.js        # HTTP server entry point
```

## Setup

1. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create the DynamoDB table (AWS CLI):

   ```bash
   aws dynamodb create-table --cli-input-json file://scripts/create-table.json
   ```

   For DynamoDB Local, set `DYNAMODB_ENDPOINT=http://localhost:8000` in `.env`.

4. Start the server:

   ```bash
   npm run dev
   ```

## API

| Method | Path           | Description              |
|--------|----------------|--------------------------|
| POST   | `/complaint`   | Create a complaint       |
| GET    | `/complaints`  | List complaints          |
| PUT    | `/status`      | Update complaint status  |
| GET    | `/health`      | Health check             |

### POST /complaint

```json
{
  "title": "Network outage",
  "description": "Cannot access internal portal since 9 AM",
  "category": "IT",
  "reporterEmail": "user@example.com"
}
```

### GET /complaints

Query parameters:

- `status` — filter by `open`, `in_progress`, `resolved`, or `closed`
- `limit` — max items (default 50, max 100)

### PUT /status

```json
{
  "complaintId": "uuid-from-create-response",
  "status": "in_progress"
}
```

## Error responses

All errors return a consistent JSON shape:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable message"
  }
}
```
