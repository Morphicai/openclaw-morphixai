import { describe, test, expect, beforeAll } from "vitest";
import { OutlookCalendarClient } from "../../src/app-clients/outlook-calendar-client.js";
import {
  CAN_RUN,
  createClient,
  resolveAccountId,
  tolerateServerError,
} from "./_test-helpers.js";

describe.skipIf(!CAN_RUN)("OutlookCalendarClient Integration", () => {
  let calendar: OutlookCalendarClient;
  let connected = false;

  beforeAll(async () => {
    const client = createClient();
    const accountId = await resolveAccountId(client, "microsoft_outlook_calendar");
    if (!accountId) return;
    calendar = new OutlookCalendarClient(client, accountId);
    connected = true;
  });

  test("should get current user profile", async () => {
    if (!connected) return;
    const me = await tolerateServerError(() => calendar.getMe());
    if (!me) return;
    expect(me.displayName).toBeTruthy();
    console.log(`  ✓ User: ${me.displayName} (${me.mail || me.userPrincipalName})`);
  });

  test("should list calendars", async () => {
    if (!connected) return;
    const result = await tolerateServerError(() => calendar.listCalendars());
    if (!result) return;
    expect(result.value).toBeDefined();
    console.log(`  ✓ Calendars: ${result.value.length}`);
    for (const c of result.value) {
      console.log(
        `    - ${c.name} (default: ${c.isDefaultCalendar}, owner: ${c.owner?.name})`,
      );
    }
  });

  test("should list events", async () => {
    if (!connected) return;
    const result = await tolerateServerError(() =>
      calendar.listEvents({ top: 5 }),
    );
    if (!result) return;
    expect(result.value).toBeDefined();
    console.log(`  ✓ Events: ${result.value.length}`);
    for (const e of result.value.slice(0, 5)) {
      console.log(
        `    - ${e.subject} | ${e.start.dateTime} → ${e.end.dateTime} | allDay: ${e.isAllDay}`,
      );
    }
  });

  test("should get calendar view for a date range", async () => {
    if (!connected) return;
    // Query a wide range to increase chance of finding events
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();

    const result = await tolerateServerError(() =>
      calendar.getCalendarView(start, end, { top: 10 }),
    );
    if (!result) return;
    expect(result.value).toBeDefined();
    console.log(
      `  ✓ Calendar view (${start.substring(0, 10)} to ${end.substring(0, 10)}): ${result.value.length} events`,
    );
    for (const e of result.value.slice(0, 5)) {
      console.log(`    - ${e.subject} | ${e.start.dateTime.substring(0, 16)}`);
    }
  });

  test("should CRUD an event", async () => {
    if (!connected) return;

    // Create
    const created = await tolerateServerError(() =>
      calendar.createEvent({
        subject: "[SDK Test] Integration test event",
        body: "This event was created by the integration test suite",
        start: { dateTime: "2026-12-25T10:00:00", timeZone: "UTC" },
        end: { dateTime: "2026-12-25T11:00:00", timeZone: "UTC" },
        location: "Test Location",
      }),
    );
    if (!created) return;
    expect(created.id).toBeTruthy();
    expect(created.subject).toBe("[SDK Test] Integration test event");
    console.log(`  ✓ Created event: ${created.id.substring(0, 30)}...`);

    // Update
    const updated = await calendar.updateEvent(created.id, {
      subject: "[SDK Test] Updated test event",
    });
    expect(updated.subject).toBe("[SDK Test] Updated test event");
    console.log(`  ✓ Updated event subject`);

    // Delete (cleanup)
    await calendar.deleteEvent(created.id);
    console.log(`  ✓ Deleted event (cleanup)`);
  });
});
