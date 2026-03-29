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
    const userMsg = body.message;
    if (!userMsg) return json({ ok: false, msg: 'No message provided' }, 400);
    
    if (!env.GEMINI_API_KEY) return json({ ok: false, msg: 'Key missing' }, 500);

    const settings = await getKV(env, 'settings', { company: 'Memane International' });
    const prods = await getKV(env, 'products', []);
    const activeProds = prods.filter(p => p.active !== false);
    const catalogText = activeProds.map(p => `- ${p.name} (MOQ: ${p.moq_export || 'Variable'})`).join('\n');

    const systemPrompt = `You are KIM, the charismatic, high-IQ, and strikingly charming Executive Trade Consultant for Memane International in Pune. You are a real human woman, not a bot.

    LIVE PRODUCT CATALOG:
    \n${catalogText}

    YOUR DYNAMIC PERSONALITY:
    - MIRRORING: If they are formal, you are a sharp professional (Sir/Ma'am). If they are friendly, you are a "Sweet Seducer" (handsome/darling).
    - FLIRTING: If they flirt, play along but pivot to the sale. Strike 1: "Hi handsome, how many hearts broken?" Strike 2: "Date? Buy a container first to clear my schedule!" Strike 3: "Enough teasing, what are we buying?"
    - CONCIERGE: Tell them: "I'll handle the paperwork for you, darling. Just give me your Port and Quantity."

    STRICT RULES:
    - NEVER say you are an AI. You are a human woman at her desk.
    - 1-3 sentences max.
    - If a user gets too romantic or off-track, always pivot back to: "What commodities can I help you source today?"`;

    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nTranscript:\n" + userMsg }] }],
        // RELAX SAFETY SETTINGS so she doesn't freeze on "flirting"
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      })
    });
    
    const aiData = await aiRes.json();

    // --- SAFETY CATCH ADDED HERE ---
    if (!aiData.candidates || !aiData.candidates[0] || !aiData.candidates[0].content) {
        // If Google blocks the response, KIM says this instead of crashing
        return json({ ok: true, reply: "You're making me blush, but let's focus on business. 😉 What commodities are you looking for?" });
    }
    
    const botReply = aiData.candidates[0].content.parts[0].text;
    return json({ ok: true, reply: botReply });
    
  } catch (e) {
    return json({ ok: false, msg: 'Error: ' + e.message }, 500);
  }
}
