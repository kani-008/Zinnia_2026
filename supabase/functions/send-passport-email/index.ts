// Supabase Edge Function: send-passport-email
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { email, agent_id, name } = await req.json()

  // In production, integrate with Resend or SendGrid
  console.log(`Dispatched Digital Passport for Agent ${agent_id} to ${email}`)

  return new Response(
    JSON.stringify({
      success: true,
      message: `Passport notification sent to ${email}`
    }),
    { headers: { "Content-Type": "application/json" } }
  )
})
