/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  const latest = await db.paymentAttempt.findFirst({
    orderBy: { createdAt: "desc" },
  });
  if (!latest) {
    console.log("No payment attempts");
  } else {
    console.log("Latest PaymentAttempt:");
    console.log(`  id: ${latest.id}`);
    console.log(`  handle: ${latest.handle}`);
    console.log(`  userId: ${latest.userId ?? "(null)"}`);
    console.log(`  status: ${latest.status}`);
    console.log(`  paymentRef: ${latest.paymentRef}`);
  }
  await db.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
