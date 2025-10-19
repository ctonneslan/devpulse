/**
 * @fileoverview Express application factory for DevPulse API.
 * Configures middleware, routes, and error handling for the application.
 * @module app
 */

import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import { fileURLToPath } from "url";
import path from "path";
import githubRoutes from "./routes/github.js";
import syncRoutes from "./routes/sync.js";
import cacheRoutes from "./routes/cache.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Creates and configures an Express application instance.
 *
 * @function createApp
 * @returns {express.Application} Configured Express application
 *
 * @description
 * Configures the following:
 * - Middleware: CORS, Morgan (logging), Helmet (security), JSON parsing
 * - Routes: GitHub API routes (/api/github/*), Sync routes (/api/sync/*)
 * - Health check endpoint (/api/health)
 * - API documentation endpoint (/)
 * - Global error handler
 */
export function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(morgan("dev"));
  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Endpoints
  app.use("/api/github", githubRoutes);
  app.use("/api/sync", syncRoutes);
  app.use("/api/cache", cacheRoutes);

  /**
   * GET /api/health
   * Health check endpoint to verify API availability.
   * @name HealthCheck
   * @route {GET} /api/health
   * @returns {Object} Status object with service name and timestamp
   */
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "devpulse",
      timeStamp: new Date().toISOString(),
    });
  });

  /**
   * GET /
   * Root endpoint providing API documentation and available endpoints.
   * @name ApiInfo
   * @route {GET} /
   * @returns {Object} API metadata including version and endpoint list
   */
  app.get("/", (req, res) => {
    res.json({
      message: "DevPulse API - Developer Activity Tracker",
      version: "1.0.0",
      endpoints: {
        health: "GET /api/health",
        github: {
          user: "GET /api/github/user/:username",
          events: "GET /api/github/events/:username",
          repos: "GET /api/github/repos/:username",
          stats: "GET /api/github/stats/:username",
          rateLimit: "GET /api/github/rate-limit",
        },
        sync: {
          profile: "POST /api/sync/profile/:username",
          repos: "POST /api/sync/repos/:username",
          events: "POST /api/sync/events/:username",
          complete: "POST /api/sync/complete/:username",
          stats: "GET /api/sync/stats",
        },
        cache: {
          clear: "DELETE /api/cache/user/:username",
          refresh: "POST /api/cache/refresh/:username",
          info: "GET /api/cache/info/:username",
          users: "GET /api/cache/users",
        },
      },
    });
  });

  /**
   * Global error handler middleware.
   * Catches all errors and returns appropriate error response.
   * Shows error details in development mode only.
   *
   * @param {Error} err - Error object
   * @param {express.Request} req - Express request object
   * @param {express.Response} res - Express response object
   * @param {express.NextFunction} next - Express next middleware function
   */
  app.use((err, req, res, next) => {
    console.error("Error:", err.stack);

    res.status(500).json({
      error: "Something went wrong",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  });

  return app;
}
