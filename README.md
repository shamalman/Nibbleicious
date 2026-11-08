# Nibbleicious — Vercel + Supabase coming-soon page

A responsive landing page and Vercel Serverless Function for capturing email signups in Supabase. No React, build command, or third-party runtime dependency required.

## 1. Configure Supabase

1. Create a Supabase project at https://supabase.com/dashboard.
2. Open **SQL Editor**, paste all of `supabase-setup.sql`, and click **Run**. If you previously created `subscribers`, this keeps the table and its data. It also creates a rate-limit table and a server-only signup function.
3. In Supabase, find your project URL in the **Connect** dialog (or Project Settings). In **Settings → API Keys**, copy a **secret** key (`sb_secret_...`), not the publishable key. Do not put the secret key in a GitHub file or frontend code.

**Security:** Row Level Security is enabled on both tables. Public visitors cannot list subscribers. The server-side secret key executes a restricted signup database function. That key can bypass RLS, so protect it carefully.

## 2. Deploy on Vercel

1. Upload the **contents** of this `nibbleicious` folder to the root of a GitHub repository. `index.html` and `api/subscribe.js` should both be at the repository root and subdirectory, respectively.
2. Import the repository at https://vercel.com/new. Select **Framework Preset: Other**, leave **Build Command** empty, and deploy.
3. In Vercel **Project → Settings → Environment Variables**, add these for **Production**:
   - `SUPABASE_URL` = `https://YOUR_PROJECT.supabase.co`
   - `SUPABASE_SECRET_KEY` = your private `sb_secret_...` key
   - `RATE_LIMIT_SALT` = any long, random, secret string (recommended)
4. **Redeploy** the project after adding variables.
5. In **Project → Settings → Domains**, add `nibbleicious.co` and follow Vercel's exact DNS instructions at your domain registrar. Optionally add `www.nibbleicious.co`.

Remove any old `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` values from Vercel; they are no longer needed.

## 3. Test signup

1. Open the live site from its Vercel deployment URL (or custom domain).
2. Enter an email address you control and submit. You should see the success message.
3. In Supabase, open **Table Editor → subscribers** and verify that the email appears once.
4. Try the same address again; it should still show a success message but not create a duplicate row.
5. If a 500 error occurs, verify that the SQL ran and that the environment variables are correct, then inspect Vercel's function logs. The live `/api/subscribe` route needs an actual Vercel deployment; opening `index.html` from your computer only previews the appearance.

## Notes

- The `script.js` form code and site design are unchanged. It POSTs JSON to `/api/subscribe`.
- An invisible form honeypot, email validation, and a 10-attempts-per-hour per-IP database check provide basic spam resistance. Add CAPTCHA/Turnstile if abuse increases. The rate limit is a fixed clock-hour window; it is not a sliding hour.
- The counter table retains hashed IP values until you delete old rows; schedule a database cleanup if you keep the site running long-term.
- No confirmation email or newsletter is sent automatically. For marketing updates, obtain appropriate consent and use an email sending service with unsubscribe support.
- `favicon.svg` and the inline SVG cookie logo can be customized separately.

## Design version

This package contains the **straight-line wordmark layout**: top navigation, centered cookie, large Coming soon heading, separate pill email input and button, and simple footer. It replaces the older curved-wordmark/sparkles layout. Supabase backend files are unchanged.


## Mobile layout fix and Supabase troubleshooting
This version fixes the run-together sentences on small screens and scales the wordmark and headline down.

If the signup says **Signup is not configured yet**, the running Vercel function is missing `SUPABASE_URL` or `SUPABASE_SECRET_KEY`. In Vercel, set both in Project → Settings → Environment Variables for **Production**, then create a new production deployment. `RATE_LIMIT_SALT` should also be set to a private, randomly generated value; the backend falls back to the secret key when absent, so the specific “not configured” message is not caused by a missing salt.

If it says **We couldn’t save your email just now**, inspect Project → Logs, filtering for `/api/subscribe`. Ensure you ran `supabase-setup.sql` in the matching Supabase project, including the `signup_to_waitlist` function, and confirm the project's URL and secret key refer to that same project. Do not post secret values in screenshots or support messages.

If the button appears not to respond, open the browser Network panel and inspect the HTTP status for `POST /api/subscribe`.
