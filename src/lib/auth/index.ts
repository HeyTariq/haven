import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { passwordlessPlugin } from "./passwordless-plugin";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    // only /setup and admin panel create accounts
    disableSignUp: true,
  },
  // nextCookies must be last so it forwards Set-Cookie from auth.api calls made in server actions.
  plugins: [admin(), passwordlessPlugin(), nextCookies()],
  secret: process.env.BETTER_AUTH_SECRET!,
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
