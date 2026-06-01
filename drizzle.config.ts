import type { Config } from "drizzle-kit";

export default {
  dialect: "sqlite",
  schema: "./src/lib/db/schema",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_PATH ?? "./data/data.db",
  },
} satisfies Config;
