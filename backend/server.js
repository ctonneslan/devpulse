import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app.js";

const app = createApp();

const PORT = process.env.PORT || 3000;

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
