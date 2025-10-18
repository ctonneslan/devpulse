import express from "express";
import {
  syncProfile,
  syncRepos,
  syncEvents,
  syncComplete,
  getStats,
} from "../controllers/syncController.js";

const router = express.Router();

router.post("/profile/:username", syncProfile);
router.post("/repos/:username", syncRepos);
router.post("/events/:username", syncEvents);
router.post("/complete/:username", syncComplete);

router.get("/stats", getStats);

export default router;
