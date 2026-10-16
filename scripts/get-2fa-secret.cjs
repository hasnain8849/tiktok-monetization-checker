/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  const tf = await db.twoFactor.findFirst();
  if (tf) {
    console.log("secret:", tf.secret);
    console.log("verifiedAt:", tf.verifiedAt);
    const backups = JSON.parse(tf.backupCodes);
    console.log("remaining backups:", backups.length);
    console.log("backups:", backups.join(", "));
  } else {
    console.log("no 2FA found");
  }
  await db.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
