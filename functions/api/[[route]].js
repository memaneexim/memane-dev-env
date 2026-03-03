// ============================================================
// MEMANE INTERNATIONAL — Cloudflare Worker API
// Handles: data reads, admin auth, product/category/setting saves
// ============================================================

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function err(msg, status = 400) {
  return json({ ok: false, msg }, status);
}

// ── DEFAULT DATA ─────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  company: 'Memane International',
  proprietor: 'Tejas Memane',
  tagline: 'Reliable Global Sourcing from India',
  about_short: 'India-based import-export company engaged in global trade of agricultural commodities, food products, minerals and engineering goods. APEDA (RCMC Registered).',
  about_long: 'Memane International was founded with a single belief: that India\'s agricultural wealth deserves to reach every corner of the world. Starting from Pune, Maharashtra, our founder Tejas Memane built a company rooted in trust, transparency, and the pure goodness of natural produce.',
  phone1: '+91 8999662331',
  phone2: '+91 9011503140',
  whatsapp: '918999662331',
  email1: 'info@memaneinternational.in',
  email2: 'memaneexim@gmail.com',
  website: 'www.memaneinternational.in',
  address: 'Pune, Maharashtra, India',
  hours: 'Monday – Saturday, 9:00 AM – 6:00 PM IST',
  w3f_enquiry: '1744dc02-e069-4ed8-8869-5e185b6b0415',
  w3f_contact: 'ceeae473-d8e0-4dbd-9741-2ae400c5f2dc',
  certifications: ['APEDA (RCMC)', 'FSSAI', 'FIEO', 'Phytosanitary'],
  stats: [
    { icon: '🌍', num: '30+',     label: 'Countries Served' },
    { icon: '📦', num: '10,000+', label: 'MT Annual Volume' },
    { icon: '✅', num: 'APEDA',   label: 'RCMC Registered' },
    { icon: '🤝', num: '500+',    label: 'Happy Clients' },
  ],
  hero_badge: '🇮🇳 APEDA (RCMC Registered) · FSSAI · Pune, India',
  hero_h1: 'Bridging India & the World — One Harvest at a Time',
  hero_sub: 'Your trusted partner for premium agricultural exports from India. Rice, Spices, Fresh Produce, Dairy, Frozen Foods & more — delivered to 30+ countries.',
  admin_password: 'admin123',
};

const DEFAULT_CATEGORIES = [
  { id:'basmati',     icon:'🌾', name:'Basmati Rice',        sub:'Premium aromatic long-grain varieties',   img:'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80' },
  { id:'nonbasmati',  icon:'🍚', name:'Non Basmati Rice',     sub:'Everyday rice for all markets',           img:'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&q=80' },
  { id:'pulses',      icon:'🫘', name:'Indian Pulses',        sub:'Protein-rich lentils and legumes',        img:'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&q=80' },
  { id:'wholespices', icon:'🌶️', name:'Whole Spices',         sub:'Pure aromatic Indian spices',             img:'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=600&q=80' },
  { id:'groundspices',icon:'🧂', name:'Grounded Spices',      sub:'Finely milled spice powders',             img:'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80' },
  { id:'freshfruits', icon:'🍎', name:'Fresh Fruits',         sub:'A-Grade fresh fruits, farm to export',    img:'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=600&q=80' },
  { id:'freshveg',    icon:'🥦', name:'Fresh Vegetables',     sub:'Export-quality fresh vegetables',         img:'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80' },
  { id:'dairy',       icon:'🥛', name:'Dairy Products',       sub:'Ghee, paneer, butter and more',           img:'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80' },
  { id:'canned',      icon:'🥫', name:'Canned Products',      sub:'Ready-to-eat canned foods',               img:'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600&q=80' },
  { id:'flour',       icon:'🌾', name:'Indian Flour',         sub:'Wheat, gram, corn and more',              img:'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80' },
  { id:'bakery',      icon:'🍞', name:'Bakery Products',      sub:'Breads, rusks and cookies',               img:'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80' },
  { id:'edibleoil',   icon:'🫙', name:'Edible Oil',           sub:'Pure cold-pressed cooking oils',          img:'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80' },
  { id:'sesame',      icon:'🌱', name:'Sesame Seeds',         sub:'White, black and hulled varieties',       img:'https://images.unsplash.com/photo-1612187029458-cef1b9a76da2?w=600&q=80' },
  { id:'seafood',     icon:'🦐', name:'Frozen Seafood',       sub:'Shrimp, prawns, fish — IQF quality',      img:'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&q=80' },
  { id:'chicken',     icon:'🍗', name:'Frozen Chicken',       sub:'Halal certified chicken cuts',            img:'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&q=80' },
  { id:'mutton',      icon:'🥩', name:'Frozen Mutton / Lamb', sub:'Goat and sheep meat, export grade',       img:'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80' },
  { id:'sugar',       icon:'🍬', name:'White Sugar',          sub:'Refined white sugar — ICUMSA 30/45',      img:'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=600&q=80' },
];

const DEFAULT_PRODUCTS = [
  { id:'p001', category_id:'basmati',     name:'1121 Golden Sella Basmati Rice',  moq_india:'1-10 MT',  moq_export:'25 MT / 1 FCL', form:'Parboiled Sella', grade:'Golden',        origin:'Punjab, Haryana',       packing:'5kg,10kg,25kg,50kg PP/Jute', certifications:'APEDA, Phytosanitary, COO', shelf_life:'24 months', storage:'Cool, Dry Place',      description:'Extra-long grain, non-sticky texture and rich golden aroma. Most popular Gulf market variety.',                img:'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80', active:true },
  { id:'p002', category_id:'basmati',     name:'1121 Steam Basmati Rice',         moq_india:'1-10 MT',  moq_export:'25 MT / 1 FCL', form:'Steam',           grade:'Premium',       origin:'Punjab, Haryana',       packing:'5kg,10kg,25kg,50kg PP',      certifications:'APEDA, Phytosanitary, COO', shelf_life:'24 months', storage:'Cool, Dry Place',      description:'Partially steamed, easy to cook, non-sticky. Widely used in restaurants across Middle East.',              img:'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=600&q=80', active:true },
  { id:'p003', category_id:'basmati',     name:'1121 Raw White Basmati Rice',     moq_india:'1-10 MT',  moq_export:'25 MT / 1 FCL', form:'Raw',             grade:'Premium',       origin:'Punjab, Haryana',       packing:'5kg,10kg,25kg,50kg PP',      certifications:'APEDA, Phytosanitary, COO', shelf_life:'24 months', storage:'Cool, Dry Place',      description:'Snow white extra long grain. Ideal for biryani and premium rice dishes. Exported to Europe and North America.', img:'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80', active:true },
  { id:'p004', category_id:'basmati',     name:'Pusa Basmati Rice',               moq_india:'1-10 MT',  moq_export:'25 MT / 1 FCL', form:'Raw/Sella',       grade:'Premium',       origin:'Haryana',               packing:'5kg,10kg,25kg,50kg PP',      certifications:'APEDA, Phytosanitary',      shelf_life:'24 months', storage:'Cool, Dry Place',      description:'Developed by IARI. Popular for its aroma, length and affordability in global markets.',                   img:'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80', active:true },
  { id:'p005', category_id:'nonbasmati',  name:'IR 64 Parboiled Rice',            moq_india:'5-20 MT',  moq_export:'20 MT / 1 FCL', form:'Parboiled',       grade:'A Grade',       origin:'Andhra Pradesh, Odisha', packing:'25kg,50kg PP/Jute',          certifications:'APEDA, Phytosanitary',      shelf_life:'18 months', storage:'Cool, Dry Place',      description:'Pre-gelatinized, retains nutrients. Most exported non-basmati variety to Africa and South Asia.',          img:'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&q=80', active:true },
  { id:'p006', category_id:'nonbasmati',  name:'Sona Masoori Rice',               moq_india:'5-10 MT',  moq_export:'20 MT / 1 FCL', form:'Raw',             grade:'Premium',       origin:'AP, Karnataka',         packing:'5kg,10kg,25kg,50kg',         certifications:'APEDA, Phytosanitary',      shelf_life:'18 months', storage:'Cool, Dry Place',      description:'Lightweight, aromatic, low starch. Huge demand in USA, UK and Australia among South Asian communities.',   img:'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&q=80', active:true },
  { id:'p007', category_id:'pulses',      name:'Toor Dal (Yellow)',               moq_india:'1-5 MT',   moq_export:'10 MT',         form:'Split, Dehusked', grade:'A Grade',       origin:'Maharashtra, Gujarat',  packing:'1kg,5kg,25kg,50kg',          certifications:'FSSAI, Phytosanitary',      shelf_life:'18 months', storage:'Cool, Dry Place',      description:'India\'s most consumed dal. High protein. Exported to USA, UK, UAE and East Africa.',                     img:'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&q=80', active:true },
  { id:'p008', category_id:'pulses',      name:'Masoor Dal (Red)',                moq_india:'1-5 MT',   moq_export:'10 MT',         form:'Whole/Split',     grade:'A Grade',       origin:'MP, UP, Bihar',         packing:'1kg,5kg,25kg,50kg',          certifications:'FSSAI, Phytosanitary',      shelf_life:'18 months', storage:'Cool, Dry Place',      description:'Quick-cooking, high protein. Widely exported to UK, Canada, UAE and Europe.',                              img:'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&q=80', active:true },
  { id:'p009', category_id:'wholespices', name:'Black Pepper (Whole)',            moq_india:'500 kg',   moq_export:'1 MT',          form:'Whole Seeds',     grade:'FAQ/Bold',      origin:'Kerala (Wayanad)',      packing:'25kg,50kg PP',               certifications:'Spices Board, APEDA',       shelf_life:'24 months', storage:'Cool, Dry, No Sunlight', description:'King of Spices. High piperine content. Kerala black pepper globally renowned.',                            img:'https://images.unsplash.com/photo-1599909631628-cbb61e600827?w=600&q=80', active:true },
  { id:'p010', category_id:'wholespices', name:'Turmeric Finger',                 moq_india:'1 MT',     moq_export:'5 MT',          form:'Finger/Bulb',     grade:'Erode',         origin:'AP, Maharashtra',       packing:'25kg,50kg Jute',             certifications:'Spices Board, APEDA',       shelf_life:'12 months', storage:'Cool, Dry Place',      description:'High curcumin 3-5%. Used in cooking, cosmetics, Ayurveda and nutraceuticals.',                            img:'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&q=80', active:true },
  { id:'p011', category_id:'wholespices', name:'Dry Red Chilli',                  moq_india:'1 MT',     moq_export:'5 MT',          form:'Whole Dry',       grade:'Teja/Sannam',   origin:'AP, Telangana',         packing:'25kg,50kg PP/Jute',          certifications:'Spices Board, APEDA',       shelf_life:'12 months', storage:'Cool, Dry Place',      description:'Teja, Sannam, Byadagi varieties. High colour ASTA 80-180. Exported to UAE, USA, UK, Bangladesh.',         img:'https://images.unsplash.com/photo-1526346698789-22fd84314424?w=600&q=80', active:true },
  { id:'p012', category_id:'groundspices',name:'Red Chilli Powder',               moq_india:'1 MT',     moq_export:'1 MT',          form:'Powder',          grade:'Extra Hot/Mild', origin:'Andhra Pradesh',       packing:'1kg,5kg,25kg,50kg',          certifications:'FSSAI, Spices Board',       shelf_life:'18 months', storage:'Cool, Dry Place',      description:'Hot, medium and mild grades. High colour ASTA 80+. Custom heat level available on request.',               img:'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80', active:true },
  { id:'p013', category_id:'groundspices',name:'Turmeric Powder',                 moq_india:'1 MT',     moq_export:'1 MT',          form:'Powder',          grade:'High Curcumin', origin:'AP, Maharashtra',       packing:'1kg,5kg,25kg PP',            certifications:'FSSAI, Spices Board',       shelf_life:'18 months', storage:'Cool, Dry Place',      description:'Curcumin 2-5%. Bright yellow colour. Used in food, cosmetics and nutraceuticals globally.',                img:'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&q=80', active:true },
  { id:'p014', category_id:'freshfruits', name:'Fresh Mango (Alphonso / Kesar)',  moq_india:'1 MT',     moq_export:'5 MT',          form:'Fresh',           grade:'A Grade',       origin:'Maharashtra, Gujarat',  packing:'3kg,5kg Gift Cartons',       certifications:'APEDA, Phytosanitary, Irradiation', shelf_life:'1-2 weeks', storage:'Refrigeration 8-12°C', description:'Alphonso, Kesar, Totapuri varieties. The world\'s finest mangoes. Exported to USA, UK, UAE, Canada, Australia.', img:'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&q=80', active:true },
  { id:'p015', category_id:'freshfruits', name:'Fresh Pomegranate (Bhagwa)',      moq_india:'2 MT',     moq_export:'10 MT',         form:'Fresh',           grade:'A Grade',       origin:'Maharashtra (Solapur)', packing:'3kg,5kg Cartons',            certifications:'GlobalGAP, APEDA, Phytosanitary', shelf_life:'3-4 weeks', storage:'Refrigeration 5-8°C', description:'Bhagwa — deep red arils, sweet-tart. India is top global exporter of this variety.',                      img:'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&q=80', active:true },
  { id:'p016', category_id:'freshveg',    name:'Fresh Red Onion',                 moq_india:'5-20 MT',  moq_export:'25 MT / 1 FCL', form:'Fresh',           grade:'A Grade',       origin:'Nashik, Maharashtra',   packing:'20kg,25kg,50kg Nets',        certifications:'APEDA, Phytosanitary',      shelf_life:'4-8 weeks', storage:'Cool, Well Ventilated', description:'India is top global exporter. Nashik Red and S-34 varieties. Exported to SE Asia, Middle East and Europe.', img:'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&q=80', active:true },
  { id:'p017', category_id:'freshveg',    name:'Fresh White Garlic',              moq_india:'1-5 MT',   moq_export:'10 MT',         form:'Fresh',           grade:'A Grade',       origin:'Gujarat (Gondal)',      packing:'500g,1kg,5kg,20kg',          certifications:'APEDA, Phytosanitary',      shelf_life:'4-6 months', storage:'Cool, Dry, Ventilated', description:'Bold cloves, high allicin. Gondal garlic preferred across Southeast Asia and Middle East.',                img:'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=600&q=80', active:true },
  { id:'p018', category_id:'dairy',       name:'Pure Cow Ghee (Desi)',            moq_india:'500 kg',   moq_export:'1 MT',          form:'Liquid Fat',      grade:'Premium/A2',    origin:'Rajasthan, Gujarat',    packing:'200ml,500ml,1L Tins; 15kg Drums', certifications:'FSSAI, ISO 22000, Halal', shelf_life:'12 months', storage:'Cool, Dry Place', description:'A2 Gir cow ghee available. Nutty aroma, golden colour. Growing demand in USA and Europe.',                img:'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80', active:true },
  { id:'p019', category_id:'seafood',     name:'Frozen Vannamei Prawns (White)',  moq_india:'500 kg',   moq_export:'1 MT',          form:'IQF / Block',     grade:'HOSO/HLSO/PD',  origin:'Andhra Pradesh',        packing:'1kg,2kg Retail; 10kg Master Carton', certifications:'MPEDA, EU, Halal, HACCP, BAP', shelf_life:'24 months frozen', storage:'Frozen -18°C', description:'Farm-raised Vannamei. India is top shrimp exporter. All formats available. Exported to USA, EU and Japan.', img:'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&q=80', active:true },
  { id:'p020', category_id:'chicken',     name:'Frozen Whole Chicken (Halal)',    moq_india:'1 MT',     moq_export:'2 MT',          form:'Eviscerated IQF', grade:'Grade A',       origin:'India',                 packing:'800g-1.5kg IQF; 10kg,20kg Cartons', certifications:'FSSAI, Halal, HACCP, BRC', shelf_life:'18 months frozen', storage:'Frozen -18°C', description:'Eviscerated cleaned whole chicken. Halal certified. Exported to GCC, Africa and Southeast Asia.',         img:'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&q=80', active:true },
  { id:'p021', category_id:'sugar',       name:'S30 White Refined Sugar',         moq_india:'5 MT',     moq_export:'25 MT / 1 FCL', form:'Fine Crystal',    grade:'S30 (ICUMSA 30-45)', origin:'Maharashtra, UP',  packing:'50kg PP Bags; 1MT Jumbo; 1kg Retail', certifications:'FSSAI, ISO 9001, Codex, Halal', shelf_life:'24 months', storage:'Cool, Dry Place', description:'Highly refined bright white sugar. ICUMSA ~30-45. Premium grade for beverages, confectionery and pharma.', img:'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=600&q=80', active:true },
];

// ── AUTH HELPERS ─────────────────────────────────────────────
async function generateToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function validateToken(env, token) {
  if (!token) return false;
  const stored = await env.KV.get('auth:' + token);
  return stored === 'valid';
}

// ── KV HELPERS ───────────────────────────────────────────────
async function getKV(env, key, fallback) {
  const val = await env.KV.get(key);
  if (val) return JSON.parse(val);
  return fallback;
}
async function setKV(env, key, data) {
  await env.KV.put(key, JSON.stringify(data));
}

// ── SEED DEFAULT DATA ─────────────────────────────────────────
async function seedIfEmpty(env) {
  const s = await env.KV.get('settings');
  if (!s) {
    await setKV(env, 'settings', DEFAULT_SETTINGS);
    await setKV(env, 'categories', DEFAULT_CATEGORIES);
    await setKV(env, 'products', DEFAULT_PRODUCTS);
    await setKV(env, 'enquiries', []);
  }
}

// ── MAIN HANDLER ─────────────────────────────────────────────
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '').replace(/\/$/, '');

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  // Seed default data on first run
  await seedIfEmpty(env);

  // ── GET /api/data ──────────────────────────────────────────
  if (request.method === 'GET' && path === 'data') {
    const type = url.searchParams.get('type');
    if (type === 'all') {
      const [settings, categories, products] = await Promise.all([
        getKV(env, 'settings', DEFAULT_SETTINGS),
        getKV(env, 'categories', DEFAULT_CATEGORIES),
        getKV(env, 'products', DEFAULT_PRODUCTS),
      ]);
      // Only return active products to public
      const activeProds = products.filter(p => p.active !== false);
      return json({ settings, categories, products: activeProds });
    }
    return err('Invalid type');
  }

  // ── POST /api/login ────────────────────────────────────────
  if (request.method === 'POST' && path === 'login') {
    const body = await request.json().catch(() => ({}));
    const settings = await getKV(env, 'settings', DEFAULT_SETTINGS);
    const correctPwd = settings.admin_password || 'admin123';
    if (body.password === correctPwd) {
      const token = await generateToken();
      // Store token for 24 hours
      await env.KV.put('auth:' + token, 'valid', { expirationTtl: 86400 });
      return json({ ok: true, token });
    }
    return json({ ok: false, msg: 'Wrong password' }, 401);
  }

  // ── ALL ADMIN ROUTES — require auth ───────────────────────
  if (request.method === 'POST') {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const authed = await validateToken(env, token);
    if (!authed) return json({ ok: false, msg: 'Not authenticated' }, 403);

    const body = await request.json().catch(() => ({}));

    // GET ADMIN DATA (products + enquiries for admin panel)
    if (path === 'admin/data') {
      const [settings, categories, products, enquiries] = await Promise.all([
        getKV(env, 'settings', DEFAULT_SETTINGS),
        getKV(env, 'categories', DEFAULT_CATEGORIES),
        getKV(env, 'products', DEFAULT_PRODUCTS),
        getKV(env, 'enquiries', []),
      ]);
      return json({ settings, categories, products, enquiries });
    }

    // SAVE SETTINGS
    if (path === 'admin/save-settings') {
      const settings = await getKV(env, 'settings', DEFAULT_SETTINGS);
      const allowed = ['company','proprietor','tagline','about_short','about_long',
        'phone1','phone2','whatsapp','email1','email2','website','address','hours',
        'hero_badge','hero_h1','hero_sub','w3f_enquiry','w3f_contact',
        'certifications','stats','admin_password'];
      for (const k of allowed) {
        if (body[k] !== undefined) settings[k] = body[k];
      }
      await setKV(env, 'settings', settings);
      return json({ ok: true, msg: 'Settings saved' });
    }

    // SAVE PRODUCT
    if (path === 'admin/save-product') {
      const products = await getKV(env, 'products', DEFAULT_PRODUCTS);
      const isNew = !body.id;
      if (isNew) body.id = 'p' + Date.now().toString(36);
      if (isNew) {
        products.push(body);
      } else {
        const idx = products.findIndex(p => p.id === body.id);
        if (idx > -1) products[idx] = body;
        else products.push(body);
      }
      await setKV(env, 'products', products);
      return json({ ok: true, msg: isNew ? 'Product added' : 'Product updated', id: body.id });
    }

    // DELETE PRODUCT
    if (path === 'admin/delete-product') {
      let products = await getKV(env, 'products', DEFAULT_PRODUCTS);
      products = products.filter(p => p.id !== body.id);
      await setKV(env, 'products', products);
      return json({ ok: true });
    }

    // TOGGLE PRODUCT ACTIVE
    if (path === 'admin/toggle-product') {
      const products = await getKV(env, 'products', DEFAULT_PRODUCTS);
      const p = products.find(p => p.id === body.id);
      if (p) p.active = !p.active;
      await setKV(env, 'products', products);
      return json({ ok: true, active: p ? p.active : null });
    }

    // SAVE CATEGORY
    if (path === 'admin/save-category') {
      const cats = await getKV(env, 'categories', DEFAULT_CATEGORIES);
      const isNew = !body.id;
      if (isNew) body.id = body.name.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,20);
      if (isNew) {
        cats.push(body);
      } else {
        const idx = cats.findIndex(c => c.id === body.id);
        if (idx > -1) cats[idx] = body;
        else cats.push(body);
      }
      await setKV(env, 'categories', cats);
      return json({ ok: true, msg: isNew ? 'Category added' : 'Category updated' });
    }

    // DELETE CATEGORY
    if (path === 'admin/delete-category') {
      let cats = await getKV(env, 'categories', DEFAULT_CATEGORIES);
      cats = cats.filter(c => c.id !== body.id);
      await setKV(env, 'categories', cats);
      return json({ ok: true });
    }

    // SAVE ENQUIRY NOTE
    if (path === 'admin/update-enquiry') {
      const enqs = await getKV(env, 'enquiries', []);
      const e = enqs.find(e => e.id === body.id);
      if (e) { e.status = body.status || e.status; e.note = body.note || ''; }
      await setKV(env, 'enquiries', enqs);
      return json({ ok: true });
    }

    // DELETE ENQUIRY
    if (path === 'admin/delete-enquiry') {
      let enqs = await getKV(env, 'enquiries', []);
      enqs = enqs.filter(e => e.id !== body.id);
      await setKV(env, 'enquiries', enqs);
      return json({ ok: true });
    }
  }

  // ── POST /api/enquiry — from website contact forms ─────────
  if (request.method === 'POST' && path === 'enquiry') {
    const body = await request.json().catch(() => ({}));
    const enqs = await getKV(env, 'enquiries', []);
    enqs.push({
      id: 'e' + Date.now().toString(36),
      date: new Date().toISOString().replace('T',' ').slice(0,19),
      name: body.name || '',
      email: body.email || '',
      phone: body.phone || '',
      country: body.country || '',
      product: body.product || '',
      quantity: body.quantity || '',
      message: body.message || '',
      status: 'new',
      note: '',
    });
    await setKV(env, 'enquiries', enqs);
    return json({ ok: true });
  }

  return json({ ok: false, msg: 'Not found' }, 404);
}
