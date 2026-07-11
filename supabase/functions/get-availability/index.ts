import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cal.com Event Type IDs — currently one shared event type across all barbers.
const EVENT_TYPE_IDS: Record<string, Record<string, string>> = {
  haircut: {
    any: "6271983",
    muntadher: "6271983",
    ali: "6271983",
    yas: "6271983",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const service = url.searchParams.get("service") || "haircut";
  const barber = url.searchParams.get("barber") || "any";
  const dateFrom = url.searchParams.get("date_from");
  const dateTo = url.searchParams.get("date_to");

  const eventTypeId = EVENT_TYPE_IDS[service]?.[barber];
  if (!eventTypeId) {
    return new Response(JSON.stringify({ error: `No event type configured for ${service}/${barber}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const calRes = await fetch(
    `https://api.cal.com/v2/slots/available?eventTypeId=${eventTypeId}&startTime=${dateFrom}&endTime=${dateTo}`,
    { headers: { "Authorization": `Bearer ${Deno.env.get("CALCOM_API_KEY")}` } }
  );
  const data = await calRes.json();

  const slotsByDate = data?.data?.slots || data?.slots || {};
  const flatSlots = Object.values(slotsByDate).flat();

  return new Response(JSON.stringify({ slots: flatSlots, barber }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
