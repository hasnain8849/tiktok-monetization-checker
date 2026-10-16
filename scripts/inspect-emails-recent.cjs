/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  const recent = await db.emailLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
  });
  console.log("Last 3 emails:");
  for (const e of recent) {
    console.log(
      `  to=${e.to} status=${e.status} tag=${e.tag} error=${e.error ?? "—"} subject="${e.subject}"`
    );
  }
  await db.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
