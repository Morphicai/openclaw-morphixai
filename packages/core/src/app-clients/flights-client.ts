/**
 * Flights Client (Duffel integration)
 *
 * Unlike other app clients that use the Pipedream proxy, the Flights client
 * calls our own Flights API directly at {baseUrl}/flights/...
 * Authenticated with the same mk_xxx API key.
 */

export interface FlightsClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

// ─── Request / Response Types ───

export interface FlightSlice {
  origin: string;
  destination: string;
  departure_date: string;
}

export interface FlightPassenger {
  type: "adult" | "child" | "infant_without_seat";
  age?: number;
}

export interface FlightSearchRequest {
  slices: FlightSlice[];
  passengers: FlightPassenger[];
  cabin_class?: "economy" | "premium_economy" | "business" | "first";
  max_connections?: number;
}

export interface PassengerIdentityDocument {
  type: "passport";
  unique_identifier: string;
  issuing_country_code: string;
  expires_on: string;
}

export interface PassengerDetail {
  id: string;
  given_name: string;
  family_name: string;
  born_on: string;
  gender: "m" | "f";
  title: "mr" | "ms" | "mrs" | "miss";
  email: string;
  phone_number: string;
  identity_documents?: PassengerIdentityDocument[];
}

export interface CreateOrderRequest {
  offer_id: string;
  passengers: PassengerDetail[];
  type?: "instant" | "pay_later";
}

export interface Create3DSRequest {
  card_id: string;
  resource_id: string;
}

export interface FlightOffer {
  id: string;
  expires_at: string;
  total_amount: string;
  total_currency: string;
  base_amount: string;
  tax_amount: string;
  owner: { name: string; iata_code: string };
  slices: any[];
  passengers: any[];
  conditions: any;
  payment_requirements: any;
}

export interface FlightSearchResponse {
  offer_request_id: string;
  offers: FlightOffer[];
}

export interface FlightOrder {
  id: string;
  booking_reference: string;
  status: string;
  total_amount: string;
  total_currency: string;
  slices: any[];
  passengers: any[];
  payment_status: any;
  available_actions: string[];
  conditions: any;
  created_at: string;
  cancelled_at?: string;
}

export interface CreatePaymentSessionRequest {
  offer_id: string;
  passengers: PassengerDetail[];
}

export interface PaymentSession {
  session_id: string;
  payment_url: string;
  expires_at: string;
  offer_summary: {
    flight: string;
    date: string;
    total_amount: string;
    total_currency: string;
    slices: any[];
  };
}

export interface AirportResult {
  id: string;
  name: string;
  iata_code: string;
  city_name: string;
  country_name: string;
  type: "airport" | "city";
}

export interface ThreeDSSession {
  id: string;
  status: "ready_for_payment" | "challenge_required" | "failed" | "expired";
  client_id: string | null;
}

// ─── Client ───

export class FlightsClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(config: FlightsClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || "https://api.morphix.app").replace(/\/$/, "");
    this.timeout = config.timeout || 60000; // flights searches can be slow
  }

  // ─── Search ───

  async searchFlights(request: FlightSearchRequest): Promise<FlightSearchResponse> {
    return this.request<FlightSearchResponse>("POST", "/flights/search", { body: request });
  }

  // ─── Offers ───

  async listOffers(options: {
    offer_request_id: string;
    limit?: number;
    sort?: "total_amount" | "total_duration";
  }): Promise<FlightOffer[]> {
    const params: Record<string, string> = {
      offer_request_id: options.offer_request_id,
    };
    if (options.limit) params.limit = String(options.limit);
    if (options.sort) params.sort = options.sort;
    return this.request<FlightOffer[]>("GET", "/flights/offers", { params });
  }

  async getOffer(offerId: string): Promise<FlightOffer> {
    return this.request<FlightOffer>("GET", `/flights/offers/${offerId}`);
  }

  // ─── 3D Secure ───

  async create3DSSession(request: Create3DSRequest): Promise<ThreeDSSession> {
    return this.request<ThreeDSSession>("POST", "/flights/3ds", { body: request });
  }

  // ─── Orders ───

  async createOrder(request: CreateOrderRequest): Promise<FlightOrder> {
    return this.request<FlightOrder>("POST", "/flights/orders", { body: request });
  }

  async listOrders(options?: {
    status?: "pending" | "confirmed" | "cancelled" | "failed";
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const params: Record<string, string> = {};
    if (options?.status) params.status = options.status;
    if (options?.limit) params.limit = String(options.limit);
    if (options?.offset) params.offset = String(options.offset);
    return this.request<any[]>("GET", "/flights/orders", { params });
  }

  async getOrder(orderId: string): Promise<FlightOrder> {
    return this.request<FlightOrder>("GET", `/flights/orders/${orderId}`);
  }

  async payOrder(orderId: string): Promise<FlightOrder> {
    return this.request<FlightOrder>("POST", `/flights/orders/${orderId}/pay`);
  }

  async cancelOrder(orderId: string): Promise<{ success: boolean; cancellation_id: string }> {
    return this.request<{ success: boolean; cancellation_id: string }>("POST", `/flights/orders/${orderId}/cancel`);
  }

  // ─── Payment Sessions ───

  async createPaymentSession(request: CreatePaymentSessionRequest): Promise<PaymentSession> {
    return this.request<PaymentSession>("POST", "/flights/payment-sessions", { body: request });
  }

  // ─── Seat Maps ───

  async getSeatMaps(offerId: string): Promise<any> {
    return this.request<any>("GET", `/flights/seatmaps/${offerId}`);
  }

  // ─── Airports ───

  async searchAirports(query: string): Promise<AirportResult[]> {
    return this.request<AirportResult[]>("GET", "/flights/airports", {
      params: { q: query },
    });
  }

  // ─── Internal HTTP ───

  private async request<T>(
    method: string,
    path: string,
    options?: { params?: Record<string, string>; body?: any },
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`;

    if (options?.params && Object.keys(options.params).length > 0) {
      const qs = new URLSearchParams(options.params).toString();
      url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    const init: RequestInit = {
      method: method.toUpperCase(),
      headers,
      signal: AbortSignal.timeout(this.timeout),
    };

    if (options?.body && method.toUpperCase() !== "GET") {
      init.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, init);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      let parsed: any = {};
      try { parsed = JSON.parse(errorBody); } catch {}
      throw new FlightsAPIError(
        parsed.message || `Flights API error: ${response.status} ${response.statusText}`,
        response.status,
        parsed.code || "",
        errorBody,
      );
    }

    const json = await response.json() as any;
    // Unwrap { success: true, data: ... } envelope
    if (json && typeof json === "object" && json.success === true && "data" in json) {
      return json.data as T;
    }
    return json as T;
  }
}

export class FlightsAPIError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errorCode: string,
    public readonly responseBody: string,
  ) {
    super(message);
    this.name = "FlightsAPIError";
  }
}
