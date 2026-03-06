import { Type, type Static } from "@sinclair/typebox";

/**
 * mx_flights tool schema
 *
 * Flights integration (Duffel): search flights, manage bookings, airports.
 */

const PassengerType = Type.Object({
  type: Type.Union([
    Type.Literal("adult"),
    Type.Literal("child"),
    Type.Literal("infant_without_seat"),
  ], { description: '"adult", "child", or "infant_without_seat"' }),
  age: Type.Optional(Type.Number({ description: "Required for children" })),
});

const SliceType = Type.Object({
  origin: Type.String({ description: "Origin IATA code (airport or city), e.g. LHR, NYC", minLength: 2 }),
  destination: Type.String({ description: "Destination IATA code", minLength: 2 }),
  departure_date: Type.String({ description: "ISO date YYYY-MM-DD", minLength: 10 }),
});

const PassengerDetailType = Type.Object({
  id: Type.String({ description: "Passenger ID from the offer's passengers array" }),
  given_name: Type.String({ description: "First name (must match passport)", minLength: 1 }),
  family_name: Type.String({ description: "Last name (must match passport)", minLength: 1 }),
  born_on: Type.String({ description: "Date of birth YYYY-MM-DD" }),
  gender: Type.Union([Type.Literal("m"), Type.Literal("f")]),
  title: Type.Union([
    Type.Literal("mr"),
    Type.Literal("ms"),
    Type.Literal("mrs"),
    Type.Literal("miss"),
  ]),
  email: Type.String({ description: "Passenger email for check-in" }),
  phone_number: Type.String({ description: 'E.164 format, e.g. "+442080160509"' }),
  identity_documents: Type.Optional(Type.Array(Type.Object({
    type: Type.Literal("passport"),
    unique_identifier: Type.String({ description: "Passport number" }),
    issuing_country_code: Type.String({ description: "ISO 3166-1 alpha-2" }),
    expires_on: Type.String({ description: "YYYY-MM-DD" }),
  }), { description: "Required for international flights" })),
});

export const OfficeFlightsSchema = Type.Union([
  // Search flights
  Type.Object({
    action: Type.Literal("search_flights"),
    slices: Type.Array(SliceType, { description: "Journey segments. One-way = 1 slice, round trip = 2 slices", minItems: 1 }),
    passengers: Type.Array(PassengerType, { description: "Passenger list", minItems: 1 }),
    cabin_class: Type.Optional(Type.Union([
      Type.Literal("economy"),
      Type.Literal("premium_economy"),
      Type.Literal("business"),
      Type.Literal("first"),
    ])),
    max_connections: Type.Optional(Type.Number({ description: "0 = direct only, 1 = max 1 stop, 2 = max 2 stops" })),
  }),

  // List offers (paginated retrieval from a previous search)
  Type.Object({
    action: Type.Literal("list_offers"),
    offer_request_id: Type.String({ description: "offer_request_id from search response" }),
    limit: Type.Optional(Type.Number({ description: "Max results (default 50)" })),
    sort: Type.Optional(Type.Union([
      Type.Literal("total_amount"),
      Type.Literal("total_duration"),
    ])),
  }),

  // Get single offer (verify latest price before booking)
  Type.Object({
    action: Type.Literal("get_offer"),
    offer_id: Type.String({ description: "Offer ID (off_xxx)" }),
  }),

  // Create order (book a flight)
  Type.Object({
    action: Type.Literal("create_order"),
    offer_id: Type.String({ description: "The offer to book (off_xxx)" }),
    passengers: Type.Array(PassengerDetailType, { description: "One entry per passenger from the offer", minItems: 1 }),
    type: Type.Optional(Type.Union([
      Type.Literal("instant"),
      Type.Literal("pay_later"),
    ], { description: '"instant" (pay now) or "pay_later" (hold). Default: instant' })),
  }),

  // List orders
  Type.Object({
    action: Type.Literal("list_orders"),
    status: Type.Optional(Type.Union([
      Type.Literal("pending"),
      Type.Literal("confirmed"),
      Type.Literal("cancelled"),
      Type.Literal("failed"),
    ])),
    limit: Type.Optional(Type.Number({ description: "Default 20" })),
    offset: Type.Optional(Type.Number({ description: "Default 0" })),
  }),

  // Get order detail
  Type.Object({
    action: Type.Literal("get_order"),
    order_id: Type.String({ description: "Duffel order ID (ord_xxx)" }),
  }),

  // Pay hold order
  Type.Object({
    action: Type.Literal("pay_order"),
    order_id: Type.String({ description: "Duffel order ID (ord_xxx)" }),
  }),

  // Cancel order
  Type.Object({
    action: Type.Literal("cancel_order"),
    order_id: Type.String({ description: "Duffel order ID (ord_xxx)" }),
  }),

  // Get seat maps
  Type.Object({
    action: Type.Literal("get_seat_maps"),
    offer_id: Type.String({ description: "Offer ID (off_xxx)" }),
  }),

  // Create payment session (generate payment link for credit card payment)
  Type.Object({
    action: Type.Literal("create_payment_session"),
    offer_id: Type.String({ description: "The offer to pay for (off_xxx)" }),
    passengers: Type.Array(PassengerDetailType, { description: "One entry per passenger from the offer", minItems: 1 }),
  }),

  // Search airports
  Type.Object({
    action: Type.Literal("search_airports"),
    query: Type.String({ description: "Search query (min 2 characters)", minLength: 2 }),
  }),
]);

export type OfficeFlightsParams = Static<typeof OfficeFlightsSchema>;
