import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/trackprep";

const config = {
  development: {
    client: "pg",
    connection: databaseUrl,
    migrations: {
      directory: join(__dirname, "src/db/migrations"),
      extension: "ts",
      loadExtensions: [".ts"],
    },
    pool: { min: 2, max: 10 },
  },

  production: {
    client: "pg",
    connection: databaseUrl,
    migrations: {
      directory: join(__dirname, "src/db/migrations"),
      extension: "ts",
      loadExtensions: [".ts"],
    },
    pool: { min: 5, max: 20 },
  },
};

export default config;
