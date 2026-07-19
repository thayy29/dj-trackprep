import knex, { Knex } from "knex";
import { logger } from "../logger.js";
import { InlineMigrationSource } from "./migrationSource.js";
import { env } from "../env.js";

let db: Knex | null = null;

function buildConfig(): Knex.Config {
  if (env.NODE_ENV === "production" && process.env.DATABASE_URL) {
    return {
      client: "pg",
      connection: process.env.DATABASE_URL,
      pool: { min: 5, max: 20 },
    };
  }

  return {
    client: "pg",
    connection: {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: process.env.DB_NAME || "trackprep",
    },
    pool: { min: 2, max: 10 },
  };
}

export async function initializeDatabase(): Promise<Knex> {
  if (db) return db;

  db = knex(buildConfig());

  try {
    // Test connection
    await db.raw("SELECT 1");
    logger.info("✓ Database connected successfully");

    // Run pending migrations using an inline source (avoids requiring
    // .ts migration files at runtime, which Node's loader can't resolve)
    await db.migrate.latest({ migrationSource: new InlineMigrationSource() });
    logger.info("✓ Migrations applied");

    return db;
  } catch (error) {
    logger.error({ err: error }, "Failed to initialize database");
    throw error;
  }
}

export function getDb(): Knex {
  if (!db) {
    throw new Error("Database not initialized. Call initializeDatabase() first.");
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.destroy();
    db = null;
    logger.info("Database connection closed");
  }
}
