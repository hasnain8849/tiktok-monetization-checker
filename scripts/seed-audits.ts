// Run with: bun run scripts/seed-audits.ts
// Seeds the SQLite DB with a handful of recent audits so the dashboard isn't empty on first load.
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const seedAudits = [
  { handle: "@mrbeast", avatarInitials: "MB", followers: 120_400_000, eligible: true, status: "eligible", checksPassed: 6, checksTotal: 6 },
  { handle: "@charlidamelio", avatarInitials: "CD", followers: 155_300_000, eligible: true, status: "eligible", checksPassed: 6, checksTotal: 6 },
  { handle: "@artbyjordan", avatarInitials: "JD", followers: 8_400, eligible: false, status: "ineligible", checksPassed: 5, checksTotal: 6 },
  { handle: "@prankzlife", avatarInitials: "PL", followers: 89_200, eligible: false, status: "restricted", checksPassed: 4, checksTotal: 6 },
  { handle: "@khaby.lame", avatarInitials: "KL", followers: 162_500_000, eligible: true, status: "eligible", checksPassed: 6, checksTotal: 6 },
  { handle: "@bellapoarch", avatarInitials: "BP", followers: 94_200_000, eligible: true, status: "eligible", checksPassed: 6, checksTotal: 6 },
];

async function main() {
  console.log("Seeding audits...");
  for (const a of seedAudits) {
    await db.savedAudit.upsert({
      where: { id: `seed_${a.handle.replace(/[@.]/g, "")}` },
      create: { id: `seed_${a.handle.replace(/[@.]/g, "")}`, ...a, checkedAt: new Date(Date.now() - Math.random() * 86400000 * 4) },
      update: {},
    });
  }
  const count = await db.savedAudit.count();
  console.log(`✓ ${count} audits in DB`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
