import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const dbPath = process.env.DATABASE_PATH ?? "./data/data.db";

type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

let _db: DrizzleDB | undefined;

function getDb(): DrizzleDB {
  if (!_db) {
    const sqlite = new Database(dbPath);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    _db = drizzle(sqlite, { schema });
  }
  return _db;
}

// Lazy proxy: defers SQLite file open until first use at request time,
// preventing SQLITE_BUSY races when Next.js build workers import this module.
export const db = new Proxy({} as DrizzleDB, {
  get(_, prop: string | symbol) {
    return (getDb() as any)[prop];
  },
});

export type DB = typeof db;
