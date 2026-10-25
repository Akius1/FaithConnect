import "server-only";
import { createSign } from "crypto";

// Reads the weekly home church report from Google Sheets with a service
// account (share the sheet with GOOGLE_SERVICE_ACCOUNT_EMAIL as Viewer).
//
// Env:
//   GOOGLE_SERVICE_ACCOUNT_EMAIL       service account email
//   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY private key from its JSON key file
//   REPORT_SHEET_ID                    spreadsheet id (defaults to the 2026 sheet)
//   REPORT_RESPONSES_RANGE             default 'Form Responses 1'!A:EE
//   REPORT_DHC_RANGE                   default 'Copy of Weekly Summary Reports'!A1:B14

const DEFAULT_SHEET_ID = "1Cpeaylc3OkFosYtlTzsO40xUVJ9PJqKBoqvJ56gDnn0";
const CACHE_MS = 60_000;

export function sheetsConfigured() {
  return !!(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY);
}

export function reportSheetUrl() {
  return `https://docs.google.com/spreadsheets/d/${process.env.REPORT_SHEET_ID || DEFAULT_SHEET_ID}/edit`;
}

let token: { value: string; expires: number } | null = null;

async function accessToken(): Promise<string> {
  if (token && token.expires > Date.now() + 60_000) return token.value;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
  // Keys pasted into env files usually have literal "\n" sequences.
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);
  const encode = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
    iss: email,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(key).toString("base64url");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
    cache: "no-store",
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Google sign-in failed: ${body.error_description ?? body.error ?? res.status}`);
  token = { value: body.access_token, expires: Date.now() + body.expires_in * 1000 };
  return token.value;
}

let cache: { at: number; data: { responses: string[][]; dhc: string[][] } } | null = null;

export async function fetchReportSheet(force = false): Promise<{ responses: string[][]; dhc: string[][] }> {
  if (!force && cache && Date.now() - cache.at < CACHE_MS) return cache.data;

  const id = process.env.REPORT_SHEET_ID || DEFAULT_SHEET_ID;
  const ranges = [
    process.env.REPORT_RESPONSES_RANGE || "'Form Responses 1'!A:EE",
    process.env.REPORT_DHC_RANGE || "'Copy of Weekly Summary Reports'!A1:B14",
  ];
  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values:batchGet`);
  ranges.forEach((r) => url.searchParams.append("ranges", r));
  url.searchParams.set("valueRenderOption", "FORMATTED_VALUE");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${await accessToken()}` },
    cache: "no-store",
  });
  const body = await res.json();
  if (!res.ok) {
    const hint =
      res.status === 403
        ? " Share the sheet with the service account email as Viewer."
        : res.status === 400
        ? " Check the sheet tab names in REPORT_RESPONSES_RANGE / REPORT_DHC_RANGE."
        : "";
    throw new Error(`Could not read the report sheet: ${body.error?.message ?? res.status}.${hint}`);
  }

  const [responses, dhc] = (body.valueRanges ?? []).map(
    (v: { values?: string[][] }) => v.values ?? []
  );
  const data = { responses: (responses ?? []).slice(1), dhc: dhc ?? [] };
  cache = { at: Date.now(), data };
  return data;
}
