import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUserId } from "@/lib/auth";
import { notifyPaymentUpdate } from "@/lib/notify";

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
  return NextResponse.json({ bank: BANK_DETAILS });
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

    // Simulate the bank webhook firing asynchronously. In production this
    // would be an external POST to /api/payments/webhook from the bank's API.
    // 30s delay gives an admin time to manually verify via /admin before the
    // simulated webhook fires (so we can demonstrate the admin UI).
    setTimeout(async () => {
      try {
        await verifyPaymentInternal(attempt.id);
        console.log(`[webhook-sim] Payment ${attempt.id} verified for @${handle}`);
      } catch (e) {
        console.error("[webhook-sim] failed:", e);
      }
    }, 30000);

    return NextResponse.json(
      { attemptId: attempt.id, status: "pending" },
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

  return attempt;
}
