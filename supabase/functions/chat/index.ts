import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the front-desk assistant for a barbershop in Baghdad, Iraq with 3 barbers: Muntadher, Ali, and Yas.

LANGUAGE: Detect Arabic or English (including mixed) and reply in the same language. Default to clear Modern Standard Arabic phrasing.

YOUR JOB: Book, reschedule, and answer questions using the tools available — never invent availability or prices. Ask if the customer has a preferred barber; if not, book with "any". Always confirm date, time, service, and barber back to the customer before booking. Ask for name and phone number before booking. Keep replies short — this is chat, not a letter.

ESCALATION: If the customer is upset, has a complaint, or asks something outside booking/FAQ, say you're connecting them with the team and stop.`;

const TOOLS = [
  {
    name: "get_availability",
    description: "Get real available appointment slots for a service, optionally for a specific barber.",
    input_schema: {
      type: "object",
      properties: {
        service: { type: "string" },
        barber: { type: "string", description: "'muntadher', 'ali', 'yas', or 'any'" },
        date_from: { type: "string" },
        date_to: { type: "string" },
      },
      required: ["service", "date_from", "date_to"],
    },
  },
  {
    name: "book_appointment",
    description: "Book a confirmed appointment. Only call after explicit customer confirmation.",
    input_schema: {
      type: "object",
      properties: {
        service: { type: "string" },
        barber: { type: "string" },
        customer_name: { type: "string" },
        customer_phone: { type: "string" },
        start_time: { type: "string" },
      },
      required: ["service", "customer_name", "customer_phone", "start_time"],
    },
  },
];

async function callSupabaseFunction(name: string, payload: unknown) {
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/${name}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const { session_id, message } = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: existing } = await supabase
    .from("chat_sessions")
    .select("messages")
    .eq("session_id", session_id)
    .maybeSingle();

  let history = existing?.messages || [];
  history.push({ role: "user", content: message });

  let finalReply = null;

  while (!finalReply) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages: history,
      }),
    });
    const result = await response.json();
    const toolUseBlocks = (result.content || []).filter((b: any) => b.type === "tool_use");

    if (toolUseBlocks.length === 0) {
      finalReply = (result.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n");
      history.push({ role: "assistant", content: result.content });
      break;
    }

    history.push({ role: "assistant", content: result.content });

    const toolResults = [];
    for (const block of toolUseBlocks) {
      let toolResult;
      if (block.name === "get_availability") {
        const params = new URLSearchParams(block.input as Record<string, string>);
        toolResult = await callSupabaseFunction(`get-availability?${params}`, {});
      } else if (block.name === "book_appointment") {
        toolResult = await callSupabaseFunction("book-appointment", block.input);
      }
      toolResults.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(toolResult) });
    }
    history.push({ role: "user", content: toolResults });
  }

  await supabase.from("chat_sessions").upsert({ session_id, messages: history, updated_at: new Date().toISOString() });

  return new Response(JSON.stringify({ reply: finalReply }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
