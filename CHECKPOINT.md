# Memane International — Session Checkpoint
**Date:** March 4, 2026  
**Session:** Website Build + Cloudflare Setup  
**Resume From:** This document — everything is working, continue from here

---

## ✅ CURRENT STATUS — WHAT IS DONE

### Cloudflare (dev environment — fully live)
| Item | Status | Detail |
|---|---|---|
| Pages project | ✅ Live | `memane-dev-env` |
| Custom domain | ✅ Live | `dev.memaneinternational.in` |
| GitHub connected | ✅ Auto-deploy | `memaneexim/memane-dev-env` |
| KV namespace | ✅ Bound | Name: `memane-kv`, Variable: `KV` |
| KV binding | ✅ Done | Variable `KV` → `memane-kv` |
| R2 bucket | ❌ Not yet | Still needed for image uploads |

### GitHub Repo Structure (correct — do not change)
```
memane-dev-env/
├── index.html              ✅ Full website SPA
├── mi-portal.html          ✅ Admin panel
├── _headers                ✅ Security headers
├── _redirects              ✅ URL routing
├── robots.txt              ✅ SEO
├── uploads/
│   └── logo.jpeg           ✅ Logo
└── functions/
    └── api/
        └── [[route]].js    ✅ Worker backend
```

---

## ✅ FIXES APPLIED THIS SESSION

### 1. KV Binding Fixed
- Was: `kv-dev` → `memane-dev` (wrong names)
- Fixed: Variable `KV` → Namespace `memane-kv`
- Worker uses `env.KV` — must match exactly

### 2. Google Maps Embed (About page)
- Replaced broken Unsplash farm image
- Now shows live Google Maps with Pune pin

### 3. WhatsApp Modal
- Replaced browser `confirm()` popup (was being blocked)
- Now shows beautiful custom modal after form submit
- Appears after both: product enquiry + contact form

### 4. Carousel Fixed
- Was: stops at end, leaves white space
- Fixed: infinite loop, auto-scrolls every 3 seconds

### 5. Email Obfuscation Fixed
- Cloudflare was hiding emails as `[email protected]`
- Fixed with JS `renderEmails()` function — bypasses Cloudflare
- Shows: `info@memaneinternational.in` and `memaneexim@gmail.com`

### 6. Product Images — Full Library
- Expanded IMGS map from 22 entries → 109 entries
- Every product now has unique Unsplash image
- All copyright-free (Unsplash License)

---

## ❌ REMAINING TODO (next session)

### Priority 1 — R2 Bucket Setup (manual — Cloudflare dashboard)
```
1. Cloudflare Dashboard → Storage & Databases → R2
2. Create bucket: memane-assets
3. Settings → Public access → Allow
4. Pages → memane-dev-env → Settings → Bindings → Add R2
   Variable name: R2
   Bucket: memane-assets
5. Add upload endpoint to [[route]].js
```

### Priority 2 — Password Hashing
- Currently admin password stored as plain text `admin123`
- Need: SubtleCrypto SHA-256 hashing in Worker

### Priority 3 — Rate Limiting
- Add Cloudflare Rate Limiting rule on `/api/login`
- Prevents brute force attacks

### Priority 4 — Production Site
- Current: `dev.memaneinternational.in` (dev environment)
- Need: Repeat same setup for `memaneinternational.in` (prod)
- Or: Promote dev to prod after testing complete

### Priority 5 — Sitemap
- Create `sitemap.xml` with all category pages
- Add to robots.txt

---

## 🔐 CREDENTIALS (change after go-live)

```
Admin URL:          /mi-portal.html
Admin password:     admin123  ← CHANGE THIS FIRST
KV namespace ID:    a5d113564fbd4bb09fbeab050e08e10a
CF Account email:   Memaneexim@gmail.com
CF Account ID:      bc7eb13b753531c91e2546cb7e85c212
GitHub repo:        memaneexim/memane-dev-env
Web3Forms enquiry:  1744dc02-e069-4ed8-8869-5e185b6b0415
Web3Forms contact:  ceeae473-d8e0-4dbd-9741-2ae400c5f2dc
WhatsApp API num:   918999662331
```

---

## 📦 ZIP CONTENTS (this file's folder)

```
memane-checkpoint.zip
├── CHECKPOINT.md           ← This file — read first
├── ASSET_LIBRARY.md        ← All 134 image URLs mapped to products
├── index.html              ← Latest website (all fixes applied)
├── mi-portal.html          ← Admin panel
├── _headers                ← Security headers
├── _redirects              ← URL routing
├── robots.txt              ← SEO
├── uploads/
│   └── logo.jpeg           ← Company logo
└── functions/
    └── api/
        └── [[route]].js    ← Worker backend
```

---

## 🚀 HOW TO DEPLOY (no terminal needed)

**From GitHub (recommended — auto deploys):**
1. Go to `github.com/memaneexim/memane-dev-env`
2. Click file → Edit or Upload files
3. Commit → Cloudflare auto-deploys in ~30 seconds

**From zip upload (fallback):**
1. Cloudflare → Workers & Pages → memane-dev-env
2. Deployments → Create deployment → Upload zip
3. Select files (not the zip itself, the files inside)

---

## 🧠 INSTRUCTIONS FOR NEXT AI SESSION

1. Read `CHECKPOINT.md` first (this file)
2. Read `ASSET_LIBRARY.md` for all image mappings
3. Stack: pure HTML + JS + Cloudflare Pages + Workers + KV
4. NO PHP, NO React, NO npm — vanilla JS only
5. Images: Unsplash hotlinks (copyright-free, no download needed)
6. Worker file MUST be at: `functions/api/[[route]].js` exactly
7. KV binding MUST be variable name `KV` (capital)
8. User prefers: discuss before building, verify step by step
9. Language: Hinglish (Hindi + English mix) is fine

---

*Checkpoint saved: March 4, 2026*
