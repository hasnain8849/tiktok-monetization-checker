#!/usr/bin/env bash
# scripts/stripe-cli-demo.sh
#
# Convenience script for local Stripe webhook development.
#
# What it does:
#   1. Verifies PAYMENT_PROVIDER=stripe + STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET
#      are set in .env (or prompts you to set them).
#   2. Tells you the stripe CLI commands to run in another terminal:
#        a) `stripe login` (one-time)
#        b) `stripe listen --forward-to localhost:3000/api/payments/webhook`
#           (this prints a whsec_... signing secret — copy it into
#           STRIPE_WEBHOOK_SECRET in .env).
#   3. Provides a one-liner to trigger a test payment_intent.succeeded event:
#        stripe trigger payment_intent.succeeded
#   4. Tells you to test the full flow in the browser.
#
# Requires:
#   - Stripe CLI installed (https://stripe.com/docs/stripe-cli)
#   - A Stripe account (test mode)
#
# Usage:
#   bash scripts/stripe-cli-demo.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if ! command -v stripe &> /dev/null; then
  echo "✗ Stripe CLI not installed."
  echo "  Install from https://stripe.com/docs/stripe-cli"
  exit 1
fi

echo "=========================================="
echo "  Stripe CLI local-dev walkthrough"
echo "=========================================="
echo ""

if [ -f "$ENV_FILE" ]; then
  PROVIDER=$(grep -E "^PAYMENT_PROVIDER=" "$ENV_FILE" | cut -d= -f2 || echo "")
  if [ "$PROVIDER" != "stripe" ]; then
    echo "⚠ PAYMENT_PROVIDER is not 'stripe' in $ENV_FILE"
    echo "  Add: PAYMENT_PROVIDER=stripe"
    echo "  Also set: STRIPE_SECRET_KEY=sk_test_..."
    echo "            STRIPE_PUBLISHABLE_KEY=pk_test_..."
    echo "            STRIPE_WEBHOOK_SECRET=whsec_..."
    echo ""
  fi
else
  echo "✗ .env not found at $ENV_FILE"
  exit 1
fi

echo "Step 1 — one-time setup"
echo "  $ stripe login"
echo "  (opens a browser to authenticate your Stripe account)"
echo ""
echo "Step 2 — start the webhook forwarder (in a separate terminal)"
echo "  $ stripe listen --forward-to localhost:3000/api/payments/webhook"
echo ""
echo "  Watch the output. It will print a line like:"
echo "    > Ready! Your webhook signing secret is whsec_xxxxxxxx"
echo "  Copy that whsec_... value and put it in $ENV_FILE as:"
echo "    STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxx"
echo "  Then restart your Next.js dev server:"
echo "    pkill -f 'next dev' && bash .zscripts/dev.sh"
echo ""
echo "Step 3 — trigger a test payment_intent.succeeded event"
echo "  $ stripe trigger payment_intent.succeeded"
echo ""
echo "  This will POST a signed event to /api/payments/webhook. If the"
echo "  signature verifies, the matching PaymentAttempt will be marked"
echo "  'verified' and the UnlockedProfile row will be written."
echo ""
echo "Step 4 — test the full flow in the browser"
echo "  Open http://localhost:3000 — sign in — audit a restricted"
echo "  profile (e.g. @prankzlife) — click View restrictions & pay to"
echo "  unlock — use the Stripe test card 4242 4242 4242 4242 with any"
echo "  future expiry + any CVC — click Pay $49.00 with card."
echo ""
echo "  Stripe will confirm the PaymentIntent server-side and POST the"
echo "  payment_intent.succeeded event to /api/payments/webhook. The"
echo "  frontend's socket listener picks up the unlock instantly."
echo ""
echo "Other useful triggers:"
echo "  stripe trigger payment_intent.payment_failed"
echo "  stripe trigger payment_intent.requires_action   (3D Secure)"
echo ""
echo "=========================================="
echo "  Current env state:"
echo "=========================================="
grep -E "^PAYMENT_PROVIDER=|^STRIPE_(SECRET|PUBLISHABLE|WEBHOOK)" "$ENV_FILE" | sed 's/=sk_test_.*/=sk_test_***REDACTED***/' | sed 's/=pk_test_.*/=pk_test_***REDACTED***/' | sed 's/=whsec_.*/=whsec_***REDACTED***/' || echo "(none set)"
echo ""
