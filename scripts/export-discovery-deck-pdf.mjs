#!/usr/bin/env node
// Renders the discovery deck to PDF via Puppeteer.
// Usage:
//   BASE_URL=https://zippyscale.in node scripts/export-discovery-deck-pdf.mjs \
//     --contact-id ghl_123 --company "Acme" --name "Priya" \
//     --cs1 professional-services-lead-to-cash \
//     --cs2 auto-parts-distribution-order-automation \
//     --kickoff 2026-04-27 \
//     --phone "+919876543210" \
//     --out /tmp/acme-deck.pdf

import puppeteer from "puppeteer";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    "contact-id": { type: "string" },
    company: { type: "string" },
    name: { type: "string" },
    cs1: { type: "string", default: "" },
    cs2: { type: "string", default: "" },
    kickoff: { type: "string", default: "" },
    phone: { type: "string", default: "" },
    out: { type: "string" },
    "base-url": { type: "string", default: process.env.BASE_URL || "http://localhost:4173" },
  },
});

const baseUrl = values["base-url"];
const out = values.out;
const contactId = values["contact-id"];
if (!contactId || !values.company || !values.name || !out) {
  console.error(
    "Missing required args. Expected --contact-id --company --name --out"
  );
  process.exit(2);
}

const sessionPayload = {
  company: values.company,
  name: values.name,
  cs1: values.cs1,
  cs2: values.cs2,
  kickoffDate: values.kickoff,
  contactId,
  phoneE164: values.phone,
  sessionStartedAt: new Date().toISOString(),
  draftBottlenecks: { b1: "", b2: "", b3: "", savedAt: "" },
};

const browser = await puppeteer.launch({ headless: "new" });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);

// Seed localStorage before navigation.
await page.evaluateOnNewDocument((payload) => {
  try {
    localStorage.setItem("zippy_discovery_session_v1", JSON.stringify(payload));
  } catch (e) {}
}, sessionPayload);

const url = `${baseUrl}/discovery?export=true`;
await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });

// Wait for deckReady ready-state flag set by DeckShell.
try {
  await page.waitForFunction(() => window.__deckReady === true, { timeout: 30000 });
} catch (err) {
  console.error("[export] deckReady timeout; PDF may be incomplete");
}

await page.pdf({
  path: out,
  format: "a4",
  landscape: true,
  printBackground: true,
  margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
});

await browser.close();
console.log(`[export] wrote ${out}`);
