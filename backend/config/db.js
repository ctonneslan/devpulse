import pg from "pg";

const { Pool } = pg;

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

pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("❌ Unexpected error on database pool", err);
  process.exit(-1);
});

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
