// Different Postgres providers/integrations on Vercel name their connection
// string env vars differently (plain "Neon" integration uses DATABASE_URL;
// older Vercel Postgres and some Neon setups use POSTGRES_URL /
// POSTGRES_PRISMA_URL; pooled vs. direct connections get "_UNPOOLED" /
// "_NON_POOLING" suffixes). Rather than guess which one is provisioned, check
// them all in a sensible priority order.

const POOLED_CANDIDATES = ["DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL"];
const DIRECT_CANDIDATES = ["DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING", ...POOLED_CANDIDATES];

// For runtime queries, a pooled connection is preferred (safe under
// serverless concurrency); falls back to a direct URL if that's all that's set.
export function resolveDatabaseUrl(): string | undefined {
  return firstDefined(POOLED_CANDIDATES);
}

// Migrations take out an advisory lock that some connection poolers (e.g.
// PgBouncer in transaction mode) don't support, so prefer a direct connection
// for `prisma migrate deploy`; falls back to a pooled URL if that's all that's set.
export function resolveDirectDatabaseUrl(): string | undefined {
  return firstDefined(DIRECT_CANDIDATES);
}

function firstDefined(names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  return undefined;
}
