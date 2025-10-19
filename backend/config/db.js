/**
 * @fileoverview PostgreSQL database configuration and connection pool.
 * Manages database connections using pg Pool with environment-based configuration.
 * @module config/db
 */

import pg from "pg";

const { Pool } = pg;

/**
 * PostgreSQL connection pool instance.
 * Configured with connection string from environment variables.
 *
 * @type {pg.Pool}
 * @property {number} max - Maximum number of clients in the pool (20)
 * @property {number} idleTimeoutMillis - How long a client can remain idle before being closed (30 seconds)
 * @property {number} connectionTimeoutMillis - How long to wait when connecting a new client (2 seconds)
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Connection event handler.
 * Logs successful database connections.
 */
pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
});

/**
 * Error event handler.
 * Logs unexpected pool errors and exits the process.
 *
 * @param {Error} err - The error that occurred
 */
pool.on("error", (err) => {
  console.error("❌ Unexpected error on database pool", err);
  process.exit(-1);
});

/**
 * Tests the database connection by executing a simple query.
 *
 * @async
 * @function testConnection
 * @returns {Promise<boolean>} True if connection is successful
 * @throws {Error} If connection test fails
 *
 * @example
 * try {
 *   await testConnection();
 *   console.log('Database ready');
 * } catch (error) {
 *   console.error('Database unavailable');
 * }
 */
export async function testConnection() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ Database connection test successful", result.rows[0]);
    return true;
  } catch (error) {
    console.error("❌ Database connection test failed:", error.message);
    throw error;
  }
}

export default pool;
