import { describe, test, beforeAll } from "vitest";
import { MorphixClient } from "../../../src/morphix-client.js";
import { CAN_RUN, createClient, resolveAccountId } from "./_test-helpers.js";

describe.skipIf(!CAN_RUN)("API Research - Notion, Confluence, Calendar", () => {
  let client: MorphixClient;
  let notionAccountId: string | null = null;
  let confluenceAccountId: string | null = null;
  let calendarAccountId: string | null = null;

  beforeAll(async () => {
    client = createClient();

    console.log("\n--- Resolving account IDs ---");
    notionAccountId = await resolveAccountId(client, "notion");
    console.log("  notion accountId:", notionAccountId);

    confluenceAccountId = await resolveAccountId(client, "confluence");
    console.log("  confluence accountId:", confluenceAccountId);

    calendarAccountId = await resolveAccountId(client, "microsoft_outlook_calendar");
    console.log("  microsoft_outlook_calendar accountId:", calendarAccountId);
  });

  // ─── Notion ───
  describe("Notion API", () => {
    test("GET /v1/users/me", async () => {
      if (!notionAccountId) { console.log("  SKIP: no notion account"); return; }
      try {
        const result = await client.proxy({
          accountId: notionAccountId,
          method: "GET",
          url: "https://api.notion.com/v1/users/me",
          headers: { "Notion-Version": "2022-06-28" },
        });
        console.log("  /users/me:", JSON.stringify(result).slice(0, 500));
      } catch (e: any) {
        console.log("  ERROR:", e.message);
        if (e.responseBody) console.log("  BODY:", e.responseBody.slice(0, 500));
      }
    });

    test("POST /v1/search (search all pages)", async () => {
      if (!notionAccountId) { console.log("  SKIP: no notion account"); return; }
      try {
        const result = await client.proxy({
          accountId: notionAccountId,
          method: "POST",
          url: "https://api.notion.com/v1/search",
          headers: { "Notion-Version": "2022-06-28" },
          body: { page_size: 5 },
        });
        console.log("  /search:", JSON.stringify(result).slice(0, 1200));
      } catch (e: any) {
        console.log("  ERROR:", e.message);
        if (e.responseBody) console.log("  BODY:", e.responseBody.slice(0, 500));
      }
    });

    test("POST /v1/search (databases only)", async () => {
      if (!notionAccountId) { console.log("  SKIP: no notion account"); return; }
      try {
        const result = await client.proxy({
          accountId: notionAccountId,
          method: "POST",
          url: "https://api.notion.com/v1/search",
          headers: { "Notion-Version": "2022-06-28" },
          body: { filter: { property: "object", value: "database" }, page_size: 5 },
        });
        console.log("  databases:", JSON.stringify(result).slice(0, 800));
      } catch (e: any) {
        console.log("  ERROR:", e.message);
        if (e.responseBody) console.log("  BODY:", e.responseBody.slice(0, 500));
      }
    });

    test("GET /v1/blocks/{page_id}/children (get page content)", async () => {
      if (!notionAccountId) { console.log("  SKIP: no notion account"); return; }
      // First search for a page to get its ID
      let pageId: string | null = null;
      try {
        const searchResult = await client.proxy({
          accountId: notionAccountId,
          method: "POST",
          url: "https://api.notion.com/v1/search",
          headers: { "Notion-Version": "2022-06-28" },
          body: { page_size: 1 },
        });
        const data = searchResult?.data ?? searchResult;
        if (data?.results?.length > 0) {
          pageId = data.results[0].id;
          console.log("  Using page:", pageId, "title:", data.results[0].properties?.title?.title?.[0]?.plain_text);
        }
      } catch (e: any) {
        console.log("  Search error:", e.message);
        return;
      }
      if (!pageId) return;

      try {
        const result = await client.proxy({
          accountId: notionAccountId,
          method: "GET",
          url: `https://api.notion.com/v1/blocks/${pageId}/children`,
          headers: { "Notion-Version": "2022-06-28" },
          params: { page_size: 10 },
        });
        console.log("  blocks/children:", JSON.stringify(result).slice(0, 1000));
      } catch (e: any) {
        console.log("  ERROR:", e.message);
        if (e.responseBody) console.log("  BODY:", e.responseBody.slice(0, 500));
      }
    });

    test("GET /v1/pages/{page_id} (get page metadata)", async () => {
      if (!notionAccountId) { console.log("  SKIP: no notion account"); return; }
      let pageId: string | null = null;
      try {
        const searchResult = await client.proxy({
          accountId: notionAccountId,
          method: "POST",
          url: "https://api.notion.com/v1/search",
          headers: { "Notion-Version": "2022-06-28" },
          body: { page_size: 1 },
        });
        const data = searchResult?.data ?? searchResult;
        if (data?.results?.length > 0) pageId = data.results[0].id;
      } catch (e) { return; }
      if (!pageId) return;

      try {
        const result = await client.proxy({
          accountId: notionAccountId,
          method: "GET",
          url: `https://api.notion.com/v1/pages/${pageId}`,
          headers: { "Notion-Version": "2022-06-28" },
        });
        console.log("  page metadata:", JSON.stringify(result).slice(0, 800));
      } catch (e: any) {
        console.log("  ERROR:", e.message);
        if (e.responseBody) console.log("  BODY:", e.responseBody.slice(0, 500));
      }
    });
  });

  // ─── Confluence ───
  describe("Confluence API", () => {
    // Helper to get cloudId
    async function getCloudId(): Promise<string | null> {
      if (!confluenceAccountId) return null;
      try {
        const sites = await client.proxy({
          accountId: confluenceAccountId,
          method: "GET",
          url: "https://api.atlassian.com/oauth/token/accessible-resources",
        });
        const data = sites?.data ?? sites;
        const arr = Array.isArray(data) ? data : [];
        return arr.length > 0 ? arr[0].id : null;
      } catch { return null; }
    }

    test("GET accessible resources (cloudId + scopes)", async () => {
      if (!confluenceAccountId) { console.log("  SKIP: no confluence account"); return; }
      try {
        const result = await client.proxy({
          accountId: confluenceAccountId,
          method: "GET",
          url: "https://api.atlassian.com/oauth/token/accessible-resources",
        });
        console.log("  accessible-resources:", JSON.stringify(result).slice(0, 800));
      } catch (e: any) {
        console.log("  ERROR:", e.message);
        if (e.responseBody) console.log("  BODY:", e.responseBody.slice(0, 500));
      }
    });

    test("GET spaces (v2 API)", async () => {
      const cloudId = await getCloudId();
      if (!cloudId) { console.log("  SKIP: no cloudId"); return; }

      try {
        const result = await client.proxy({
          accountId: confluenceAccountId!,
          method: "GET",
          url: `https://api.atlassian.com/ex/confluence/${cloudId}/wiki/api/v2/spaces`,
          params: { limit: 10 },
        });
        console.log("  spaces (v2):", JSON.stringify(result).slice(0, 1000));
      } catch (e: any) {
        console.log("  spaces v2 ERROR:", e.message);
        if (e.responseBody) console.log("  BODY:", e.responseBody.slice(0, 500));
      }
    });

    test("GET pages (v2 API) with sort", async () => {
      const cloudId = await getCloudId();
      if (!cloudId) { console.log("  SKIP: no cloudId"); return; }

      try {
        const result = await client.proxy({
          accountId: confluenceAccountId!,
          method: "GET",
          url: `https://api.atlassian.com/ex/confluence/${cloudId}/wiki/api/v2/pages`,
          params: { limit: 5, sort: "-modified-date" },
        });
        console.log("  pages (v2):", JSON.stringify(result).slice(0, 1200));
      } catch (e: any) {
        console.log("  pages v2 ERROR:", e.message);
        if (e.responseBody) console.log("  BODY:", e.responseBody.slice(0, 500));
      }
    });

    test("GET a single page with body (v2 API)", async () => {
      const cloudId = await getCloudId();
      if (!cloudId) { console.log("  SKIP: no cloudId"); return; }

      // Get first page
      let pageId: string | null = null;
      try {
        const pages = await client.proxy({
          accountId: confluenceAccountId!,
          method: "GET",
          url: `https://api.atlassian.com/ex/confluence/${cloudId}/wiki/api/v2/pages`,
          params: { limit: 1 },
        });
        const data = pages?.data ?? pages;
        const results = data?.results ?? [];
        if (results.length > 0) {
          pageId = results[0].id;
          console.log("  Using page:", pageId, "title:", results[0].title);
        }
      } catch (e) { return; }
      if (!pageId) return;

      // Get page with body-format=storage
      try {
        const result = await client.proxy({
          accountId: confluenceAccountId!,
          method: "GET",
          url: `https://api.atlassian.com/ex/confluence/${cloudId}/wiki/api/v2/pages/${pageId}`,
          params: { "body-format": "storage" },
        });
        console.log("  page detail:", JSON.stringify(result).slice(0, 1000));
      } catch (e: any) {
        console.log("  page detail ERROR:", e.message);
        if (e.responseBody) console.log("  BODY:", e.responseBody.slice(0, 500));
      }
    });

    test("GET spaces with pages (v2 API)", async () => {
      const cloudId = await getCloudId();
      if (!cloudId) { console.log("  SKIP: no cloudId"); return; }

      // Get first space
      let spaceId: string | null = null;
      let spaceKey: string | null = null;
      try {
        const spaces = await client.proxy({
          accountId: confluenceAccountId!,
          method: "GET",
          url: `https://api.atlassian.com/ex/confluence/${cloudId}/wiki/api/v2/spaces`,
          params: { limit: 1 },
        });
        const data = spaces?.data ?? spaces;
        const results = data?.results ?? [];
        if (results.length > 0) {
          spaceId = results[0].id;
          spaceKey = results[0].key;
          console.log("  Using space:", spaceId, "key:", spaceKey, "name:", results[0].name);
        }
      } catch (e) { return; }
      if (!spaceId) return;

      // Get pages in that space
      try {
        const result = await client.proxy({
          accountId: confluenceAccountId!,
          method: "GET",
          url: `https://api.atlassian.com/ex/confluence/${cloudId}/wiki/api/v2/spaces/${spaceId}/pages`,
          params: { limit: 5 },
        });
        console.log("  space pages:", JSON.stringify(result).slice(0, 800));
      } catch (e: any) {
        console.log("  space pages ERROR:", e.message);
        if (e.responseBody) console.log("  BODY:", e.responseBody.slice(0, 500));
      }
    });

    test("POST search (CQL)", async () => {
      const cloudId = await getCloudId();
      if (!cloudId) { console.log("  SKIP: no cloudId"); return; }

      // Try search via v2
      try {
        const result = await client.proxy({
          accountId: confluenceAccountId!,
          method: "GET",
          url: `https://api.atlassian.com/ex/confluence/${cloudId}/wiki/rest/api/search`,
          params: { cql: "type=page", limit: 5 },
        });
        console.log("  search (CQL):", JSON.stringify(result).slice(0, 800));
      } catch (e: any) {
        console.log("  search CQL ERROR:", e.message);
        if (e.responseBody) console.log("  BODY:", e.responseBody.slice(0, 500));
      }
    });
  });

  // ─── Microsoft Outlook Calendar ───
  describe("Microsoft Outlook Calendar", () => {
    test("GET /me (user profile)", async () => {
      if (!calendarAccountId) { console.log("  SKIP: no calendar account"); return; }
      try {
        const result = await client.proxy({
          accountId: calendarAccountId,
          method: "GET",
          url: "https://graph.microsoft.com/v1.0/me",
          params: { $select: "displayName,mail,userPrincipalName" },
        });
        console.log("  /me:", JSON.stringify(result).slice(0, 500));
      } catch (e: any) {
        console.log("  /me ERROR:", e.message);
        if (e.responseBody) console.log("  BODY:", e.responseBody.slice(0, 500));
      }
    });

    test("GET /me/calendars (list all calendars)", async () => {
      if (!calendarAccountId) { console.log("  SKIP: no calendar account"); return; }
      try {
        const result = await client.proxy({
          accountId: calendarAccountId,
          method: "GET",
          url: "https://graph.microsoft.com/v1.0/me/calendars",
        });
        console.log("  /calendars:", JSON.stringify(result).slice(0, 800));
      } catch (e: any) {
        console.log("  /calendars ERROR:", e.message);
        if (e.responseBody) console.log("  BODY:", e.responseBody.slice(0, 500));
      }
    });

    test("GET /me/events (basic list)", async () => {
      if (!calendarAccountId) { console.log("  SKIP: no calendar account"); return; }
      try {
        const result = await client.proxy({
          accountId: calendarAccountId,
          method: "GET",
          url: "https://graph.microsoft.com/v1.0/me/events",
          params: { $top: "5", $orderby: "start/dateTime desc" },
        });
        console.log("  /events:", JSON.stringify(result).slice(0, 1200));
      } catch (e: any) {
        console.log("  /events ERROR:", e.message);
        if (e.responseBody) console.log("  BODY:", e.responseBody.slice(0, 500));
      }
    });

    test("GET /me/calendarView (with query string in URL)", async () => {
      if (!calendarAccountId) { console.log("  SKIP: no calendar account"); return; }
      const start = new Date();
      const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Try embedding params in the URL directly since `params` may not work for $-prefixed keys
      const urlWithParams = `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${encodeURIComponent(start.toISOString())}&endDateTime=${encodeURIComponent(end.toISOString())}&$top=10&$orderby=${encodeURIComponent("start/dateTime")}`;
      try {
        const result = await client.proxy({
          accountId: calendarAccountId,
          method: "GET",
          url: urlWithParams,
        });
        console.log("  /calendarView (url params):", JSON.stringify(result).slice(0, 1000));
      } catch (e: any) {
        console.log("  /calendarView (url params) ERROR:", e.message);
        if (e.responseBody) console.log("  BODY:", e.responseBody.slice(0, 500));
      }
    });

    test("GET /me/calendarView (params in body)", async () => {
      if (!calendarAccountId) { console.log("  SKIP: no calendar account"); return; }
      const start = new Date();
      const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Try passing startDateTime/endDateTime in params object
      try {
        const result = await client.proxy({
          accountId: calendarAccountId,
          method: "GET",
          url: "https://graph.microsoft.com/v1.0/me/calendarView",
          params: {
            startDateTime: start.toISOString(),
            endDateTime: end.toISOString(),
            $top: "10",
          },
        });
        console.log("  /calendarView (params obj):", JSON.stringify(result).slice(0, 1000));
      } catch (e: any) {
        console.log("  /calendarView (params obj) ERROR:", e.message);
        if (e.responseBody) console.log("  BODY:", e.responseBody.slice(0, 500));
      }
    });

    test("GET /me/events with $filter (future events)", async () => {
      if (!calendarAccountId) { console.log("  SKIP: no calendar account"); return; }
      const now = new Date().toISOString();

      // Try filter in URL
      const url = `https://graph.microsoft.com/v1.0/me/events?$filter=${encodeURIComponent(`start/dateTime ge '${now}'`)}&$top=5&$orderby=${encodeURIComponent("start/dateTime")}`;
      try {
        const result = await client.proxy({
          accountId: calendarAccountId,
          method: "GET",
          url,
        });
        console.log("  /events filtered (url):", JSON.stringify(result).slice(0, 1000));
      } catch (e: any) {
        console.log("  /events filtered ERROR:", e.message);
        if (e.responseBody) console.log("  BODY:", e.responseBody.slice(0, 500));
      }
    });

    test("GET /me/calendar/events (default calendar events)", async () => {
      if (!calendarAccountId) { console.log("  SKIP: no calendar account"); return; }
      try {
        const result = await client.proxy({
          accountId: calendarAccountId,
          method: "GET",
          url: "https://graph.microsoft.com/v1.0/me/calendar/events",
          params: { $top: "3", $select: "subject,start,end,location,organizer,isAllDay,isCancelled" },
        });
        console.log("  /calendar/events:", JSON.stringify(result).slice(0, 1000));
      } catch (e: any) {
        console.log("  /calendar/events ERROR:", e.message);
        if (e.responseBody) console.log("  BODY:", e.responseBody.slice(0, 500));
      }
    });

    test("POST /me/events (create event - DRY RUN shape only)", async () => {
      if (!calendarAccountId) { console.log("  SKIP: no calendar account"); return; }
      // Don't actually create - just log what the shape should be
      console.log("  CREATE EVENT shape (not executed):");
      console.log("  POST https://graph.microsoft.com/v1.0/me/events");
      console.log("  body: { subject, body: { contentType, content }, start: { dateTime, timeZone }, end: { dateTime, timeZone }, location: { displayName }, attendees: [{ emailAddress: { address, name }, type }] }");
    });
  });
});
