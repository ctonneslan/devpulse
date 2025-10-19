/**
 * @fileoverview Sync API routes for DevPulse application.
 * Defines Express routes for syncing GitHub data to the local database
 * and retrieving sync statistics.
 * @module routes/sync
 */

import express from "express";
import {
  syncProfile,
  syncRepos,
  syncEvents,
  syncComplete,
  getStats,
} from "../controllers/syncController.js";

/**
 * Express router for sync-related endpoints.
 * @type {express.Router}
 */
const router = express.Router();

/**
 * POST /profile/:username
 * Syncs GitHub user profile data to the local database.
 * @name SyncProfile
 * @route {POST} /profile/:username
 * @routeparam {string} username - GitHub username to sync profile for
 */
router.post("/profile/:username", syncProfile);

/**
 * POST /repos/:username
 * Syncs GitHub repositories to the local database.
 * @name SyncRepos
 * @route {POST} /repos/:username
 * @routeparam {string} username - GitHub username to sync repositories for
 */
router.post("/repos/:username", syncRepos);

/**
 * POST /events/:username
 * Syncs GitHub events/activity to the local database.
 * @name SyncEvents
 * @route {POST} /events/:username
 * @routeparam {string} username - GitHub username to sync events for
 */
router.post("/events/:username", syncEvents);

/**
 * POST /complete/:username
 * Performs a complete sync of profile, repositories, and events.
 * @name SyncComplete
 * @route {POST} /complete/:username
 * @routeparam {string} username - GitHub username to perform complete sync for
 */
router.post("/complete/:username", syncComplete);

/**
 * GET /stats
 * Retrieves database statistics (total users, repos, events).
 * @name GetStats
 * @route {GET} /stats
 */
router.get("/stats", getStats);

export default router;
