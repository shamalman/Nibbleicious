# Nibbleicious coming-soon page

A responsive vanilla HTML/CSS/JS landing page with a Vercel Serverless Function for collecting emails. No build step or frontend framework required.

## Deploy on Vercel

1. Upload this folder to a GitHub repository.
2. In Vercel, select **Add New → Project**, import the repository, choose **Other** framework preset, and leave the build command empty.
3. Create an **Upstash Redis** database (from the Upstash console or Vercel Marketplace). Add these environment variables in Vercel **Project → Settings → Environment Variables**:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - Optional: `RATE_LIMIT_SALT` (a long random string)
4. Redeploy after adding environment variables. **Email signup will show an error until Redis is configured.**
5. Add `nibbleicious.co` in Vercel **Project → Settings → Domains** and follow the DNS records that Vercel displays at your domain registrar. Add `www.nibbleicious.co` as desired.

## Where emails are saved

Emails are added to an Upstash Redis set called `nibbleicious:subscribers`. To retrieve them, use Redis CLI or Upstash's console and run:

```redis
SMEMBERS nibbleicious:subscribers
```

The API applies a simple per-IP rate limit and honeypot field and avoids storing raw visitor IPs. This collects subscribers but does **not** send updates or confirmation emails. For actual newsletters, export subscribers to a mailing service or integrate a double-opt-in provider (e.g., Buttondown, Mailchimp, Loops). Review applicable consent and privacy rules before sending campaigns.

## Local preview

Open `index.html` in a browser to preview the page. To test signup locally, install Vercel CLI and run `vercel dev` with your Upstash environment variables. The static preview by itself cannot store emails.

## Customization

- Text and logo are in `index.html`.
- Colors and fonts are in `styles.css`.
- The logo is an inline SVG with the corrected spelling, **nibbleicious**.
- The favicon is `favicon.svg`.
