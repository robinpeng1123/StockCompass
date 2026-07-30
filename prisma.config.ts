import "dotenv/config";
import { defineConfig } from "prisma/config";
import { resolveDirectDatabaseUrl } from "./lib/dbUrl";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: resolveDirectDatabaseUrl(),
  },
});
