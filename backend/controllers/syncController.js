/**
 * @fileoverview Sync controller for managing data synchronization operations.
 * Handles syncing GitHub data to the local database and retrieving sync statistics.
 * @module controllers/syncController
 */

import * as syncService from "../services/syncService.js";
import * as dbService from "../services/databaseService.js";

/**
 * Syncs a GitHub user profile to the local database.
 *
 * @async
 * @function syncProfile
 * @param {express.Request} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.username - GitHub username to sync
 * @param {express.Response} res - Express response object
 * @returns {Promise<void>}
 *
 * @description
 * - Fetches user profile from GitHub API
 * - Stores/updates user data in local database
 * - Creates sync log entry
 * - Returns 400 if username is missing
 * - Returns 500 if sync fails
 */
export async function syncProfile(req, res) {
  const { username } = req.params;
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    const user = await syncService.syncUserProfile(username);
    res.json({
      success: true,
      message: `Profile synced for ${username}`,
      data: user,
    });
  } catch (error) {
    console.error("Sync profile error:", error.message);
    res
      .status(500)
      .json({ error: "Failed to sync profile", message: error.message });
  }
}

/**
 * Syncs a user's GitHub repositories to the local database.
 *
 * @async
 * @function syncRepos
 * @param {express.Request} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.username - GitHub username to sync repositories for
 * @param {express.Response} res - Express response object
 * @returns {Promise<void>}
 *
 * @description
 * - Fetches repositories from GitHub API
 * - Upserts repository data in local database
 * - Creates sync log entry
 * - Returns count of synced repositories
 * - Returns 400 if username is missing
 * - Returns 500 if sync fails
 */
export async function syncRepos(req, res) {
  const { username } = req.params;
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    const count = await syncService.syncUserRepositories(username);
    res.json({
      success: true,
      message: `Synced ${count} repositories for ${username}`,
      count,
    });
  } catch (error) {
    console.error("Sync repositories error:", error.message);
    res
      .status(500)
      .json({ error: "Failed to sync repositories", message: error.message });
  }
}

/**
 * Syncs a user's GitHub events/activity to the local database.
 *
 * @async
 * @function syncEvents
 * @param {express.Request} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.username - GitHub username to sync events for
 * @param {express.Response} res - Express response object
 * @returns {Promise<void>}
 *
 * @description
 * - Fetches recent events from GitHub API
 * - Inserts new events into local database
 * - Creates sync log entry
 * - Returns count of newly synced events
 * - Returns 400 if username is missing
 * - Returns 500 if sync fails
 */
export async function syncEvents(req, res) {
  const { username } = req.params;
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    const count = await syncService.syncUserEvents(username);
    res.json({
      success: true,
      message: `Synced ${count} events for ${username}`,
      count,
    });
  } catch (error) {
    console.error("Sync events error:", error.message);
    res
      .status(500)
      .json({ error: "Failed to sync events", message: error.message });
  }
}

/**
 * Performs a complete sync of profile, repositories, and events.
 *
 * @async
 * @function syncComplete
 * @param {express.Request} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.username - GitHub username to perform complete sync for
 * @param {express.Response} res - Express response object
 * @returns {Promise<void>}
 *
 * @description
 * - Syncs profile, repositories, and events in sequence
 * - Returns aggregated results including counts
 * - Returns 400 if username is missing
 * - Returns 500 if any sync step fails
 */
export async function syncComplete(req, res) {
  const { username } = req.params;
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    const result = await syncService.syncUserComplete(username);
    res.json({
      success: true,
      message: `Complete sync finished for ${username}`,
      data: result,
    });
  } catch (error) {
    console.error(`Complete sync error:`, error.message);
    res
      .status(500)
      .json({ error: "Failed to complete sync", message: error.message });
  }
}

/**
 * Retrieves database statistics.
 *
 * @async
 * @function getStats
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {Promise<void>}
 *
 * @description
 * - Returns total counts for users, repositories, and events in database
 * - Returns 500 if retrieval fails
 */
export async function getStats(req, res) {
  try {
    const stats = await dbService.getDatabaseStatistics();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get stats error:", error.message);
    res
      .status(500)
      .json({ error: "Failed to get statistics", message: error.message });
  }
}
