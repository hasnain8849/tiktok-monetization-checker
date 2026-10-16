/* eslint-disable @typescript-eslint/no-require-imports */
// Inspect the last email log entry — confirms the React Email template HTML was persisted.
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  const latest = await db.emailLog.findFirst({
    orderBy: { createdAt: "desc" },
  });
  if (!latest) {
    console.log("No emails in DB");
    return;
  }
  console.log("Latest email:");
  console.log("  to:", latest.to);
  console.log("  subject:", latest.subject);
  console.log("  tag:", latest.tag);
  console.log("  status:", latest.status);
  console.log("  provider:", latest.provider);
  console.log("  body length:", latest.body.length, "chars");
  console.log("  body (first 200 chars):", latest.body.slice(0, 200));
  await db.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
