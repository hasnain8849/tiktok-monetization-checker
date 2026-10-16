// Payment provider abstraction.
//
// The simulated provider is the default — it auto-verifies any attempt via a
// scheduled setTimeout (no real bank integration). The Stripe provider is a
// production-ready drop-in: when PAYMENT_PROVIDER=stripe is set, the
// /api/payments/webhook endpoint verifies Stripe-signed webhook events and
// the verifyPaymentInternal() routine treats verified Stripe events as
// canonical (instead of the simulated setTimeout).
//
// To switch to real Stripe:
//   1. Set PAYMENT_PROVIDER=stripe in .env
//   2. Set STRIPE_SECRET_KEY=sk_test_... and STRIPE_WEBHOOK_SECRET=whsec_...
//   3. Point your Stripe webhook at https://yourdomain.com/api/payments/webhook
//   4. Create a PaymentIntent or Checkout Session in POST /api/payments
//      (the route is already structured to call provider.createIntent()).

export type ProviderName = "simulated" | "stripe";

interface CreateIntentResult {
  /** Provider-specific intent id (e.g., Stripe payment_intent id) */
  intentId: string;
  /** Client secret to hand to the frontend for client-side confirmation */
  clientSecret: string | null;
  /** Anything else the provider wants to record */
  metadata?: Record<string, unknown>;
}

export interface PaymentProvider {
  name: ProviderName;
  /** Create a payment intent for the given amount + handle. */
  createIntent(opts: {
    handle: string;
    amount: number;
    currency: string;
    paymentRef: string;
  }): Promise<CreateIntentResult>;
  /**
   * Verify a webhook signature. Returns the parsed event payload on success,
   * throws on signature mismatch.
   */
  verifyWebhook(opts: {
    rawBody: string;
    signature: string;
  }): Promise<unknown>;
}

// --- env-based provider selection -------------------------------------

function getProviderName(): ProviderName {
  const v = (process.env.PAYMENT_PROVIDER ?? "simulated").toLowerCase();
  return v === "stripe" ? "stripe" : "simulated";
}

// --- simulated provider (default) -------------------------------------

const simulatedProvider: PaymentProvider = {
  name: "simulated",
  async createIntent(opts) {
    return {
      intentId: `sim_${opts.paymentRef}_${Date.now()}`,
      clientSecret: null,
      metadata: { note: "simulated — auto-verified by setTimeout" },
    };
  },
  async verifyWebhook() {
    // The simulated provider doesn't have signatures; any payload is accepted.
    return { verified: true };
  },
};

// --- Stripe provider (production) -------------------------------------

async function makeStripeProvider(): Promise<PaymentProvider> {
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
    apiVersion: "2025-08-27.basil" as Stripe.LatestApiVersion,
  });
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  return {
    name: "stripe",
    async createIntent(opts) {
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(opts.amount * 100),
        currency: opts.currency.toLowerCase(),
        description: `TikTok unlock fee for ${opts.handle}`,
        metadata: { handle: opts.handle, paymentRef: opts.paymentRef },
      });
      return {
        intentId: intent.id,
        clientSecret: intent.client_secret,
        metadata: { stripeIntentId: intent.id },
      };
    },
    async verifyWebhook({ rawBody, signature }) {
      const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
      return event;
    },
  };
}

let cachedProvider: PaymentProvider | null = null;

export async function getPaymentProvider(): Promise<PaymentProvider> {
  if (cachedProvider) return cachedProvider;
  const name = getProviderName();
  cachedProvider =
    name === "stripe" ? await makeStripeProvider() : simulatedProvider;
  return cachedProvider;
}
