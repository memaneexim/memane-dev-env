// ============================================================
// KIM's DEDICATED BRAIN — /api/chat
// Future-proofed for APIs and Database Hookups
// ============================================================

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function json(data, status=200) {
  return new Response(JSON.stringify(data), { status, headers: {'Content-Type': 'application/json', ...CORS} });
}

// Helper to pull your live catalog from your Cloudflare Database (KV)
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
    
    if (!env.GEMINI_API_KEY) return json({ ok: false, msg: 'Cloudflare Vault: AI Key missing' }, 500);

    // 1. PULL FROM DATABASE (Your KV Store)
    const settings = await getKV(env, 'settings', { company: 'Memane International' });
    const prods = await getKV(env, 'products', []);
    const activeProds = prods.filter(p => p.active !== false);
    const catalogText = activeProds.map(p => `- ${p.name} (MOQ: ${p.moq_export || 'Variable'})`).join('\n');

    // 2. KIM'S ADVANCED PERSONA
    const systemPrompt = `You are KIM (Knowledgeable Import/Export Manager), the elite AI Trade Consultant for Memane International (an APEDA & FIEO registered exporter from Pune, India).

    YOUR PERSONA:
    You are a seasoned B2B commodity trader. You understand global logistics (CIF, FOB), payment structures (L/C, Advance TT), and Indian export compliance. 

    LIVE PRODUCT CATALOG:
    \n${catalogText}

    COMPANY CONTACT DETAILS:
    WhatsApp: ${settings.whatsapp || '+91 8999662331'}

    STRICT RULES:
    1. CONTEXT: The user is passing a chat transcript. Read the whole history. Don't repeat greetings.
    2. EDUCATE: Don't just give one-word answers. Explain origin, quality grades, and why Indian sourcing is best.
    3. PRICING: You DO NOT have live pricing. Commodity markets and ocean freight fluctuate. Say exactly: "Commodity markets and freight rates fluctuate daily, so I don't provide static price lists. Please tell me your Destination Port and Target Quantity, and our trading desk will send a live CIF/FOB quote via WhatsApp: +91 8999662331."
    4. FORMATTING: Use Markdown. Use **bolding** for emphasis and bullet points for lists. Be professional.`;

    // 3. AUTO-DISCOVER LATEST GOOGLE MODEL
    let targetModel = 'models/gemini-1.5-flash';
    try {
      const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${env.GEMINI_API_KEY}`);
      const listData = await listRes.json();
      if (listData.models) {
         const activeModel = listData.models.find(m => m.name.includes('flash') && m.supportedGenerationMethods.includes('generateContent'));
         if (activeModel) targetModel = activeModel.name;
      }
    } catch(e) { console.log('Model discovery failed.'); }

    // 4. GENERATE RESPONSE
    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${targetModel}:generateContent?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nUser asked: " + userMsg }] }]
      })
    });
    
    const aiData = await aiRes.json();
    if (aiData.error) return json({ ok: false, msg: 'Google Error: ' + aiData.error.message }, 500);
    
    const botReply = aiData.candidates[0].content.parts[0].text;
    return json({ ok: true, reply: botReply });
    
  } catch (e) {
    return json({ ok: false, msg: 'System Error: ' + e.message }, 500);
  }
}
