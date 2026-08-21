// Supabase Edge Function: generate-certificate
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { participant_id, participant_name, event_title, type } = await req.json()

  const certificate_number = `ZIN26-CERT-${Math.floor(1000 + Math.random() * 9000)}`

  return new Response(
    JSON.stringify({
      success: true,
      certificate_number,
      participant_name,
      event_title,
      type,
      issue_date: new Date().toISOString().split('T')[0],
      verified: true
    }),
    { headers: { "Content-Type": "application/json" } }
  )
})
