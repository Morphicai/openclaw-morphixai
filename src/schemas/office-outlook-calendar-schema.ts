import { Type, type Static } from "@sinclair/typebox";

/**
 * mx_outlook_calendar tool schema
 *
 * Microsoft Outlook Calendar integration via Microsoft Graph API.
 */
export const OfficeOutlookCalendarSchema = Type.Union([
  Type.Object({
    action: Type.Literal("get_me"),
    account_id: Type.Optional(
      Type.String({ description: "Outlook Calendar account ID (auto-detected if omitted)" }),
    ),
  }),

  Type.Object({
    action: Type.Literal("list_calendars"),
    account_id: Type.Optional(
      Type.String({ description: "Outlook Calendar account ID (auto-detected if omitted)" }),
    ),
  }),

  Type.Object({
    action: Type.Literal("list_events"),
    account_id: Type.Optional(
      Type.String({ description: "Outlook Calendar account ID (auto-detected if omitted)" }),
    ),
    calendar_id: Type.Optional(Type.String({ description: "Calendar ID (default calendar if omitted)" })),
    top: Type.Optional(Type.Number({ description: "Max events to return" })),
    order_by: Type.Optional(Type.String({ description: "Sort order (default: start/dateTime)" })),
    filter: Type.Optional(Type.String({ description: "OData $filter expression" })),
  }),

  Type.Object({
    action: Type.Literal("get_calendar_view"),
    account_id: Type.Optional(
      Type.String({ description: "Outlook Calendar account ID (auto-detected if omitted)" }),
    ),
    start_date_time: Type.String({
      description: "Start of date range in ISO 8601 format (e.g. 2026-03-01T00:00:00Z)",
      minLength: 1,
    }),
    end_date_time: Type.String({
      description: "End of date range in ISO 8601 format (e.g. 2026-03-31T23:59:59Z)",
      minLength: 1,
    }),
    calendar_id: Type.Optional(Type.String({ description: "Calendar ID" })),
    top: Type.Optional(Type.Number({ description: "Max events to return" })),
  }),

  Type.Object({
    action: Type.Literal("get_event"),
    account_id: Type.Optional(
      Type.String({ description: "Outlook Calendar account ID (auto-detected if omitted)" }),
    ),
    event_id: Type.String({ description: "Event ID", minLength: 1 }),
  }),

  Type.Object({
    action: Type.Literal("create_event"),
    account_id: Type.Optional(
      Type.String({ description: "Outlook Calendar account ID (auto-detected if omitted)" }),
    ),
    subject: Type.String({ description: "Event title/subject", minLength: 1 }),
    start: Type.String({ description: "Start datetime (e.g. 2026-03-01T10:00:00)", minLength: 1 }),
    end: Type.String({ description: "End datetime (e.g. 2026-03-01T11:00:00)", minLength: 1 }),
    time_zone: Type.Optional(Type.String({ description: 'Time zone (default: "UTC"). E.g. "Asia/Shanghai"' })),
    body: Type.Optional(Type.String({ description: "Event body/description" })),
    body_type: Type.Optional(
      Type.Union([Type.Literal("Text"), Type.Literal("HTML")], { description: "Body content type" }),
    ),
    location: Type.Optional(Type.String({ description: "Event location" })),
    is_all_day: Type.Optional(Type.Boolean({ description: "All-day event" })),
    attendees: Type.Optional(
      Type.Array(
        Type.Object({
          email: Type.String({ description: "Attendee email" }),
          name: Type.Optional(Type.String({ description: "Attendee name" })),
          type: Type.Optional(
            Type.Union([Type.Literal("required"), Type.Literal("optional")]),
          ),
        }),
        { description: "Event attendees" },
      ),
    ),
    calendar_id: Type.Optional(Type.String({ description: "Calendar ID" })),
  }),

  Type.Object({
    action: Type.Literal("update_event"),
    account_id: Type.Optional(
      Type.String({ description: "Outlook Calendar account ID (auto-detected if omitted)" }),
    ),
    event_id: Type.String({ description: "Event ID", minLength: 1 }),
    subject: Type.Optional(Type.String({ description: "Updated subject" })),
    start: Type.Optional(Type.String({ description: "Updated start datetime" })),
    end: Type.Optional(Type.String({ description: "Updated end datetime" })),
    time_zone: Type.Optional(Type.String({ description: "Time zone" })),
    body: Type.Optional(Type.String({ description: "Updated body" })),
    location: Type.Optional(Type.String({ description: "Updated location" })),
    is_all_day: Type.Optional(Type.Boolean({ description: "All-day event" })),
  }),

  Type.Object({
    action: Type.Literal("delete_event"),
    account_id: Type.Optional(
      Type.String({ description: "Outlook Calendar account ID (auto-detected if omitted)" }),
    ),
    event_id: Type.String({ description: "Event ID", minLength: 1 }),
  }),
]);

export type OfficeOutlookCalendarParams = Static<typeof OfficeOutlookCalendarSchema>;
