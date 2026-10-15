import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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
  // Return the bank details + fee for the front-end payment UI.
  return NextResponse.json({
    bank: BANK_DETAILS,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PaymentBody;
    if (!body?.handle || !body?.paymentRef) {
      return NextResponse.json(
        { error: "handle and paymentRef required" },
        { status: 400 }
      );
    }
    const handle = body.handle.trim().toLowerCase().replace(/^@/, "");
    const ref = body.paymentRef.trim();

    // 1. Record the payment attempt.
    const attempt = await db.paymentAttempt.create({
      data: {
        handle: `@${handle}`,
        amount: BANK_DETAILS.feeAmount,
        currency: BANK_DETAILS.currency,
        paymentRef: ref,
        status: "verified", // auto-verify in demo mode
      },
    });

    // 2. Mark the profile as unlocked. The audit endpoint will see this row
    //    and treat the profile as eligible on the next run.
    await db.unlockedProfile.upsert({
      where: { handle },
      create: {
        handle,
        feeAmount: BANK_DETAILS.feeAmount,
        currency: BANK_DETAILS.currency,
        paymentMethod: "bank_transfer",
        paymentRef: ref,
      },
      update: {
        paymentRef: ref,
        paidAt: new Date(),
      },
    });

    return NextResponse.json(
      { ok: true, attemptId: attempt.id, verified: true },
      { status: 201 }
    );
  } catch (e) {
    console.error("Payment failed:", e);
    return NextResponse.json(
      { error: "payment verification failed" },
      { status: 500 }
    );
  }
}
