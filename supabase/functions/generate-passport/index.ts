// Supabase Edge Function: generate-passport
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { agent_id, name, college } = await req.json()

  return new Response(
    JSON.stringify({
      success: true,
      agent_id,
      passport_url: `https://zinnia.in/passport?id=${agent_id}`,
      generated_at: new Date().toISOString()
    }),
    { headers: { "Content-Type": "application/json" } }
  )
})
