# Phase 16 — technical reference

**Start here instead:** [PHASE16_SIMPLE.md](./PHASE16_SIMPLE.md) — step-by-step guide in plain language.

This file has extra detail (architecture, IAM JSON, concepts). Use the simple guide first.

---

## Quick links

| Topic | Document |
|-------|----------|
| **Do Phase 16 now** | [PHASE16_SIMPLE.md](./PHASE16_SIMPLE.md) |
| **EKS node IAM clicks** | [EKS_NODE_IAM.md](./EKS_NODE_IAM.md) |
| **Phase 15 EKS verify** | [EKS_PHASE15_VERIFY.md](./EKS_PHASE15_VERIFY.md) |

---

## What was added (short)

1. **Secrets Manager** — notification-service reads `complaint-management/notification`
2. **Structured logs** — JSON to stdout → CloudWatch on EKS
3. **X-Ray** — complaint-service traces (optional, `ENABLE_XRAY=true` on EKS)

Local `.env` still works as backup.
