import express from "express";
import {
  getUser,
  getEvents,
  getRepositories,
  checkRateLimit,
} from "../controllers/githubController.js";

const router = express.Router();

router.get("/user/:username", getUser);
router.get("/events/:username", getEvents);
router.get("/repos/:username", getRepositories);
router.get("/rate-limit", checkRateLimit);

export default router;
