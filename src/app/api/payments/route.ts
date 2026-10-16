import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUserId } from "@/lib/auth";
import { notifyPaymentUpdate } from "@/lib/notify";
import { getPaymentProvider } from "@/lib/payment-provider";
import { sendTemplateEmail } from "@/lib/email";
import PaymentVerifiedEmail from "@/emails/payment-verified-email";

// Bank account details shown to users who want to pay the unlock fee.
// In a real app these would be a merchant bank account and the verification
// would come from a payment gateway webhook (e.g., Stripe / Plaid / bank API).
export const BANK_DETAILS = {
  bank: "First Continental Digital Bank",
  accountHolder: "TikTok Monetization Checker, Inc.",
  accountNumber: "4498-2273-0091",
  routingNumber: "021000089",
  iban: "US64 SVBK 0000 0449 8227 3009 1",
  swift: "SVBKUS6S",
  address: "100 Crypto Row, Wilmington, DE 19801, USA",
  feeAmount: 49.0,
  currency: "USD",
  feeLabel: "Account Restriction Unlock Fee",
};

type PaymentBody = {
  handle: string;
  paymentRef: string;
};

export async function GET() {
  const provider = await getPaymentProvider();
  return NextResponse.json({
    bank: BANK_DETAILS,
    provider: provider.name,
    // In stripe mode we expose the publishable key so the frontend can
    // initialize Stripe.js with it.
    stripePublishableKey:
      provider.name === "stripe"
        ? (process.env.STRIPE_PUBLISHABLE_KEY ?? null)
        : null,
  });
}

// POST creates a *pending* PaymentAttempt and schedules a simulated bank
// webhook to fire ~4 seconds later, which flips the attempt to "verified"
// and writes the UnlockedProfile row.
//
// In production this scheduling would not exist — the bank would call our
// /api/payments/webhook endpoint asynchronously. We simulate it here so the
// demo is self-contained.
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const body = (await req.json()) as PaymentBody;
    if (!body?.handle || !body?.paymentRef) {
      return NextResponse.json(
        { error: "handle and paymentRef required" },
        { status: 400 }
      );
    }
    const handle = body.handle.trim().toLowerCase().replace(/^@/, "");
    const ref = body.paymentRef.trim();

    // Create an intent with the active provider. In simulated mode this is a
    // no-op (returns a fake intentId). In Stripe mode this creates a real
    // PaymentIntent with the handle + paymentRef baked into the metadata.
    const provider = await getPaymentProvider();
    let intentResult: { intentId: string; clientSecret: string | null } | null = null;
    if (provider.name === "stripe") {
      try {
        intentResult = await provider.createIntent({
          handle: `@${handle}`,
          amount: BANK_DETAILS.feeAmount,
          currency: BANK_DETAILS.currency,
          paymentRef: ref,
        });
      } catch (e) {
        console.error("Provider createIntent failed:", e);
        return NextResponse.json(
          { error: "failed to create payment intent" },
          { status: 500 }
        );
      }
    }

    const attempt = await db.paymentAttempt.create({
      data: {
        userId: userId ?? null,
        handle: `@${handle}`,
        amount: BANK_DETAILS.feeAmount,
        currency: BANK_DETAILS.currency,
        paymentRef: ref,
        status: "pending",
      },
    });

    // Only schedule the simulated webhook when in simulated mode. In Stripe
    // mode the real Stripe webhook fires externally when payment succeeds.
    if (provider.name === "simulated") {
      setTimeout(async () => {
        try {
          await verifyPaymentInternal(attempt.id);
          console.log(`[webhook-sim] Payment ${attempt.id} verified for @${handle}`);
        } catch (e) {
          console.error("[webhook-sim] failed:", e);
        }
      }, 30000);
    }

    return NextResponse.json(
      {
        attemptId: attempt.id,
        status: "pending",
        provider: provider.name,
        clientSecret: intentResult?.clientSecret ?? null,
        intentId: intentResult?.intentId ?? null,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("Payment creation failed:", e);
    return NextResponse.json(
      { error: "payment creation failed" },
      { status: 500 }
    );
  }
}

// Shared verification routine — used by both the simulated setTimeout and
// the external /api/payments/webhook endpoint.
export async function verifyPaymentInternal(attemptId: string) {
  const attempt = await db.paymentAttempt.findUnique({
    where: { id: attemptId },
  });
  if (!attempt) throw new Error("attempt not found");
  if (attempt.status === "verified") return attempt;

  await db.paymentAttempt.update({
    where: { id: attemptId },
    data: { status: "verified" },
  });

  const handle = attempt.handle.replace(/^@/, "").toLowerCase();
  await db.unlockedProfile.upsert({
    where: { handle },
    create: {
      handle,
      userId: attempt.userId,
      feeAmount: BANK_DETAILS.feeAmount,
      currency: BANK_DETAILS.currency,
      paymentMethod: "bank_transfer",
      paymentRef: attempt.paymentRef,
    },
    update: {
      userId: attempt.userId ?? undefined,
      paymentRef: attempt.paymentRef,
      paidAt: new Date(),
    },
  });

  // Notify the websocket service so any client waiting on this handle
  // (e.g. the restricted popup) transitions instantly.
  await notifyPaymentUpdate({
    handle,
    status: "verified",
    attemptId,
  });

  // Send a payment-verified email to the user who paid (if their account has
  // an email). Fire-and-forget — failures are logged inside sendTemplateEmail.
  if (attempt.userId) {
    try {
      const user = await db.user.findUnique({ where: { id: attempt.userId } });
      if (user?.email) {
        await sendTemplateEmail(PaymentVerifiedEmail, {
          to: user.email,
          subject: "Your TikTok unlock has been verified",
          tag: "payment_verified",
          userName: user.name ?? "there",
          handle: attempt.handle,
          paymentRef: attempt.paymentRef,
          amount: attempt.amount,
          currency: attempt.currency,
        });
      }
    } catch (e) {
      console.error("send payment-verified email failed:", e);
    }
  }

  return attempt;
}
