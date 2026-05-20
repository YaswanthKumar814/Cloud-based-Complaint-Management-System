# Amazon Comprehend — complaint AI analysis

## What happens on `POST /api/complaints`

1. Your API receives `title` + `description`.
2. **Amazon Comprehend** (managed AWS service) analyzes the text:
   - **Sentiment** — positive / negative / neutral / mixed
   - **Key phrases** — important words/phrases AWS detects
3. **Local keyword rules** (free, in your code) set:
   - **aiCategory** — Internet, Electrical, Hostel, etc.
   - **priority** — HIGH, MEDIUM, LOW
4. All fields are saved in **DynamoDB** with the complaint.

If Comprehend fails (permissions, network), the complaint is **still created** using keyword rules only.

---

## IAM permission (AWS Console)

1. AWS Console → **IAM** → **Users** → your user
2. **Add permissions** → **Create inline policy** → **JSON**
3. Paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "comprehend:DetectSentiment",
        "comprehend:DetectKeyPhrases"
      ],
      "Resource": "*"
    }
  ]
}
```

4. Name: `ComprehendComplaintAnalysis` → **Create policy**

Region: use **ap-south-1** (same as `AWS_REGION`).

---

## npm install

```powershell
cd "c:\yaswanth\BTECH\Sem 6\Cloud Computing\Project\complaint-management-system"
npm install
npm run dev
```

---

## API test examples

### Example 1 — Hostel + HIGH priority

**POST** `http://localhost:5000/api/complaints`

```json
{
  "title": "Fire in hostel room",
  "description": "Emergency fire near bathroom in hostel block B",
  "category": "Hostel"
}
```

**Expected AI fields:**

| Field | Expected |
|-------|----------|
| aiCategory | Hostel |
| priority | HIGH |
| sentiment | (Comprehend result, often NEGATIVE) |
| keyPhrases | e.g. "hostel", "fire", "bathroom" |

### Example 2 — Internet + LOW

```json
{
  "title": "Slow wifi",
  "description": "Internet network delay in lab"
}
```

| Field | Expected |
|-------|----------|
| aiCategory | Internet |
| priority | LOW |

### Example 3 — Electrical

```json
{
  "title": "No power",
  "description": "Electricity and light not working in room"
}
```

| Field | Expected |
|-------|----------|
| aiCategory | Electrical |
| priority | LOW or MEDIUM |

---

## Verify in DynamoDB

1. Console → **DynamoDB** → **ap-south-1** → table **Complaints**
2. **Explore table items** → open latest item
3. Check: `sentiment`, `aiCategory`, `priority`, `keyPhrases` (list)

Or:

```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/complaints
```

---

## Common errors

| Error | Fix |
|-------|-----|
| AccessDenied on Comprehend | Add IAM policy above |
| Complaint created but sentiment `NEUTRAL` only | Comprehend failed — check terminal warning + IAM |
| Wrong category | Keyword not in rules — edit `src/utils/aiRules.js` |
| `UnsupportedLanguageException` | Text must be English (`LanguageCode: en`) |

---

## Beginner concepts

**Sentiment analysis** — AWS guesses if the text sounds positive, negative, neutral, or mixed.

**Key phrases** — Important short phrases in the complaint (e.g. "water leakage", "hostel room").

**How Comprehend works** — You send plain text; AWS returns JSON results. No model training on your side.

---

## Pricing (low-cost)

- Uses **DetectSentiment** + **DetectKeyPhrases** only (cheap APIs).
- **No** Bedrock, SageMaker, or custom models.
- New AWS accounts often get **Comprehend free tier** (limited units/month for 12 months).
- Each complaint = 2 small API calls (sentiment + key phrases).
- Keyword category/priority runs in your app = **$0**.

Check current pricing: AWS Console → **Comprehend** → **Pricing**.
