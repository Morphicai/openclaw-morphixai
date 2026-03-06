import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { OfficeFlightsSchema, type OfficeFlightsParams } from "@morphixai/core";
import { FlightsClient, FlightsAPIError } from "@morphixai/core";
import { resolveConfig, NO_API_KEY_ERROR } from "./_tool-helpers.js";
import { json } from "@morphixai/core";

export function registerOfficeFlightsTool(api: OpenClawPluginApi) {
  api.registerTool(
    {
      name: "mx_flights",
      label: "Flights",
      description:
        "Flight booking integration (Duffel): search flights, compare offers, book tickets, manage orders, search airports. " +
        "Actions: search_flights, list_offers, get_offer, create_3ds_session, create_order, list_orders, get_order, pay_order, cancel_order, get_seat_maps, search_airports",
      parameters: OfficeFlightsSchema,
      async execute(_toolCallId, params) {
        const p = params as OfficeFlightsParams;

        const config = resolveConfig(api);
        if (!config) {
          return json(NO_API_KEY_ERROR);
        }

        const flights = new FlightsClient({ apiKey: config.apiKey, baseUrl: config.baseUrl });

        try {
          switch (p.action) {
            case "search_flights":
              return json(
                await flights.searchFlights({
                  slices: p.slices,
                  passengers: p.passengers,
                  cabin_class: p.cabin_class,
                  max_connections: p.max_connections,
                }),
              );

            case "list_offers":
              return json(
                await flights.listOffers({
                  offer_request_id: p.offer_request_id,
                  limit: p.limit,
                  sort: p.sort,
                }),
              );

            case "get_offer":
              return json(await flights.getOffer(p.offer_id));

            case "create_3ds_session":
              return json(
                await flights.create3DSSession({
                  card_id: p.card_id,
                  resource_id: p.resource_id,
                }),
              );

            case "create_order":
              return json(
                await flights.createOrder({
                  offer_id: p.offer_id,
                  passengers: p.passengers,
                  type: p.type,
                }),
              );

            case "list_orders":
              return json(
                await flights.listOrders({
                  status: p.status,
                  limit: p.limit,
                  offset: p.offset,
                }),
              );

            case "get_order":
              return json(await flights.getOrder(p.order_id));

            case "pay_order":
              return json(await flights.payOrder(p.order_id));

            case "cancel_order":
              return json(await flights.cancelOrder(p.order_id));

            case "get_seat_maps":
              return json(await flights.getSeatMaps(p.offer_id));

            case "search_airports":
              return json(await flights.searchAirports(p.query));

            default:
              return json({ error: `Unknown action: ${(p as any).action}` });
          }
        } catch (err) {
          if (err instanceof FlightsAPIError) {
            return json({
              error: err.message,
              status: err.statusCode,
              code: err.errorCode,
            });
          }
          return json({ error: err instanceof Error ? err.message : String(err) });
        }
      },
    },
    { name: "mx_flights" },
  );

  api.logger.info?.("mx_flights: Registered");
}
