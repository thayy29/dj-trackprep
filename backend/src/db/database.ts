import knex, { Knex } from "knex";
import { logger } from "../logger.js";

let db: Knex | null = null;

export async function initializeDatabase(): Promise<Knex> {
  if (db) return db;

  const environment = process.env.NODE_ENV || "development";
  const knexConfig = require("../../knexfile.ts")[environment];

  db = knex(knexConfig);

  try {
    // Test connection
    await db.raw("SELECT 1");
    logger.info("✓ Database connected successfully");

    // Run pending migrations
    await db.migrate.latest();
    logger.info("✓ Migrations applied");

    return db;
  } catch (error) {
    logger.error("Failed to initialize database:", error);
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
