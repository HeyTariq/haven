import { lt } from "drizzle-orm";
import { session, verification } from "./schema/auth";
import type { DB } from "./index";

export function purgeExpiredAuthRecords(db: DB) {
  const now = new Date();
  db.delete(session).where(lt(session.expiresAt, now)).run();
  db.delete(verification).where(lt(verification.expiresAt, now)).run();
}
