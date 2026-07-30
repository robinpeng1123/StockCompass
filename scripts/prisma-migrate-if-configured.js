#!/usr/bin/env node
// Runs `prisma migrate deploy` only when a database connection string is
// actually configured. Without this, a build with no database connected yet
// would hard-fail and block the entire site from deploying — even though
// everything except sign-in/synced portfolios works fine with no database.
const { execSync } = require("child_process");

const CANDIDATES = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
];

const hasDbUrl = CANDIDATES.some((name) => !!process.env[name]);

if (!hasDbUrl) {
  console.warn(
    `\n[prisma] No database connection string found (checked ${CANDIDATES.join(", ")}). ` +
      "Skipping `prisma migrate deploy` — sign-in and the synced portfolio will be " +
      "unavailable until a Postgres database is connected and the app is redeployed.\n"
  );
  process.exit(0);
}

execSync("npx prisma migrate deploy", { stdio: "inherit" });
