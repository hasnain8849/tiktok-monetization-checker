/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  const tokens = await db.shareToken.findMany({ orderBy: { createdAt: "desc" }, take: 3 });
  console.log("ShareTokens:", tokens.length);
  for (const t of tokens) {
    console.log(
      `  token=${t.token.slice(0, 16)}... handle=${t.handle} userId=${t.userId?.slice(-8) ?? "(null)"} expiresAt=${t.expiresAt ?? "never"} revokedAt=${t.revokedAt ?? "no"}`
    );
  }
  await db.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
