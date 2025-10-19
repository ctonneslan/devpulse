/**
 * @fileoverview Database service for managing PostgreSQL data operations.
 * Provides CRUD operations for users, repositories, events, and sync logs.
 * @module services/databaseService
 */

import pool from "../config/db.js";

/**
 * Retrieves a user from the database by username.
 *
 * @async
 * @function getUserByUsername
 * @param {string} username - GitHub username to search for
 * @returns {Promise<Object|null>} User object if found, null otherwise
 * @throws {Error} If database query fails
 */
export async function getUserByUsername(username) {
  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error finding user:", error);
    throw error;
  }
}

/**
 * Inserts or updates a user in the database.
 *
 * @async
 * @function upsertUser
 * @param {Object} userData - User data to insert/update
 * @param {string} userData.username - GitHub username
 * @param {number} userData.github_id - GitHub user ID
 * @param {string} userData.name - User's display name
 * @param {string} userData.avatar_url - Avatar image URL
 * @param {string} userData.bio - User biography
 * @param {number} userData.public_repos - Number of public repositories
 * @param {number} userData.followers - Number of followers
 * @param {number} userData.following - Number of users being followed
 * @param {string} userData.created_at - Account creation timestamp
 * @param {string} userData.updated_at - Last update timestamp
 * @returns {Promise<Object>} The inserted or updated user record
 * @throws {Error} If database operation fails
 *
 * @description
 * Uses ON CONFLICT to update existing records or insert new ones.
 * Updates all fields except username and github_id on conflict.
 */
export async function upsertUser(userData) {
  try {
    const {
      username,
      github_id,
      name,
      avatar_url,
      bio,
      public_repos,
      followers,
      following,
      created_at,
      updated_at,
    } = userData;

    const result = await pool.query(
      `
        INSERT INTO users
        (username, github_id, name, avatar_url, bio, public_repos, followers, following, github_created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (username)
        DO UPDATE SET
            name = EXCLUDED.name,
            avatar_url = EXCLUDED.avatar_url,
            bio = EXCLUDED.bio,
            public_repos = EXCLUDED.public_repos,
            followers = EXCLUDED.followers,
            following = EXCLUDED.following,
            updated_at = CURRENT_TIMESTAMP
        RETURNING *`,
      [
        username,
        github_id,
        name,
        avatar_url,
        bio,
        public_repos,
        followers,
        following,
        created_at,
        updated_at,
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

/**
 * Retrieves all users from the database, ordered by creation date.
 *
 * @async
 * @function getAllUsers
 * @returns {Promise<Array<Object>>} Array of user objects
 * @throws {Error} If database query fails
 */
export async function getAllUsers() {
  try {
    const result = await pool.query(
      "SELECT * FROM users ORDER BY created_at DESC"
    );
    return result.rows;
  } catch (error) {
    console.error("Error getting all users:", error);
    throw error;
  }
}

/**
 * Inserts or updates multiple repositories in the database in bulk.
 *
 * @async
 * @function upsertRepositories
 * @param {number} userId - Database ID of the user who owns these repositories
 * @param {Array<Object>} repos - Array of repository objects to insert/update
 * @param {number} repos[].id - GitHub repository ID
 * @param {string} repos[].name - Repository name
 * @param {string} repos[].full_name - Full repository name (owner/repo)
 * @param {string} repos[].description - Repository description
 * @param {string} repos[].language - Primary programming language
 * @param {number} repos[].stargazers_count - Number of stars
 * @param {number} repos[].forks_count - Number of forks
 * @param {number} repos[].open_issues_count - Number of open issues
 * @param {string} repos[].created_at - Repository creation timestamp
 * @param {string} repos[].updated_at - Last update timestamp
 * @returns {Promise<number>} Number of repositories affected
 * @throws {Error} If database operation fails
 *
 * @description
 * Performs bulk insert/update using a single query for efficiency.
 * Uses ON CONFLICT to update existing repositories or insert new ones.
 * Returns 0 if repos array is empty or null.
 */
export async function upsertRepositories(userId, repos) {
  if (!repos || repos.length === 0) {
    return 0;
  }

  try {
    const values = [];
    const placeholders = [];

    repos.forEach((repo, index) => {
      const offset = index * 11;

      values.push(
        repo.id,
        userId,
        repo.name,
        repo.full_name,
        repo.description,
        repo.language,
        repo.stargazers_count,
        repo.forks_count,
        repo.open_issues_count,
        repo.created_at,
        repo.updated_at
      );

      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${
          offset + 5
        }, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${
          offset + 10
        }, $${offset + 11})`
      );
    });

    const query = `
        INSERT INTO repositories (
            github_id, user_id, name, full_name, description,
            language, stargazers_count, forks_count,
            open_issues_count, github_created_at, github_updated_at
        ) VALUES ${placeholders.join(", ")}
         ON CONFLICT (github_id)
         DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            language = EXCLUDED.language,
            stargazers_count = EXCLUDED.stargazers_count,
            forks_count = EXCLUDED.forks_count,
            open_issues_count = EXCLUDED.open_issues_count,
            github_updated_at = EXCLUDED.github_updated_at,
            updated_at = CURRENT_TIMESTAMP
        RETURNING id
    `;

    const result = await pool.query(query, values);
    return result.rowCount; // Number of rows affected
  } catch (error) {
    console.error("Error upserting repositories:", error);
    throw error;
  }
}

/**
 * Retrieves repositories for a specific user.
 *
 * @async
 * @function getRepositoriesByUserId
 * @param {number} userId - Database ID of the user
 * @param {number} [limit=30] - Maximum number of repositories to return
 * @returns {Promise<Array<Object>>} Array of repository objects, ordered by most recently updated
 * @throws {Error} If database query fails
 */
export async function getRepositoriesByUserId(userId, limit = 30) {
  try {
    const result = await pool.query(
      `
        SELECT * FROM repositories
        WHERE user_id = $1
        ORDER BY github_updated_at DESC
        LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  } catch (error) {
    console.error("Error getting repositories:", error);
    throw error;
  }
}

/**
 * Inserts multiple events into the database in bulk.
 *
 * @async
 * @function insertEvents
 * @param {number} userId - Database ID of the user who generated these events
 * @param {Array<Object>} events - Array of event objects to insert
 * @param {string} events[].id - GitHub event ID
 * @param {string} events[].type - Event type (e.g., PushEvent, IssueEvent)
 * @param {string} events[].repo - Repository name
 * @param {Object} events[].payload - Event payload data
 * @param {string} events[].created_at - Event creation timestamp
 * @returns {Promise<number>} Number of new events inserted (duplicates are ignored)
 * @throws {Error} If database operation fails
 *
 * @description
 * Performs bulk insert using a single query for efficiency.
 * Uses ON CONFLICT DO NOTHING to skip duplicate events.
 * Returns 0 if events array is empty or null.
 */
export async function insertEvents(userId, events) {
  if (!events || events.length === 0) {
    return 0;
  }

  try {
    const values = [];
    const placeholders = [];

    events.forEach((event, index) => {
      const offset = index * 6;

      values.push(
        event.id,
        userId,
        event.type,
        event.repo,
        JSON.stringify(event.payload),
        event.created_at
      );

      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${
          offset + 5
        }, $${offset + 6})`
      );
    });

    const query = `
        INSERT INTO events (
        github_id, user_id, event_type, repo_name, payload, github_created_at)
        VALUES ${placeholders.join(", ")}
        ON CONFLICT (github_id) DO NOTHING
        RETURNING id`;

    const result = await pool.query(query, values);
    return result.rowCount;
  } catch (error) {
    console.error("Error inserting events:", error);
    throw error;
  }
}

/**
 * Retrieves events for a specific user.
 *
 * @async
 * @function getEventsByUserId
 * @param {number} userId - Database ID of the user
 * @param {number} [limit=30] - Maximum number of events to return
 * @returns {Promise<Array<Object>>} Array of event objects, ordered by most recent
 * @throws {Error} If database query fails
 */
export async function getEventsByUserId(userId, limit = 30) {
  try {
    const result = await pool.query(
      "SELECT * FROM events WHERE user_id = $1 ORDER BY github_created_at DESC LIMIT $2",
      [userId, limit]
    );
    return result.rows;
  } catch (error) {
    console.error("Error getting events:", error);
    throw error;
  }
}

/**
 * Retrieves event statistics grouped by event type for a user.
 *
 * @async
 * @function getEventStatsByUserId
 * @param {number} userId - Database ID of the user
 * @returns {Promise<Object>} Object with event types as keys and counts as values
 * @throws {Error} If database query fails
 *
 * @example
 * // Returns: { "PushEvent": 42, "IssuesEvent": 15, "PullRequestEvent": 8 }
 */
export async function getEventStatsByUserId(userId) {
  try {
    const result = await pool.query(
      `
        SELECT event_type, COUNT(*) as count
        FROM events
        WHERE user_id = $1
        GROUP BY event_type
        ORDER BY count DESC`,
      [userId]
    );

    const stats = {};
    result.rows.forEach((row) => {
      stats[row.event_type] = parseInt(row.count);
    });

    return stats;
  } catch (error) {
    console.error("Error getting event statistics:", error);
    throw error;
  }
}

/**
 * Creates a new sync log entry.
 *
 * @async
 * @function createSyncLog
 * @param {number} userId - Database ID of the user
 * @param {string} syncType - Type of sync operation (e.g., "profile", "repos", "events")
 * @param {string} [status="started"] - Initial status of the sync
 * @param {number} [recordsSynced=0] - Number of records synced (0 at start)
 * @param {string|null} [errorMessage=null] - Error message if sync failed
 * @returns {Promise<Object>} The created sync log record
 * @throws {Error} If database operation fails
 */
export async function createSyncLog(
  userId,
  syncType,
  status = "started",
  recordsSynced = 0,
  errorMessage = null
) {
  try {
    const result = await pool.query(
      `
        INSERT INTO sync_logs (
            user_id, sync_type, status, records_synced, error_message)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
      [userId, syncType, status, recordsSynced, errorMessage]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error creating sync log:", error);
    throw error;
  }
}

/**
 * Updates an existing sync log entry with completion information.
 *
 * @async
 * @function updateSyncLog
 * @param {number} syncLogId - ID of the sync log to update
 * @param {string} status - Final status ("success" or "failed")
 * @param {number} recordsSynced - Number of records successfully synced
 * @param {string|null} [errorMessage=null] - Error message if sync failed
 * @returns {Promise<void>}
 * @throws {Error} If database operation fails
 */
export async function updateSyncLog(
  syncLogId,
  status,
  recordsSynced,
  errorMessage = null
) {
  try {
    await pool.query(
      `
        UPDATE sync_logs
        SET status = $1,
            records_synced = $2,
            error_message = $3,
            completed_at = CURRENT_TIMESTAMP
        WHERE id = $4`,
      [status, recordsSynced, errorMessage, syncLogId]
    );
  } catch (error) {
    console.error("Error updating sync log:", error);
    throw error;
  }
}

/**
 * Retrieves sync logs for a specific user.
 *
 * @async
 * @function getSyncLogsByUserId
 * @param {number} userId - Database ID of the user
 * @param {number} [limit=10] - Maximum number of sync logs to return
 * @returns {Promise<Array<Object>>} Array of sync log objects, ordered by most recent
 * @throws {Error} If database query fails
 */
export async function getSyncLogsByUserId(userId, limit = 10) {
  try {
    const result = await pool.query(
      `
        SELECT * FROM sync_logs
        WHERE user_id = $1
        ORDER BY started_at DESC
        LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  } catch (error) {
    console.error("Error getting sync logs:", error);
    throw error;
  }
}

/**
 * Checks if cached data is stale and needs refreshing.
 *
 * @async
 * @function isDataStale
 * @param {string|Date} lastUpdated - Timestamp of last update
 * @param {number} [maxAgeMinutes=60] - Maximum age in minutes before data is considered stale
 * @returns {boolean} True if data is stale or lastUpdated is null/undefined, false otherwise
 *
 * @example
 * const needsRefresh = isDataStale(user.updated_at, 30); // Check if older than 30 minutes
 */
export function isDataStale(lastUpdated, maxAgeMinutes = 60) {
  if (!lastUpdated) return true;

  const now = new Date();
  const updated = new Date(lastUpdated);
  const diffMinutes = (now - updated) / 1000 / 60;

  return diffMinutes > maxAgeMinutes;
}

/**
 * Retrieves overall database statistics.
 *
 * @async
 * @function getDatabaseStatistics
 * @returns {Promise<Object>} Statistics object
 * @returns {number} return.totalUsers - Total number of users in database
 * @returns {number} return.totalRepositories - Total number of repositories in database
 * @returns {number} return.totalEvents - Total number of events in database
 * @throws {Error} If database queries fail
 *
 * @description
 * Executes three count queries in parallel for efficiency.
 */
export async function getDatabaseStatistics() {
  try {
    const [usersResult, reposResult, eventsResult] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM users"),
      pool.query("SELECT COUNT(*) FROM repositories"),
      pool.query("SELECT COUNT(*) FROM events"),
    ]);

    return {
      totalUsers: parseInt(usersResult.rows[0].count),
      totalRepositories: parseInt(reposResult.rows[0].count),
      totalEvents: parseInt(eventsResult.rows[0].count),
    };
  } catch (error) {
    console.error("Error getting database statistics:", error);
    throw error;
  }
}
