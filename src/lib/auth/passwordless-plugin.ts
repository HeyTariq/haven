import { createAuthEndpoint, APIError } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import type { BetterAuthPlugin } from "better-auth";
import * as z from "zod";
import { getAuthMode } from "@/lib/settings";

// Mints a session for any user without a password, gated on passwordless auth mode.
// Identity is preserved; only the password challenge is skipped. The endpoint is
// intentionally unauthenticated (no session middleware) since it is the sign-in path.
export const passwordlessPlugin = () =>
  ({
    id: "passwordless",
    endpoints: {
      signInPasswordless: createAuthEndpoint(
        "/sign-in/passwordless",
        {
          method: "POST",
          body: z.object({ userId: z.string() }),
        },
        async (ctx) => {
          if ((await getAuthMode()) !== "passwordless") {
            throw new APIError("FORBIDDEN", {
              message: "Passwordless sign-in is disabled.",
            });
          }

          const user = await ctx.context.internalAdapter.findUserById(
            ctx.body.userId,
          );
          if (!user) {
            throw new APIError("NOT_FOUND", { message: "Profile not found." });
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
