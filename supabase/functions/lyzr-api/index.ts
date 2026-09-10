import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id, agent_id, session_id, message } = await req.json();

    const LYZR_API_KEY = Deno.env.get('LYZR_API_KEY') || 'sk-default-dnznvkXvx9zrt9859ZTv4xOVBFiN4IGW'; // Fallback for local testing if env is not set

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Missing message parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lyzrPayload = {
      user_id: user_id || "anonymous",
      agent_id: agent_id || "696fa434b50537828e0b25c9",
      session_id: session_id || "696fa434b50537828e0b25c9-fa188pi9h9q",
      message: message
    };

    console.log("Sending request to Lyzr:", JSON.stringify(lyzrPayload));

    const lyzrResponse = await fetch('https://agent-prod.studio.lyzr.ai/v3/inference/chat/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LYZR_API_KEY
      },
      body: JSON.stringify(lyzrPayload)
    });

    if (!lyzrResponse.ok) {
      const errorText = await lyzrResponse.text();
      console.error("Lyzr API Error Response:", errorText);
      return new Response(
        JSON.stringify({ error: `Lyzr API returned ${lyzrResponse.status}`, details: errorText }),
        { status: lyzrResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await lyzrResponse.json();
    
    // Normalize response if necessary
    let normalizedResponse = "No response content found.";
    if (data && typeof data === 'object') {
       if (data.response) {
         normalizedResponse = data.response;
       } else if (data.result) {
         normalizedResponse = data.result;
       } else if (data.text) {
         normalizedResponse = data.text;
       }
    }

    return new Response(
      JSON.stringify({ response: normalizedResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Edge Function Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
