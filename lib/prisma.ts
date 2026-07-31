import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { resolveDatabaseUrl } from "./dbUrl";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function makeClient() {
  const connectionString = resolveDatabaseUrl();
  if (!connectionString) {
    throw new Error(
      "No database connection string found — set DATABASE_URL (or POSTGRES_URL / POSTGRES_PRISMA_URL) in your environment."
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const client = makeClient();
    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
    return client;
  }
  return globalForPrisma.prisma;
}

// A lazy proxy: touching `prisma` itself never throws, only calling a method
// on it does. Next.js imports every API route module during the build's
// page-data-collection step (even for routes rendered dynamically at
// request time), so eagerly constructing the client at module load would
// break builds whenever no database is configured yet — which is expected
// before a Postgres integration is connected on Vercel.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client as object, prop);
    return typeof value === "function" ? value.bind(client) : value;
  },
}) as PrismaClient;
