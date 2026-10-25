# Faith Connect

Follow-up platform for first timers and new converts: counsellors record
feedback round by round and track each person through foundation class until
they are planted.

Built with Next.js 15 (App Router), Clerk for sign-in and Supabase (Postgres).

## Getting started

```bash
pnpm install
pnpm dev
```

Create `.env.local` with:

| Variable | What it is |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Clerk keys |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase project URL and service role key (server only) |
| `SUPER_ADMIN_EMAILS` | Comma-separated emails made super admin when they sign in |
| `TERMII_API_KEY`, `TERMII_SENDER_ID`, `TERMII_BASE_URL`, `TERMII_CHANNEL` | Bulk SMS through Termii (optional) |
| `NEXT_PUBLIC_CHURCH_WHATSAPP_LINK` | Link used in the "WhatsApp invite" message preset (optional) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Read-only Google service account for the weekly home church report sheet (Reports page) |
| `REPORT_SHEET_ID`, `REPORT_RESPONSES_RANGE`, `REPORT_DHC_RANGE` | Optional: which sheet and tabs the Reports page reads |
| `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANG` | Automatic WhatsApp through Meta's Cloud API (optional) |

## Database

Run the files in `supabase/migrations/` in order in the Supabase SQL editor.
They are safe to run more than once.

## Roles

- **Super admin**: sees every contact, assigns contacts to counsellors, manages
  counsellors and can send bulk messages to anyone.
- **Counsellor**: sees the contacts assigned to them and anyone they have
  followed up, can message any single person, and can send bulk messages to the
  people assigned to them.

## Weekly reports

The Reports page (super admins only) reads the "Weekly Home Church Report"
Google Form responses. Share the sheet with the service account email as
Viewer. "No of DHC" per district comes from the summary tab.

## WhatsApp webhook

When the Cloud API is set up, point the Meta webhook at
`https://<your-domain>/api/webhooks/whatsapp` with `WHATSAPP_VERIFY_TOKEN` as
the verify token and subscribe to `messages`. Delivery reports mark each
contact as on or not on WhatsApp.
