import { NextResponse } from "next/server";

// GET /api/docs/stripe — returns a Stripe test-mode walkthrough as Markdown.
const markdown = `# Stripe Test Mode Walkthrough

This guide walks you through switching the TikTok Monetization Checker
from the simulated payment provider to real Stripe (test mode).

## 1. Get your Stripe test keys

1. Sign up for a free Stripe account at https://dashboard.stripe.com/register.
2. In the Stripe dashboard, make sure **Viewing test data** is ON (top right).
3. Copy your **Publishable key** (starts with \`pk_test_\`) from
   https://dashboard.stripe.com/test/apikeys.
4. Copy your **Secret key** (starts with \`sk_test_\`) from the same page.

## 2. Add the keys to your .env

\`\`\`env
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
\`\`\`

## 3. Configure the Stripe webhook

Stripe will POST to your app's /api/payments/webhook endpoint when a
payment succeeds. Configure the webhook:

1. Go to https://dashboard.stripe.com/test/webhooks.
2. Click **Add endpoint**.
3. Set the endpoint URL to your production URL (or a tunnel like ngrok
   for local dev): https://yourdomain.com/api/payments/webhook
4. Select the event **payment_intent.succeeded**.
5. Click **Add endpoint**.
6. On the endpoint detail page, copy the **Signing secret** (starts with
   \`whsec_\`) and put it in your .env as \`STRIPE_WEBHOOK_SECRET\`.

## 4. Test a payment

1. Restart your Next.js dev server so the new env vars are loaded.
2. Sign in as a regular user.
3. Run an audit on a restricted profile (e.g. @prankzlife).
4. Click **View restrictions & pay to unlock**.
5. The popup will now show a **Stripe Elements card form** instead of the
   bank details card.
6. Enter Stripe's test card number \`4242 4242 4242 4242\` with any future
   expiry and any CVC.
7. Click **Pay $49.00 with card**.
8. Stripe will confirm the PaymentIntent server-side and POST to your
   webhook endpoint. The endpoint verifies the signature and transitions
   the attempt to \`verified\`, which writes the \`UnlockedProfile\` row.
9. The frontend's socket listener picks up the unlock notification and
   transitions the popup to **Payment verified!** — re-run the audit to
   see the profile is now eligible.

## 5. Test cards

| Card number        | Behavior                          |
|--------------------|-----------------------------------|
| \`4242 4242 4242 4242\` | Succeeds (default)               |
| \`4000 0027 6000 3184\` | Triggers 3D Secure authentication |
| \`4000 0000 0000 9995\` | Fails with insufficient funds     |
| \`4000 0000 0000 0002\` | Fails (generic decline)          |

## 6. Webhook signature verification

The webhook endpoint uses \`stripe.webhooks.constructEvent()\` to verify the
\`stripe-signature\` header against your \`STRIPE_WEBHOOK_SECRET\`. If the
signature doesn't match, the endpoint returns 400 and the payment stays
\`pending\`. This prevents replay attacks.

## 7. Going live

When you're ready to accept real payments:

1. Switch the toggle from **Viewing test data** to **Viewing live data** in
   the Stripe dashboard.
2. Replace the test keys in .env with the live ones (\`pk_live_\` and
   \`sk_live_\`).
3. Reconfigure the webhook endpoint to use the live signing secret.
4. Restart the app.

## 8. Switching back to simulated mode

To go back to the simulated bank-transfer flow (no real Stripe calls),
just set:

\`\`\`env
PAYMENT_PROVIDER=simulated
\`\`\`

Restart the app. The restricted popup will show the bank-details card
again, and the 30-second simulated webhook will auto-verify payments.

## 9. Troubleshooting

- **Stripe Elements doesn't load** → check \`STRIPE_PUBLISHABLE_KEY\` is
  set and the network is reachable.
- **Webhook returns 400 "invalid signature"** → confirm
  \`STRIPE_WEBHOOK_SECRET\` matches the endpoint's signing secret.
- **Payment stuck on "verifying"** → the webhook hasn't fired yet. Use
  the Stripe CLI (\`stripe listen --forward-to localhost:3000/api/payments/webhook\`)
  for local development.
- **Admin → Webhooks tab shows "failed"** → the payment-notifier
  mini-service may not be running. Start it with \`bun run dev\` in
  /home/z/my-project/mini-services/payment-notifier/.
`;

export async function GET() {
  return NextResponse.json({ markdown });
}
