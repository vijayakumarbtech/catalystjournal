# The Catalyst — API Documentation

Base URL (local dev): `http://localhost:5000/api`
Base URL (production): `https://<your-render-app>.onrender.com/api`

All responses follow one of these shapes:

```json
{ "success": true, "data": { ... } }
{ "success": true, "data": [ ... ], "page": 1, "totalPages": 4, "totalCount": 42 }
{ "success": false, "message": "Human-readable error message" }
{ "success": false, "message": "...", "errors": { "email": "Enter a valid email address." } }
```

The `errors` field (field name → message) appears on `POST /submissions`
validation failures so the frontend can highlight the specific field.

Admin routes require an `Authorization: Bearer <token>` header, obtained from
`POST /api/admin/auth/login`.

---

## Public Routes

| Method | Path | Description |
|---|---|---|
| GET | `/settings` | Site-wide settings (journal name, contact info, stats, socials, hero content, payment method config). |
| GET | `/nav` | Enabled navigation items (header + footer columns), in admin-configured order. |
| GET | `/issues?year=&volume=&page=` | Paginated list of published issues. |
| GET | `/issues/current` | The issue currently flagged as "current". |
| GET | `/issues/:id` | A single issue with its populated articles. |
| GET | `/articles?search=&subject=&year=&volume=&issue=&page=` | Paginated, filterable article list. |
| GET | `/articles/featured` | Up to 6 featured (or most recent) articles. |
| GET | `/articles/:slug` | A single article; increments its view count. |
| POST | `/articles/:id/download` | Increments an article's download counter. |
| GET | `/editorial-board` | All editorial board members, grouped by role on the client. |
| POST | `/submissions` | Create a new paper submission (multipart/form-data — see below). |
| GET | `/payments/methods` | Admin-configured payment method options (UPI ID, GPay/PhonePe/Paytm/Stripe links, Razorpay toggle). |
| POST | `/payments/create-order` | Creates a Razorpay order for a given `submissionId`. |
| POST | `/payments/verify` | Verifies a completed Razorpay payment's signature. |
| POST | `/payments/manual` | Self-reports a UPI/GPay/PhonePe/Paytm/Stripe payment; sets status to "under-verification". |
| GET | `/pages/:slug` | CMS page content (`submission-guidelines`, `open-access-statement`, `peer-review-policy`, `publication-ethics`, `guidelines`). |
| GET | `/faqs` | All FAQs, sorted by display order. |
| GET | `/news` | Latest 20 news/announcement posts. |
| POST | `/contact` | Submit the contact form. |
| POST | `/newsletter/subscribe` | Subscribe an email to the newsletter. |

### POST /submissions (multipart/form-data)

Fields: `authorName, coAuthors, email, phone, institution, department,
country, orcid, paperTitle, abstract, keywords, subject, message` (text
fields) plus files `manuscript` (required, PDF/DOC/DOCX, ≤15MB) and
`copyrightForm` (optional, PDF/DOC/DOCX). Server-side validates required
fields, email format, and ORCID format (`0000-0002-1825-0097`), returning
`400` with a field-keyed `errors` object on failure.

Response:
```json
{ "success": true, "data": { "_id": "...", "trackingId": "TC-SUB-2026-000123", "amount": 250000 } }
```

`amount` is in the smallest currency unit (paise for INR) and is set
server-side from Settings — never trust a client-supplied amount.

### GET /payments/methods
```json
{
  "success": true,
  "data": {
    "upiId": "journal@upi",
    "googlePayLink": "https://...",
    "phonePeLink": "https://...",
    "paytmLink": "https://...",
    "stripeLink": "https://...",
    "razorpayEnabled": true,
    "bankDetails": { "accountName": "...", "accountNumber": "...", "ifscCode": "...", "bankName": "..." }
  }
}
```

### POST /payments/create-order
```json
{ "submissionId": "..." }
```
Returns `{ orderId, amount, currency, keyId }` for use with Razorpay Checkout
on the client. Covers Card, Debit Card, Net Banking, and Wallet — Razorpay
Checkout presents these as tabs within one widget.

### POST /payments/verify
```json
{
  "submissionId": "...",
  "razorpay_order_id": "...",
  "razorpay_payment_id": "...",
  "razorpay_signature": "..."
}
```
Verifies the HMAC signature server-side, marks the submission + a `Payment`
record as `paid`.

### POST /payments/manual
```json
{ "submissionId": "...", "method": "upi", "transactionId": "...", "authorNote": "optional" }
```
`method` is one of `upi`, `googlepay`, `phonepe`, `paytm`, `stripe`. Creates
a `Payment` record with status `under-verification` and emails the author.
An admin must approve it via `PATCH /admin/payments/:id` before the
submission counts as paid — see "a note on payment verification" in the
root README for why this can't be automatic for these methods.

---

## Admin Routes (require `Authorization: Bearer <token>`)

| Method | Path | Description |
|---|---|---|
| POST | `/admin/auth/login` | `{ email, password }` → `{ token, admin }`. Rate-limited. |
| GET | `/admin/auth/me` | Returns the currently authenticated admin. |
| GET | `/admin/dashboard/stats` | Dashboard counters (papers, pending, accepted, payments, visitors). |
| GET | `/admin/submissions?search=&status=&page=` | Paginated submissions list. |
| GET | `/admin/submissions/export` | Downloads all submissions as an `.xlsx` file. |
| PATCH | `/admin/submissions/:id` | `{ status, revisionNote? }` — update review status; emails the author on accepted/rejected/revision-requested. |
| DELETE | `/admin/submissions/:id` | Delete a submission. |
| GET | `/admin/payments?search=&status=&page=` | Paginated payments list (populated with submission). |
| PATCH | `/admin/payments/:id` | `{ status }` — approve (`paid`) / reject (`failed`) / `pending`; syncs the linked submission and emails the author. |
| GET / POST | `/admin/issues` | List / create issues. |
| PUT / DELETE | `/admin/issues/:id` | Update / delete an issue. |
| PATCH | `/admin/issues/:id/set-current` | Marks one issue as current, unsets all others. |
| POST | `/admin/issues/:id/cover` | Upload a cover image (multipart, field `cover`). |
| GET / POST | `/admin/articles` | List / create articles. |
| PUT / DELETE | `/admin/articles/:id` | Update / delete an article. |
| GET / POST | `/admin/editorial-board` | List / add editorial board members. |
| PUT / DELETE | `/admin/editorial-board/:id` | Update / remove a member. |
| GET | `/admin/pages/:slug` | Fetch a CMS page for editing. |
| PUT | `/admin/pages/:slug` | Upsert a CMS page's title/content/metaDescription. |
| GET / POST | `/admin/faqs` | List / add FAQs. |
| PUT / DELETE | `/admin/faqs/:id` | Update / remove an FAQ. |
| GET / POST | `/admin/news` | List / add news posts. |
| PUT / DELETE | `/admin/news/:id` | Update / remove a news post. |
| GET | `/admin/contacts` | List contact form submissions. |
| DELETE | `/admin/contacts/:id` | Delete a contact message. |
| GET | `/admin/settings` | Fetch full site settings (identity, hero, contact, socials, stats, payment methods). |
| PUT | `/admin/settings` | Update site settings. |
| GET | `/admin/nav` | List all navigation items (all locations, including disabled). |
| POST | `/admin/nav` | Create a nav item: `{ location, label, path }`. |
| PUT | `/admin/nav/:id` | Update a nav item (label, path, or `enabled`). |
| DELETE | `/admin/nav/:id` | Delete a nav item. |
| PATCH | `/admin/nav/:id/reorder` | `{ direction: 'up' | 'down' }` — swaps order with its neighbor. |
| POST | `/admin/nav/:id/children` | Add a dropdown child: `{ label, path }`. |
| PUT | `/admin/nav/:id/children/:childId` | Update a dropdown child. |
| DELETE | `/admin/nav/:id/children/:childId` | Remove a dropdown child. |

---

## Authentication

JWTs are signed with `JWT_SECRET` and expire per `JWT_EXPIRES_IN` (default
7 days). Passwords are hashed with bcrypt (12 rounds). There is no public
registration endpoint — admin accounts are created via the seed script
(`npm run seed`) or directly in Supabase's Table Editor.

## Rate Limits

- General API: 300 requests / 15 min per IP
- `/submissions`: 10 / hour per IP
- `/payments/*`: 20 / 15 min per IP
- `/admin/auth/login`: 10 / 15 min per IP

## File Uploads

Uploaded manuscripts/copyright forms are served statically from
`/uploads/<papers|copyright-forms|covers>/<filename>` relative to the API's
base URL, accepting PDF, DOC, or DOCX (≤15MB). On Render's ephemeral
filesystem, uploaded files do **not** persist across deploys/restarts — see
the deployment guide for swapping in a persistent disk or S3-compatible
storage for production use.

## Database Collections

`admins`, `submissions`, `payments`, `cmspages`, `editorialmembers`,
`issues`, `articles`, `faqs`, `news`, `contactmessages`, `newsletters`,
`settings` (singleton document), `navitems`, `pageviews`.
