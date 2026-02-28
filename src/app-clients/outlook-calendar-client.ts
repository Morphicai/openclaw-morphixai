/**
 * Microsoft Outlook Calendar Client
 *
 * Wraps MorphixAI Pipedream proxy for Microsoft Graph API (Calendar).
 * URL pattern: https://graph.microsoft.com/v1.0/me/...
 *
 * IMPORTANT: For calendarView, query params must be embedded in URL
 * (proxy `params` field is unreliable for startDateTime/endDateTime).
 */
import type { BaibianClient } from "../baibian-client.js";
import { BaseAppClient } from "./base-app-client.js";

export interface OutlookCalendar {
  id: string;
  name: string;
  color: string;
  isDefaultCalendar: boolean;
  canShare: boolean;
  canEdit: boolean;
  owner: { name: string; address: string };
}

export interface OutlookEvent {
  id: string;
  subject: string;
  bodyPreview?: string;
  body?: { contentType: string; content: string };
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: { displayName: string };
  organizer?: { emailAddress: { name: string; address: string } };
  attendees?: Array<{
    emailAddress: { name: string; address: string };
    type: string;
    status?: { response: string };
  }>;
  isAllDay: boolean;
  isCancelled: boolean;
  importance: string;
  sensitivity: string;
  hasAttachments: boolean;
  createdDateTime: string;
  lastModifiedDateTime: string;
  webLink?: string;
}

export class OutlookCalendarClient extends BaseAppClient {
  constructor(baibian: BaibianClient, accountId: string) {
    super(baibian, accountId);
  }

  protected resolveUrl(path: string): string {
    return `https://graph.microsoft.com/v1.0${path}`;
  }

  // ─── Calendars ───

  async listCalendars(): Promise<{ value: OutlookCalendar[] }> {
    return this.get("/me/calendars");
  }

  async getCalendar(calendarId: string): Promise<OutlookCalendar> {
    return this.get<OutlookCalendar>(`/me/calendars/${calendarId}`);
  }

  // ─── Events ───

  /**
   * List events from the default calendar.
   */
  async listEvents(options?: {
    calendarId?: string;
    top?: number;
    skip?: number;
    orderBy?: string;
    select?: string[];
    filter?: string;
  }): Promise<{ value: OutlookEvent[]; "@odata.nextLink"?: string }> {
    const params: Record<string, any> = {};
    if (options?.top) params.$top = options.top;
    if (options?.skip) params.$skip = options.skip;
    if (options?.orderBy) params.$orderby = options.orderBy;
    else params.$orderby = "start/dateTime";
    if (options?.select) params.$select = options.select.join(",");
    if (options?.filter) params.$filter = options.filter;

    const basePath = options?.calendarId
      ? `/me/calendars/${options.calendarId}/events`
      : "/me/events";
    return this.get(basePath, params);
  }

  /**
   * Get events in a date range using calendarView.
   * Params are embedded in URL due to proxy forwarding bug.
   */
  async getCalendarView(
    startDateTime: string,
    endDateTime: string,
    options?: { calendarId?: string; top?: number },
  ): Promise<{ value: OutlookEvent[] }> {
    const start = encodeURIComponent(startDateTime);
    const end = encodeURIComponent(endDateTime);
    let qs = `startDateTime=${start}&endDateTime=${end}`;
    if (options?.top) qs += `&$top=${options.top}`;

    const basePath = options?.calendarId
      ? `/me/calendars/${options.calendarId}/calendarView`
      : "/me/calendarView";
    return this.get(`${basePath}?${qs}`);
  }

  /**
   * Get a single event by ID.
   */
  async getEvent(eventId: string): Promise<OutlookEvent> {
    return this.get<OutlookEvent>(`/me/events/${eventId}`);
  }

  /**
   * Create a new calendar event.
   */
  async createEvent(options: {
    subject: string;
    body?: string;
    bodyType?: "Text" | "HTML";
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    location?: string;
    isAllDay?: boolean;
    attendees?: Array<{ email: string; name?: string; type?: "required" | "optional" }>;
    calendarId?: string;
  }): Promise<OutlookEvent> {
    const event: Record<string, any> = {
      subject: options.subject,
      start: options.start,
      end: options.end,
    };
    if (options.body) {
      event.body = {
        contentType: options.bodyType || "Text",
        content: options.body,
      };
    }
    if (options.location) {
      event.location = { displayName: options.location };
    }
    if (options.isAllDay !== undefined) {
      event.isAllDay = options.isAllDay;
    }
    if (options.attendees) {
      event.attendees = options.attendees.map((a) => ({
        emailAddress: { address: a.email, name: a.name || a.email },
        type: a.type || "required",
      }));
    }

    const basePath = options.calendarId
      ? `/me/calendars/${options.calendarId}/events`
      : "/me/events";
    return this.post<OutlookEvent>(basePath, event);
  }

  /**
   * Update an existing event.
   */
  async updateEvent(
    eventId: string,
    fields: Partial<{
      subject: string;
      body: { contentType: string; content: string };
      start: { dateTime: string; timeZone: string };
      end: { dateTime: string; timeZone: string };
      location: { displayName: string };
      isAllDay: boolean;
    }>,
  ): Promise<OutlookEvent> {
    return this.patch<OutlookEvent>(`/me/events/${eventId}`, fields);
  }

  /**
   * Delete an event.
   */
  async deleteEvent(eventId: string): Promise<void> {
    await this.del(`/me/events/${eventId}`);
  }

  // ─── User Profile ───

  async getMe(): Promise<{
    displayName: string;
    mail: string;
    userPrincipalName: string;
    id: string;
  }> {
    return this.get("/me", { $select: "displayName,mail,userPrincipalName,id" });
  }
}
