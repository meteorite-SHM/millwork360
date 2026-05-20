# Millwork360 Ops Portal — Setup Guide

## What you're getting
- Order status board (all staff can view + update status)
- Purchase Order creation with line items (office only)
- Inventory tracking with low-stock alerts (all staff)
- Vendor directory (office only)
- Role-based login: **office** (full access) vs **shop_floor** (read + status updates)

---

## Step 1 — Create your Supabase project (free)

1. Go to **https://supabase.com** → Sign up (free)
2. Click **New project** → name it `millwork360`
3. Set a database password (save it somewhere)
4. Wait ~2 minutes for it to spin up
5. Go to **SQL Editor** (left sidebar) → paste the entire contents of `supabase_setup.sql` → click **Run**
   - This creates all tables, permissions, and seeds your vendors/inventory

---

## Step 2 — Get your API keys

In Supabase: **Settings → API**

Copy these two values:
- **Project URL** → looks like `https://abcdefg.supabase.co`
- **anon public key** → long string starting with `eyJ...`

---

## Step 3 — Configure the app

Create a file called `.env` in the root of the project folder:

```
REACT_APP_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...your_anon_key...
```

---

## Step 4 — Create user accounts

In Supabase: **Authentication → Users → Add user**

Create accounts for each person. After creating, go to **Table Editor → profiles** and set their `role`:
- `office` → Jason, Ben, Morgan, Kerry, you (Shahab)
- `shop_floor` → Arley, Josh, and anyone on the floor

> Accounts can also be invited via email from the Auth dashboard.

---

## Step 5 — Deploy to Netlify (free, permanent URL)

**Option A — Easiest: Netlify Drop**
1. Run `npm run build` in the project folder
2. Go to **https://netlify.com** → drag the `build/` folder onto the page
3. Netlify gives you a URL like `https://millwork360-ops.netlify.app`
4. Add your environment variables: **Site settings → Environment variables**

**Option B — GitHub auto-deploy (recommended for updates)**
1. Push this project to a private GitHub repo
2. Connect it in Netlify → every `git push` auto-redeploys

---

## Step 6 — Share the URL

Send the URL to your team. They log in with the email/password you set up in Step 4.

Shop floor workers see: Dashboard, Orders (status updates only), Inventory
Office workers see: Everything + Purchase Orders + Vendors

---

## Local development

```bash
npm install
npm start
```
Opens at http://localhost:3000

---

## Need to add features later?

Common requests I can build for you:
- Email notifications when an order goes overdue
- PDF export of a PO (to email to vendor)
- Order history / activity log
- CSV export of orders or inventory
- Mobile-optimized layout for shop floor tablets
