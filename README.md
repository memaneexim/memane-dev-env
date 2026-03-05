# Memane International Website

Stack: Cloudflare Pages + Workers + KV

## Structure
```
index.html          → Main website (SPA, 17 categories, 120+ products)
mi-portal.html      → Admin panel (/mi-portal.html)
functions/api/      → Cloudflare Worker API
uploads/logo.jpeg   → Logo
_redirects          → URL routing
_headers            → Security headers
```

## Deploy
Push to GitHub → Cloudflare Pages auto-deploys

## Admin Panel
URL: /mi-portal.html
Default password: admin123
