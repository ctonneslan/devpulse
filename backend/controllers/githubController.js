import * as githubService from "../services/githubService.js";
import * as dbService from "../services/databaseService.js";
import * as syncService from "../services/syncService.js";
import * as metricsService from "../services/metricsService.js";

/**
 * Cache configuration for different data types (in minutes)
 * @type {Object}
 * @property {number} profile - Cache duration for user profiles
 * @property {number} repos - Cache duration for repositories
 * @property {number} events - Cache duration for events
 */
const CACHE_CONFIG = {
  profile: 60,
  repos: 30,
  events: 15,
};

/**
 * Get GitHub user profile with intelligent caching
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.username - GitHub username
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.refresh] - Force refresh if "true"
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @description Fetches user profile with cache-first strategy. Returns stale data if GitHub API fails.
 * Sets X-Cache headers (HIT/MISS/STALE) and X-Cache-Age for monitoring.
 */
export async function getUser(req, res) {
  const { username } = req.params;
  const forceRefresh = req.query.refresh === "true";

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    const cachedUser = await dbService.getUserByUsername(username);
    const needsRefresh =
      forceRefresh ||
      !cachedUser ||
      dbService.isDataStale(cachedUser.updated_at, CACHE_CONFIG.profile);

    if (needsRefresh) {
      metricsService.recordCacheOperation("miss");
      console.log(`♻️ Refreshing profile for ${username} from GitHub...`);
      try {
        const user = await syncService.syncUserProfile(username);
        res.setHeader("X-Cache", "MISS");
        res.setHeader("X-Cache-Reason", cachedUser ? "stale" : "not-found");
        return res.json({
          success: true,
          data: user,
          cached: false,
        });
      } catch (error) {
        if (cachedUser) {
          metricsService.recordCacheOperation("stale");
          console.log(
            `⚠️ GitHub fetch failed, returning stale cache for ${username}`
          );
          res.setHeader("X-Cache", "STALE");
          return res.json({
            success: true,
            data: cachedUser,
            cached: true,
            warning: "Returned stale data due to API error",
          });
        }
        throw error;
      }
    }
    metricsService.recordCacheOperation("hit");
    console.log(`✓ Serving ${username} profile from cache`);
    res.setHeader("X-Cache", "HIT");
    res.setHeader(
      "X-Cache-Age",
      Math.floor((Date.now() - new Date(cachedUser.updated_at)) / 1000 / 60) +
        "m"
    );
    res.json({
      success: true,
      data: cachedUser,
      cached: true,
    });
  } catch (error) {
    metricsService.recordError("controller");
    console.error("Error in getUser controller:", error.message);
    if (error.message.includes("not found")) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes("rate limit")) {
      res.status(429).json({ error: error.message });
    } else {
      res.status(500).json({
        error: "Failed to fetch user data",
        message: error.message,
      });
    }
  }
}

/**
 * Get GitHub user events with intelligent caching
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.username - GitHub username
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.limit] - Maximum number of events (1-100, default: 30)
 * @param {string} [req.query.refresh] - Force refresh if "true"
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @description Fetches user events with cache-first strategy. Auto-syncs if user not found.
 * Returns stale data if GitHub API fails. Sets X-Cache headers for monitoring.
 */
export async function getEvents(req, res) {
  const { username } = req.params;
  const limit = parseInt(req.query.limit) || 30;
  const forceRefresh = req.query.refresh === "true";

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  if (limit < 1 || limit > 100) {
    return res.status(400).json({ error: "Limit must be between 1 and 100" });
  }

  try {
    const user = await dbService.getUserByUsername(username);
    if (!user) {
      metricsService.recordCacheOperation("miss");
      console.log(`📥 User ${username} not found, syncing...`);
      await syncService.syncUserComplete(username);
      const newUser = await dbService.getUserByUsername(username);
      const events = await dbService.getEventsByUserId(newUser.id, limit);

      res.setHeader("X-Cache", "MISS");
      return res.json({
        success: true,
        count: events.length,
        data: events,
        cached: false,
      });
    }

    const needsRefresh =
      forceRefresh ||
      dbService.isDataStale(user.updated_at, CACHE_CONFIG.events);

    if (needsRefresh) {
      metricsService.recordCacheOperation("miss");
      console.log(`♻️ Refreshing events for ${username}...`);

      try {
        await syncService.syncUserEvents(username);
        const events = await dbService.getEventsByUserId(user.id, limit);

        res.setHeader("X-Cache", "MISS");
        return res.json({
          success: true,
          count: events.length,
          data: events,
          cached: false,
        });
      } catch (error) {
        metricsService.recordCacheOperation("stale");
        console.log(
          `⚠️ Refresh failed, returning cached events for ${username}`
        );
        const events = await dbService.getEventsByUserId(user.id, limit);
        res.setHeader("X-Cache", "STALE");
        return res.json({
          success: true,
          count: events.length,
          data: events,
          cached: true,
          warning: "Returned stale data due to API error",
        });
      }
    }

    metricsService.recordCacheOperation("hit");
    console.log(`✓ Serving events for ${username} from cache...`);
    const events = await dbService.getEventsByUserId(user.id, limit);
    res.setHeader("X-Cache", "HIT");
    res.json({
      success: true,
      count: events.length,
      data: events,
      cached: true,
    });
  } catch (error) {
    metricsService.recordError("controller");
    console.error("Error in getEvents controller:", error.message);

    if (error.message.includes("not found")) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes("rate limit")) {
      res.status(429).json({ error: error.message });
    } else {
      res
        .status(500)
        .json({ error: "Failed to fetch events", message: error.message });
    }
  }
}

/**
 * Get GitHub user repositories with intelligent caching
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.username - GitHub username
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.limit] - Maximum number of repositories (1-100, default: 30)
 * @param {string} [req.query.refresh] - Force refresh if "true"
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @description Fetches user repositories with cache-first strategy. Auto-syncs if user not found.
 * Returns stale data if GitHub API fails. Sets X-Cache headers for monitoring.
 */
export async function getRepositories(req, res) {
  const { username } = req.params;
  const limit = parseInt(req.query.limit) || 30;
  const forceRefresh = req.query.refresh === "true";

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  if (limit < 1 || limit > 100) {
    return res.status(400).json({ error: "Limit must be between 1 and 100" });
  }

  try {
    const user = await dbService.getUserByUsername(username);
    if (!user) {
      metricsService.recordCacheOperation("miss");
      console.log(`📥 User ${username} not found, syncing...`);
      await syncService.syncUserComplete(username);
      const newUser = await dbService.getUserByUsername(username);
      const repos = await dbService.getRepositoriesByUserId(newUser.id, limit);
      res.setHeader("X-Cache", "MISS");
      return res.json({
        success: true,
        count: repos.length,
        data: repos,
        cached: false,
      });
    }

    const needsRefresh =
      forceRefresh ||
      dbService.isDataStale(user.updated_at, CACHE_CONFIG.repos);

    if (needsRefresh) {
      metricsService.recordCacheOperation("miss");
      console.log(`♻️ Refreshing repositories for ${username}...`);
      try {
        await syncService.syncUserRepositories(username);
        const repos = await dbService.getRepositoriesByUserId(user.id, limit);

        res.setHeader("X-Cache", "MISS");
        return res.json({
          success: true,
          count: repos.length,
          data: repos,
          cached: false,
        });
      } catch (error) {
        metricsService.recordCacheOperation("stale");
        console.log(
          `⚠️ Refresh failed, returning cached repos for ${username}`
        );
        const repos = await dbService.getRepositoriesByUserId(user.id, limit);
        res.setHeader("X-Cache", "STALE");
        return res.json({
          success: true,
          count: repos.length,
          data: repos,
          cached: true,
          warning: "Returning stale data due to API error",
        });
      }
    }

    metricsService.recordCacheOperation("hit");
    console.log(`✓ Serving repositories for ${username} from cache`);
    const repos = await dbService.getRepositoriesByUserId(user.id, limit);

    res.setHeader("X-Cache", "HIT");
    res.json({
      success: true,
      count: repos.length,
      data: repos,
      cached: true,
    });
  } catch (error) {
    metricsService.recordError("controller");
    console.error("Error in getRepositories controller:", error.message);
    if (error.message.includes("not found")) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes("rate limit")) {
      res.status(429).json({ error: error.message });
    } else {
      res.status(500).json({
        error: "Failed to fetch repositories",
        message: error.message,
      });
    }
  }
}

/**
 * Get aggregated event statistics for a user
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.username - GitHub username
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @description Returns event type breakdown and statistics from database.
 * User must be synced first - returns 404 if not found.
 */
export async function getEventStats(req, res) {
  const { username } = req.params;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    const user = await dbService.getUserByUsername(username);

    if (!user) {
      return res
        .status(404)
        .json({ error: `User ${username} not found. Sync data first.` });
    }

    const stats = await dbService.getEventStatsByUserId(user.id);

    res.json({
      success: true,
      username,
      data: stats,
    });
  } catch (error) {
    metricsService.recordError("controller");
    console.error("Error in getEventStats controller:", error.message);
    res.status(500).json({
      error: "Failed to fetch event statistics",
      message: error.message,
    });
  }
}

/**
 * Check GitHub API rate limit status
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @description Returns current GitHub API rate limit information including
 * remaining requests and reset time.
 */
export async function checkRateLimit(req, res) {
  try {
    const rateLimit = await githubService.getRateLimit();

    res.json({
      success: true,
      data: rateLimit,
    });
  } catch (error) {
    metricsService.recordError("controller");
    console.error("Error checking rate limit:", error.message);
    res
      .status(500)
      .json({ error: "Failed to check rate limit", message: error.message });
  }
}
