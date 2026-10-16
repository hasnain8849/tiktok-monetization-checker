/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  const settings = await db.notificationSettings.findMany();
  console.log("NotificationSettings rows:");
  for (const s of settings) {
    console.log(
      `  userId=${s.userId} paymentEmails=${s.paymentEmailsEnabled} alerts=${s.eligibilityAlertsEnabled} muted=${s.mutedHandlesJson}`
    );
  }
  await db.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
