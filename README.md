# Complaint Management System — Backend

Phase 2 foundation: Node.js + Express with ES modules.

## Structure

```
src/
  config/       # Environment configuration
  controllers/  # Route handlers
  middleware/   # Error handling, etc.
  routes/       # Express routers
  services/     # Business logic (Phase 3+)
  app.js        # Express application
  server.js     # Entry point
```

## Run

```bash
npm install
npm run dev
```

Server listens on `process.env.PORT` (default **5000** from `.env`).

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

Run:

```bash
docker run --rm -p 5000:5000 --name complaint-service complaint-service:latest
```

Verify:

```bash
curl http://localhost:5000/
```
