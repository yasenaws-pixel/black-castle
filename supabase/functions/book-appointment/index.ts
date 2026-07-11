import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Same placeholder map as get-availability — keep both files in sync when you
// fill in real IDs.
const EVENT_TYPE_IDS: Record<string, Record<string, string>> = {
  haircut: {
    any: "PLACEHOLDER_ANY_EVENT_TYPE_ID",
    muntadher: "PLACEHOLDER_MUNTADHER_EVENT_TYPE_ID",
    ali: "PLACEHOLDER_ALI_EVENT_TYPE_ID",
    yas: "PLACEHOLDER_YAS_EVENT_TYPE_ID",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const { service, barber, customer_name, customer_phone, start_time } = await req.json();
  const eventTypeId = EVENT_TYPE_IDS[service]?.[barber || "any"];

  if (!eventTypeId) {
    return new Response(JSON.stringify({ error: `No event type configured for ${service}/${barber}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Placeholder email since we only collect phone — Cal.com's schema requires
  // a valid-format email inside attendee. example.com is a real, reserved,
  // always-valid domain for this purpose.
  const placeholderEmail = `${customer_phone.replace(/[^0-9]/g, "")}@example.com`;

  const calRes = await fetch("https://api.cal.com/v2/bookings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("CALCOM_API_KEY")}`,
      "Content-Type": "application/json",
      "cal-api-version": "2024-08-13",
    },
    body: JSON.stringify({
      eventTypeId: Number(eventTypeId),
      start: start_time,
      attendee: {
        name: customer_name,
        email: placeholderEmail,
        phoneNumber: customer_phone,
        timeZone: "Asia/Baghdad",
        language: "en",
      },
      metadata: {},
    }),
  });

  const data = await calRes.json();

  if (!calRes.ok) {
    return new Response(JSON.stringify({ error: `Cal.com API error: ${JSON.stringify(data)}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ booking_id: data.uid || data.id, confirmed: true, barber }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
