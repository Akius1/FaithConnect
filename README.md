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
| `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANG` | Automatic WhatsApp through Meta's Cloud API (optional) |

## Database

Run the files in `supabase/migrations/` in order in the Supabase SQL editor.
They are safe to run more than once.

## Roles

- **Everyone signed in** sees every contact on the dashboard, Follow-up and
  Foundation Class pages, records feedback and can message any single person.
- **Counsellor**: can filter to the people assigned to them and send bulk
  messages to those people.
- **Super admin**: also manages counsellors, assigns and deletes contacts, sees
  Reports and can send bulk messages to anyone.

## WhatsApp webhook

When the Cloud API is set up, point the Meta webhook at
`https://<your-domain>/api/webhooks/whatsapp` with `WHATSAPP_VERIFY_TOKEN` as
the verify token and subscribe to `messages`. Delivery reports mark each
contact as on or not on WhatsApp.
