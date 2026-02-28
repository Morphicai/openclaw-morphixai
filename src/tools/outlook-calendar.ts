import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { OfficeOutlookCalendarSchema, type OfficeOutlookCalendarParams } from "../schemas/outlook-calendar-schema.js";
import { OutlookCalendarClient } from "../app-clients/outlook-calendar-client.js";
import { resolveConfig, resolveAppAccount, AppNotConnectedError, NO_API_KEY_ERROR, CONNECTIONS_URL } from "./_tool-helpers.js";
import { BaibianClient, BaibianAPIError } from "../baibian-client.js";
import { json } from "../helpers.js";

const APP_SLUG = "microsoft_outlook_calendar";

export function registerOfficeOutlookCalendarTool(api: OpenClawPluginApi) {
  api.registerTool(
    {
      name: "mx_outlook_calendar",
      label: "Outlook Calendar",
      description:
        "Microsoft Outlook Calendar integration: list calendars, view/create/update/delete events, get calendar view by date range. " +
        "Actions: get_me, list_calendars, list_events, get_calendar_view, get_event, create_event, update_event, delete_event",
      parameters: OfficeOutlookCalendarSchema,
      async execute(_toolCallId, params) {
        const p = params as OfficeOutlookCalendarParams;

        const config = resolveConfig(api);
        if (!config) {
          return json(NO_API_KEY_ERROR);
        }

        const client = new BaibianClient({ apiKey: config.apiKey, baseUrl: config.baseUrl });

        try {
          const accountId = await resolveAppAccount(client, APP_SLUG, (p as any).account_id);
          const calendar = new OutlookCalendarClient(client, accountId);

          switch (p.action) {
            case "get_me":
              return json(await calendar.getMe());

            case "list_calendars":
              return json(await calendar.listCalendars());

            case "list_events":
              return json(
                await calendar.listEvents({
                  calendarId: p.calendar_id,
                  top: p.top,
                  orderBy: p.order_by,
                  filter: p.filter,
                }),
              );

            case "get_calendar_view":
              return json(
                await calendar.getCalendarView(
                  p.start_date_time,
                  p.end_date_time,
                  { calendarId: p.calendar_id, top: p.top },
                ),
              );

            case "get_event":
              return json(await calendar.getEvent(p.event_id));

            case "create_event": {
              const tz = p.time_zone || "UTC";
              return json(
                await calendar.createEvent({
                  subject: p.subject,
                  body: p.body,
                  bodyType: p.body_type,
                  start: { dateTime: p.start, timeZone: tz },
                  end: { dateTime: p.end, timeZone: tz },
                  location: p.location,
                  isAllDay: p.is_all_day,
                  attendees: p.attendees,
                  calendarId: p.calendar_id,
                }),
              );
            }

            case "update_event": {
              const fields: Record<string, any> = {};
              if (p.subject) fields.subject = p.subject;
              if (p.body) fields.body = { contentType: "Text", content: p.body };
              if (p.start) fields.start = { dateTime: p.start, timeZone: p.time_zone || "UTC" };
              if (p.end) fields.end = { dateTime: p.end, timeZone: p.time_zone || "UTC" };
              if (p.location) fields.location = { displayName: p.location };
              if (p.is_all_day !== undefined) fields.isAllDay = p.is_all_day;
              return json(await calendar.updateEvent(p.event_id, fields));
            }

            case "delete_event":
              await calendar.deleteEvent(p.event_id);
              return json({ success: true, message: "Event deleted" });

            default:
              return json({ error: `Unknown action: ${(p as any).action}` });
          }
        } catch (err) {
          if (err instanceof AppNotConnectedError) {
            return json({ error: err.message, action_required: "connect_account", app: APP_SLUG, connect_url: CONNECTIONS_URL });
          }
          if (err instanceof BaibianAPIError) {
            return json({ error: err.message, status: err.statusCode });
          }
          return json({ error: err instanceof Error ? err.message : String(err) });
        }
      },
    },
    { name: "mx_outlook_calendar" },
  );

  api.logger.info?.("mx_outlook_calendar: Registered");
}
