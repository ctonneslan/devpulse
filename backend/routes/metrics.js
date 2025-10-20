import express from "express";
import * as metricsService from "../services/metricsService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    res.set("Content-Type", metricsService.register.contentType);
    const metrics = await metricsService.getMetrics();
    res.send(metrics);
  } catch (error) {
    console.error("Error generating metrics:", error);
    res.status(500).send("Error generating metrics");
  }
});

router.get("/json", async (req, res) => {
  try {
    const metrics = await metricsService.getMetricsJSON();
    res.json(metrics);
  } catch (error) {
    console.error("Error generating metrics JSON:", error);
    res.status(500).json({ error: "Error generating metrics" });
  }
});

export default router;
