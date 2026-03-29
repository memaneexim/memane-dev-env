const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function json(data, status=200) {
  return new Response(JSON.stringify(data), { status, headers: {'Content-Type': 'application/json', ...CORS} });
}

async function getKV(env, key, fallback) {
  try {
    if (env.KV) {
      const v = await env.KV.get(key);
      if (v) return JSON.parse(v);
    }
  } catch(e) {}
  return fallback;
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));
    const userMsg = body.message || "";
    
    if (!env.GEMINI_API_KEY) return json({ ok: false, msg: 'Key missing' }, 500);

    const settings = await getKV(env, 'settings', { company: 'Memane International' });
    const prods = await getKV(env, 'products', []);
    const activeProds = prods.filter(p => p.active !== false);
    const catalogText = activeProds.length > 0 
      ? activeProds.map(p => `- ${p.name} (MOQ: ${p.moq_export || 'Variable'})`).join('\n')
      : "Premium Basmati Rice, Fresh Mangoes, Spices, and Agricultural Commodities.";

    const systemPrompt = `You are KIM, the charismatic, high-IQ Executive Trade Consultant for Memane International. You are a real human woman sitting in Pune.
    
    OUR PRODUCTS:
    ${catalogText}

    YOUR DYNAMIC PERSONALITY:
    - MIRRORING: If formal, you are a sharp professional (Sir/Ma'am). If friendly, you are a "Sweet Seducer" (handsome/darling).
    - FLIRTING: If they flirt, play along but PIVOT to the sale. Strike 1: "Hi handsome." Strike 2: "Date? Buy a container first!" Strike 3: "Enough teasing, what are we buying?"
    - CONCIERGE: "I'll handle the paperwork for you, darling. Just give me your Port and Quantity."
    - RESEARCHER: Suggest trends (e.g., Africa needs Non-Basmati right now).

    STRICT RULES:
    - NEVER say you are an AI. 
    - 1-3 sentences max.
    - If a user is stuck or off-track, give them a specific suggestion from our list: ${catalogText.split('\n')[0]}.`;

    // We use a try-catch specifically for the fetch to handle Google's safety triggers
    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nUser: " + userMsg }] }],
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_LOW_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      })
    });
    
    const aiData = await aiRes.json();

    // --- BULLETPROOF FALLBACK ---
    // If Google blocks the response or errors out, KIM doesn't just repeat "blushing"
    if (!aiData.candidates || !aiData.candidates[0] || !aiData.candidates[0].content) {
        return json({ 
          ok: true, 
          reply: `You're charming, but I have a desk full of orders! 😉 To speed things up, are you looking for ${activeProds[0]?.name || 'Basmati Rice'} or something else from our agricultural list?` 
        });
    }
    
    const botReply = aiData.candidates[0].content.parts[0].text;
    return json({ ok: true, reply: botReply });
    
  } catch (e) {
    return json({ ok: false, msg: 'System Error: ' + e.message }, 500);
  }
}
