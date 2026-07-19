import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Tracks table
  await knex.schema.createTable("tracks", (table) => {
    table.uuid("id").primary();
    table.string("title").notNullable();
    table.string("artist").nullable();
    table.string("file_path").notNullable();
    table.string("file_name").notNullable();
    table.integer("file_size").notNullable();
    table.integer("duration_ms").nullable();
    table.float("bpm").nullable();
    table.string("key_camelot").nullable();
    table.string("key_note").nullable();
    table.integer("energy_level").nullable();
    table.text("waveform_data").nullable();
    table.enum("status", ["analyzing", "analyzed", "error"]).defaultTo("analyzing");
    table.timestamp("uploaded_at").defaultTo(knex.fn.now());
    table.timestamp("analyzed_at").nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.index("status");
    table.index("key_camelot");
  });

  // Playlists table
  await knex.schema.createTable("playlists", (table) => {
    table.uuid("id").primary();
    table.string("title").notNullable();
    table.text("description").nullable();
    table.integer("total_duration_ms").defaultTo(0);
    table.integer("total_tracks").defaultTo(0);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  // Playlist tracks join table
  await knex.schema.createTable("playlist_tracks", (table) => {
    table.uuid("id").primary();
    table.uuid("playlist_id").notNullable().references("id").inTable("playlists").onDelete("CASCADE");
    table.uuid("track_id").notNullable().references("id").inTable("tracks").onDelete("CASCADE");
    table.integer("position").notNullable();
    table.timestamp("added_at").defaultTo(knex.fn.now());
    table.unique(["playlist_id", "track_id"]);
    table.index("playlist_id");
  });

  // Convert presets table
  await knex.schema.createTable("convert_presets", (table) => {
    table.uuid("id").primary();
    table.string("name").notNullable().unique();
    table.string("format").notNullable();
    table.integer("sample_rate").notNullable();
    table.integer("bit_depth").nullable();
    table.float("loudness_lufs").nullable();
    table.text("description").nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });

  // Exports table
  await knex.schema.createTable("exports", (table) => {
    table.uuid("id").primary();
    table.uuid("playlist_id").notNullable().references("id").inTable("playlists").onDelete("CASCADE");
    table.uuid("preset_id").notNullable().references("id").inTable("convert_presets");
    table.enum("status", ["pending", "processing", "completed", "error"]).defaultTo("pending");
    table.string("output_path").nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("completed_at").nullable();
    table.index("status");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("exports");
  await knex.schema.dropTableIfExists("convert_presets");
  await knex.schema.dropTableIfExists("playlist_tracks");
  await knex.schema.dropTableIfExists("playlists");
  await knex.schema.dropTableIfExists("tracks");
}
