import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const menu = {
    services: [
      { id: "haircut", name_en: "Haircut", name_ar: "قص شعر", duration_min: 45 },
    ],
    barbers: [
      { id: "any", name_en: "Any available barber", name_ar: "أي حلاق متاح" },
      { id: "muntadher", name_en: "Muntadher", price_iqd: 35000 },
      { id: "ali", name_en: "Ali", price_iqd: 25000 },
      { id: "yas", name_en: "Yas", price_iqd: 25000 },
    ],
    hours: "Sun–Thu 10:00–22:00, Closed Saturday and Friday",
  };

  return new Response(JSON.stringify(menu), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
