# Wakeur Web App

React + Vite frontend for Wakeur shop management.

## Setup

1. Install dependencies
```bash
npm install
```

2. Configure `.env`
```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
# optional backward compatibility:
# VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_API_URL=http://localhost:5000/api
```

3. Run
```bash
npm run dev
```

## Auth + reset password flow

- Login page: `src/pages/Login.jsx`
- Reset page: `src/pages/ResetPassword.jsx`
- Route registration: `src/App.jsx`

Supabase configuration required:

1. Open Supabase Dashboard -> Authentication -> URL Configuration.
2. Add your web URL(s) in **Redirect URLs**.
3. Include your reset route, for example:
   - `https://your-domain.com/reset-password`
   - `http://localhost:5173/reset-password`

If the redirect URL is missing, reset password emails will fail.

## Deployment note (important)

Vite reads `VITE_*` variables at build time. For Netlify/Vercel/Render:

1. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the hosting dashboard environment variables.
2. Trigger a new deploy after saving variables.
3. Never use `sb_secret_*` in frontend variables.

## Security improvements in this frontend

- Cooldown/temporary lock after repeated admin login failures
- Safer reset-password messaging and cooldown controls
- Strong password requirements on reset
- Axios API client now sends bearer tokens automatically
