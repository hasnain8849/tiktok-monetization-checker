/* eslint-disable @typescript-eslint/no-require-imports */
// Utility to inspect / clean up User rows for testing the new auth flow.
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  const action = process.argv[2] || "list";
  if (action === "list") {
    const users = await db.user.findMany({ orderBy: { createdAt: "desc" } });
    console.log(`${users.length} users:`);
    for (const u of users) {
      console.log(`  - ${u.email} | role=${u.role} | hasPwd=${!!u.password} | name=${u.name ?? "—"}`);
    }
  } else if (action === "wipe") {
    const r = await db.user.deleteMany({});
    console.log(`deleted ${r.count} users`);
  } else if (action === "promote") {
    const email = process.argv[3];
    if (!email) {
      console.error("usage: node scripts/user-admin.cjs promote <email>");
      process.exit(1);
    }
    const u = await db.user.update({
      where: { email: email.toLowerCase() },
      data: { role: "admin" },
    });
    console.log(`promoted ${u.email} to admin`);
  }
  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
