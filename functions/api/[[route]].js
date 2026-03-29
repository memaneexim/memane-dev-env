// Waking up the Gemini Key
// ============================================================
// MEMANE INTERNATIONAL — Cloudflare Worker API v7
// 17 Categories · 91 Products · Full TOTP Multi-Admin Auth
// ============================================================
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization'};
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json',...CORS}});}
function err(msg,status=400){return json({ok:false,msg},status);}

const DEFAULT_SETTINGS={company:'Memane International',proprietor:'Tejas Memane',tagline:'Reliable Global Sourcing from India',about_short:'India-based import-export company specializing in agricultural commodities, food products, minerals and engineering goods. APEDA (RCMC) Registered.',about_long:"Memane International was founded with a single belief: that India's agricultural wealth deserves to reach every corner of the world. Starting from Pune, Maharashtra, our founder Tejas Memane built a company rooted in trust, transparency, and the pure goodness of natural produce. We source directly from verified farmers and processors across India, ensuring consistency, competitive pricing, and export-ready standards for every shipment.",phone1:'+91 8999662331',phone2:'+91 9011503140',whatsapp:'918999662331',email1:'info@memaneinternational.in',email2:'memaneexim@gmail.com',website:'www.memaneinternational.in',address:'Pune, Maharashtra, India',hours:'Monday – Saturday, 9:00 AM – 6:00 PM IST',certifications:['APEDA (RCMC)','FSSAI','FIEO','Phytosanitary'],stats:[{icon:'🌍',num:'40+',label:'Countries Served'},{icon:'📦',num:'91+',label:'Products Listed'},{icon:'✅',num:'APEDA',label:'RCMC Registered'},{icon:'🤝',num:'17',label:'Categories'}],hero_badge:'🇮🇳 APEDA (RCMC) · FSSAI · FIEO · Pune, India',hero_h1:'Bridging India & the World — One Harvest at a Time',hero_sub:'Your trusted partner for premium agricultural exports from India. Rice, Spices, Fresh Produce, Dairy, Frozen Foods & more — delivered to 40+ countries.',admin_password:'admin123'};

const DEFAULT_CATEGORIES=[
  {id:'basmati',icon:'🌾',name:'Basmati Rice',sub:'Premium aromatic long-grain varieties',img:'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80'},
  {id:'nonbasmati',icon:'🍚',name:'Non Basmati Rice',sub:'Everyday rice for all markets',img:'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&q=80'},
  {id:'pulses',icon:'🫘',name:'Indian Pulses',sub:'Protein-rich lentils and legumes',img:'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&q=80'},
  {id:'wholespices',icon:'🌶️',name:'Whole Spices',sub:'Pure aromatic Indian spices',img:'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=600&q=80'},
  {id:'groundspices',icon:'🧂',name:'Grounded Spices',sub:'Finely milled spice powders',img:'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80'},
  {id:'freshfruits',icon:'🍎',name:'Fresh Fruits',sub:'A-Grade fresh fruits, farm to export',img:'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=600&q=80'},
  {id:'freshveg',icon:'🥦',name:'Fresh Vegetables',sub:'Export-quality fresh vegetables',img:'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80'},
  {id:'dairy',icon:'🥛',name:'Dairy Products',sub:'Ghee, paneer, butter and more',img:'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80'},
  {id:'canned',icon:'🥫',name:'Canned Products',sub:'Ready-to-eat canned foods',img:'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600&q=80'},
  {id:'flour',icon:'🌾',name:'Indian Flour',sub:'Wheat, gram, corn and more',img:'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80'},
  {id:'bakery',icon:'🍞',name:'Bakery Products',sub:'Breads, rusks and cookies',img:'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80'},
  {id:'edibleoil',icon:'🫙',name:'Edible Oil',sub:'Pure cold-pressed cooking oils',img:'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80'},
  {id:'sesame',icon:'🌱',name:'Sesame Seeds',sub:'White, black and hulled varieties',img:'https://images.unsplash.com/photo-1612187029458-cef1b9a76da2?w=600&q=80'},
  {id:'seafood',icon:'🦐',name:'Frozen Seafood',sub:'Shrimp, prawns, fish — IQF quality',img:'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&q=80'},
  {id:'chicken',icon:'🍗',name:'Frozen Chicken',sub:'Halal certified chicken cuts',img:'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&q=80'},
  {id:'mutton',icon:'🥩',name:'Frozen Mutton / Lamb',sub:'Goat and sheep meat, export grade',img:'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80'},
  {id:'sugar',icon:'🍬',name:'Sugar & Molasses',sub:'Refined white sugar ICUMSA 30/45',img:'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=600&q=80'},
];


const DEFAULT_PRODUCTS=[
  // BASMATI RICE
  {id:'p001',category_id:'basmati',name:'1121 Golden Sella Basmati Rice',moq_india:'1–10 MT',moq_export:'25 MT / 1 FCL',form:'Parboiled Sella',grade:'Golden',origin:'Punjab, Haryana',packing:'5kg, 10kg, 25kg, 50kg PP/Jute',certifications:'APEDA, Phytosanitary, COO',shelf_life:'24 months',storage:'Cool, Dry Place',description:'Extra-long grain with non-sticky texture and rich golden aroma. Most popular variety for the Gulf market. Grain length 8.35mm+.',img:'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',active:true},
  {id:'p002',category_id:'basmati',name:'1121 Steam Basmati Rice',moq_india:'1–10 MT',moq_export:'25 MT / 1 FCL',form:'Steam',grade:'Premium',origin:'Punjab, Haryana',packing:'5kg, 10kg, 25kg, 50kg PP',certifications:'APEDA, Phytosanitary, COO',shelf_life:'24 months',storage:'Cool, Dry Place',description:'Partially steamed, easy to cook, non-sticky. Widely used in restaurants across the Middle East.',img:'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=600&q=80',active:true},
  {id:'p003',category_id:'basmati',name:'1121 Raw White Basmati Rice',moq_india:'1–10 MT',moq_export:'25 MT / 1 FCL',form:'Raw',grade:'Premium White',origin:'Punjab, Haryana',packing:'5kg, 10kg, 25kg, 50kg PP',certifications:'APEDA, Phytosanitary, COO',shelf_life:'24 months',storage:'Cool, Dry Place',description:'Snow-white extra-long grain. Ideal for biryani. Exported to Europe and North America.',img:'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',active:true},
  {id:'p004',category_id:'basmati',name:'Pusa 1509 Basmati Rice',moq_india:'1–10 MT',moq_export:'25 MT / 1 FCL',form:'Raw / Sella',grade:'Premium',origin:'Haryana, Punjab',packing:'5kg, 10kg, 25kg, 50kg PP',certifications:'APEDA, Phytosanitary',shelf_life:'24 months',storage:'Cool, Dry Place',description:'Popular for fragrance, length and affordability. Cooks in 15 minutes. High demand in domestic and export markets.',img:'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',active:true},
  {id:'p005',category_id:'basmati',name:'386 Creamy Sella Basmati Rice',moq_india:'1–10 MT',moq_export:'25 MT / 1 FCL',form:'Creamy Sella',grade:'A Grade',origin:'Punjab, Haryana',packing:'5kg, 25kg, 50kg PP',certifications:'APEDA, Phytosanitary',shelf_life:'24 months',storage:'Cool, Dry Place',description:'Cream-coloured sella variety. Long grain with pleasant aroma. Budget-friendly export option popular in Africa and Middle East.',img:'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',active:true},
  {id:'p006',category_id:'basmati',name:'Sugandha Basmati Rice',moq_india:'1–10 MT',moq_export:'20 MT / 1 FCL',form:'Raw / Sella / Steam',grade:'Premium',origin:'UP, Uttarakhand',packing:'5kg, 25kg, 50kg PP',certifications:'APEDA, Phytosanitary',shelf_life:'24 months',storage:'Cool, Dry Place',description:'Fine-grained aromatic variety with sweet fragrance. Popular in South Asian diaspora markets in UK, USA and Canada.',img:'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',active:true},
  {id:'p007',category_id:'basmati',name:'Sharbati Basmati Rice (Sehore)',moq_india:'5–20 MT',moq_export:'20 MT / 1 FCL',form:'Raw',grade:'Premium',origin:'Madhya Pradesh (Sehore)',packing:'5kg, 25kg, 50kg PP',certifications:'APEDA, Phytosanitary',shelf_life:'24 months',storage:'Cool, Dry Place',description:'Famous Sehore Sharbati — thin, long and naturally sweet. Gaining popularity in premium export markets.',img:'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',active:true},
  // NON BASMATI
  {id:'p008',category_id:'nonbasmati',name:'IR 64 Parboiled Rice',moq_india:'5–20 MT',moq_export:'20 MT / 1 FCL',form:'Parboiled',grade:'A Grade',origin:'Andhra Pradesh, Odisha',packing:'25kg, 50kg PP/Jute',certifications:'APEDA, Phytosanitary',shelf_life:'18 months',storage:'Cool, Dry Place',description:'Pre-gelatinized for extra nutrients. Most exported non-basmati variety. Huge demand across Sub-Saharan Africa and South Asia.',img:'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&q=80',active:true},
  {id:'p009',category_id:'nonbasmati',name:'Sona Masoori Rice',moq_india:'5–10 MT',moq_export:'20 MT / 1 FCL',form:'Raw',grade:'Premium',origin:'Andhra Pradesh, Karnataka',packing:'5kg, 10kg, 25kg, 50kg',certifications:'APEDA, Phytosanitary',shelf_life:'18 months',storage:'Cool, Dry Place',description:'Lightweight, aromatic, low starch. Preferred by South Asian diaspora in USA, UK and Australia.',img:'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&q=80',active:true},
  {id:'p010',category_id:'nonbasmati',name:'Swarna (MTU-7029) Parboiled Rice',moq_india:'10–25 MT',moq_export:'25 MT / 1 FCL',form:'Parboiled',grade:'A Grade',origin:'Andhra Pradesh, Telangana',packing:'25kg, 50kg PP',certifications:'APEDA, Phytosanitary',shelf_life:'18 months',storage:'Cool, Dry Place',description:'High-yielding medium grain. Very popular in Africa. Excellent post-cooking texture and grain separation.',img:'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&q=80',active:true},
  {id:'p011',category_id:'nonbasmati',name:'HMT Rice (Jeerakasala)',moq_india:'5–10 MT',moq_export:'15 MT',form:'Raw',grade:'Premium',origin:'Karnataka, Kerala',packing:'5kg, 10kg, 25kg',certifications:'APEDA, Phytosanitary',shelf_life:'18 months',storage:'Cool, Dry Place',description:'Short grain aromatic variety used in biryanis in South India. Gaining export demand in Middle East.',img:'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&q=80',active:true},
  {id:'p012',category_id:'nonbasmati',name:'Ponni Raw Rice',moq_india:'5–10 MT',moq_export:'15 MT',form:'Raw',grade:'A Grade',origin:'Tamil Nadu',packing:'5kg, 10kg, 25kg, 50kg',certifications:'APEDA, Phytosanitary',shelf_life:'18 months',storage:'Cool, Dry Place',description:'South Indian staple. Short fat grain. High demand among Tamil diaspora globally.',img:'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&q=80',active:true},
  // PULSES
  {id:'p013',category_id:'pulses',name:'Toor Dal (Split Pigeon Peas)',moq_india:'1–5 MT',moq_export:'10 MT',form:'Split, Dehusked',grade:'A Grade',origin:'Maharashtra, Gujarat, Karnataka',packing:'1kg, 5kg, 25kg, 50kg PP',certifications:'FSSAI, Phytosanitary',shelf_life:'18 months',storage:'Cool, Dry Place',description:"India's most consumed dal. 22% protein content. Exported to USA, UK, UAE and East Africa.",img:'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&q=80',active:true},
  {id:'p014',category_id:'pulses',name:'Masoor Dal (Red Lentils)',moq_india:'1–5 MT',moq_export:'10 MT',form:'Whole / Split',grade:'A Grade',origin:'Madhya Pradesh, UP, Bihar',packing:'1kg, 5kg, 25kg, 50kg PP',certifications:'FSSAI, Phytosanitary',shelf_life:'18 months',storage:'Cool, Dry Place',description:'Quick-cooking, high protein, nutty flavour. Widely exported to UK, Canada, UAE and Europe.',img:'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&q=80',active:true},
  {id:'p015',category_id:'pulses',name:'Chana Dal (Split Bengal Gram)',moq_india:'1–5 MT',moq_export:'10 MT',form:'Split, Dehusked',grade:'A Grade',origin:'Rajasthan, Madhya Pradesh',packing:'1kg, 5kg, 25kg, 50kg PP',certifications:'FSSAI, Phytosanitary',shelf_life:'18 months',storage:'Cool, Dry Place',description:'Nutty earthy flavour. Used in curries and sweets. High fibre and protein. Popular across Middle East and Europe.',img:'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&q=80',active:true},
  {id:'p016',category_id:'pulses',name:'Moong Dal (Split Green Gram)',moq_india:'1–5 MT',moq_export:'5 MT',form:'Split, Dehusked',grade:'A Grade',origin:'Rajasthan, Maharashtra, AP',packing:'1kg, 5kg, 25kg, 50kg PP',certifications:'FSSAI, Phytosanitary',shelf_life:'18 months',storage:'Cool, Dry Place',description:'Easiest to digest. Baby food and diet food base. High demand in Southeast Asia, Middle East and USA.',img:'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&q=80',active:true},
  {id:'p017',category_id:'pulses',name:'Urad Dal (Black Gram)',moq_india:'1–5 MT',moq_export:'5 MT',form:'Split / Whole',grade:'A Grade',origin:'Madhya Pradesh, Rajasthan',packing:'1kg, 5kg, 25kg, 50kg PP',certifications:'FSSAI, Phytosanitary',shelf_life:'18 months',storage:'Cool, Dry Place',description:'Essential for idli, dosa batter. High protein — 26g per 100g. Strong demand across South Asian diaspora worldwide.',img:'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&q=80',active:true},
  {id:'p018',category_id:'pulses',name:'Kabuli Chickpeas (White)',moq_india:'2–10 MT',moq_export:'10 MT',form:'Whole, Dried',grade:'42/44 Count',origin:'Rajasthan, Madhya Pradesh',packing:'25kg, 50kg PP/Jute',certifications:'FSSAI, Phytosanitary',shelf_life:'24 months',storage:'Cool, Dry Place',description:'Large white kabuli chickpeas. Used in hummus, curries, salads. Major export to Middle East, Europe and North America.',img:'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&q=80',active:true},
  // WHOLE SPICES
  {id:'p019',category_id:'wholespices',name:'Black Pepper (Whole)',moq_india:'500 kg',moq_export:'1 MT',form:'Whole Seeds',grade:'FAQ / Bold 550g/L+',origin:'Kerala (Wayanad, Idukki)',packing:'25kg, 50kg PP',certifications:'Spices Board India, APEDA',shelf_life:'24 months',storage:'Cool, Dry, Away from Sunlight',description:'King of Spices. 5.5%+ piperine content. Kerala black pepper globally renowned for sharp aroma and heat.',img:'https://images.unsplash.com/photo-1599909631628-cbb61e600827?w=600&q=80',active:true},
  {id:'p020',category_id:'wholespices',name:'Turmeric Finger (Whole)',moq_india:'1 MT',moq_export:'5 MT',form:'Dry Finger / Bulb',grade:'Erode / Salem',origin:'Andhra Pradesh, Maharashtra, Tamil Nadu',packing:'25kg, 50kg Jute',certifications:'Spices Board India, APEDA',shelf_life:'12 months',storage:'Cool, Dry Place',description:'3–5% curcumin content. Used in cooking, cosmetics, Ayurveda and nutraceuticals. India supplies 80% of global turmeric.',img:'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&q=80',active:true},
  {id:'p021',category_id:'wholespices',name:'Dry Red Chilli (Whole)',moq_india:'1 MT',moq_export:'5 MT',form:'Whole Dry',grade:'Teja / Sannam / Byadagi',origin:'Andhra Pradesh, Telangana',packing:'25kg, 50kg PP/Jute',certifications:'Spices Board India, APEDA',shelf_life:'12 months',storage:'Cool, Dry Place',description:'Teja, Sannam, Byadagi varieties. ASTA colour 80–180. Exported to UAE, USA, UK, Bangladesh and Southeast Asia.',img:'https://images.unsplash.com/photo-1526346698789-22fd84314424?w=600&q=80',active:true},
  {id:'p022',category_id:'wholespices',name:'Green Cardamom (Elaichi)',moq_india:'100 kg',moq_export:'500 kg',form:'Whole Pods',grade:'Bold 7mm+',origin:'Kerala, Karnataka (Coorg)',packing:'10kg, 25kg Cartons',certifications:'Spices Board India',shelf_life:'18 months',storage:'Cool, Dry, Airtight',description:'Queen of Spices. Intense sweet-spicy aroma. 7mm+ bold grade. Premium demand in Middle East for tea and confectionery.',img:'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=600&q=80',active:true},
  {id:'p023',category_id:'wholespices',name:'Cumin Seeds (Jeera)',moq_india:'1 MT',moq_export:'5 MT',form:'Whole Seeds',grade:'99% Pure Double Cleaned',origin:'Rajasthan, Gujarat',packing:'25kg, 50kg PP',certifications:'Spices Board India, APEDA',shelf_life:'24 months',storage:'Cool, Dry Place',description:'High volatile oil 2.5%+. India supplies 70% of global cumin. Earthy warm flavour. Double-cleaned, machine-sorted.',img:'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=600&q=80',active:true},
  {id:'p024',category_id:'wholespices',name:'Coriander Seeds (Dhaniya)',moq_india:'1 MT',moq_export:'5 MT',form:'Whole Seeds',grade:'Eagle / Scooter',origin:'Rajasthan, Madhya Pradesh',packing:'25kg, 50kg PP/Jute',certifications:'Spices Board India',shelf_life:'24 months',storage:'Cool, Dry Place',description:'Two grades: Eagle (large round) and Scooter (small elongated). Citrusy warm flavour. Widely exported.',img:'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=600&q=80',active:true},
  {id:'p025',category_id:'wholespices',name:'Fennel Seeds (Saunf)',moq_india:'1 MT',moq_export:'3 MT',form:'Whole Seeds',grade:'Lucknow / Gujarat',origin:'Gujarat, Rajasthan, UP',packing:'25kg, 50kg PP',certifications:'Spices Board India',shelf_life:'18 months',storage:'Cool, Dry Place',description:'Sweet anise-like flavour. Digestive properties. Exported to Europe, Middle East and North America.',img:'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=600&q=80',active:true},
  {id:'p026',category_id:'wholespices',name:'Cloves (Laung)',moq_india:'100 kg',moq_export:'500 kg',form:'Whole Dried Buds',grade:'Handpicked Premium',origin:'Kerala, Karnataka, Tamil Nadu',packing:'10kg, 25kg Cartons',certifications:'Spices Board India',shelf_life:'24 months',storage:'Cool, Dry, Airtight',description:'High eugenol 14–19%. Intense warm-spicy aroma. Used in cooking, oral care and pharmaceuticals globally.',img:'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=600&q=80',active:true},
  {id:'p027',category_id:'wholespices',name:'Cinnamon Sticks (Dalchini)',moq_india:'500 kg',moq_export:'2 MT',form:'Rolled Sticks',grade:'Ceylon / Cassia',origin:'Kerala, Karnataka',packing:'15kg, 25kg Cartons',certifications:'Spices Board India',shelf_life:'24 months',storage:'Cool, Dry Place',description:'Warm sweet spice. Ceylon (true cinnamon) and Cassia varieties. Wide use in baking, beverages and curries.',img:'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=600&q=80',active:true},
  // GROUNDED SPICES
  {id:'p028',category_id:'groundspices',name:'Red Chilli Powder',moq_india:'1 MT',moq_export:'1 MT',form:'Fine Powder',grade:'Extra Hot / Mild / Kashmiri',origin:'Andhra Pradesh, Rajasthan',packing:'1kg, 5kg, 25kg, 50kg PP',certifications:'FSSAI, Spices Board India',shelf_life:'18 months',storage:'Cool, Dry Place',description:'ASTA colour 80–160+. Hot, medium and mild grades available. Custom heat level and colour on request.',img:'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',active:true},
  {id:'p029',category_id:'groundspices',name:'Turmeric Powder',moq_india:'1 MT',moq_export:'1 MT',form:'Fine Powder',grade:'High Curcumin 3–5%',origin:'Andhra Pradesh, Maharashtra',packing:'1kg, 5kg, 25kg PP',certifications:'FSSAI, Spices Board India',shelf_life:'18 months',storage:'Cool, Dry Place',description:'Bright yellow, 3–5% curcumin. Used in food, cosmetics and nutraceuticals globally. ISO 22000 facility.',img:'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&q=80',active:true},
  {id:'p030',category_id:'groundspices',name:'Cumin Powder (Jeera Powder)',moq_india:'500 kg',moq_export:'1 MT',form:'Fine Powder',grade:'Premium',origin:'Rajasthan, Gujarat',packing:'1kg, 5kg, 25kg PP',certifications:'FSSAI, Spices Board India',shelf_life:'18 months',storage:'Cool, Dry Place',description:'Freshly ground cumin with retained aroma. High volatile oil. Widely used in Middle Eastern and Indian cuisines.',img:'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',active:true},
  {id:'p031',category_id:'groundspices',name:'Coriander Powder (Dhaniya Powder)',moq_india:'500 kg',moq_export:'1 MT',form:'Fine Powder',grade:'Premium',origin:'Rajasthan, Madhya Pradesh',packing:'1kg, 5kg, 25kg PP',certifications:'FSSAI, Spices Board India',shelf_life:'18 months',storage:'Cool, Dry Place',description:'Mildly spicy, citrusy flavour. Freshly ground. Base ingredient in most Indian masalas.',img:'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',active:true},
  {id:'p032',category_id:'groundspices',name:'Garam Masala Powder',moq_india:'500 kg',moq_export:'1 MT',form:'Blended Powder',grade:'Premium Blend',origin:'Multi-state blend',packing:'100g, 500g, 1kg, 5kg, 25kg PP',certifications:'FSSAI, ISO 22000',shelf_life:'18 months',storage:'Cool, Dry Place',description:'Proprietary blend of 12+ spices. Rich warming flavour. Custom recipe formulation for private label buyers.',img:'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',active:true},
  {id:'p033',category_id:'groundspices',name:'Black Pepper Powder',moq_india:'500 kg',moq_export:'1 MT',form:'Fine Powder',grade:'Premium',origin:'Kerala',packing:'1kg, 5kg, 25kg PP',certifications:'FSSAI, Spices Board India',shelf_life:'18 months',storage:'Cool, Dry Place',description:'Freshly milled from clean Kerala pepper. 5%+ piperine. Sharp pungent flavour for food and pharma.',img:'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',active:true},
  // FRESH FRUITS
  {id:'p034',category_id:'freshfruits',name:'Fresh Mango (Alphonso / Kesar)',moq_india:'1 MT',moq_export:'5 MT',form:'Fresh',grade:'A Grade Premium',origin:'Maharashtra (Ratnagiri), Gujarat',packing:'3kg, 5kg Cartons / Gift Boxes',certifications:'APEDA, Phytosanitary, Irradiation',shelf_life:'2–3 weeks',storage:'8–12°C Refrigeration',description:"Alphonso and Kesar — world's finest mangoes. Deep orange, sweet, fibre-free pulp. Exported to USA, UK, UAE, Canada and Australia.",img:'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&q=80',active:true},
  {id:'p035',category_id:'freshfruits',name:'Fresh Pomegranate (Bhagwa)',moq_india:'2 MT',moq_export:'10 MT',form:'Fresh',grade:'Super A / A Grade',origin:'Maharashtra (Solapur, Sangli)',packing:'3kg, 5kg Export Cartons',certifications:'GlobalGAP, APEDA, Phytosanitary',shelf_life:'3–4 weeks',storage:'5–8°C Refrigeration',description:'Bhagwa variety — deep red arils, sweet-tart taste. India is top global pomegranate exporter.',img:'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&q=80',active:true},
  {id:'p036',category_id:'freshfruits',name:'Fresh Banana (Cavendish / Robusta)',moq_india:'5 MT',moq_export:'20 MT',form:'Fresh',grade:'A Grade',origin:'Maharashtra, Gujarat, Andhra Pradesh',packing:'13kg Carton / Cluster',certifications:'APEDA, Phytosanitary',shelf_life:'10–14 days',storage:'13–15°C',description:'Cavendish and Robusta varieties. Consistent size and colour. High demand in Gulf countries and Southeast Asia.',img:'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&q=80',active:true},
  {id:'p037',category_id:'freshfruits',name:'Fresh Grapes (Thompson Seedless)',moq_india:'2 MT',moq_export:'10 MT',form:'Fresh',grade:'A Grade Premium',origin:'Maharashtra (Nashik, Sangli)',packing:'4.5kg–9kg Export Cartons',certifications:'GlobalGAP, APEDA, Phytosanitary',shelf_life:'3–4 weeks',storage:'0–1°C',description:'Seedless Thompson and Sharad varieties. India is major exporter to EU. Large berry, high BRIX content.',img:'https://images.unsplash.com/photo-1423483641154-5411ec9c0ddf?w=600&q=80',active:true},
  {id:'p038',category_id:'freshfruits',name:'Fresh Guava (Allahabad Safeda)',moq_india:'2 MT',moq_export:'5 MT',form:'Fresh',grade:'A Grade',origin:'Allahabad UP, Andhra Pradesh',packing:'3kg, 5kg Cartons',certifications:'APEDA, Phytosanitary',shelf_life:'7–10 days',storage:'5–10°C',description:'Rich in Vitamin C — 4x more than oranges. White-fleshed Safeda variety preferred globally.',img:'https://images.unsplash.com/photo-1536064479547-7ee40b74b807?w=600&q=80',active:true},
  {id:'p039',category_id:'freshfruits',name:'Fresh Lemon (Seedless)',moq_india:'2 MT',moq_export:'5 MT',form:'Fresh',grade:'A Grade',origin:'Gujarat, Maharashtra, Andhra Pradesh',packing:'5kg, 10kg, 20kg Cartons',certifications:'APEDA, Phytosanitary',shelf_life:'3–4 weeks',storage:'8–10°C',description:'Thin-skinned, highly juicy seedless variety. High ascorbic acid. Exported to Middle East, Europe and Southeast Asia.',img:'https://images.unsplash.com/photo-1587131782738-de30ea91a542?w=600&q=80',active:true},
  {id:'p040',category_id:'freshfruits',name:'Fresh Coconut (Brown / Green)',moq_india:'5 MT',moq_export:'20 MT',form:'Fresh Mature / Tender',grade:'A Grade',origin:'Kerala, Tamil Nadu, Karnataka',packing:'50 / 100 pcs Mesh Bags',certifications:'APEDA, Phytosanitary',shelf_life:'3–4 months (brown)',storage:'Cool, Ventilated',description:'Brown mature and green tender coconuts. India is top coconut producer. Exported to Middle East and Europe.',img:'https://images.unsplash.com/photo-1560806175-b9a75d8bb7bc?w=600&q=80',active:true},
  // FRESH VEGETABLES
  {id:'p041',category_id:'freshveg',name:'Fresh Red Onion',moq_india:'5–20 MT',moq_export:'25 MT / 1 FCL',form:'Fresh Bulb',grade:'A Grade Medium/Large',origin:'Nashik, Maharashtra',packing:'20kg, 25kg, 50kg Net/Jute',certifications:'APEDA, Phytosanitary',shelf_life:'4–8 weeks',storage:'Cool, Well-Ventilated',description:'Nashik Red and S-34 varieties. India is top global exporter. Sharp flavour. Exported to SE Asia, Middle East and Europe.',img:'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&q=80',active:true},
  {id:'p042',category_id:'freshveg',name:'Fresh White Garlic',moq_india:'1–5 MT',moq_export:'10 MT',form:'Fresh Bulb',grade:'A Grade, Bold Cloves',origin:'Gujarat (Gondal), Madhya Pradesh',packing:'500g, 1kg, 5kg, 20kg PP/Boxes',certifications:'APEDA, Phytosanitary',shelf_life:'4–6 months',storage:'Cool, Dry, Ventilated',description:'Bold cloves with high allicin content. Gondal garlic preferred across Southeast Asia, Middle East and Europe.',img:'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=600&q=80',active:true},
  {id:'p043',category_id:'freshveg',name:'Fresh Ginger',moq_india:'1–5 MT',moq_export:'5 MT',form:'Fresh Rhizome',grade:'A Grade, Clean',origin:'Kerala, Karnataka, Himachal Pradesh',packing:'10kg, 20kg Cartons/Jute',certifications:'APEDA, Phytosanitary',shelf_life:'2–3 months',storage:'Cool, Dry Place',description:'Pungent, aromatic. High gingerol content. Used in food, beverages, pharmaceuticals and cosmetics globally.',img:'https://images.unsplash.com/photo-1615485291218-c0cd2d0ff0bb?w=600&q=80',active:true},
  {id:'p044',category_id:'freshveg',name:'Fresh Potato',moq_india:'5–20 MT',moq_export:'25 MT / 1 FCL',form:'Fresh',grade:'A Grade',origin:'UP, West Bengal, Punjab',packing:'25kg, 50kg Jute/Net',certifications:'APEDA, Phytosanitary',shelf_life:'3–6 months',storage:'8–12°C Cool Storage',description:'Kufri Jyoti and Kufri Chipsona varieties. India is world top potato producer. Exported to Middle East and Southeast Asia.',img:'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&q=80',active:true},
  {id:'p045',category_id:'freshveg',name:'Fresh Tomato',moq_india:'2–10 MT',moq_export:'10 MT',form:'Fresh',grade:'A Grade',origin:'Maharashtra, Karnataka, Andhra Pradesh',packing:'10kg, 15kg Export Cartons',certifications:'APEDA, Phytosanitary',shelf_life:'7–14 days',storage:'10–12°C',description:'Fresh, firm tomatoes with long shelf life. High lycopene content. Available year-round from multiple growing regions.',img:'https://images.unsplash.com/photo-1558818498-28c1e002b655?w=600&q=80',active:true},
  {id:'p046',category_id:'freshveg',name:'Fresh Green Chilli',moq_india:'1–5 MT',moq_export:'5 MT',form:'Fresh',grade:'A Grade',origin:'Andhra Pradesh, Maharashtra',packing:'5kg, 10kg Cartons/PP',certifications:'APEDA, Phytosanitary',shelf_life:'7–10 days',storage:'7–10°C',description:'Pungent to mild varieties available. High capsaicin content. High demand in Middle East, UK and USA.',img:'https://images.unsplash.com/photo-1526346698789-22fd84314424?w=600&q=80',active:true},
  {id:'p047',category_id:'freshveg',name:'Fresh Okra (Bhindi / Lady Finger)',moq_india:'1–5 MT',moq_export:'5 MT',form:'Fresh',grade:'A Grade, Tender',origin:'Maharashtra, Gujarat, Punjab',packing:'5kg, 10kg Cartons',certifications:'APEDA, Phytosanitary',shelf_life:'5–7 days',storage:'10–12°C',description:'Tender fresh okra. High demand in Middle East, UK and USA. Rich in fibre and Vitamin C.',img:'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80',active:true},
  {id:'p048',category_id:'freshveg',name:'Bitter Gourd (Karela)',moq_india:'1–2 MT',moq_export:'3 MT',form:'Fresh',grade:'A Grade',origin:'Maharashtra, Rajasthan, Andhra Pradesh',packing:'5kg, 10kg Cartons',certifications:'APEDA, Phytosanitary',shelf_life:'5–7 days',storage:'10–12°C',description:'Medicinal vegetable used in diabetes management. High demand in UK, USA, UAE among South Asian diaspora.',img:'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80',active:true},
  // DAIRY
  {id:'p049',category_id:'dairy',name:'Pure Cow Ghee (Desi A2)',moq_india:'500 kg',moq_export:'1 MT',form:'Clarified Butter Fat',grade:'Premium A2',origin:'Rajasthan (Gir Cow), Gujarat',packing:'200ml, 500ml, 1L Tins; 15kg Drums',certifications:'FSSAI, ISO 22000, Halal, Kosher',shelf_life:'12 months',storage:'Cool, Dry Place',description:'A2 Gir cow ghee available. Deep golden, nutty aroma. Growing demand in USA, Europe and Middle East for Ayurvedic health.',img:'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80',active:true},
  {id:'p050',category_id:'dairy',name:'Buffalo Ghee',moq_india:'500 kg',moq_export:'1 MT',form:'Clarified Butter Fat',grade:'Premium',origin:'Punjab, Haryana, UP',packing:'200ml, 500ml, 1L Tins; 15kg Drums',certifications:'FSSAI, ISO 22000, Halal',shelf_life:'12 months',storage:'Cool, Dry Place',description:'Higher fat content than cow ghee. White to pale yellow colour. Rich texture. Popular in Gulf countries.',img:'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80',active:true},
  {id:'p051',category_id:'dairy',name:'Indian Paneer (Cottage Cheese)',moq_india:'500 kg',moq_export:'1 MT',form:'Frozen / Fresh',grade:'Premium',origin:'Punjab, Haryana',packing:'200g, 500g, 1kg Vacuum Packs',certifications:'FSSAI, ISO 22000, Halal',shelf_life:'6 months frozen',storage:'Frozen -18°C / Chilled 4°C',description:'Fresh-pressed cow milk paneer. Soft, firm texture. Ideal for curries. High demand in UK, Canada and UAE.',img:'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80',active:true},
  {id:'p052',category_id:'dairy',name:'Unsalted White Butter',moq_india:'500 kg',moq_export:'1 MT',form:'Solid Block',grade:'Premium',origin:'Punjab, Haryana, Maharashtra',packing:'500g, 1kg, 5kg, 25kg Blocks',certifications:'FSSAI, ISO 22000, Halal',shelf_life:'12 months frozen',storage:'Frozen -18°C',description:'Pure cow/buffalo milk butter. 80%+ fat. Used in bakeries, confectionery and cooking across Middle East and Europe.',img:'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80',active:true},
  {id:'p053',category_id:'dairy',name:'Full Cream Milk Powder (FCMP)',moq_india:'1 MT',moq_export:'5 MT',form:'Spray-Dried Powder',grade:'25% Fat+',origin:'Rajasthan, Gujarat, UP',packing:'25kg Multi-layer PP Bags',certifications:'FSSAI, ISO 22000, Halal, Codex',shelf_life:'24 months',storage:'Cool, Dry Place',description:'Full cream spray-dried milk powder. Used in bakery, chocolate and infant food. Exported to Africa and Middle East.',img:'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80',active:true},
  {id:'p054',category_id:'dairy',name:'Skimmed Milk Powder (SMP)',moq_india:'1 MT',moq_export:'5 MT',form:'Spray-Dried Powder',grade:'1.25% Fat Max',origin:'Rajasthan, Gujarat',packing:'25kg Multi-layer PP Bags',certifications:'FSSAI, ISO 22000, Halal, Codex',shelf_life:'24 months',storage:'Cool, Dry Place',description:'Low-fat skim milk powder. Used in yogurt, cheese, ice cream and pharma. Exported to SE Asia, Africa and Gulf.',img:'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80',active:true},
  // CANNED
  {id:'p055',category_id:'canned',name:'Alphonso Mango Pulp (Canned)',moq_india:'1 MT',moq_export:'5 MT',form:'Canned Pulp',grade:'Premium Alphonso',origin:'Maharashtra (Ratnagiri)',packing:'850g, 3.1kg Cans; 210g Pouches',certifications:'FSSAI, BRC, Halal, APEDA',shelf_life:'24 months',storage:'Room Temperature',description:'100% pure Alphonso mango pulp. Deep orange, sweet, fibre-free. Used in juices, ice cream and desserts.',img:'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&q=80',active:true},
  {id:'p056',category_id:'canned',name:'Tomato Puree (Canned)',moq_india:'1 MT',moq_export:'3 MT',form:'Canned Puree',grade:'Premium',origin:'Maharashtra, Karnataka',packing:'400g, 800g, 3kg Cans',certifications:'FSSAI, BRC, ISO 22000',shelf_life:'24 months',storage:'Room Temperature',description:'Concentrated tomato puree. Brix 28–30. Used in sauces, soups and ready meals.',img:'https://images.unsplash.com/photo-1558818498-28c1e002b655?w=600&q=80',active:true},
  {id:'p057',category_id:'canned',name:'Canned Chickpeas (Kabuli)',moq_india:'500 kg',moq_export:'2 MT',form:'Cooked, Canned',grade:'Premium',origin:'India',packing:'400g, 800g Cans',certifications:'FSSAI, BRC, Halal',shelf_life:'36 months',storage:'Room Temperature',description:'Pre-cooked ready-to-eat chickpeas in brine. Used in hummus, salads and curries. High demand in Middle East and Europe.',img:'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600&q=80',active:true},
  {id:'p058',category_id:'canned',name:'Coconut Milk (Canned)',moq_india:'500 kg',moq_export:'2 MT',form:'Canned Liquid',grade:'Premium Full-Fat',origin:'Kerala, Tamil Nadu',packing:'165ml, 400ml, 1L Cans',certifications:'FSSAI, BRC, Halal, Organic available',shelf_life:'24 months',storage:'Room Temperature',description:'Creamy full-fat coconut milk. 17–19% fat. Used in curries, smoothies and dairy-free products.',img:'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600&q=80',active:true},
  // FLOUR
  {id:'p059',category_id:'flour',name:'Whole Wheat Atta (Chakki Ground)',moq_india:'1–5 MT',moq_export:'5 MT',form:'Stone/Chakki Ground',grade:'Premium',origin:'Punjab, Rajasthan, Haryana',packing:'1kg, 2kg, 5kg, 10kg, 25kg PP',certifications:'FSSAI, Halal',shelf_life:'6 months',storage:'Cool, Dry Place',description:'100% whole wheat chakki-ground atta. Retains bran and germ. Ideal for chapati, roti, paratha. High demand in diaspora markets.',img:'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80',active:true},
  {id:'p060',category_id:'flour',name:'Maida (Refined Wheat Flour)',moq_india:'1–5 MT',moq_export:'5 MT',form:'Fine Milled',grade:'A Grade',origin:'Punjab, Haryana, UP',packing:'1kg, 5kg, 10kg, 25kg, 50kg PP',certifications:'FSSAI, Halal',shelf_life:'6 months',storage:'Cool, Dry Place',description:'Super-refined wheat flour. Used in bakeries, noodles, confectionery and snacks. High gluten content.',img:'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80',active:true},
  {id:'p061',category_id:'flour',name:'Besan (Gram / Chickpea Flour)',moq_india:'1–3 MT',moq_export:'3 MT',form:'Milled Powder',grade:'Premium',origin:'Rajasthan, Madhya Pradesh',packing:'1kg, 5kg, 25kg, 50kg PP',certifications:'FSSAI, Halal',shelf_life:'9 months',storage:'Cool, Dry Place',description:'Gluten-free chickpea flour. Used in pakoras, kadhi, sweets and as protein supplement. High demand globally.',img:'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80',active:true},
  {id:'p062',category_id:'flour',name:'Semolina (Suji / Rava)',moq_india:'1–3 MT',moq_export:'3 MT',form:'Coarse Ground',grade:'Fine / Coarse',origin:'Punjab, Haryana, UP',packing:'1kg, 5kg, 25kg, 50kg PP',certifications:'FSSAI, Halal',shelf_life:'9 months',storage:'Cool, Dry Place',description:'Durum or bread wheat semolina. Used in upma, halwa, pasta and couscous. Fine and coarse grades available.',img:'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80',active:true},
  {id:'p063',category_id:'flour',name:'Corn Flour (Maize Starch)',moq_india:'1–3 MT',moq_export:'3 MT',form:'Fine White Powder',grade:'Food Grade',origin:'Maharashtra, Karnataka, Bihar',packing:'500g, 1kg, 25kg, 50kg PP',certifications:'FSSAI, Halal',shelf_life:'24 months',storage:'Cool, Dry Place',description:'Pure maize starch. Thickening agent for soups, sauces and gravies. Gluten-free. Used in food processing and pharma.',img:'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80',active:true},
  // BAKERY
  {id:'p064',category_id:'bakery',name:'Marie Biscuits (Export Pack)',moq_india:'500 kg',moq_export:'1 MT',form:'Baked Biscuit',grade:'Export Quality',origin:'Maharashtra, Gujarat',packing:'100g, 200g, 400g Retail; Master Carton',certifications:'FSSAI, ISO 22000, Halal',shelf_life:'9 months',storage:'Cool, Dry Place',description:'Light crispy marie biscuits. Perfect with tea. Popular across Africa, Middle East and South Asia. Private label available.',img:'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80',active:true},
  {id:'p065',category_id:'bakery',name:'Digestive Biscuits (Whole Wheat)',moq_india:'500 kg',moq_export:'1 MT',form:'Baked Biscuit',grade:'Export Quality',origin:'Maharashtra, Gujarat',packing:'100g, 200g, 400g Retail; Master Carton',certifications:'FSSAI, ISO 22000, Halal',shelf_life:'9 months',storage:'Cool, Dry Place',description:'High-fibre digestive biscuits. Semi-sweet, crumbly texture. Growing health-food export demand.',img:'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80',active:true},
  {id:'p066',category_id:'bakery',name:'Rusk / Toast (Wheat)',moq_india:'500 kg',moq_export:'1 MT',form:'Double-Baked',grade:'Export Quality',origin:'Maharashtra, UP',packing:'250g, 400g Retail; Master Carton',certifications:'FSSAI, ISO 22000, Halal',shelf_life:'12 months',storage:'Cool, Dry Place',description:'Double-baked crispy rusk. Classic Indian tea-time snack. Massive demand among South Asian diaspora globally.',img:'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80',active:true},
  {id:'p067',category_id:'bakery',name:'Cream Crackers',moq_india:'500 kg',moq_export:'1 MT',form:'Baked Cracker',grade:'Export Quality',origin:'Maharashtra, Gujarat',packing:'200g, 400g Retail; Master Carton',certifications:'FSSAI, ISO 22000, Halal',shelf_life:'9 months',storage:'Cool, Dry Place',description:'Light flaky cream crackers. Low sugar, high crunch. Popular in Africa and Middle East. Private label available.',img:'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80',active:true},
  // EDIBLE OIL
  {id:'p068',category_id:'edibleoil',name:'Refined Sunflower Oil',moq_india:'1–5 MT',moq_export:'5 MT',form:'Refined Oil',grade:'RBD Premium',origin:'Maharashtra, Karnataka',packing:'1L, 2L, 5L PET/Tin; 15kg, 200kg Tin',certifications:'FSSAI, ISO 22000, Halal',shelf_life:'18 months',storage:'Cool, Dry, Away from Light',description:'Light colour, neutral taste. High in Vitamin E. Most popular cooking oil globally. Exported to Africa and Middle East.',img:'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80',active:true},
  {id:'p069',category_id:'edibleoil',name:'Cold-Pressed Groundnut Oil',moq_india:'1–5 MT',moq_export:'3 MT',form:'Cold-Pressed',grade:'Premium Expeller',origin:'Gujarat, Rajasthan',packing:'500ml, 1L, 5L Glass/PET; 15kg Tin',certifications:'FSSAI, Organic available',shelf_life:'12 months',storage:'Cool, Dark Place',description:'Cold-pressed peanut oil. Rich nutty flavour. High smoke point 230°C. Gaining premium export demand.',img:'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80',active:true},
  {id:'p070',category_id:'edibleoil',name:'Refined Soybean Oil',moq_india:'1–5 MT',moq_export:'5 MT',form:'Refined Oil',grade:'RBD',origin:'Madhya Pradesh, Rajasthan',packing:'1L, 5L PET; 15kg, 200kg Tin',certifications:'FSSAI, ISO 22000, Halal',shelf_life:'18 months',storage:'Cool, Dry Place',description:'Light mild-flavoured soybean oil. High polyunsaturated fats. Widely used in foodservice and food processing.',img:'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80',active:true},
  {id:'p071',category_id:'edibleoil',name:'Virgin Coconut Oil (VCO)',moq_india:'500 kg',moq_export:'1 MT',form:'Cold-Pressed Virgin',grade:'Extra Virgin',origin:'Kerala, Tamil Nadu',packing:'200ml, 500ml, 1L Glass/PET',certifications:'FSSAI, Organic, USDA-NOP, Halal',shelf_life:'24 months',storage:'Cool, Away from Light',description:'Cold-pressed from fresh coconut. No chemicals, no heat. MCT-rich. Growing demand in health/wellness and cosmetics globally.',img:'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80',active:true},
  {id:'p072',category_id:'edibleoil',name:'Kachi Ghani Mustard Oil',moq_india:'1–5 MT',moq_export:'3 MT',form:'Cold-Pressed Kachi Ghani',grade:'Premium',origin:'Rajasthan, Punjab, Haryana',packing:'500ml, 1L, 5L PET/Tins',certifications:'FSSAI, Halal',shelf_life:'12 months',storage:'Cool, Away from Light',description:'Traditional cold-pressed mustard oil. Pungent aroma, high in omega-3. Popular in Bangladesh, Pakistan and South Asian diaspora.',img:'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80',active:true},
  // SESAME
  {id:'p073',category_id:'sesame',name:'Natural White Sesame Seeds',moq_india:'1 MT',moq_export:'5 MT',form:'Natural (Unhulled)',grade:'99% Pure',origin:'Gujarat, Rajasthan, MP',packing:'25kg, 50kg PP',certifications:'APEDA, Spices Board, ISO 22000',shelf_life:'24 months',storage:'Cool, Dry Place',description:'India is top global exporter. 99% purity, machine-cleaned and sorted. Used in food, oil extraction and confectionery.',img:'https://images.unsplash.com/photo-1612187029458-cef1b9a76da2?w=600&q=80',active:true},
  {id:'p074',category_id:'sesame',name:'Hulled White Sesame Seeds',moq_india:'1 MT',moq_export:'5 MT',form:'Hulled (Dehulled)',grade:'99.95% Pure',origin:'Gujarat, Rajasthan',packing:'25kg, 50kg PP',certifications:'APEDA, ISO 22000, Halal, Kosher',shelf_life:'18 months',storage:'Cool, Dry Place',description:'Hull removed. Snow-white colour, mild flavour. Used in tahini, bakery, sushi and confectionery. Premium export grade.',img:'https://images.unsplash.com/photo-1612187029458-cef1b9a76da2?w=600&q=80',active:true},
  {id:'p075',category_id:'sesame',name:'Black Sesame Seeds',moq_india:'1 MT',moq_export:'3 MT',form:'Whole (Unroasted)',grade:'98% Pure',origin:'Gujarat, Rajasthan, MP',packing:'25kg, 50kg PP',certifications:'APEDA, ISO 22000',shelf_life:'24 months',storage:'Cool, Dry Place',description:'Rich nutty flavour with earthy depth. High antioxidants. Used in Asian cuisine, confectionery and ayurvedic supplements.',img:'https://images.unsplash.com/photo-1612187029458-cef1b9a76da2?w=600&q=80',active:true},
  {id:'p076',category_id:'sesame',name:'Roasted Sesame Seeds',moq_india:'500 kg',moq_export:'2 MT',form:'Roasted',grade:'Premium',origin:'Gujarat, Rajasthan',packing:'10kg, 25kg Cartons',certifications:'FSSAI, ISO 22000, Halal',shelf_life:'12 months',storage:'Cool, Dry, Airtight',description:'Freshly roasted. Enhanced nutty aroma. Ready-to-use for bakery, sushi, salads, snacks. Custom roast levels available.',img:'https://images.unsplash.com/photo-1612187029458-cef1b9a76da2?w=600&q=80',active:true},
  // FROZEN SEAFOOD
  {id:'p077',category_id:'seafood',name:'Frozen Vannamei Prawns (White Leg)',moq_india:'500 kg',moq_export:'1 MT',form:'IQF / Block Frozen',grade:'HOSO / HLSO / PD / PUD',origin:'Andhra Pradesh (Farm-raised)',packing:'1kg, 2kg Retail; 10kg Master Carton',certifications:'MPEDA, EU Listed, Halal, HACCP, BAP, ASC',shelf_life:'24 months frozen',storage:'-18°C Frozen',description:'Farm-raised. India is #1 shrimp exporter. All formats available. Sizes 100/200 to U/10. EU, USA and Japan approved.',img:'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&q=80',active:true},
  {id:'p078',category_id:'seafood',name:'Frozen Black Tiger Prawns',moq_india:'500 kg',moq_export:'1 MT',form:'IQF / Block Frozen',grade:'HLSO / PD / PUD',origin:'Andhra Pradesh, West Bengal',packing:'2kg, 5kg Retail; 10kg Master Carton',certifications:'MPEDA, EU Listed, Halal, HACCP',shelf_life:'24 months frozen',storage:'-18°C Frozen',description:'Wild-caught and farm-raised Black Tiger Prawns. Premium species. Sweet firm flesh. High demand in Japan, Europe and USA.',img:'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&q=80',active:true},
  {id:'p079',category_id:'seafood',name:'Frozen Squid (Whole / Cleaned)',moq_india:'500 kg',moq_export:'1 MT',form:'IQF Whole / Cleaned Tubes',grade:'A Grade',origin:'Gujarat, Maharashtra (Wild)',packing:'10kg, 20kg Master Cartons',certifications:'MPEDA, HACCP, EU Listed, Halal',shelf_life:'24 months frozen',storage:'-18°C Frozen',description:'Wild-caught squid. Whole round and cleaned tubes available. Used in calamari, stir-fry and seafood platters.',img:'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&q=80',active:true},
  {id:'p080',category_id:'seafood',name:'Frozen Silver Pomfret',moq_india:'500 kg',moq_export:'1 MT',form:'IQF Whole Round',grade:'Premium Fresh-Frozen',origin:'Gujarat, Maharashtra (Wild)',packing:'1kg, 2kg Retail; 10kg Master Carton',certifications:'MPEDA, HACCP, EU Listed, Halal',shelf_life:'24 months frozen',storage:'-18°C Frozen',description:'Delicate mild-flavoured fish. Silver Pomfret is premium grade. Very high demand in Middle East and Southeast Asia.',img:'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&q=80',active:true},
  {id:'p081',category_id:'seafood',name:'Frozen Cuttlefish (Cleaned)',moq_india:'500 kg',moq_export:'1 MT',form:'IQF Cleaned',grade:'A Grade',origin:'Gujarat, Maharashtra',packing:'10kg, 20kg Master Cartons',certifications:'MPEDA, HACCP, EU Listed',shelf_life:'24 months frozen',storage:'-18°C Frozen',description:'Cleaned and IQF frozen. Tender texture. Used in Mediterranean and Asian cuisines. Exported to EU, Japan and Southeast Asia.',img:'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&q=80',active:true},
  // FROZEN CHICKEN
  {id:'p082',category_id:'chicken',name:'Frozen Whole Chicken (Halal IQF)',moq_india:'1 MT',moq_export:'2 MT',form:'IQF Eviscerated Whole',grade:'Grade A',origin:'India (FSSAI Licensed Plants)',packing:'800g–1.5kg IQF; 10kg, 20kg Cartons',certifications:'FSSAI, Halal, HACCP, BRC',shelf_life:'18 months frozen',storage:'-18°C Frozen',description:'Eviscerated, cleaned, IQF whole chicken. Halal certified. Exported to GCC, Africa and Southeast Asia.',img:'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&q=80',active:true},
  {id:'p083',category_id:'chicken',name:'Frozen Chicken Breast (Boneless)',moq_india:'1 MT',moq_export:'2 MT',form:'Boneless, Skinless IQF',grade:'Grade A',origin:'India',packing:'1kg, 2kg Retail; 10kg, 20kg Master Cartons',certifications:'FSSAI, Halal, HACCP, BRC',shelf_life:'18 months frozen',storage:'-18°C Frozen',description:'Premium boneless skinless chicken breast. IQF individually frozen. Consistent size. High demand in Middle East and Africa.',img:'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&q=80',active:true},
  {id:'p084',category_id:'chicken',name:'Frozen Chicken Legs / Drumsticks',moq_india:'1 MT',moq_export:'2 MT',form:'IQF Legs / Quarters',grade:'Grade A',origin:'India',packing:'1kg, 2kg Retail; 10kg, 20kg Master Cartons',certifications:'FSSAI, Halal, HACCP, BRC',shelf_life:'18 months frozen',storage:'-18°C Frozen',description:'Full leg quarters and drumsticks. IQF. Best price-value ratio. Strong demand across Africa and Middle East.',img:'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&q=80',active:true},
  {id:'p085',category_id:'chicken',name:'Frozen Chicken Wings',moq_india:'1 MT',moq_export:'2 MT',form:'IQF Whole / Split Wings',grade:'Grade A',origin:'India',packing:'1kg, 2kg Retail; 10kg, 20kg Master Cartons',certifications:'FSSAI, Halal, HACCP, BRC',shelf_life:'18 months frozen',storage:'-18°C Frozen',description:'Whole and split chicken wings. IQF frozen. Premium quality. High demand in GCC, Southeast Asia and Africa.',img:'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&q=80',active:true},
  // FROZEN MUTTON
  {id:'p086',category_id:'mutton',name:'Frozen Goat Meat (Curry Cut, Halal)',moq_india:'500 kg',moq_export:'1 MT',form:'IQF Curry Cut (Bone-in)',grade:'A Grade',origin:'Rajasthan, UP, Maharashtra',packing:'1kg Retail; 10kg, 20kg Cartons',certifications:'FSSAI, Halal, HACCP',shelf_life:'18 months frozen',storage:'-18°C Frozen',description:'Small Indian breed goat. Curry-cut with bone. Deep flavour. Halal slaughtered. Exported to GCC, UK and Southeast Asia.',img:'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80',active:true},
  {id:'p087',category_id:'mutton',name:'Frozen Boneless Goat Meat',moq_india:'500 kg',moq_export:'1 MT',form:'IQF Boneless Pieces',grade:'A Grade',origin:'Rajasthan, UP',packing:'1kg, 2kg Retail; 10kg, 20kg Cartons',certifications:'FSSAI, Halal, HACCP',shelf_life:'18 months frozen',storage:'-18°C Frozen',description:'Tender boneless goat meat. IQF frozen. Used for kebabs, biryanis and curries. High demand in Middle East and Europe.',img:'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80',active:true},
  {id:'p088',category_id:'mutton',name:'Frozen Lamb Cuts (Bone-In)',moq_india:'500 kg',moq_export:'1 MT',form:'IQF Bone-in Cuts',grade:'Premium',origin:'India (Young Sheep)',packing:'10kg, 20kg Vacuum Cartons',certifications:'FSSAI, Halal, HACCP',shelf_life:'18 months frozen',storage:'-18°C Frozen',description:'Young sheep (lamb) cuts. Tender, mild flavour. Growing premium market in UAE, UK and Saudi Arabia.',img:'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80',active:true},
  // SUGAR
  {id:'p089',category_id:'sugar',name:'S30 White Refined Sugar (ICUMSA 30)',moq_india:'5 MT',moq_export:'25 MT / 1 FCL',form:'Fine Crystal',grade:'ICUMSA 30–45',origin:'Maharashtra, Uttar Pradesh',packing:'50kg PP; 1MT Jumbo; 1kg Retail',certifications:'FSSAI, ISO 9001, Codex, Halal',shelf_life:'24 months',storage:'Cool, Dry Place',description:'Highly refined bright white sugar. ICUMSA ~30–45. Premium grade for beverages, confectionery, pharma and food processing.',img:'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=600&q=80',active:true},
  {id:'p090',category_id:'sugar',name:'Raw Cane Sugar (ICUMSA 600–800)',moq_india:'5 MT',moq_export:'25 MT / 1 FCL',form:'Raw Crystal',grade:'ICUMSA 600–800',origin:'Maharashtra, UP, Karnataka',packing:'50kg Jute/PP Bags',certifications:'FSSAI, Codex',shelf_life:'24 months',storage:'Cool, Dry Place',description:'Raw cane sugar with natural molasses. Golden-brown colour. Used in refining, brewing and bulk food processing.',img:'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=600&q=80',active:true},
  {id:'p091',category_id:'sugar',name:'Sugarcane Molasses (Feed Grade)',moq_india:'5 MT',moq_export:'25 MT',form:'Liquid Syrup',grade:'C-Heavy Molasses',origin:'Maharashtra, UP, Karnataka',packing:'200kg Drums; Flexi Bags (Bulk)',certifications:'FSSAI',shelf_life:'24 months',storage:'Cool, Dry Place',description:'C-heavy molasses. 46–48% total sugars. Used as animal feed additive, fermentation feedstock and industrial applications.',img:'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=600&q=80',active:true},
];

// ── AUTH & TOTP HELPERS ──────────────────────────────────────
async function generateToken(){const a=new Uint8Array(32);crypto.getRandomValues(a);return Array.from(a).map(b=>b.toString(16).padStart(2,'0')).join('');}
async function validateToken(env,token){if(!token)return null;const s=await env.KV.get('auth:'+token);return s?JSON.parse(s):null;}
async function getKV(env,key,fallback){
  try{if(!env||!env.KV)return fallback;const v=await env.KV.get(key);if(v)return JSON.parse(v);return fallback;}
  catch(e){return fallback;}
}
async function setKV(env,key,data){
  if(!env||!env.KV)throw new Error('KV namespace not bound');
  await env.KV.put(key,JSON.stringify(data));
}
function b32dec(s){const a='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits=0,val=0;const out=[];for(const c of s.toUpperCase().replace(/=+$/,'')){val=(val<<5)|a.indexOf(c);bits+=5;if(bits>=8){out.push((val>>>(bits-8))&255);bits-=8;}}return new Uint8Array(out);}
async function genTOTP(secret,w=0){const epoch=Math.floor(Date.now()/1000);const ctr=Math.floor(epoch/30)+w;const key=await crypto.subtle.importKey('raw',b32dec(secret),{name:'HMAC',hash:'SHA-1'},false,['sign']);const data=new DataView(new ArrayBuffer(8));data.setUint32(4,ctr,false);const sig=new Uint8Array(await crypto.subtle.sign('HMAC',key,data.buffer));const off=sig[19]&0xf;const code=(((sig[off]&0x7f)<<24)|(sig[off+1]<<16)|(sig[off+2]<<8)|sig[off+3])%1000000;return code.toString().padStart(6,'0');}
async function verifyTOTP(secret,token){for(const w of[-1,0,1])if(await genTOTP(secret,w)===token)return true;return false;}

// ── NEW RESEND API INTEGRATION ────────────────────────────────
async function sendEmail(env, toEmail, toName, subject, htmlBody){
  try{
    if (!env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY missing from environment variables");
      return false;
    }
    const res=await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type':'application/json'
      },
      body:JSON.stringify({
        from:'Memane Admin <info@memaneinternational.in>', // Using your verified professional domain
        to:toEmail,
        subject:subject,
        html:htmlBody
      })
    });
    return res.ok;
  }catch(e){return false;}
}

function genSecret(){const c='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';return Array.from(crypto.getRandomValues(new Uint8Array(20))).map(b=>c[b%32]).join('');}

async function seedIfEmpty(env){
  const s=await env.KV.get('settings');
  if(!s){
    await setKV(env,'settings',DEFAULT_SETTINGS);
    await setKV(env,'categories',DEFAULT_CATEGORIES);
    await setKV(env,'products',DEFAULT_PRODUCTS);
    await setKV(env,'enquiries',[]);
    await setKV(env,'admins',[{id:'admin1',username:'admin',password:'admin123',role:'superadmin',name:'Tejas Memane',email:'memaneexim@gmail.com',totp_secret:null,totp_enabled:false,created:Date.now()}]);
  }
}

export async function onRequest(context){
  const{request,env}=context;
  const url=new URL(request.url);
  const path=url.pathname.replace('/api/','').replace(/\/$/,'');

  if(request.method==='OPTIONS')return new Response(null,{headers:CORS});
  if(!env||!env.KV)return json({ok:false,msg:'KV not configured.'},503);
  try{ await seedIfEmpty(env); }catch(e){ return json({ok:false,msg:'KV init error: '+e.message},503); }

  // ── PUBLIC GET ──────────────────────────────────────────────────────
  if(request.method==='GET'&&path==='data'){
    const type=url.searchParams.get('type');
    if(type==='all'){
      const[settings,categories,products]=await Promise.all([getKV(env,'settings',DEFAULT_SETTINGS),getKV(env,'categories',DEFAULT_CATEGORIES),getKV(env,'products',DEFAULT_PRODUCTS)]);
      return json({settings,categories,products:products.filter(p=>p.active!==false)});
    }
    return err('Invalid type');
  }
// ── SECRET EMAIL DIAGNOSTIC TEST ──
  if(request.method==='GET' && path==='test-email'){
    if (!env.RESEND_API_KEY) return json({status: "FAIL", error: "Cloudflare cannot see the API Key. It is empty."});
    
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Memane Admin <info@memaneinternational.in>',
        to: 'memaneexim@gmail.com', // Sending directly to you
        subject: 'API Diagnostic Test',
        html: '<p>If you get this, the API is working perfectly!</p>'
      })
    });
    
    const rawResponse = await res.text();
    return new Response(rawResponse, { status: res.status, headers: {'Content-Type': 'application/json'} });
  }
  // ── ALL POST ROUTES ─────────────────────────────────────────────────
  if(request.method==='POST'){

    // 1. PUBLIC: Enquiry (Saves to DB + Sends Resend Email to Admin)
    if(path==='enquiry'){
      const body=await request.json().catch(()=>({}));
      const enquiries=await getKV(env,'enquiries',[]);
      
      // Clean up stray Web3Forms keys if any get passed
      delete body.access_key; delete body.botcheck; delete body.subject;
      
      enquiries.unshift({id:'eq'+Date.now(),...body,status:'new',ts:Date.now()});
      await setKV(env,'enquiries',enquiries.slice(0,500));

      // Fetch admin email from settings
      const s=await getKV(env,'settings',DEFAULT_SETTINGS);
      const adminEmail = s.email1 || 'info@memaneinternational.in';
      
      // Build email notification
      const emailHtml = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e0e0e0;">
          <div style="background:#1A2B5F;padding:20px;text-align:center;">
            <h2 style="color:#fff;margin:0;">New Website Enquiry</h2>
            <p style="color:#C9A84C;margin:5px 0 0;font-size:14px;">Memane International</p>
          </div>
          <div style="padding:24px;background:#f9f9f9;">
            <p><strong>Name:</strong> ${body.name || 'Not provided'}</p>
            <p><strong>Email:</strong> ${body.email || 'Not provided'}</p>
            <p><strong>Phone:</strong> ${body.phone || 'Not provided'}</p>
            <p><strong>Product:</strong> ${body.product || 'Not provided'}</p>
            <p><strong>Quantity:</strong> ${body.quantity || 'Not provided'}</p>
            <p><strong>Company/Country/Port:</strong> ${body.company || ''} ${body.country || ''} ${body.destination_port || ''}</p>
            <div style="background:#fff;padding:15px;border-left:4px solid #C9A84C;margin-top:20px;">
              <p style="margin:0;font-weight:bold;font-size:12px;color:#999;text-transform:uppercase;">Message / Requirements</p>
              <p style="margin:8px 0 0;line-height:1.6;">${body.message || body.requirements || 'No message provided.'}</p>
            </div>
            <div style="text-align:center;margin-top:30px;">
              <a href="https://memaneinternational.in/admin.html" style="background:#9B1C31;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;font-weight:bold;font-size:14px;">View in Dashboard</a>
            </div>
          </div>
        </div>
      `;

      // Fire off the email to admin via Resend
      await sendEmail(env, adminEmail, s.proprietor || 'Admin', '🔔 New Lead: ' + (body.name || 'Website Enquiry'), emailHtml);

      return json({ok:true});
    }


    
    // PUBLIC: Login
    if(path==='login'){
      const body=await request.json().catch(()=>({}));
      const admins=await getKV(env,'admins',null);
      if(!admins){
        const settings=await getKV(env,'settings',DEFAULT_SETTINGS);
        if(body.password===(settings.admin_password||'admin123')){
          const token=await generateToken();
          await env.KV.put('auth:'+token,JSON.stringify({role:'superadmin',username:'admin'}),{expirationTtl:86400});
          return json({ok:true,token,requireTotp:false,role:'superadmin',name:'Admin',username:'admin'});
        }
        return json({ok:false,msg:'Wrong credentials'},401);
      }
      const admin=admins.find(a=>a.username===body.username&&a.password===body.password);
      if(!admin)return json({ok:false,msg:'Wrong username or password'},401);
      if(admin.totp_enabled&&admin.totp_secret){
        const tmpToken=await generateToken();
        await env.KV.put('tmp:'+tmpToken,JSON.stringify({username:admin.username}),{expirationTtl:300});
        return json({ok:true,requireTotp:true,tmp_token:tmpToken});
      }
      const authToken=await generateToken();
      await env.KV.put('auth:'+authToken,JSON.stringify({role:admin.role,username:admin.username,id:admin.id,name:admin.name}),{expirationTtl:86400});
      return json({ok:true,token:authToken,requireTotp:false,role:admin.role,username:admin.username,name:admin.name});
    }

    // PUBLIC: TOTP Login Verify
    if(path==='login/totp'){
      const body=await request.json().catch(()=>({}));
      const{tmp_token,code}=body;
      if(!tmp_token||!code)return json({ok:false,msg:'Missing token or code'},400);
      const stored=await env.KV.get('tmp:'+tmp_token);
      if(!stored)return json({ok:false,msg:'Session expired. Please login again.'},401);
      const{username}=JSON.parse(stored);
      const admins=await getKV(env,'admins',[]);
      const admin=admins.find(a=>a.username===username);
      if(!admin)return json({ok:false,msg:'Admin not found'},404);
      if(!(await verifyTOTP(admin.totp_secret,code)))return json({ok:false,msg:'Invalid code. Try again.'},401);
      await env.KV.delete('tmp:'+tmp_token);
      const authToken=await generateToken();
      await env.KV.put('auth:'+authToken,JSON.stringify({role:admin.role,username:admin.username,id:admin.id,name:admin.name}),{expirationTtl:86400});
      return json({ok:true,token:authToken,role:admin.role,username:admin.username,name:admin.name});
    }

    // PUBLIC: Forgot Password (by EMAIL — secure via Resend)
    if(path==='admin/forgot-password'){
      const body=await request.json().catch(()=>({}));
      const{email}=body;
      if(!email)return json({ok:false,msg:'Email address required'},400);
      const admins=await getKV(env,'admins',[]);
      const admin=admins.find(a=>a.email&&a.email.toLowerCase()===email.toLowerCase());
      if(admin){
        const tokenBytes=new Uint8Array(32);
        crypto.getRandomValues(tokenBytes);
        const resetToken=Array.from(tokenBytes).map(b=>b.toString(16).padStart(2,'0')).join('');
        await env.KV.put(`pwreset:${resetToken}`,JSON.stringify({username:admin.username,created:Date.now()}),{expirationTtl:3600});
        const resetLink=`https://memaneinternational.in/admin.html?reset=${resetToken}`;
        
        // Using updated sendEmail with env
        const sent=await sendEmail(env, admin.email,admin.name||admin.username,'Account Recovery — Memane International',
          `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#1A2B5F;padding:24px;text-align:center;"><h2 style="color:#fff;margin:0;">Memane International</h2><p style="color:#C9A84C;margin:4px 0 0;font-size:13px;">Account Recovery Request</p></div><div style="padding:28px;background:#f9f9f9;border:1px solid #e0e0e0;"><p>Hi <strong>${admin.name||admin.username}</strong>,</p><p>We received an account recovery request for this email.</p><div style="background:#fff;padding:16px;border-left:4px solid #1A2B5F;margin:20px 0;"><p style="margin:0;font-size:16px;"><strong>Your Username:</strong> ${admin.username}</p></div><p>Click below to reset your password:</p><div style="text-align:center;margin:28px 0;"><a href="${resetLink}" style="background:#9B1C31;color:#fff;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:15px;display:inline-block;">Reset My Password</a></div><p style="color:#666;font-size:13px;">Or copy: <a href="${resetLink}">${resetLink}</a></p><p style="color:#666;font-size:13px;">⏱ Expires in 1 hour.</p><hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0;"><p style="color:#999;font-size:12px;">— Memane International Admin System · memaneinternational.in</p></div></div>`
        );
        if(!sent)console.log('Email send failed for:',admin.email);
      }
      return json({ok:true,msg:'If that email is registered, your username and a reset link have been sent.'});
    }

    // PUBLIC: Reset Password (token from email)
    if(path==='admin/reset-password'){
      const body=await request.json().catch(()=>({}));
      const{token:resetToken,newPassword}=body;
      if(!resetToken||!newPassword)return json({ok:false,msg:'Token and new password required'},400);
      if(newPassword.length<8)return json({ok:false,msg:'Password must be at least 8 characters'},400);
      const stored=await env.KV.get(`pwreset:${resetToken}`);
      if(!stored)return json({ok:false,msg:'Reset link expired or already used.'},400);
      const{username}=JSON.parse(stored);
      const admins=await getKV(env,'admins',[]);
      const idx=admins.findIndex(a=>a.username===username);
      if(idx<0)return json({ok:false,msg:'Account not found'},404);
      admins[idx].password=newPassword;
      admins[idx].password_changed=Date.now();
      await setKV(env,'admins',admins);
      await env.KV.delete(`pwreset:${resetToken}`);
      const s=await getKV(env,'settings',DEFAULT_SETTINGS);
      const adminEmail=admins[idx].email||s.email1||'info@memaneinternational.in';
      
      // Using updated sendEmail with env
      await sendEmail(env, adminEmail,admins[idx].name||username,'Password Reset Successful — Memane International',
        `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#1A2B5F;padding:24px;text-align:center;"><h2 style="color:#fff;margin:0;">Memane International</h2><p style="color:#27AE60;margin:4px 0 0;font-size:13px;">✅ Password Reset Successful</p></div><div style="padding:28px;background:#f9f9f9;border:1px solid #e0e0e0;"><p>Hi <strong>${admins[idx].name||username}</strong>,</p><p>Your password was reset on <strong>${new Date().toUTCString()}</strong>.</p><p><a href="https://memaneinternational.in/admin.html" style="color:#9B1C31;font-weight:bold;">Click here to log in</a></p><hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0;"><p style="color:#999;font-size:12px;">— Memane International Admin System</p></div></div>`
      );
      return json({ok:true,msg:'Password reset successfully. You can now log in.'});
    }

    // ── PROTECTED ROUTES (require valid token) ──────────────────────
    const authHeader=request.headers.get('Authorization')||'';
    const token=authHeader.replace('Bearer ','');
    const session=await validateToken(env,token);
    
    // Session check endpoint
    if(path==='admin' || path==='admin/verify') {
       if(!session) return json({ok:false, msg:'Not authenticated'}, 401);
       return json({ok:true, session});
    }
    
    if(!session)return json({ok:false,msg:'Not authenticated'},403);

    const body=await request.json().catch(()=>({}));

    if(path==='admin/data'){
      const[settings,categories,products,enquiries,admins]=await Promise.all([getKV(env,'settings',DEFAULT_SETTINGS),getKV(env,'categories',DEFAULT_CATEGORIES),getKV(env,'products',DEFAULT_PRODUCTS),getKV(env,'enquiries',[]),getKV(env,'admins',[])]);
      return json({settings,categories,products,enquiries,admins:admins.map(a=>({...a,password:undefined,totp_secret:undefined})),session});
    }
    if(path==='admin/save-settings'){const s=await getKV(env,'settings',DEFAULT_SETTINGS);['company','proprietor','tagline','about_short','about_long','phone1','phone2','whatsapp','email1','email2','website','address','hours','hero_badge','hero_h1','hero_sub','w3f_enquiry','w3f_contact','admin_password'].forEach(k=>{if(body[k]!==undefined)s[k]=body[k];});await setKV(env,'settings',s);return json({ok:true});}
    if(path==='admin/save-categories'){await setKV(env,'categories',body.categories);return json({ok:true});}
    if(path==='admin/save-products'){await setKV(env,'products',body.products);return json({ok:true});}
    if(path==='admin/save-enquiries'){await setKV(env,'enquiries',body.enquiries);return json({ok:true});}
    if(path==='admin/totp-setup'){const secret=genSecret();const s=await getKV(env,'settings',DEFAULT_SETTINGS);const otpauth=`otpauth://totp/${encodeURIComponent(s.company||'Memane')}:${encodeURIComponent(session.username)}?secret=${secret}&issuer=${encodeURIComponent(s.company||'Memane')}`;await env.KV.put('totp-pending:'+token,secret,{expirationTtl:600});return json({ok:true,secret,otpauth});}
    if(path==='admin/totp-confirm'){const secret=await env.KV.get('totp-pending:'+token);if(!secret)return json({ok:false,msg:'Setup expired'});if(!(await verifyTOTP(secret,body.code)))return json({ok:false,msg:'Invalid code'});const admins=await getKV(env,'admins',[]);const idx=admins.findIndex(a=>a.username===session.username);if(idx>=0){admins[idx].totp_secret=secret;admins[idx].totp_enabled=true;await setKV(env,'admins',admins);}await env.KV.delete('totp-pending:'+token);return json({ok:true});}
    if(path==='admin/save-admin'){
      if(session.role!=='superadmin')return json({ok:false,msg:'Superadmin only'},403);
      const{id,username,password,role,email,name}=body;
      if(!username)return json({ok:false,msg:'Username required'},400);
      if(!email)return json({ok:false,msg:'Email required'},400);
      const admins=await getKV(env,'admins',[]);
      if(id){
        const idx=admins.findIndex(a=>a.id===id);
        if(idx<0)return json({ok:false,msg:'Admin not found'},404);
        admins[idx].username=username;admins[idx].role=role||admins[idx].role;admins[idx].email=email;admins[idx].name=name||admins[idx].name;
        if(password)admins[idx].password=password;
        await setKV(env,'admins',admins);return json({ok:true,msg:'Admin updated'});
      }else{
        if(!password)return json({ok:false,msg:'Password required'},400);
        if(admins.find(a=>a.username===username))return json({ok:false,msg:'Username already exists'},409);
        admins.push({id:'adm_'+Date.now(),username,password,role:role||'editor',email,name:name||username,totp_secret:null,totp_enabled:false,created:Date.now()});
        await setKV(env,'admins',admins);return json({ok:true,msg:'Admin added'});
      }
    }
    if(path==='admin/save-admins'){if(session.role!=='superadmin')return json({ok:false,msg:'Superadmin only'},403);await setKV(env,'admins',body.admins);return json({ok:true});}
    if(path==='admin/change-password'){
      const{currentPassword,newPassword}=body;
      if(!currentPassword||!newPassword)return json({ok:false,msg:'Both fields required'},400);
      if(newPassword.length<8)return json({ok:false,msg:'Min 8 characters'},400);
      const admins=await getKV(env,'admins',[]);
      const idx=admins.findIndex(a=>a.username===session.username);
      if(idx<0)return json({ok:false,msg:'Admin not found'},404);
      if(admins[idx].password!==currentPassword)return json({ok:false,msg:'Current password incorrect'},401);
      admins[idx].password=newPassword;admins[idx].password_changed=Date.now();
      await setKV(env,'admins',admins);
      const s=await getKV(env,'settings',DEFAULT_SETTINGS);
      // Using updated sendEmail with env
      await sendEmail(env, admins[idx].email||s.email1,admins[idx].name||session.username,'Admin Password Changed — Memane International',`<p>Your password was changed on ${new Date().toUTCString()}.</p>`);
      return json({ok:true,msg:'Password changed. Confirmation email sent.'});
    }
    if(path==='admin/save-product'){
      const prods=await getKV(env,'products',DEFAULT_PRODUCTS);
      const p=body;if(!p.id)p.id='p'+Date.now();if(p.active===undefined)p.active=true;
      const idx=prods.findIndex(x=>x.id===p.id);
      if(idx>=0)prods[idx]=p;else prods.push(p);
      await setKV(env,'products',prods);return json({ok:true,msg:'Product saved'});
    }
    if(path==='admin/toggle-product'){
      const prods=await getKV(env,'products',DEFAULT_PRODUCTS);
      const idx=prods.findIndex(x=>x.id===body.id);
      if(idx<0)return json({ok:false,msg:'Not found'},404);
      prods[idx].active=!prods[idx].active;
      await setKV(env,'products',prods);return json({ok:true,active:prods[idx].active});
    }
    if(path==='admin/delete-product'){
      const prods=await getKV(env,'products',DEFAULT_PRODUCTS);
      await setKV(env,'products',prods.filter(x=>x.id!==body.id));return json({ok:true});
    }
    if(path==='admin/save-category'){
      const cats=await getKV(env,'categories',DEFAULT_CATEGORIES);
      const c=body;if(!c.id)c.id='cat'+Date.now();
      const idx=cats.findIndex(x=>x.id===c.id);
      if(idx>=0)cats[idx]=c;else cats.push(c);
      await setKV(env,'categories',cats);return json({ok:true,msg:'Category saved'});
    }
    if(path==='admin/delete-category'){
      const cats=await getKV(env,'categories',DEFAULT_CATEGORIES);
      await setKV(env,'categories',cats.filter(x=>x.id!==body.id));return json({ok:true});
    }
    if(path==='admin/update-enquiry'){
      const enqs=await getKV(env,'enquiries',[]);
      const idx=enqs.findIndex(x=>x.id===body.id);
      if(idx>=0){Object.assign(enqs[idx],body);await setKV(env,'enquiries',enqs);}
      return json({ok:true});
    }
    if(path==='admin/delete-enquiry'){
      const enqs=await getKV(env,'enquiries',[]);
      await setKV(env,'enquiries',enqs.filter(x=>x.id!==body.id));return json({ok:true});
    }
    if(path==='admin/reset-products'){
      if(session.role!=='superadmin')return json({ok:false,msg:'Superadmin only'},403);
      await setKV(env,'products',DEFAULT_PRODUCTS);await setKV(env,'categories',DEFAULT_CATEGORIES);
      return json({ok:true,msg:'Reset to '+DEFAULT_PRODUCTS.length+' products, '+DEFAULT_CATEGORIES.length+' categories'});
    }
    if(path==='admin/logout'){await env.KV.delete('auth:'+token);return json({ok:true});}
    if(path==='admin/delete-admin'){
      if(session.role!=='superadmin')return json({ok:false,msg:'Superadmin only'},403);
      if(body.id===session.id)return json({ok:false,msg:'Cannot delete yourself'},400);
      const admins=await getKV(env,'admins',[]);
      await setKV(env,'admins',admins.filter(a=>a.id!==body.id));return json({ok:true});
    }
    if(path==='admin/reset-totp'){
      if(session.role!=='superadmin')return json({ok:false,msg:'Superadmin only'},403);
      const admins=await getKV(env,'admins',[]);
      const idx=admins.findIndex(a=>a.id===body.id);
      if(idx<0)return json({ok:false,msg:'Not found'},404);
      admins[idx].totp_secret=null;admins[idx].totp_enabled=false;
      await setKV(env,'admins',admins);return json({ok:true,msg:'2FA reset'});
    }

    return err('Unknown route');
  }

  return err('Method not allowed',405);
}
