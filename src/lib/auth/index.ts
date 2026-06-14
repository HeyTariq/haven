import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { passwordlessPlugin } from "./passwordless-plugin";

const DEFAULT_SECRET = "change-me-use-openssl-rand-base64-32";
const isBuilding = process.env.NEXT_PHASE === "phase-production-build";
if (!isBuilding && (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET === DEFAULT_SECRET)) {
  throw new Error(
    "BETTER_AUTH_SECRET is unset or still the placeholder. Generate one with `openssl rand -base64 32` and set it in .env before starting.",
  );
}

// "*" disables Better Auth's CSRF origin check entirely; surface that loudly.
if (process.env.TRUSTED_ORIGINS === "*") {
  console.warn(
    "[auth] TRUSTED_ORIGINS=* disables CSRF origin validation. Set an explicit comma-separated allowlist for anything beyond a fully trusted LAN.",
  );
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  // Passwords are disabled entirely: sign-in is by profile + optional PIN via the
  // passwordless plugin. Accounts are created only by /setup and the admin panel.
  emailAndPassword: {
    enabled: false,
  },
  // nextCookies must be last so it forwards Set-Cookie from auth.api calls made in server actions.
  plugins: [admin(), passwordlessPlugin(), nextCookies()],
  secret: process.env.BETTER_AUTH_SECRET ?? DEFAULT_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  // "*" trusts any origin via wildcard pattern; otherwise a comma-separated allowlist
  trustedOrigins: process.env.TRUSTED_ORIGINS === "*"
    ? ["*"]
    : process.env.TRUSTED_ORIGINS
      ? process.env.TRUSTED_ORIGINS.split(",").map((o) => o.trim())
      : [],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
