# Email & SNS notifications (beginner guide)

## What SES and SNS do

| Service | Simple meaning |
|---------|----------------|
| **SES** | Sends **email** from your app (like Gmail API for servers) |
| **SNS** | Sends a **short message** to a topic (email/SMS subscribers can subscribe later) |

**Why useful:** Admin gets alerted when a complaint is filed or status changes — without checking DynamoDB manually.

---

## `.env` variables

Add to project root `.env` (same folder as backend `package.json`):

```env
SES_FROM_EMAIL=you@example.com
ADMIN_EMAIL=you@example.com
```

Both addresses must be **verified in SES** while your account is in **sandbox**.

Optional SNS:

```env
SNS_TOPIC_ARN=arn:aws:sns:ap-south-1:YOUR_ACCOUNT_ID:complaint-alerts
```

---

## AWS Console — SES email verification (sandbox)

### Step 1 — Open SES

1. AWS Console → top-right region: **Asia Pacific (Mumbai) ap-south-1**
2. Search bar: type **SES** → click **Amazon Simple Email Service**

### Step 2 — Verify email identity

1. Left menu → **Verified identities**
2. Click **Create identity**
3. Identity type: **Email address**
4. Email address: type the email you will use (e.g. your Gmail)
5. Click **Create identity**
6. Check that inbox → click the **verification link** from AWS
7. Refresh **Verified identities** — status should be **Verified**

Repeat for a second address if `ADMIN_EMAIL` is different from `SES_FROM_EMAIL`.

**Sandbox rule:** You can only send **to verified addresses**.

### Step 3 — IAM permission

1. **IAM** → **Users** → your user → **Add permissions** → **Create inline policy** → **JSON**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ses:SendEmail", "ses:SendRawEmail"],
      "Resource": "*"
    }
  ]
}
```

4. Name: `SESComplaintEmail` → **Create policy**

Optional SNS:

```json
{
  "Effect": "Allow",
  "Action": ["sns:Publish"],
  "Resource": "arn:aws:sns:ap-south-1:YOUR_ACCOUNT_ID:complaint-alerts"
}
```

---

## Optional — create SNS topic

1. AWS Console → **SNS** → region **ap-south-1**
2. **Topics** → **Create topic**
3. Type: **Standard**
4. Name: `complaint-alerts`
5. **Create topic**
6. Copy **ARN** → paste into `.env` as `SNS_TOPIC_ARN`
7. **Create subscription** → Protocol **Email** → Endpoint = your admin email → Confirm subscription email

---

## npm install & run

```powershell
cd "c:\yaswanth\BTECH\Sem 6\Cloud Computing\Project\complaint-management-system"
npm install
npm run dev
```

---

## Testing

### Test 1 — Create complaint (email)

**POST** `http://localhost:5000/api/complaints`

```json
{
  "title": "Fire in hostel room",
  "description": "Emergency fire near bathroom",
  "category": "Hostel"
}
```

**Terminal should show:**

```
[notification] Email sent: [New Complaint] Fire in hostel room
```

**Check inbox** for `ADMIN_EMAIL`.

### Test 2 — Update status

**PUT** `http://localhost:5000/api/complaints/<complaintId>/status`

```json
{ "status": "Resolved" }
```

Subject: `[Resolved] Fire in hostel room`

Other statuses send `[Status Update] ... → In Progress` etc.

---

## Example email body

```
A new complaint was submitted.

Complaint ID: 3ed686e4-2671-45ea-a9be-7d4473b79528
Title: Fire in hostel room
Status: Pending
AI Category: Hostel
Priority: HIGH
User Category: Hostel
Sentiment: NEUTRAL
Key Phrases: —
Description: Emergency fire near bathroom
```

---

## Verify delivery

1. Check **ADMIN_EMAIL** inbox (and spam folder)
2. SES Console → **Account dashboard** → sending statistics
3. If SNS enabled: SNS → topic → **Monitoring** for publish count

---

## Common SES sandbox errors

| Error | Fix |
|-------|-----|
| `MessageRejected` Email address not verified | Verify **both** FROM and TO in SES |
| `AccessDenied` | Add `ses:SendEmail` IAM policy |
| Email skipped in logs | Set `SES_FROM_EMAIL` and `ADMIN_EMAIL` in `.env`, restart server |
| Complaint saves but no email | Notifications never block API — read terminal `[notification]` logs |
| Wrong region | SES + app must use **ap-south-1** |

---

## Free Tier notes

- **SES:** 3,000 messages/month free (first 12 months on new accounts) when sent from EC2 — check current AWS pricing page
- **SNS:** 1 million publishes/month free tier (first 12 months)
- This project sends **1 email per create** and **1 per status update** — very low volume

---

## When notifications run

| API | Notification |
|-----|----------------|
| `POST /api/complaints` | New complaint email (+ optional SNS) |
| `PUT /api/complaints/:id/status` | Status update email (+ optional SNS) |

Complaint **always saves** even if SES/SNS fails.
