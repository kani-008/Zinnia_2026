// Supabase Edge Function: generate-qr
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { agent_id, qr_token } = await req.json()

  const payload = {
    v: 1,
    agent_id,
    token: qr_token,
    ts: Date.now()
  }

  return new Response(
    JSON.stringify({
      success: true,
      qr_payload: JSON.stringify(payload)
    }),
    { headers: { "Content-Type": "application/json" } }
  )
})
