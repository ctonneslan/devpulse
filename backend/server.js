/**
 * @fileoverview DevPulse API server entry point.
 * Initializes the Express application, establishes database connection,
 * and starts the HTTP server with graceful shutdown handlers.
 * @module server
 */

import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app.js";
import { testConnection } from "./config/db.js";

const app = createApp();
const PORT = process.env.PORT || 3000;

/**
 * Starts the DevPulse API server with database connection and graceful shutdown handlers.
 *
 * @async
 * @function startServer
 * @throws {Error} If database connection fails or server cannot start
 * @returns {Promise<void>}
 *
 * @description
 * - Tests database connection before starting server
 * - Starts HTTP server on configured PORT
 * - Registers SIGTERM handler for graceful shutdown
 * - Registers unhandledRejection handler to prevent crashes
 * - Exits process if startup fails
 */
async function startServer() {
  try {
    await testConnection();

    const server = app.listen(PORT, () => {
      console.log(`🚀 DevPulse API running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    });

    // Graceful shutdown handlers
    process.on("SIGTERM", () => {
      console.log("SIGTERM received, shutting down gracefully");
      server.close(() => {
        console.log("Process terminated");
      });
    });

    // Handle unhandled promise rejections to prevent crashes
    process.on("unhandledRejection", (err) => {
      console.error("Unhandled rejection", err);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
