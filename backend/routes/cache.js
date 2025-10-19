/**
 * @fileoverview Cache management routes for DevPulse API.
 * Defines REST API endpoints for cache operations including
 * clearing, refreshing, and retrieving cache information.
 * @module routes/cache
 */

import express from "express";
import {
  clearUserCache,
  refreshUserCache,
  getCacheInfo,
  getCachedUsers,
} from "../controllers/cacheController.js";

const router = express.Router();

/**
 * @route DELETE /api/cache/user/:username
 * @description Clears all cached data for a specific GitHub user
 * @param {string} username - GitHub username to clear from cache
 * @returns {Object} Success message
 * @example
 * DELETE /api/cache/user/octocat
 * Response: { "success": true, "message": "Cache cleared for octocat" }
 */
router.delete("/user/:username", clearUserCache);

/**
 * @route POST /api/cache/refresh/:username
 * @description Manually refreshes all cached data for a user from GitHub API
 * @param {string} username - GitHub username to refresh
 * @returns {Object} Refreshed user data with repos and events counts
 * @example
 * POST /api/cache/refresh/octocat
 * Response: {
 *   "success": true,
 *   "message": "Cache refreshed for octocat",
 *   "data": { "user": {...}, "reposCount": 8, "eventsCount": 30 }
 * }
 */
router.post("/refresh/:username", refreshUserCache);

/**
 * @route GET /api/cache/info/:username
 * @description Gets detailed cache information for a specific user
 * @param {string} username - GitHub username to get info for
 * @returns {Object} Cache metadata including age, counts, and sync history
 * @example
 * GET /api/cache/info/octocat
 * Response: {
 *   "success": true,
 *   "cached": true,
 *   "data": {
 *     "username": "octocat",
 *     "cachedSince": "2025-10-18T23:42:28.873Z",
 *     "lastUpdated": "2025-10-19T16:57:27.453Z",
 *     "cacheAgeMinutes": 15,
 *     "repositories": 8,
 *     "events": 30,
 *     "recentSyncs": [...]
 *   }
 * }
 */
router.get("/info/:username", getCacheInfo);

/**
 * @route GET /api/cache/users
 * @description Lists all users currently in the cache with metadata
 * @returns {Object} Array of cached users with age information
 * @example
 * GET /api/cache/users
 * Response: {
 *   "success": true,
 *   "count": 3,
 *   "data": [
 *     {
 *       "username": "octocat",
 *       "name": "The Octocat",
 *       "lastUpdated": "2025-10-19T16:57:27.453Z",
 *       "cacheAgeMinutes": 15
 *     }
 *   ]
 * }
 */
router.get("/users", getCachedUsers);

export default router;
