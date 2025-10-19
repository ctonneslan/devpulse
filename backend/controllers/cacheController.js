/**
 * @fileoverview Cache management controller for DevPulse API.
 * Provides endpoints to manage cached GitHub data including clearing,
 * refreshing, and retrieving cache information.
 * @module controllers/cacheController
 */

import pool from "../config/db.js";
import * as dbService from "../services/databaseService.js";
import * as syncService from "../services/syncService.js";

/**
 * Clears all cached data for a specific user.
 * Deletes user and all associated data (repos, events) via CASCADE.
 *
 * @async
 * @function clearUserCache
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.username - GitHub username to clear from cache
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 *
 * @description
 * - Validates username parameter
 * - Checks if user exists in cache
 * - Deletes user record (CASCADE deletes repos and events)
 * - Returns success message
 *
 * @example
 * DELETE /api/cache/user/octocat
 * Response: { "success": true, "message": "Cache cleared for octocat" }
 */
export async function clearUserCache(req, res) {
  const { username } = req.params;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    const user = await dbService.getUserByUsername(username);

    if (!user) {
      return res
        .status(404)
        .json({ error: `User ${username} not found in cache` });
    }

    await pool.query("DELETE FROM users WHERE id = $1", [user.id]);

    res.json({
      success: true,
      message: `Cache cleared for ${username}`,
    });
  } catch (error) {
    console.error("Error clearing cache:", error.message);
    res.status(500).json({
      error: "Failed to clear cache",
      message: error.message,
    });
  }
}

/**
 * Manually refreshes all cached data for a specific user.
 * Fetches fresh data from GitHub API regardless of cache staleness.
 *
 * @async
 * @function refreshUserCache
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.username - GitHub username to refresh
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 *
 * @description
 * - Validates username parameter
 * - Calls syncUserComplete to fetch profile, repos, and events
 * - Returns refreshed user data with counts
 *
 * @example
 * POST /api/cache/refresh/octocat
 * Response: {
 *   "success": true,
 *   "message": "Cache refreshed for octocat",
 *   "data": { "user": {...}, "reposCount": 8, "eventsCount": 30 }
 * }
 */
export async function refreshUserCache(req, res) {
  const { username } = req.params;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    const result = await syncService.syncUserComplete(username);
    res.json({
      success: true,
      message: `Cache refreshed for ${username}`,
      data: result,
    });
  } catch (error) {
    console.error("Error refreshing cache:", error.message);
    res.status(500).json({
      error: "Failed to refresh cache",
      message: error.message,
    });
  }
}

/**
 * Retrieves detailed cache information for a specific user.
 * Shows cache age, data counts, and recent sync history.
 *
 * @async
 * @function getCacheInfo
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.username - GitHub username to get info for
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 *
 * @description
 * - Validates username parameter
 * - Checks if user exists in cache
 * - Retrieves counts for repos and events
 * - Fetches last 5 sync operations
 * - Calculates cache age in minutes
 * - Returns comprehensive cache metadata
 *
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
export async function getCacheInfo(req, res) {
  const { username } = req.params;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    const user = await dbService.getUserByUsername(username);
    if (!user) {
      return res.json({
        success: true,
        cached: false,
        message: `No cached data for ${username}`,
      });
    }

    const [reposResult, eventsResult, logsResult] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM repositories WHERE user_id = $1", [
        user.id,
      ]),
      pool.query("SELECT COUNT(*) FROM events WHERE user_id = $1", [user.id]),
      dbService.getSyncLogsByUserId(user.id, 5),
    ]);

    const cacheAgeMinutes = Math.floor(
      (Date.now() - new Date(user.updated_at)) / 1000 / 60
    );

    res.json({
      success: true,
      cached: true,
      data: {
        username: user.username,
        cachedSince: user.created_at,
        lastUpdated: user.updated_at,
        cacheAgeMinutes,
        repositories: parseInt(reposResult.rows[0].count),
        events: parseInt(eventsResult.rows[0].count),
        recentSyncs: logsResult,
      },
    });
  } catch (error) {
    console.error("Error getting cache info:", error.message);
    res
      .status(500)
      .json({ error: "Failed to get cache info", message: error.message });
  }
}

/**
 * Retrieves a list of all users currently in the cache.
 * Includes cache age metadata for each user.
 *
 * @async
 * @function getCachedUsers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 *
 * @description
 * - Fetches all users from database
 * - Calculates cache age for each user
 * - Returns list with username, name, last update, and age
 *
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
 *     },
 *     ...
 *   ]
 * }
 */
export async function getCachedUsers(req, res) {
  try {
    const users = await dbService.getAllUsers();
    const usersWithAge = users.map((user) => ({
      username: user.username,
      name: user.name,
      lastUpdated: user.updated_at,
      cacheAgeMinutes: Math.floor(
        (Date.now() - new Date(user.updated_at)) / 1000 / 60
      ),
    }));

    res.json({
      success: true,
      count: users.length,
      data: usersWithAge,
    });
  } catch (error) {
    console.error("Error getting cached users:", error.message);
    return res
      .status(500)
      .json({ error: "Failed to get cached users", message: error.message });
  }
}
