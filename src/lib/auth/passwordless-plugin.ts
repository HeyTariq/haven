import { createAuthEndpoint, APIError } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import type { BetterAuthPlugin } from "better-auth";
import { verifyPassword } from "@better-auth/utils/password";
import { eq } from "drizzle-orm";
import * as z from "zod";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/schema/auth";

// Mints a session for a chosen profile without a password. Identity is the userId;
// the only challenge is an optional PIN. The endpoint is intentionally
// unauthenticated (no session middleware) since it is the sign-in path — so it
// MUST verify the PIN itself for any PIN-protected profile. Never trust a caller
// to have checked the PIN before reaching here.
export const passwordlessPlugin = () =>
  ({
    id: "passwordless",
    // Throttle PIN guessing. Better Auth's built-in /sign-in* rule (3 req / 10s)
    // already covers this path in production, but PINs are only 4-8 digits, so we
    // tighten it to 5 attempts per minute per IP and make the intent explicit in
    // code. Rate limiting is only active when enabled (on by default in
    // production); a household running the Docker image gets it automatically.
    rateLimit: [
      { pathMatcher: (path: string) => path === "/sign-in/passwordless", window: 60, max: 5 },
    ],
    endpoints: {
      signInPasswordless: createAuthEndpoint(
        "/sign-in/passwordless",
        {
          method: "POST",
          body: z.object({ userId: z.string(), pin: z.string().optional() }),
        },
        async (ctx) => {
          const user = await ctx.context.internalAdapter.findUserById(
            ctx.body.userId,
          );
          if (!user) {
            throw new APIError("NOT_FOUND", { message: "Profile not found." });
          }

          // Read the hash directly so we never depend on the adapter surfacing a
          // custom column to the session-shaped user object.
          const [row] = await db
            .select({ pinHash: userTable.pinHash })
            .from(userTable)
            .where(eq(userTable.id, ctx.body.userId))
            .limit(1);
          const pinHash = row?.pinHash ?? null;

          if (pinHash) {
            if (!ctx.body.pin) {
              throw new APIError("UNAUTHORIZED", { message: "PIN required." });
            }
            const ok = await verifyPassword(pinHash, ctx.body.pin);
            if (!ok) {
              throw new APIError("UNAUTHORIZED", { message: "Incorrect PIN." });
            }
          }

          const session = await ctx.context.internalAdapter.createSession(
            user.id,
            false,
          );
          await setSessionCookie(ctx, { session, user });

          return ctx.json({ user });
        },
      ),
    },
  }) satisfies BetterAuthPlugin;
