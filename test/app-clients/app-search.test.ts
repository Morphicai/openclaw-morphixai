import { describe, test, beforeAll } from "vitest";
import { MorphixClient } from "../../src/morphix-client.js";
import { CAN_RUN, createClient } from "./_test-helpers.js";

describe.skipIf(!CAN_RUN)("Pipedream App Search", () => {
  let client: MorphixClient;
  beforeAll(async () => { client = createClient(); });

  const categories = [
    "music", "spotify", "apple_music", "soundcloud",
    "news", "rss", "hackernews", "reddit",
    "weather", "openweather",
    "calendar", "google_calendar",
    "ai", "openai", "anthropic",
    "storage", "dropbox", "google_drive",
    "social", "twitter", "instagram", "tiktok",
    "productivity", "todoist", "clickup", "trello",
    "finance", "stripe", "paypal",
    "communication", "telegram", "whatsapp", "discord",
    "video", "youtube", "twitch", "zoom",
    "ecommerce", "shopify",
    "analytics", "google_analytics",
    "database", "airtable", "supabase", "firebase",
    "cms", "wordpress", "contentful",
    "design", "figma", "canva",
    "crm", "hubspot", "salesforce",
    "translation", "deepl",
    "maps", "google_maps",
    "email_marketing", "mailchimp", "sendgrid",
    "survey", "typeform",
    "document", "google_docs", "google_sheets",
  ];

  test("search all categories", async () => {
    const allApps = new Map<string, { name: string; slug: string; auth: string; proxy?: boolean }>();

    for (const q of categories) {
      try {
        const result = await client.listApps(q, 5, 0);
        for (const app of result.data) {
          if (!allApps.has(app.nameSlug)) {
            allApps.set(app.nameSlug, {
              name: app.name,
              slug: app.nameSlug,
              auth: app.authType,
              proxy: app.connect?.proxy_enabled,
            });
          }
        }
      } catch (e) {
        // ignore
      }
    }

    // Group by whether proxy is enabled (we need proxy for our SDK)
    const proxyApps = [...allApps.values()].filter(a => a.proxy);
    const noProxyApps = [...allApps.values()].filter(a => !a.proxy);

    console.log(`\n=== Proxy-enabled apps (${proxyApps.length}) ===`);
    for (const a of proxyApps.sort((a, b) => a.name.localeCompare(b.name))) {
      console.log(`  ${a.slug} : ${a.name} (${a.auth})`);
    }

    console.log(`\n=== No proxy (${noProxyApps.length}) ===`);
    for (const a of noProxyApps.sort((a, b) => a.name.localeCompare(b.name))) {
      console.log(`  ${a.slug} : ${a.name} (${a.auth})`);
    }
  }, 120000);
});
