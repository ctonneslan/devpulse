/**
 * @fileoverview Database schema setup script.
 * Reads and executes the SQL schema file to initialize database tables.
 * This is a standalone script meant to be run during initial setup or migrations.
 * @module database/setup
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Sets up the database schema by executing the schema.sql file.
 *
 * @async
 * @function setupDatabase
 * @returns {Promise<void>}
 * @throws {Error} If schema file cannot be read or SQL execution fails
 *
 * @description
 * - Reads the schema.sql file from the same directory
 * - Executes the SQL commands to create tables
 * - Closes the database pool connection
 * - Exits the process with appropriate status code
 *
 * @example
 * // Run this script with:
 * // node backend/database/setup.js
 */
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
