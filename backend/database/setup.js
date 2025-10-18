import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  try {
    console.log("📦 Setting up database schema...");

    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    await pool.query(schema);

    console.log("✅ Database schema created successfully");

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error setting up database:", error);
    await pool.end();
    process.exit(1);
  }
}

setupDatabase();
