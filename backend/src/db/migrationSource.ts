import type { Knex } from "knex";
import * as migration001 from "./migrations/001_initial_schema.js";

const migrations: Record<string, { up: (knex: Knex) => Promise<void>; down: (knex: Knex) => Promise<void> }> = {
  "001_initial_schema": migration001,
};

const migrationNames = Object.keys(migrations).sort();

export class InlineMigrationSource implements Knex.MigrationSource<string> {
  async getMigrations(): Promise<string[]> {
    return migrationNames;
  }

  getMigrationName(migration: string): string {
    return migration;
  }

  async getMigration(migration: string) {
    const found = migrations[migration];
    if (!found) {
      throw new Error(`Unknown migration: ${migration}`);
    }
    return found;
  }
}
