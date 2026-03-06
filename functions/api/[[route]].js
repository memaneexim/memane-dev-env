// ============================================================
// MEMANE INTERNATIONAL — Cloudflare Worker API v3
// All 109 products · Auth: Username + Password + TOTP
// Roles: superadmin, editor, viewer
// ============================================================

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const j = (d, s=200) => new Response(JSON.stringify(d), {status:s, headers:{'Content-Type':'application/json',...CORS}});
const e = (m, s=400) => j({ok:false, msg:m}, s);

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function randToken() {
  const a = new Uint8Array(32); crypto.getRandomValues(a);
  return Array.from(a).map(b=>b.toString(16).padStart(2,'0')).join('');
}

const B32ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function b32enc(bytes) {
  let bits=0, val=0, out='';
  for (const b of bytes) { val=(val<<8)|b; bits+=8; while(bits>=5){out+=B32ABC[(val>>>(bits-5))&31];bits-=5;} }
  if (bits>0) out+=B32ABC[(val<<(5-bits))&31];
  return out;
}
function b32dec(s) {
  s=s.toUpperCase().replace(/=+$/,'');
  let bits=0, val=0; const out=[];
  for (const c of s) { val=(val<<5)|B32ABC.indexOf(c); bits+=5; if(bits>=8){out.push((val>>>(bits-8))&255);bits-=8;} }
  return new Uint8Array(out);
}
function totpGenSecret() { const b = new Uint8Array(20); crypto.getRandomValues(b); return b32enc(b); }
async function totpVerify(secret, token) {
  const key = b32dec(secret);
  const t = Math.floor(Date.now()/30000);
  const ck = await crypto.subtle.importKey('raw', key, {name:'HMAC',hash:'SHA-1'}, false, ['sign']);
  for (let d=-1; d<=1; d++) {
    const buf=new ArrayBuffer(8), v=new DataView(buf);
    v.setUint32(4, t+d, false);
    const sig = new Uint8Array(await crypto.subtle.sign('HMAC', ck, buf));
    const off = sig[19]&0xf;
    const code = (((sig[off]&0x7f)<<24)|(sig[off+1]<<16)|(sig[off+2]<<8)|sig[off+3])%1000000;
    if (code.toString().padStart(6,'0') === token.toString().padStart(6,'0')) return true;
  }
  return false;
}
function totpQR(secret, username, company='Memane International') {
  return `otpauth://totp/${encodeURIComponent(company)}:${encodeURIComponent(username)}?secret=${secret}&issuer=${encodeURIComponent(company)}&digits=6&period=30`;
}

const DEFAULT_SETTINGS = {
  company:'Memane International', proprietor:'Tejas Memane',
  tagline:'Reliable Global Sourcing from India',
  about_short:'India-based export company engaged in global trade of agricultural commodities, food products and more. APEDA (RCMC Registered).',
  about_long:"Memane International was founded with a single belief: that India's agricultural wealth deserves to reach every corner of the world. Starting from Pune, Maharashtra, our founder Tejas Memane built a company rooted in trust, transparency, and the pure goodness of natural produce.",
  phone1:'+91 8999662331', phone2:'+91 9011503140', whatsapp:'918999662331',
  email1:'info@memaneinternational.in', email2:'memaneexim@gmail.com',
  website:'www.memaneinternational.in', address:'Pune, Maharashtra, India',
  hours:'Monday - Saturday, 9:00 AM - 6:00 PM IST',
  w3f_enquiry:'1744dc02-e069-4ed8-8869-5e185b6b0415',
  w3f_contact:'ceeae473-d8e0-4dbd-9741-2ae400c5f2dc',
  hero_badge:'APEDA (RCMC Registered) · FSSAI · Pune, India',
  hero_h1:'Bridging India & the World — One Harvest at a Time',
  hero_sub:'Your trusted partner for premium agricultural exports from India.',
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
  { id:'seafood',     icon:'🦐', name:'Frozen Seafood',       sub:'Shrimp, prawns, fish — IQF quality',     img:'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&q=80' },
  { id:'chicken',     icon:'🍗', name:'Frozen Chicken',       sub:'Halal certified chicken cuts',            img:'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&q=80' },
  { id:'mutton',      icon:'🥩', name:'Frozen Mutton / Lamb', sub:'Goat and sheep meat, export grade',      img:'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80' },
  { id:'sugar',       icon:'🍬', name:'White Sugar',          sub:'Refined white sugar — ICUMSA 30/45',     img:'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=600&q=80' },
];

const DEFAULT_PRODUCTS = [
  { id:'p001', category_id:'basmati', name:'1121 Golden Sella Basmati Rice', moq_india:'1-10 MT', moq_export:'25 MT / 1 FCL', form:'Parboiled Sella', grade:'Golden', origin:'Punjab, Haryana', packing:'5kg,10kg,25kg,50kg PP/Jute', certifications:'APEDA, Phytosanitary, COO', shelf_life:'24 months', storage:'Cool, Dry Place', description:'Extra-long grain, non-sticky texture and rich golden aroma. Most popular Gulf market variety.', img:'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80', active:true },
  { id:'p002', category_id:'basmati', name:'1121 Steam Basmati Rice', moq_india:'1-10 MT', moq_export:'25 MT / 1 FCL', form:'Steam', grade:'Premium', origin:'Punjab, Haryana', packing:'5kg,10kg,25kg,50kg PP', certifications:'APEDA, Phytosanitary, COO', shelf_life:'24 months', storage:'Cool, Dry Place', description:'Partially steamed, easy to cook, non-sticky. Widely used in restaurants across Middle East.', img:'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=600&q=80', active:true },
  { id:'p003', category_id:'basmati', name:'1121 Raw White Basmati Rice', moq_india:'1-10 MT', moq_export:'25 MT / 1 FCL', form:'Raw', grade:'Premium', origin:'Punjab, Haryana', packing:'5kg,10kg,25kg,50kg PP', certifications:'APEDA, Phytosanitary, COO', shelf_life:'24 months', storage:'Cool, Dry Place', description:'Snow white extra long grain. Ideal for biryani and premium rice dishes. Exported to Europe and North America.', img:'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&q=80', active:true },
  { id:'p004', category_id:'basmati', name:'1121 White Sella Basmati Rice', moq_india:'1-10 MT', moq_export:'25 MT / 1 FCL', form:'White Sella', grade:'Premium', origin:'Punjab, Haryana', packing:'5kg,10kg,25kg,50kg PP', certifications:'APEDA, Phytosanitary, COO', shelf_life:'24 months', storage:'Cool, Dry Place', description:'White parboiled variety, firm texture after cooking. Popular in Middle East and Africa.', img:'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&q=80', active:true },
  { id:'p005', category_id:'basmati', name:'1509 Sella Basmati Rice', moq_india:'1-10 MT', moq_export:'25 MT / 1 FCL', form:'Sella', grade:'Premium', origin:'Punjab', packing:'5kg,10kg,25kg,50kg PP', certifications:'APEDA, Phytosanitary', shelf_life:'24 months', storage:'Cool, Dry Place', description:'Long grain, pleasant aroma. Cost-effective premium basmati for bulk buyers.', img:'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=600&q=80', active:true },
  { id:'p006', category_id:'basmati', name:'1509 Steam Basmati Rice', moq_india:'1-10 MT', moq_export:'25 MT / 1 FCL', form:'Steam', grade:'Premium', origin:'Punjab', packing:'5kg,10kg,25kg,50kg PP', certifications:'APEDA, Phytosanitary', shelf_life:'24 months', storage:'Cool, Dry Place', description:'Steam processed for better nutrition retention. Ideal for hotel and restaurant use.', img:'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80', active:true },
  { id:'p007', category_id:'basmati', name:'Sharbati Basmati Rice', moq_india:'1-10 MT', moq_export:'25 MT / 1 FCL', form:'Raw', grade:'Premium', origin:'MP, Rajasthan', packing:'5kg,10kg,25kg,50kg PP', certifications:'APEDA, Phytosanitary', shelf_life:'24 months', storage:'Cool, Dry Place', description:'Soft texture, sweet aroma. Popular in Saudi Arabia and UAE markets.', img:'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&q=80', active:true },
  { id:'p008', category_id:'basmati', name:'Pusa Basmati Rice', moq_india:'1-10 MT', moq_export:'25 MT / 1 FCL', form:'Raw/Sella', grade:'Premium', origin:'Haryana', packing:'5kg,10kg,25kg,50kg PP', certifications:'APEDA, Phytosanitary', shelf_life:'24 months', storage:'Cool, Dry Place', description:'Developed by IARI. Popular for its aroma, length and affordability in global markets.', img:'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=600&q=80', active:true },
  { id:'p009', category_id:'basmati', name:'Sugandha Basmati Rice', moq_india:'1-10 MT', moq_export:'25 MT / 1 FCL', form:'Raw', grade:'Premium', origin:'UP, Uttarakhand', packing:'5kg,10kg,25kg,50kg PP', certifications:'APEDA, Phytosanitary', shelf_life:'24 months', storage:'Cool, Dry Place', description:'Medium grain, pleasant fragrance. Budget-friendly basmati for price-sensitive markets.', img:'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80', active:true },
  { id:'p010', category_id:'basmati', name:'Traditional Basmati Rice', moq_india:'1-10 MT', moq_export:'25 MT / 1 FCL', form:'Raw', grade:'Heritage', origin:'Dehradun, UP', packing:'5kg,10kg,25kg,50kg PP/Jute', certifications:'APEDA, GI Tag, Phytosanitary', shelf_life:'24 months', storage:'Cool, Dry Place', description:'Heritage variety with GI tag. True basmati aroma, aged for 1-2 years. Premium export product.', img:'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&q=80', active:true },
  { id:'p011', category_id:'nonbasmati', name:'IR 64 Parboiled Rice', moq_india:'5-20 MT', moq_export:'20 MT / 1 FCL', form:'Parboiled', grade:'A Grade', origin:'Andhra Pradesh, Odisha', packing:'25kg,50kg PP/Jute', certifications:'APEDA, Phytosanitary', shelf_life:'18 months', storage:'Cool, Dry Place', description:'Pre-gelatinized, retains nutrients. Most exported non-basmati variety to Africa and South Asia.', img:'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&q=80', active:true },
  { id:'p012', category_id:'nonbasmati', name:'IR 64 Raw White Rice', moq_india:'5-20 MT', moq_export:'20 MT / 1 FCL', form:'Raw', grade:'A Grade', origin:'Andhra Pradesh', packing:'25kg,50kg PP', certifications:'APEDA, Phytosanitary', shelf_life:'18 months', storage:'Cool, Dry Place', description:'Versatile everyday rice. High demand in Bangladesh, Sri Lanka and African markets.', img:'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=600&q=80', active:true },
  { id:'p013', category_id:'nonbasmati', name:'Sona Masoori Rice', moq_india:'5-10 MT', moq_export:'20 MT / 1 FCL', form:'Raw', grade:'Premium', origin:'AP, Karnataka', packing:'5kg,10kg,25kg,50kg', certifications:'APEDA, Phytosanitary', shelf_life:'18 months', storage:'Cool, Dry Place', description:'Lightweight, aromatic, low starch. Huge demand in USA, UK and Australia among South Asian communities.', img:'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=600&q=80', active:true },
  { id:'p014', category_id:'nonbasmati', name:'Swarna Non Basmati Rice', moq_india:'5-20 MT', moq_export:'20 MT / 1 FCL', form:'Parboiled', grade:'A Grade', origin:'West Bengal, Odisha', packing:'25kg,50kg PP/Jute', certifications:'APEDA, Phytosanitary', shelf_life:'18 months', storage:'Cool, Dry Place', description:'High yielding variety, strong in East Africa and Southeast Asia markets.', img:'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&q=80', active:true },
  { id:'p015', category_id:'nonbasmati', name:'Ponni Rice', moq_india:'5-10 MT', moq_export:'20 MT / 1 FCL', form:'Raw/Parboiled', grade:'Premium', origin:'Tamil Nadu', packing:'5kg,10kg,25kg PP', certifications:'APEDA, Phytosanitary', shelf_life:'18 months', storage:'Cool, Dry Place', description:'Tamil Nadu specialty rice, soft texture, popular in Sri Lanka, Malaysia and Singapore.', img:'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&q=80', active:true },
  { id:'p016', category_id:'nonbasmati', name:'100% Broken Rice', moq_india:'10-25 MT', moq_export:'20 MT / 1 FCL', form:'Broken', grade:'Standard', origin:'Pan India', packing:'25kg,50kg PP', certifications:'APEDA, Phytosanitary', shelf_life:'18 months', storage:'Cool, Dry Place', description:'Used in brewing, animal feed, rice flour and baby food. Cost-effective bulk product.', img:'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=600&q=80', active:true },
  { id:'p017', category_id:'nonbasmati', name:'Matta Red Rice', moq_india:'2-5 MT', moq_export:'10 MT', form:'Parboiled', grade:'Premium', origin:'Kerala', packing:'1kg,5kg,25kg PP', certifications:'APEDA, Phytosanitary', shelf_life:'18 months', storage:'Cool, Dry Place', description:'Kerala heritage red rice, high fibre, nutty flavour. Growing health food demand in Europe and USA.', img:'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=600&q=80', active:true },
  { id:'p018', category_id:'pulses', name:'Toor Dal (Yellow)', moq_india:'1-5 MT', moq_export:'10 MT', form:'Split, Dehusked', grade:'A Grade', origin:'Maharashtra, Gujarat', packing:'1kg,5kg,25kg,50kg', certifications:'FSSAI, Phytosanitary', shelf_life:'18 months', storage:'Cool, Dry Place', description:"India's most consumed dal. High protein. Exported to USA, UK, UAE and East Africa.", img:'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&q=80', active:true },
  { id:'p019', category_id:'pulses', name:'Chana Dal (Yellow)', moq_india:'1-5 MT', moq_export:'10 MT', form:'Split, Dehusked', grade:'A Grade', origin:'Rajasthan, MP', packing:'1kg,5kg,25kg,50kg', certifications:'FSSAI, Phytosanitary', shelf_life:'18 months', storage:'Cool, Dry Place', description:'High protein, nutty flavour. Used in curry and snacks. Exported to Middle East and UK.', img:'https://images.unsplash.com/photo-1612857440200-fe15d3f2b4b7?w=600&q=80', active:true },
  { id:'p020', category_id:'pulses', name:'Moong Dal (Green)', moq_india:'1-5 MT', moq_export:'10 MT', form:'Whole/Split', grade:'A Grade', origin:'Rajasthan, Gujarat', packing:'1kg,5kg,25kg,50kg', certifications:'FSSAI, Phytosanitary', shelf_life:'18 months', storage:'Cool, Dry Place', description:'Easily digestible, high nutrition. Strong demand in Southeast Asia and diaspora markets.', img:'https://images.unsplash.com/photo-1598169284893-2a208d28cbe1?w=600&q=80', active:true },
  { id:'p021', category_id:'pulses', name:'Masoor Dal (Red)', moq_india:'1-5 MT', moq_export:'10 MT', form:'Whole/Split', grade:'A Grade', origin:'MP, UP, Bihar', packing:'1kg,5kg,25kg,50kg', certifications:'FSSAI, Phytosanitary', shelf_life:'18 months', storage:'Cool, Dry Place', description:'Quick-cooking, high protein. Widely exported to UK, Canada, UAE and Europe.', img:'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600&q=80', active:true },
  { id:'p022', category_id:'pulses', name:'Kabuli Chana (White)', moq_india:'1-5 MT', moq_export:'10 MT', form:'Whole', grade:'A Grade', origin:'Rajasthan, MP', packing:'25kg,50kg PP', certifications:'FSSAI, Phytosanitary', shelf_life:'24 months', storage:'Cool, Dry Place', description:'Large white chickpea. Used in hummus and canned foods. Strong EU and Middle East demand.', img:'https://images.unsplash.com/photo-1559181567-c3190b007a5a?w=600&q=80', active:true },
  { id:'p023', category_id:'pulses', name:'Urad Dal (Black)', moq_india:'1-5 MT', moq_export:'10 MT', form:'Whole/Split', grade:'A Grade', origin:'Andhra Pradesh, MP', packing:'1kg,5kg,25kg,50kg', certifications:'FSSAI, Phytosanitary', shelf_life:'18 months', storage:'Cool, Dry Place', description:'Used in idli, dosa batter. High protein. Exported to Malaysia, Singapore, UK diaspora.', img:'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&q=80', active:true },
  { id:'p024', category_id:'wholespices', name:'Black Pepper (Whole)', moq_india:'500 kg', moq_export:'1 MT', form:'Whole Seeds', grade:'FAQ/Bold', origin:'Kerala (Wayanad)', packing:'25kg,50kg PP', certifications:'Spices Board, APEDA', shelf_life:'24 months', storage:'Cool, Dry, No Sunlight', description:'King of Spices. High piperine content. Kerala black pepper globally renowned.', img:'https://images.unsplash.com/photo-1599909631628-cbb61e600827?w=600&q=80', active:true },
  { id:'p025', category_id:'wholespices', name:'Turmeric Finger', moq_india:'1 MT', moq_export:'5 MT', form:'Finger/Bulb', grade:'Erode', origin:'AP, Maharashtra', packing:'25kg,50kg Jute', certifications:'Spices Board, APEDA', shelf_life:'12 months', storage:'Cool, Dry Place', description:'High curcumin 3-5%. Used in cooking, cosmetics, Ayurveda and nutraceuticals.', img:'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&q=80', active:true },
  { id:'p026', category_id:'wholespices', name:'Green Cardamom', moq_india:'500 kg', moq_export:'1 MT', form:'Whole Pods', grade:'8mm/7mm', origin:'Kerala, Karnataka', packing:'10kg,25kg Tin/PP', certifications:'Spices Board, APEDA', shelf_life:'12 months', storage:'Cool, Dry, Airtight', description:'Queen of Spices. Intense aroma and flavour. Premium market in Middle East and Scandinavia.', img:'https://images.unsplash.com/photo-1573477236062-6e8b3dcc8f8d?w=600&q=80', active:true },
  { id:'p027', category_id:'wholespices', name:'Cumin Seeds', moq_india:'500 kg', moq_export:'2 MT', form:'Whole Seeds', grade:'Eagle/Double Parrot', origin:'Gujarat, Rajasthan', packing:'25kg,50kg PP', certifications:'Spices Board, APEDA', shelf_life:'18 months', storage:'Cool, Dry Place', description:"India is world's largest cumin exporter. Essential spice for Middle East, US and European cuisines.", img:'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=600&q=80', active:true },
  { id:'p028', category_id:'wholespices', name:'Coriander Seeds', moq_india:'500 kg', moq_export:'2 MT', form:'Whole Seeds', grade:'Eagle', origin:'Rajasthan, MP', packing:'25kg,50kg PP', certifications:'Spices Board, APEDA', shelf_life:'18 months', storage:'Cool, Dry Place', description:'Mild flavour, used in spice blends worldwide. Strong demand in Middle East and Europe.', img:'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=600&q=80', active:true },
  { id:'p029', category_id:'wholespices', name:'Dry Red Chilli', moq_india:'1 MT', moq_export:'5 MT', form:'Whole Dry', grade:'Teja/Sannam', origin:'AP, Telangana', packing:'25kg,50kg PP/Jute', certifications:'Spices Board, APEDA', shelf_life:'12 months', storage:'Cool, Dry Place', description:'Teja, Sannam, Byadagi varieties. High colour ASTA 80-180. Exported to UAE, USA, UK, Bangladesh.', img:'https://images.unsplash.com/photo-1526346698789-22fd84314424?w=600&q=80', active:true },
  { id:'p030', category_id:'wholespices', name:'Cloves', moq_india:'500 kg', moq_export:'1 MT', form:'Whole', grade:'Grade A', origin:'Kerala, Karnataka', packing:'10kg,25kg Tin', certifications:'Spices Board, APEDA', shelf_life:'24 months', storage:'Cool, Dry, Airtight', description:'Strong aromatic spice. Used in cooking and traditional medicine. Exported to Europe and Middle East.', img:'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=80', active:true },
  { id:'p031', category_id:'wholespices', name:'Cinnamon Sticks', moq_india:'500 kg', moq_export:'1 MT', form:'Sticks', grade:'Grade A', origin:'Kerala', packing:'10kg,25kg PP', certifications:'Spices Board, APEDA', shelf_life:'24 months', storage:'Cool, Dry Place', description:'True cinnamon, warm flavour. Used in baking and beverages. Global demand steadily growing.', img:'https://images.unsplash.com/photo-1514733670139-4d66e2fb5c59?w=600&q=80', active:true },
  { id:'p032', category_id:'wholespices', name:'Black Cardamom', moq_india:'500 kg', moq_export:'1 MT', form:'Whole Pods', grade:'Grade A', origin:'Sikkim, Himachal', packing:'10kg,25kg PP', certifications:'Spices Board, APEDA', shelf_life:'18 months', storage:'Cool, Dry Place', description:'Smoky, camphor-like flavour. Used in biryanis and curries. Niche premium market in Middle East.', img:'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=80', active:true },
  { id:'p033', category_id:'groundspices', name:'Red Chilli Powder', moq_india:'1 MT', moq_export:'1 MT', form:'Powder', grade:'Extra Hot/Mild', origin:'Andhra Pradesh', packing:'1kg,5kg,25kg,50kg', certifications:'FSSAI, Spices Board', shelf_life:'18 months', storage:'Cool, Dry Place', description:'Hot, medium and mild grades. High colour ASTA 80+. Custom heat level available on request.', img:'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80', active:true },
  { id:'p034', category_id:'groundspices', name:'Turmeric Powder', moq_india:'1 MT', moq_export:'1 MT', form:'Powder', grade:'High Curcumin', origin:'AP, Maharashtra', packing:'1kg,5kg,25kg PP', certifications:'FSSAI, Spices Board', shelf_life:'18 months', storage:'Cool, Dry Place', description:'Curcumin 2-5%. Bright yellow colour. Used in food, cosmetics and nutraceuticals globally.', img:'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&q=80', active:true },
  { id:'p035', category_id:'groundspices', name:'Coriander Powder', moq_india:'1 MT', moq_export:'1 MT', form:'Powder', grade:'Eagle', origin:'Rajasthan, MP', packing:'1kg,5kg,25kg PP', certifications:'FSSAI, Spices Board', shelf_life:'18 months', storage:'Cool, Dry Place', description:'Mild aromatic powder. Essential in spice blends and curry powders worldwide.', img:'https://images.unsplash.com/photo-1505253716362-afcea1eae1f2?w=600&q=80', active:true },
  { id:'p036', category_id:'groundspices', name:'Cumin Powder', moq_india:'500 kg', moq_export:'1 MT', form:'Powder', grade:'Eagle', origin:'Gujarat, Rajasthan', packing:'1kg,5kg,25kg PP', certifications:'FSSAI, Spices Board', shelf_life:'18 months', storage:'Cool, Dry Place', description:'Earthy warm flavour, essential in Middle Eastern and South Asian cooking.', img:'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=600&q=80', active:true },
  { id:'p037', category_id:'groundspices', name:'Black Pepper Powder', moq_india:'500 kg', moq_export:'1 MT', form:'Powder', grade:'FAQ', origin:'Kerala', packing:'1kg,5kg,25kg PP', certifications:'FSSAI, Spices Board', shelf_life:'18 months', storage:'Cool, Dry Place', description:'Fine grind, high piperine. Used in seasoning blends and food processing worldwide.', img:'https://images.unsplash.com/photo-1599909631628-cbb61e600827?w=600&q=80', active:true },
  { id:'p038', category_id:'groundspices', name:'Cinnamon Powder', moq_india:'500 kg', moq_export:'1 MT', form:'Powder', grade:'Grade A', origin:'Kerala', packing:'1kg,5kg,25kg PP', certifications:'FSSAI, Spices Board', shelf_life:'18 months', storage:'Cool, Dry Place', description:'Fine cinnamon powder for baking, beverages and spice blends. Growing health food demand.', img:'https://images.unsplash.com/photo-1514733670139-4d66e2fb5c59?w=600&q=80', active:true },
  { id:'p039', category_id:'groundspices', name:'Cardamom Powder (Green)', moq_india:'250 kg', moq_export:'500 kg', form:'Powder', grade:'Premium', origin:'Kerala, Karnataka', packing:'100g,500g,1kg,5kg Tins', certifications:'FSSAI, Spices Board', shelf_life:'12 months', storage:'Cool, Dry, Airtight', description:'Premium aromatic powder. Used in chai, desserts and Middle Eastern sweets.', img:'https://images.unsplash.com/photo-1573477236062-6e8b3dcc8f8d?w=600&q=80', active:true },
  { id:'p040', category_id:'freshfruits', name:'Fresh Mango (Alphonso / Kesar)', moq_india:'1 MT', moq_export:'5 MT', form:'Fresh', grade:'A Grade', origin:'Maharashtra, Gujarat', packing:'3kg,5kg Gift Cartons', certifications:'APEDA, Phytosanitary, Irradiation', shelf_life:'1-2 weeks', storage:'Refrigeration 8-12C', description:"Alphonso, Kesar, Totapuri varieties. The world's finest mangoes. Exported to USA, UK, UAE, Canada, Australia.", img:'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&q=80', active:true },
  { id:'p041', category_id:'freshfruits', name:'Green A Grade Malda Mango', moq_india:'1 MT', moq_export:'5 MT', form:'Fresh', grade:'A Grade', origin:'West Bengal', packing:'5kg,10kg Cartons', certifications:'APEDA, Phytosanitary', shelf_life:'1-2 weeks', storage:'Refrigeration 8-12C', description:"Malda's famous green mango. Popular in Bangladesh and Middle East markets.", img:'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600&q=80', active:true },
  { id:'p042', category_id:'freshfruits', name:'Fresh Pomegranate (Bhagwa)', moq_india:'2 MT', moq_export:'10 MT', form:'Fresh', grade:'A Grade', origin:'Maharashtra (Solapur)', packing:'3kg,5kg Cartons', certifications:'GlobalGAP, APEDA, Phytosanitary', shelf_life:'3-4 weeks', storage:'Refrigeration 5-8C', description:'Bhagwa — deep red arils, sweet-tart. India is top global exporter of this variety.', img:'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&q=80', active:true },
  { id:'p043', category_id:'freshfruits', name:'Fresh Green Grapes (Thompson)', moq_india:'2 MT', moq_export:'10 MT', form:'Fresh', grade:'A Grade', origin:'Maharashtra (Nashik)', packing:'4kg,8kg Cartons', certifications:'GlobalGAP, APEDA, Phytosanitary', shelf_life:'3-4 weeks', storage:'Refrigeration 1-4C', description:'Seedless, sweet, crisp. Nashik grapes exported to Europe, Middle East and South East Asia.', img:'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=600&q=80', active:true },
  { id:'p044', category_id:'freshfruits', name:'Fresh Orange (Nagpur Mandarin)', moq_india:'2 MT', moq_export:'10 MT', form:'Fresh', grade:'A Grade', origin:'Nagpur, Maharashtra', packing:'5kg,10kg Cartons', certifications:'APEDA, Phytosanitary', shelf_life:'3-4 weeks', storage:'Refrigeration 4-8C', description:'World-famous Nagpur orange. GI tagged. Sweet, thin-skinned. High demand in Gulf and UK.', img:'https://images.unsplash.com/photo-1547514701-42782101795e?w=600&q=80', active:true },
  { id:'p045', category_id:'freshfruits', name:'Fresh Banana (Cavendish G9)', moq_india:'5 MT', moq_export:'20 MT', form:'Fresh', grade:'A Grade', origin:'Tamil Nadu, AP', packing:'13kg,18kg Cartons', certifications:'APEDA, Phytosanitary', shelf_life:'2-3 weeks', storage:'Controlled Atmosphere', description:"India's most exported banana. Cavendish G9 variety, uniform size, long shelf life.", img:'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&q=80', active:true },
  { id:'p046', category_id:'freshfruits', name:'Fresh Papaya (Red Lady)', moq_india:'1 MT', moq_export:'5 MT', form:'Fresh', grade:'A Grade', origin:'Maharashtra, Karnataka', packing:'3kg,5kg Cartons', certifications:'APEDA, Phytosanitary', shelf_life:'2 weeks', storage:'Refrigeration 10-13C', description:'Red Lady variety, sweet orange flesh. Exported to Middle East and Southeast Asia.', img:'https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=600&q=80', active:true },
  { id:'p047', category_id:'freshfruits', name:'Fresh Guava', moq_india:'1 MT', moq_export:'5 MT', form:'Fresh', grade:'A Grade', origin:'Maharashtra, UP', packing:'3kg,5kg Cartons', certifications:'APEDA, Phytosanitary', shelf_life:'1-2 weeks', storage:'Cool, Dry Place', description:'White and pink flesh varieties. Rich in Vitamin C. Growing export demand in Middle East.', img:'https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?w=600&q=80', active:true },
  { id:'p048', category_id:'freshfruits', name:'Fresh Watermelon', moq_india:'5 MT', moq_export:'20 MT', form:'Fresh', grade:'A Grade', origin:'Karnataka, Maharashtra', packing:'Whole in Cartons', certifications:'APEDA, Phytosanitary', shelf_life:'2-3 weeks', storage:'Refrigeration 10-15C', description:'Large, sweet, seedless varieties. Bulk export to Gulf countries and SE Asia.', img:'https://images.unsplash.com/photo-1589984662646-e7b2e4962f18?w=600&q=80', active:true },
  { id:'p049', category_id:'freshveg', name:'Fresh Red Onion', moq_india:'5-20 MT', moq_export:'25 MT / 1 FCL', form:'Fresh', grade:'A Grade', origin:'Nashik, Maharashtra', packing:'20kg,25kg,50kg Nets', certifications:'APEDA, Phytosanitary', shelf_life:'4-8 weeks', storage:'Cool, Well Ventilated', description:'India is top global exporter. Nashik Red and S-34 varieties. Exported to SE Asia, Middle East and Europe.', img:'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&q=80', active:true },
  { id:'p050', category_id:'freshveg', name:'Fresh White Garlic', moq_india:'1-5 MT', moq_export:'10 MT', form:'Fresh', grade:'A Grade', origin:'Gujarat (Gondal)', packing:'500g,1kg,5kg,20kg', certifications:'APEDA, Phytosanitary', shelf_life:'4-6 months', storage:'Cool, Dry, Ventilated', description:'Bold cloves, high allicin. Gondal garlic preferred across Southeast Asia and Middle East.', img:'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=600&q=80', active:true },
  { id:'p051', category_id:'freshveg', name:'Fresh Potato', moq_india:'10-25 MT', moq_export:'25 MT / 1 FCL', form:'Fresh', grade:'A Grade', origin:'UP, West Bengal', packing:'25kg,50kg Jute/PP', certifications:'APEDA, Phytosanitary', shelf_life:'3-4 months', storage:'Cool, Dark Place', description:'Kufri Jyoti and Chipsona varieties. Exported to Middle East and SE Asia.', img:'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&q=80', active:true },
  { id:'p052', category_id:'freshveg', name:'Fresh Ginger', moq_india:'1-5 MT', moq_export:'5 MT', form:'Fresh', grade:'A Grade', origin:'Meghalaya, Kerala', packing:'10kg,25kg Jute', certifications:'Spices Board, APEDA, Phytosanitary', shelf_life:'3-4 weeks', storage:'Cool, Dry Place', description:'High gingerol content. Organic options available. Strong demand in Japan, EU and US.', img:'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&q=80', active:true },
  { id:'p053', category_id:'freshveg', name:'Fresh Tomato', moq_india:'5-10 MT', moq_export:'10 MT', form:'Fresh', grade:'A Grade', origin:'Maharashtra, Karnataka', packing:'5kg,10kg Cartons', certifications:'APEDA, Phytosanitary', shelf_life:'2-3 weeks', storage:'Refrigeration 10-15C', description:'Hybrid varieties with long shelf life. Bulk export to Maldives, Sri Lanka and Gulf.', img:'https://images.unsplash.com/photo-1558818498-28c1e002b655?w=600&q=80', active:true },
  { id:'p054', category_id:'freshveg', name:'Fresh Green Chilli', moq_india:'1-5 MT', moq_export:'5 MT', form:'Fresh', grade:'A Grade', origin:'AP, Telangana', packing:'5kg,10kg Cartons', certifications:'APEDA, Phytosanitary', shelf_life:'2-3 weeks', storage:'Refrigeration 7-10C', description:'Hot and mild varieties. Widely used in Asian and Middle Eastern cuisines.', img:'https://images.unsplash.com/photo-1526346698789-22fd84314424?w=600&q=80', active:true },
  { id:'p055', category_id:'freshveg', name:'Fresh Lady Finger (Okra)', moq_india:'1-5 MT', moq_export:'5 MT', form:'Fresh', grade:'A Grade', origin:'Gujarat, Maharashtra', packing:'3kg,5kg Cartons', certifications:'APEDA, Phytosanitary', shelf_life:'1-2 weeks', storage:'Refrigeration 10-13C', description:'Tender fresh okra. Huge demand in UK, USA and Middle East among South Asian diaspora.', img:'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80', active:true },
  { id:'p056', category_id:'freshveg', name:'Fresh Capsicum (Red/Green)', moq_india:'1-5 MT', moq_export:'5 MT', form:'Fresh', grade:'A Grade', origin:'Himachal, Maharashtra', packing:'5kg,10kg Cartons', certifications:'APEDA, Phytosanitary', shelf_life:'2-3 weeks', storage:'Refrigeration 7-10C', description:'Red, green and yellow bell peppers. Growing demand in Middle East and EU markets.', img:'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&q=80', active:true },
  { id:'p057', category_id:'freshveg', name:'Fresh Carrot', moq_india:'2-5 MT', moq_export:'10 MT', form:'Fresh', grade:'A Grade', origin:'Punjab, Himachal', packing:'10kg,20kg Cartons', certifications:'APEDA, Phytosanitary', shelf_life:'3-4 weeks', storage:'Refrigeration 0-4C', description:'Nantes and hybrid varieties. Sweet, crunchy, high beta-carotene. Exported to Gulf and SE Asia.', img:'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&q=80', active:true },
  { id:'p058', category_id:'freshveg', name:'Fresh Lemon', moq_india:'2-5 MT', moq_export:'10 MT', form:'Fresh', grade:'A Grade', origin:'Maharashtra, AP', packing:'5kg,10kg Cartons', certifications:'APEDA, Phytosanitary', shelf_life:'3-4 weeks', storage:'Refrigeration 10-13C', description:'High juice content, thin skin. Used in beverages and cooking. Year-round availability.', img:'https://images.unsplash.com/photo-1582087654735-8cdf5ad35c6f?w=600&q=80', active:true },
  { id:'p059', category_id:'freshveg', name:'Fresh Broccoli', moq_india:'1-5 MT', moq_export:'5 MT', form:'Fresh', grade:'A Grade', origin:'Maharashtra, Karnataka', packing:'5kg Cartons', certifications:'APEDA, Phytosanitary', shelf_life:'2-3 weeks', storage:'Refrigeration 0-4C', description:'Premium vegetable, growing demand in Middle East, SE Asia and diaspora markets globally.', img:'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=600&q=80', active:true },
  { id:'p060', category_id:'dairy', name:'Pure Cow Ghee (Desi)', moq_india:'500 kg', moq_export:'1 MT', form:'Liquid Fat', grade:'Premium/A2', origin:'Rajasthan, Gujarat', packing:'200ml,500ml,1L Tins; 15kg Drums', certifications:'FSSAI, ISO 22000, Halal', shelf_life:'12 months', storage:'Cool, Dry Place', description:'A2 Gir cow ghee available. Nutty aroma, golden colour. Growing demand in USA and Europe.', img:'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80', active:true },
  { id:'p061', category_id:'dairy', name:'Buffalo Ghee', moq_india:'500 kg', moq_export:'1 MT', form:'Liquid Fat', grade:'Grade A', origin:'Uttar Pradesh, Punjab', packing:'500ml,1L Tins; 15kg Drums', certifications:'FSSAI, Halal', shelf_life:'12 months', storage:'Cool, Dry Place', description:'High fat content, rich flavour. Popular in Middle East and Pakistani diaspora markets.', img:'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80', active:true },
  { id:'p062', category_id:'dairy', name:'Fresh Paneer', moq_india:'500 kg', moq_export:'1 MT', form:'Fresh Block', grade:'Premium', origin:'Punjab, Maharashtra', packing:'200g,500g,1kg Blocks', certifications:'FSSAI, Halal', shelf_life:'21 days fresh', storage:'Refrigeration 2-5C', description:'Indian cottage cheese, firm texture. Frozen export options available. Growing international demand.', img:'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80', active:true },
  { id:'p063', category_id:'dairy', name:'Full Cream Milk Powder', moq_india:'500 kg', moq_export:'1 MT', form:'Spray Dried', grade:'Grade A', origin:'Punjab, Haryana', packing:'25kg,50kg Paper Bags', certifications:'FSSAI, ISO 22000, Codex', shelf_life:'24 months', storage:'Cool, Dry Place', description:'26% fat content. Used in confectionery, bakery and dairy reconstitution. Gulf and Africa markets.', img:'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80', active:true },
  { id:'p064', category_id:'dairy', name:'Skimmed Milk Powder', moq_india:'500 kg', moq_export:'1 MT', form:'Spray Dried', grade:'Grade A', origin:'Pan India', packing:'25kg,50kg Paper Bags', certifications:'FSSAI, ISO 22000, Codex', shelf_life:'24 months', storage:'Cool, Dry Place', description:'Low fat, high protein. Used in sports nutrition, baby food and food processing.', img:'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80', active:true },
  { id:'p065', category_id:'dairy', name:'Salted / Unsalted Butter', moq_india:'500 kg', moq_export:'1 MT', form:'Block', grade:'Grade A', origin:'Punjab, Haryana', packing:'25kg Blocks, Retail Packs', certifications:'FSSAI, ISO 22000, Halal', shelf_life:'9 months frozen', storage:'Frozen -18C', description:'Creamy texture, consistent quality. Used in bakery and food processing globally.', img:'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&q=80', active:true },
  { id:'p066', category_id:'canned', name:'Canned Sweet Corn', moq_india:'1-5 MT', moq_export:'5 MT', form:'Whole Kernel', grade:'Grade A', origin:'Maharashtra, Karnataka', packing:'400g,800g,2.95kg Tins', certifications:'FSSAI, ISO 22000, Codex', shelf_life:'24 months', storage:'Cool, Dry Place', description:'Sweet, tender whole kernel corn. High demand in hotels, restaurants and retail chains.', img:'https://images.unsplash.com/photo-1601593346740-925612772716?w=600&q=80', active:true },
  { id:'p067', category_id:'canned', name:'Canned Mushroom', moq_india:'1-5 MT', moq_export:'5 MT', form:'Sliced/Whole', grade:'Grade A', origin:'Himachal, Maharashtra', packing:'400g,800g Tins', certifications:'FSSAI, ISO 22000, Codex', shelf_life:'24 months', storage:'Cool, Dry Place', description:'Button mushroom in brine. Used in pizza, pasta and ready meals. European and ME demand.', img:'https://images.unsplash.com/photo-1504545102780-26774c1bb073?w=600&q=80', active:true },
  { id:'p068', category_id:'canned', name:'Canned Pineapple', moq_india:'1-5 MT', moq_export:'5 MT', form:'Slices/Chunks', grade:'Grade A', origin:'Kerala, Tamil Nadu', packing:'400g,825g,3kg Tins', certifications:'FSSAI, ISO 22000, Codex', shelf_life:'24 months', storage:'Cool, Dry Place', description:'Sweet tropical pineapple in syrup. Used in desserts and bakery products worldwide.', img:'https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=600&q=80', active:true },
  { id:'p069', category_id:'canned', name:'Canned Lychee', moq_india:'1-5 MT', moq_export:'5 MT', form:'Whole in Syrup', grade:'Grade A', origin:'West Bengal, Jharkhand', packing:'400g,825g Tins', certifications:'FSSAI, ISO 22000, Codex', shelf_life:'24 months', storage:'Cool, Dry Place', description:'Premium tropical fruit. Growing demand in Middle East, Europe and Asian diaspora markets.', img:'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=600&q=80', active:true },
  { id:'p070', category_id:'canned', name:'Canned Fruit Cocktail', moq_india:'1-5 MT', moq_export:'5 MT', form:'Mixed in Syrup', grade:'Grade A', origin:'Pan India', packing:'400g,825g,3kg Tins', certifications:'FSSAI, ISO 22000, Codex', shelf_life:'24 months', storage:'Cool, Dry Place', description:'Mixed tropical fruits in light syrup. Used in desserts, bakery and hospitality sector.', img:'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600&q=80', active:true },
  { id:'p071', category_id:'flour', name:'Whole Wheat Flour (Atta)', moq_india:'1-5 MT', moq_export:'10 MT', form:'Stone Ground/Roller', grade:'A Grade', origin:'Punjab, UP', packing:'1kg,5kg,10kg,25kg,50kg', certifications:'FSSAI, Phytosanitary', shelf_life:'6-9 months', storage:'Cool, Dry Place', description:'Premium chakki fresh atta. Used for chapati, roti, puri. High demand in diaspora markets globally.', img:'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80', active:true },
  { id:'p072', category_id:'flour', name:'White Wheat Flour (Maida)', moq_india:'1-5 MT', moq_export:'10 MT', form:'Refined', grade:'Grade A', origin:'UP, Punjab', packing:'25kg,50kg PP', certifications:'FSSAI, Phytosanitary', shelf_life:'6-9 months', storage:'Cool, Dry Place', description:'Refined white flour for baking, noodles and pastry. Used in food processing industry.', img:'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80', active:true },
  { id:'p073', category_id:'flour', name:'Gram Flour (Besan)', moq_india:'1-5 MT', moq_export:'5 MT', form:'Stone Ground', grade:'A Grade', origin:'Rajasthan, MP', packing:'1kg,5kg,25kg,50kg', certifications:'FSSAI, Phytosanitary', shelf_life:'6-9 months', storage:'Cool, Dry Place', description:'High protein chickpea flour. Used in snacks, pakora, kadhi. Strong diaspora market globally.', img:'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600&q=80', active:true },
  { id:'p074', category_id:'flour', name:'Fine Semolina (Suji/Rawa)', moq_india:'1-5 MT', moq_export:'5 MT', form:'Granular', grade:'A Grade', origin:'UP, Punjab', packing:'1kg,5kg,25kg PP', certifications:'FSSAI, Phytosanitary', shelf_life:'6-9 months', storage:'Cool, Dry Place', description:'Coarse and fine grades. Used in upma, halwa, pasta and bakery products.', img:'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80', active:true },
  { id:'p075', category_id:'flour', name:'Maize Flour (Corn)', moq_india:'1-5 MT', moq_export:'10 MT', form:'Milled', grade:'A Grade', origin:'Karnataka, Andhra', packing:'25kg,50kg PP', certifications:'FSSAI, Phytosanitary', shelf_life:'6-9 months', storage:'Cool, Dry Place', description:'Yellow corn flour for makki ki roti, tortillas and food processing. Africa and Middle East markets.', img:'https://images.unsplash.com/photo-1601593346740-925612772716?w=600&q=80', active:true },
  { id:'p076', category_id:'bakery', name:'Wheat Rusk', moq_india:'1-5 MT', moq_export:'5 MT', form:'Baked', grade:'Premium', origin:'Gujarat, Maharashtra', packing:'200g,400g,800g Boxes', certifications:'FSSAI, ISO 22000', shelf_life:'12 months', storage:'Cool, Dry Place', description:'Classic wheat rusk, twice baked for crunch. Popular breakfast item in Indian diaspora markets.', img:'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80', active:true },
  { id:'p077', category_id:'bakery', name:'Ajwain Rusk', moq_india:'1-5 MT', moq_export:'5 MT', form:'Baked', grade:'Premium', origin:'Gujarat, Maharashtra', packing:'200g,400g Boxes', certifications:'FSSAI, ISO 22000', shelf_life:'12 months', storage:'Cool, Dry Place', description:'Carom seed flavoured rusk, digestive properties. Popular in Middle East and UK diaspora.', img:'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80', active:true },
  { id:'p078', category_id:'bakery', name:'Butter Cookies', moq_india:'1-5 MT', moq_export:'5 MT', form:'Baked', grade:'Premium', origin:'Gujarat, Maharashtra', packing:'200g,400g Tins/Boxes', certifications:'FSSAI, ISO 22000', shelf_life:'12 months', storage:'Cool, Dry Place', description:'Rich butter cookies, bakery quality. Growing retail demand in Gulf and UK markets.', img:'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&q=80', active:true },
  { id:'p079', category_id:'bakery', name:'Jeera Cookies', moq_india:'1-5 MT', moq_export:'5 MT', form:'Baked', grade:'Premium', origin:'Gujarat, Maharashtra', packing:'200g,400g Boxes', certifications:'FSSAI, ISO 22000', shelf_life:'12 months', storage:'Cool, Dry Place', description:'Cumin seed cookies, savoury flavour. Unique Indian bakery product for international markets.', img:'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&q=80', active:true },
  { id:'p080', category_id:'bakery', name:'Sandwich / Milk Bread', moq_india:'1-5 MT', moq_export:'5 MT', form:'Baked', grade:'Premium', origin:'Maharashtra, Gujarat', packing:'400g,800g Packs', certifications:'FSSAI, ISO 22000', shelf_life:'7-10 days', storage:'Cool, Dry Place', description:'Soft sandwich bread, extended shelf life options. Exported to Maldives, Mauritius and Gulf.', img:'https://images.unsplash.com/photo-1549931319-a545dcf3bc7b?w=600&q=80', active:true },
  { id:'p081', category_id:'bakery', name:'Multigrain Bread', moq_india:'1-5 MT', moq_export:'5 MT', form:'Baked', grade:'Premium', origin:'Maharashtra, Gujarat', packing:'400g,800g Packs', certifications:'FSSAI, ISO 22000', shelf_life:'7-10 days', storage:'Cool, Dry Place', description:'Healthy multigrain bread, growing health food demand in premium export markets.', img:'https://images.unsplash.com/photo-1549931319-a545dcf3bc7b?w=600&q=80', active:true },
  { id:'p082', category_id:'edibleoil', name:'Refined Sunflower Oil', moq_india:'5-10 MT', moq_export:'25 MT / 1 FCL', form:'Refined', grade:'Grade A', origin:'Maharashtra, Gujarat', packing:'1L,5L,15L,200L', certifications:'FSSAI, ISO 22000, Halal', shelf_life:'18 months', storage:'Cool, Dry Place', description:'Light, healthy, high smoke point. Used in cooking and food processing. Gulf and Africa markets.', img:'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80', active:true },
  { id:'p083', category_id:'edibleoil', name:'Pure Mustard Oil (Kachi Ghani)', moq_india:'2-5 MT', moq_export:'10 MT', form:'Cold Pressed', grade:'Kachi Ghani', origin:'Rajasthan, UP', packing:'500ml,1L,5L,15L', certifications:'FSSAI, ISO 22000', shelf_life:'12 months', storage:'Cool, Dry Place', description:'Cold pressed, pungent flavour. Essential in Bengali and North Indian cooking. UK diaspora demand.', img:'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80', active:true },
  { id:'p084', category_id:'edibleoil', name:'Pure Coconut Oil (Virgin)', moq_india:'1-5 MT', moq_export:'5 MT', form:'Cold Pressed', grade:'Virgin', origin:'Kerala, Tamil Nadu', packing:'500ml,1L,5L Bottles', certifications:'FSSAI, ISO 22000, Organic', shelf_life:'18 months', storage:'Cool, Dry Place', description:'Virgin cold pressed coconut oil. Used in cooking, cosmetics and Ayurveda. Europe and US markets.', img:'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80', active:true },
  { id:'p085', category_id:'edibleoil', name:'Pure Sesame Oil', moq_india:'1-5 MT', moq_export:'5 MT', form:'Cold Pressed', grade:'Grade A', origin:'Gujarat, Rajasthan', packing:'500ml,1L,5L Bottles', certifications:'FSSAI, ISO 22000', shelf_life:'18 months', storage:'Cool, Dry Place', description:'Roasted and raw varieties. Used in Asian cooking and cosmetics. Japan and Korea demand.', img:'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80', active:true },
  { id:'p086', category_id:'edibleoil', name:'Groundnut Oil', moq_india:'2-5 MT', moq_export:'10 MT', form:'Refined/Cold Pressed', grade:'Grade A', origin:'Gujarat', packing:'1L,5L,15L Tins', certifications:'FSSAI, ISO 22000, Halal', shelf_life:'18 months', storage:'Cool, Dry Place', description:'High smoke point, nutty flavour. Popular in West Africa and Middle East cooking.', img:'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80', active:true },
  { id:'p087', category_id:'sesame', name:'Natural White Sesame Seeds', moq_india:'500 kg', moq_export:'2 MT', form:'Natural', grade:'99% Purity', origin:'Gujarat, Rajasthan', packing:'25kg,50kg PP', certifications:'FSSAI, Spices Board, Halal, Kosher', shelf_life:'24 months', storage:'Cool, Dry Place', description:'Unhulled white sesame. Used in tahini, bakery and confectionery. Japan, China and ME demand.', img:'https://images.unsplash.com/photo-1612187029458-cef1b9a76da2?w=600&q=80', active:true },
  { id:'p088', category_id:'sesame', name:'Hulled White Sesame Seeds', moq_india:'500 kg', moq_export:'2 MT', form:'Hulled', grade:'99.95% Purity', origin:'Gujarat, Rajasthan', packing:'25kg,50kg PP', certifications:'FSSAI, Spices Board, Halal, Kosher', shelf_life:'18 months', storage:'Cool, Dry Place', description:'Machine hulled, bright white. Used in burger buns, confectionery and tahini.', img:'https://images.unsplash.com/photo-1612187029458-cef1b9a76da2?w=600&q=80', active:true },
  { id:'p089', category_id:'sesame', name:'Black Sesame Seeds', moq_india:'500 kg', moq_export:'2 MT', form:'Natural', grade:'99% Purity', origin:'Gujarat, Rajasthan', packing:'25kg,50kg PP', certifications:'FSSAI, Spices Board, Halal', shelf_life:'24 months', storage:'Cool, Dry Place', description:'High antioxidant, nutty flavour. Growing health food demand in Japan, China, US and Europe.', img:'https://images.unsplash.com/photo-1612187029458-cef1b9a76da2?w=600&q=80', active:true },
  { id:'p090', category_id:'seafood', name:'Frozen Vannamei Prawns (White)', moq_india:'500 kg', moq_export:'1 MT', form:'IQF / Block', grade:'HOSO/HLSO/PD', origin:'Andhra Pradesh', packing:'1kg,2kg Retail; 10kg Master Carton', certifications:'MPEDA, EU, Halal, HACCP, BAP', shelf_life:'24 months', storage:'Frozen -18C', description:'Farm-raised Vannamei. India is top shrimp exporter. All formats available. Exported to USA, EU and Japan.', img:'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&q=80', active:true },
  { id:'p091', category_id:'seafood', name:'Frozen Black Tiger Shrimp', moq_india:'500 kg', moq_export:'1 MT', form:'IQF', grade:'HOSO/HLSO/PD', origin:'Andhra Pradesh, Tamil Nadu', packing:'1kg,2kg Retail; 10kg Carton', certifications:'MPEDA, EU, Halal, HACCP', shelf_life:'24 months', storage:'Frozen -18C', description:'Wild and farmed black tiger shrimp. Premium variety, high demand in Europe and Japan.', img:'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&q=80', active:true },
  { id:'p092', category_id:'seafood', name:'Frozen Mackerel', moq_india:'500 kg', moq_export:'1 MT', form:'IQF Whole/HG', grade:'Grade A', origin:'Kerala, Goa', packing:'10kg,20kg Cartons', certifications:'MPEDA, EU, Halal', shelf_life:'24 months', storage:'Frozen -18C', description:'Indian mackerel (Bangda). High omega-3. Strong demand in Middle East and SE Asia.', img:'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=600&q=80', active:true },
  { id:'p093', category_id:'seafood', name:'Frozen Red Snapper', moq_india:'500 kg', moq_export:'1 MT', form:'IQF Whole/Fillet', grade:'Grade A', origin:'Tamil Nadu, Kerala', packing:'10kg,20kg Cartons', certifications:'MPEDA, Halal, HACCP', shelf_life:'24 months', storage:'Frozen -18C', description:'Premium red snapper, firm white flesh. High value export to Middle East and USA.', img:'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=600&q=80', active:true },
  { id:'p094', category_id:'seafood', name:'Frozen Blue Swim Crab', moq_india:'500 kg', moq_export:'1 MT', form:'IQF Whole/Sections', grade:'Grade A', origin:'Andhra Pradesh, Odisha', packing:'10kg,20kg Cartons', certifications:'MPEDA, EU, Halal, HACCP', shelf_life:'24 months', storage:'Frozen -18C', description:'Blue swimmer crab sections and whole. Popular in Middle East, USA and European markets.', img:'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&q=80', active:true },
  { id:'p095', category_id:'seafood', name:'Frozen Deep Sea Shrimp', moq_india:'500 kg', moq_export:'1 MT', form:'IQF', grade:'Grade A', origin:'Gujarat, Maharashtra', packing:'10kg Cartons', certifications:'MPEDA, EU, Halal', shelf_life:'24 months', storage:'Frozen -18C', description:'Wild caught deep sea shrimp. Premium quality, distinctive sweet flavour. EU and Japan markets.', img:'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&q=80', active:true },
  { id:'p096', category_id:'chicken', name:'Frozen Whole Chicken (Halal)', moq_india:'1 MT', moq_export:'2 MT', form:'Eviscerated IQF', grade:'Grade A', origin:'India', packing:'800g-1.5kg IQF; 10kg,20kg Cartons', certifications:'FSSAI, Halal, HACCP, BRC', shelf_life:'18 months', storage:'Frozen -18C', description:'Eviscerated cleaned whole chicken. Halal certified. Exported to GCC, Africa and Southeast Asia.', img:'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&q=80', active:true },
  { id:'p097', category_id:'chicken', name:'Frozen Chicken Quarter Leg', moq_india:'1 MT', moq_export:'2 MT', form:'IQF Portions', grade:'Grade A', origin:'India', packing:'10kg,20kg Cartons', certifications:'FSSAI, Halal, HACCP', shelf_life:'18 months', storage:'Frozen -18C', description:'Drumstick and thigh portions. High demand in Africa, Middle East and SE Asia.', img:'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600&q=80', active:true },
  { id:'p098', category_id:'chicken', name:'Frozen Chicken Breast (Boneless)', moq_india:'1 MT', moq_export:'2 MT', form:'IQF Boneless', grade:'Grade A', origin:'India', packing:'10kg,20kg Cartons', certifications:'FSSAI, Halal, HACCP, BRC', shelf_life:'18 months', storage:'Frozen -18C', description:'Skinless boneless breast. Premium product for food processing and retail. Europe and ME.', img:'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&q=80', active:true },
  { id:'p099', category_id:'chicken', name:'Frozen Chicken Wings', moq_india:'1 MT', moq_export:'2 MT', form:'IQF Whole/Mid-Joint', grade:'Grade A', origin:'India', packing:'10kg,20kg Cartons', certifications:'FSSAI, Halal, HACCP', shelf_life:'18 months', storage:'Frozen -18C', description:'Full wings and mid-joint sections. Popular in casual dining globally. Africa and ME markets.', img:'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&q=80', active:true },
  { id:'p100', category_id:'chicken', name:'Frozen Chicken Feet (Paws)', moq_india:'1 MT', moq_export:'2 MT', form:'IQF', grade:'Grade A', origin:'India', packing:'10kg,20kg Cartons', certifications:'FSSAI, Halal, HACCP', shelf_life:'18 months', storage:'Frozen -18C', description:'High collagen content. Huge demand in China, Hong Kong and SE Asia markets.', img:'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&q=80', active:true },
  { id:'p101', category_id:'chicken', name:'Frozen Chicken Liver / Gizzard', moq_india:'500 kg', moq_export:'1 MT', form:'IQF', grade:'Grade A', origin:'India', packing:'10kg Cartons', certifications:'FSSAI, Halal, HACCP', shelf_life:'18 months', storage:'Frozen -18C', description:'Organ meats, high iron and protein. Cost-effective export product for Africa and ME.', img:'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&q=80', active:true },
  { id:'p102', category_id:'mutton', name:'Frozen Boneless Mutton (Goat)', moq_india:'500 kg', moq_export:'1 MT', form:'IQF Boneless', grade:'Grade A', origin:'Rajasthan, UP', packing:'10kg,20kg Cartons', certifications:'FSSAI, Halal, HACCP', shelf_life:'18 months', storage:'Frozen -18C', description:'Premium halal goat meat. High demand in Middle East, Malaysia and Muslim markets globally.', img:'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80', active:true },
  { id:'p103', category_id:'mutton', name:'Frozen Mutton Leg (Bone-in)', moq_india:'500 kg', moq_export:'1 MT', form:'IQF Whole Leg', grade:'Grade A', origin:'Rajasthan, Maharashtra', packing:'10kg,20kg Cartons', certifications:'FSSAI, Halal, HACCP', shelf_life:'18 months', storage:'Frozen -18C', description:'Whole leg with bone, premium presentation. Popular in Middle East for celebrations.', img:'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80', active:true },
  { id:'p104', category_id:'mutton', name:'Whole Frozen Mutton (Carcass)', moq_india:'500 kg', moq_export:'1 MT', form:'IQF Carcass', grade:'Grade A', origin:'Rajasthan, UP', packing:'Per Carcass', certifications:'FSSAI, Halal, HACCP', shelf_life:'18 months', storage:'Frozen -18C', description:'Whole carcass for halal butchers and restaurants. Middle East and African markets.', img:'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80', active:true },
  { id:'p105', category_id:'mutton', name:'Frozen Mutton Liver', moq_india:'500 kg', moq_export:'1 MT', form:'IQF', grade:'Grade A', origin:'Pan India', packing:'10kg Cartons', certifications:'FSSAI, Halal, HACCP', shelf_life:'18 months', storage:'Frozen -18C', description:'Fresh frozen goat liver, high iron. Used in traditional Middle Eastern and African cuisine.', img:'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80', active:true },
  { id:'p106', category_id:'sugar', name:'S30 White Refined Sugar', moq_india:'5 MT', moq_export:'25 MT / 1 FCL', form:'Fine Crystal', grade:'ICUMSA 30-45', origin:'Maharashtra, UP', packing:'50kg PP; 1MT Jumbo; 1kg Retail', certifications:'FSSAI, ISO 9001, Codex, Halal', shelf_life:'24 months', storage:'Cool, Dry Place', description:'Highly refined bright white sugar. ICUMSA 30-45. Premium grade for beverages and pharma.', img:'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=600&q=80', active:true },
  { id:'p107', category_id:'sugar', name:'M30 White Mill Sugar', moq_india:'5 MT', moq_export:'25 MT / 1 FCL', form:'Crystal', grade:'ICUMSA 30-150', origin:'UP, Maharashtra', packing:'50kg PP; 1MT Jumbo', certifications:'FSSAI, ISO 9001, Codex', shelf_life:'24 months', storage:'Cool, Dry Place', description:'Mill white sugar, cost-effective for food processing and confectionery industry.', img:'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=600&q=80', active:true },
  { id:'p108', category_id:'sugar', name:'Indian Jaggery (Gur)', moq_india:'1-5 MT', moq_export:'10 MT', form:'Block/Powder', grade:'Grade A', origin:'Maharashtra, UP', packing:'1kg,5kg,25kg Packs', certifications:'FSSAI, Organic available', shelf_life:'12 months', storage:'Cool, Dry Place', description:'Natural unrefined cane sugar, mineral-rich. Growing health food demand in Europe and USA.', img:'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80', active:true },
  { id:'p109', category_id:'sugar', name:'Molasses (Sugarcane)', moq_india:'10-25 MT', moq_export:'25 MT', form:'Liquid', grade:'Grade A', origin:'UP, Maharashtra', packing:'200L Drums, Flexi Tanks', certifications:'FSSAI, Codex', shelf_life:'24 months', storage:'Cool, Dry Place', description:'Thick dark syrup, used in alcohol production, animal feed and food processing globally.', img:'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=600&q=80', active:true },
];

async function getKV(env, key, fallback) {
  const val = await env.KV.get(key);
  return val ? JSON.parse(val) : fallback;
}
async function setKV(env, key, data) { await env.KV.put(key, JSON.stringify(data)); }

async function seedIfEmpty(env) {
  const admins = await env.KV.get('admins');
  if (!admins) {
    const pwHash = await sha256('admin123');
    await setKV(env, 'admins', [{ id:'a1', username:'admin', password_hash:pwHash, role:'superadmin', totp_secret:null, totp_enabled:false, created_at: new Date().toISOString().slice(0,10) }]);
    await setKV(env, 'settings', DEFAULT_SETTINGS);
    await setKV(env, 'categories', DEFAULT_CATEGORIES);
    await setKV(env, 'products', DEFAULT_PRODUCTS);
    await setKV(env, 'enquiries', []);
  }
}

async function validateToken(env, token) {
  if (!token) return null;
  const data = await env.KV.get('sess:' + token);
  if (!data) return null;
  return JSON.parse(data);
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '').replace(/\/$/, '');

  if (request.method === 'OPTIONS') return new Response(null, {headers: CORS});
  await seedIfEmpty(env);

  if (request.method === 'GET' && path === 'data') {
    const [settings, categories, products] = await Promise.all([
      getKV(env, 'settings', DEFAULT_SETTINGS),
      getKV(env, 'categories', DEFAULT_CATEGORIES),
      getKV(env, 'products', DEFAULT_PRODUCTS),
    ]);
    return j({ settings, categories, products: products.filter(p=>p.active!==false) });
  }

  if (request.method === 'POST' && path === 'enquiry') {
    const b = await request.json().catch(()=>({}));
    const enqs = await getKV(env, 'enquiries', []);
    enqs.push({ id:'e'+Date.now().toString(36), date:new Date().toISOString().slice(0,19).replace('T',' '), name:b.name||'', email:b.email||'', phone:b.phone||'', country:b.country||'', product:b.product||'', quantity:b.quantity||'', message:b.message||'', status:'new' });
    await setKV(env, 'enquiries', enqs);
    return j({ok:true});
  }

  if (request.method === 'POST' && path === 'login') {
    const b = await request.json().catch(()=>({}));
    const admins = await getKV(env, 'admins', []);
    const admin = admins.find(a => a.username === b.username);
    if (!admin) return e('Invalid username or password', 401);
    const pwHash = await sha256(b.password || '');
    if (admin.password_hash !== pwHash) return e('Invalid username or password', 401);
    if (!admin.totp_enabled) {
      if (!admin.totp_secret) { admin.totp_secret = totpGenSecret(); await setKV(env, 'admins', admins); }
      const tmpToken = await randToken();
      await env.KV.put('tmp:'+tmpToken, JSON.stringify({username:admin.username, action:'setup'}), {expirationTtl:600});
      return j({ ok:true, totp_setup:true, tmp_token:tmpToken, totp_uri: totpQR(admin.totp_secret, admin.username), secret: admin.totp_secret });
    }
    const tmpToken = await randToken();
    await env.KV.put('tmp:'+tmpToken, JSON.stringify({username:admin.username, action:'verify'}), {expirationTtl:300});
    return j({ ok:true, totp_required:true, tmp_token:tmpToken });
  }

  if (request.method === 'POST' && path === 'login/totp') {
    const b = await request.json().catch(()=>({}));
    const tmpData = await env.KV.get('tmp:' + b.tmp_token);
    if (!tmpData) return e('Session expired. Please login again.', 401);
    const tmp = JSON.parse(tmpData);
    const admins = await getKV(env, 'admins', []);
    const admin = admins.find(a => a.username === tmp.username);
    if (!admin) return e('Admin not found', 401);
    const valid = await totpVerify(admin.totp_secret, b.code);
    if (!valid) return e('Invalid code. Try again.', 401);
    if (tmp.action === 'setup') { admin.totp_enabled = true; await setKV(env, 'admins', admins); }
    await env.KV.delete('tmp:' + b.tmp_token);
    const token = await randToken();
    await env.KV.put('sess:'+token, JSON.stringify({username:admin.username, role:admin.role}), {expirationTtl:86400});
    return j({ ok:true, token, role:admin.role, username:admin.username });
  }

  if (request.method === 'POST') {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const sess = await validateToken(env, token);
    if (!sess) return e('Not authenticated', 403);
    const b = await request.json().catch(()=>({}));

    if (path === 'admin/data') {
      const [settings, categories, products, enquiries, admins] = await Promise.all([
        getKV(env, 'settings', DEFAULT_SETTINGS),
        getKV(env, 'categories', DEFAULT_CATEGORIES),
        getKV(env, 'products', DEFAULT_PRODUCTS),
        getKV(env, 'enquiries', []),
        getKV(env, 'admins', []),
      ]);
      const safeAdmins = admins.map(a=>({id:a.id,username:a.username,role:a.role,totp_enabled:a.totp_enabled,created_at:a.created_at}));
      return j({ settings, categories, products, enquiries, admins:safeAdmins, myRole:sess.role, myUsername:sess.username });
    }

    // IMPORTANT: Force reset all products/categories to latest defaults
    if (path === 'admin/reset-products') {
      if (sess.role !== 'superadmin') return e('Permission denied', 403);
      await setKV(env, 'products', DEFAULT_PRODUCTS);
      await setKV(env, 'categories', DEFAULT_CATEGORIES);
      return j({ok:true, count: DEFAULT_PRODUCTS.length, msg:`Reset complete: ${DEFAULT_PRODUCTS.length} products, ${DEFAULT_CATEGORIES.length} categories`});
    }

    if (path === 'admin/save-settings') {
      if (sess.role !== 'superadmin') return e('Permission denied', 403);
      const settings = await getKV(env, 'settings', DEFAULT_SETTINGS);
      const allowed = ['company','proprietor','tagline','about_short','about_long','phone1','phone2','whatsapp','email1','email2','website','address','hours','hero_badge','hero_h1','hero_sub','w3f_enquiry','w3f_contact'];
      for (const k of allowed) { if (b[k] !== undefined) settings[k] = b[k]; }
      await setKV(env, 'settings', settings);
      return j({ok:true});
    }

    if (path === 'admin/save-product') {
      if (sess.role === 'viewer') return e('Permission denied', 403);
      const products = await getKV(env, 'products', DEFAULT_PRODUCTS);
      const isNew = !b.id;
      if (isNew) b.id = 'p' + Date.now().toString(36);
      if (isNew) { products.push(b); } else { const idx=products.findIndex(p=>p.id===b.id); if(idx>-1) products[idx]=b; else products.push(b); }
      await setKV(env, 'products', products);
      return j({ok:true, id:b.id});
    }

    if (path === 'admin/delete-product') {
      if (sess.role === 'viewer') return e('Permission denied', 403);
      let products = await getKV(env, 'products', DEFAULT_PRODUCTS);
      products = products.filter(p=>p.id!==b.id);
      await setKV(env, 'products', products);
      return j({ok:true});
    }

    if (path === 'admin/toggle-product') {
      if (sess.role === 'viewer') return e('Permission denied', 403);
      const products = await getKV(env, 'products', DEFAULT_PRODUCTS);
      const p = products.find(p=>p.id===b.id);
      if (p) p.active = !p.active;
      await setKV(env, 'products', products);
      return j({ok:true});
    }

    if (path === 'admin/save-category') {
      if (sess.role === 'viewer') return e('Permission denied', 403);
      const cats = await getKV(env, 'categories', DEFAULT_CATEGORIES);
      const isNew = !cats.find(c=>c.id===b.id);
      if (!b.id) b.id = b.name.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,20);
      if (isNew) { cats.push(b); } else { const idx=cats.findIndex(c=>c.id===b.id); if(idx>-1) cats[idx]=b; }
      await setKV(env, 'categories', cats);
      return j({ok:true});
    }

    if (path === 'admin/delete-category') {
      if (sess.role === 'viewer') return e('Permission denied', 403);
      let cats = await getKV(env, 'categories', DEFAULT_CATEGORIES);
      cats = cats.filter(c=>c.id!==b.id);
      await setKV(env, 'categories', cats);
      return j({ok:true});
    }

    if (path === 'admin/update-enquiry') {
      const enqs = await getKV(env, 'enquiries', []);
      const eq = enqs.find(e=>e.id===b.id);
      if (eq) eq.status = b.status||eq.status;
      await setKV(env, 'enquiries', enqs);
      return j({ok:true});
    }

    if (path === 'admin/delete-enquiry') {
      if (sess.role === 'viewer') return e('Permission denied', 403);
      let enqs = await getKV(env, 'enquiries', []);
      enqs = enqs.filter(e=>e.id!==b.id);
      await setKV(env, 'enquiries', enqs);
      return j({ok:true});
    }

    if (path === 'admin/save-admin') {
      if (sess.role !== 'superadmin') return e('Permission denied', 403);
      const admins = await getKV(env, 'admins', []);
      const isNew = !b.id;
      if (isNew) {
        if (!b.username || !b.password) return e('Username and password required');
        if (admins.find(a=>a.username===b.username)) return e('Username already exists');
        admins.push({ id:'a'+Date.now().toString(36), username:b.username, password_hash: await sha256(b.password), role: b.role||'editor', totp_secret:null, totp_enabled:false, created_at:new Date().toISOString().slice(0,10) });
      } else {
        const admin = admins.find(a=>a.id===b.id);
        if (!admin) return e('Admin not found');
        if (b.username) admin.username = b.username;
        if (b.password) admin.password_hash = await sha256(b.password);
        if (b.role) admin.role = b.role;
      }
      await setKV(env, 'admins', admins);
      return j({ok:true});
    }

    if (path === 'admin/delete-admin') {
      if (sess.role !== 'superadmin') return e('Permission denied', 403);
      let admins = await getKV(env, 'admins', []);
      if (admins.find(a=>a.id===b.id)?.username === sess.username) return e('Cannot delete yourself');
      admins = admins.filter(a=>a.id!==b.id);
      await setKV(env, 'admins', admins);
      return j({ok:true});
    }

    if (path === 'admin/reset-totp') {
      if (sess.role !== 'superadmin') return e('Permission denied', 403);
      const admins = await getKV(env, 'admins', []);
      const admin = admins.find(a=>a.id===b.id);
      if (!admin) return e('Admin not found');
      admin.totp_secret = totpGenSecret();
      admin.totp_enabled = false;
      await setKV(env, 'admins', admins);
      return j({ok:true});
    }

    if (path === 'admin/logout') {
      await env.KV.delete('sess:' + token);
      return j({ok:true});
    }
  }

  return j({ok:false, msg:'Not found'}, 404);
}
