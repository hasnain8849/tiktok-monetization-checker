/* eslint-disable @typescript-eslint/no-require-imports */
// Quick utility to clear cached data for a handle (used for browser-flow testing).
// Usage: node scripts/clear-handle.cjs <handle>
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
const handle = process.argv[2] || "spamtest123";

async function main() {
  const r1 = await db.cachedProfile.deleteMany({ where: { handle } });
  const r2 = await db.unlockedProfile.deleteMany({ where: { handle } });
  const r3 = await db.paymentAttempt.deleteMany({ where: { handle: `@${handle}` } });
  console.log(`deleted: ${r1.count} cached, ${r2.count} unlocked, ${r3.count} payment attempts for ${handle}`);
  await db.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
