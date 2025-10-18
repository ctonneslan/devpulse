import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import { fileURLToPath } from "url";
import path from "path";
import githubRoutes from "./routes/github.js";
import syncRoutes from "./routes/sync.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "devpulse",
      timeStamp: new Date().toISOString(),
    });
  });

  // Root endpoint - basic info about the API
  app.get("/", (req, res) => {
    res.json({
      message: "DevPulse API - Developer Activity Tracker",
      version: "1.0.0",
      endpoints: {
        health: "/api/health",
        githubUser: "/api/github/user/:username",
        githubEvents: "/api/github/events/:username",
        githubRepos: "/api/github/repos/:username",
        rateLimit: "/api/github/rate-limit",
        syncProfile: "POST /api/sync/profile/:username",
        syncRepos: "POST /api/sync/repos/:username",
        syncEvents: "POST /api/sync/events/:username",
        syncComplete: "POST /api/sync/complete/:username",
        stats: "/api/sync/stats",
      },
    });
  });

  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error("Error:", err.stack);

    res.status(500).json({
      error: "Something went wrong",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  });

  return app;
}
