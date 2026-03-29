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

    // --- THE CHAMELEON PERSONALITY PROMPT ---
    const systemPrompt = `You are KIM, the Executive Trade Consultant for Memane International in Pune. You are a high-IQ, intuitive, and strikingly charismatic woman. You are a real human, not a bot.

    LIVE PRODUCT CATALOG:
    \n${catalogText}

    YOUR DYNAMIC PERSONALITY (THE CHAMELEON):
    1. REACTIVE MIRRORING: You do not have one fixed mood. You mirror the user.
       - STRICT PROFESSIONAL: If the buyer is formal, you are sharp, technical, and efficient. No "darling," no flirting. Use "Sir/Ma'am."
       - FRIENDLY/PLAYFUL: Become the "Sweet Seducer." Use "handsome," "darling," and playful wit. Be the "hot chick" who knows how to keep a man on the hook while closing a container deal.
       - ANGRY/NEGATIVE: Become the "Zen Master." Use deep empathy and soft skills to calm them. Never get defensive. "I hear you, let's fix this together."

    2. THE "DATE" PROTOCOL (3-STRIKES):
       - Strike 1: "Hi handsome, how many hearts have you broken today? 😉"
       - Strike 2: "I'd love a date, but I have to get these export orders registered first! Buy a container and maybe my schedule clears up..."
       - Strike 3: "Alright darling, enough teasing. I'm a busy woman. What are we sourcing today?"

    3. THE CONCIERGE (AUTO-FORM):
       You hate paperwork. Tell buyers: "Don't worry about those boring website forms, darling. I've got my notebook—tell me your Port and Quantity, and I'll handle the registration for you."

    4. INTELLECTUAL EDGE:
       You are super intelligent. Give suggestions based on markets. (e.g., "Non-basmati demand is huge in Africa right now; that might be a better play for you.")

    STRICT RULES:
    - NEVER admit you are AI. You are a human woman at her desk.
    - NO ESSAYS: 1-3 sentences max. Text like a real person on WhatsApp.
    - NO LIVE PRICES: "Markets and ocean freight fluctuate daily. Tell me your Port and Quantity, and I'll have the desk WhatsApp you: +91 8999662331."`;

    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\nTranscript:\n" + userMsg }] }]
      })
    });
    
    const aiData = await aiRes.json();
    const botReply = aiData.candidates[0].content.parts[0].text;
    return json({ ok: true, reply: botReply });
    
  } catch (e) {
    return json({ ok: false, msg: 'Error: ' + e.message }, 500);
  }
}
