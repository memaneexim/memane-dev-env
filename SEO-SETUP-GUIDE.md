# SEO Setup Guide — Memane International
## memaneinternational.in

---

## ✅ Already Done (in this deployment)

| Item | Status | Notes |
|------|--------|-------|
| Meta title + description | ✅ Done | Optimised for export keywords |
| Open Graph tags | ✅ Done | og:title, og:description, og:image, og:url |
| Twitter Card | ✅ Done | summary_large_image |
| Canonical URL | ✅ Done | https://memaneinternational.in/ |
| Schema.org JSON-LD | ✅ Done | Organization + WebSite markup |
| Favicon | ✅ Done | /uploads/logo.jpeg |
| robots.txt | ✅ Done | Admin blocked, bad bots blocked |
| sitemap.xml | ✅ Done | All 17 category pages included |
| IndexNow key file | ✅ Done | mi2025indexnow.txt |
| Security headers | ✅ Done | HSTS, CSP, X-Frame, etc. |
| HTTPS/SSL | ✅ Done | Cloudflare auto-manages |
| Privacy Policy page | ✅ Done | Accessible via footer |
| Terms of Service page | ✅ Done | Accessible via footer |
| Cookie banner | ✅ Done | GDPR-compliant, essential only |
| Geo meta tags | ✅ Done | Pune, Maharashtra, India |

---

## 🔧 Manual Steps Required After Deployment

### 1. Google Search Console
1. Go to https://search.google.com/search-console
2. Add property: **https://memaneinternational.in**
3. Choose "HTML tag" verification method
4. Copy the code (looks like: `abc123XYZ`)
5. Open `index.html` and find this line:
   ```
   <!-- <meta name="google-site-verification" content="YOUR_GOOGLE_VERIFICATION_CODE_HERE"> -->
   ```
6. Replace `YOUR_GOOGLE_VERIFICATION_CODE_HERE` with your actual code and uncomment the line
7. Deploy and click "Verify" in Search Console
8. Submit sitemap: https://memaneinternational.in/sitemap.xml

### 2. Bing Webmaster Tools
1. Go to https://www.bing.com/webmasters
2. Add site: **https://memaneinternational.in**
3. Choose "Meta tag" verification
4. Copy your code (looks like: `1234ABCD5678EFGH`)
5. Open `index.html` and find:
   ```
   <!-- <meta name="msvalidate.01" content="YOUR_BING_VERIFICATION_CODE_HERE"> -->
   ```
6. Replace and uncomment
7. Deploy and verify in Bing Webmaster

### 3. IndexNow (Bing instant indexing)
After verifying on Bing, go to:
**Bing Webmaster → IndexNow → Submit URL**
Or call this URL to notify Bing when you update content:
```
https://www.bing.com/indexnow?url=https://memaneinternational.in/&key=mi2025indexnow
```

### 4. OG Image
Create a 1200×630px image for social sharing:
- File path: `/uploads/og-image.jpg`
- Should show: Memane International logo + "Premium Agri Exports from India"
- Currently falling back to logo.jpeg (acceptable but not ideal)

### 5. Google Analytics (Optional)
If you want visitor tracking:
1. Create Google Analytics 4 account
2. Get measurement ID (G-XXXXXXXXXX)
3. Add to index.html before </head>:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## 📊 SEO Keywords to Target

**Primary (high intent):**
- "basmati rice export India" 
- "APEDA registered exporter India"
- "spices export company Pune"
- "fresh fruits export India"
- "halal frozen chicken export India"

**Secondary:**
- "Indian pulses export"
- "agricultural commodity export India"
- "bulk rice exporter India"
- "Indian food export company"

---

## 🔍 Recommended Free Tools

| Tool | URL | Purpose |
|------|-----|---------|
| Google Search Console | search.google.com/search-console | Index monitoring |
| Bing Webmaster | bing.com/webmasters | Bing indexing |
| Google PageSpeed | pagespeed.web.dev | Performance check |
| Schema Validator | schema.org/docs/validator | Test JSON-LD |
| Open Graph Debugger | developers.facebook.com/tools/debug | Test OG tags |
| Twitter Card Validator | cards-dev.twitter.com/validator | Test Twitter card |

---

*Guide generated: March 2025*
*Website: memaneinternational.in*
