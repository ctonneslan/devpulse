import pool from "../config/db.js";

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

export async function isDataStale(lastUpdated, maxAgeMinutes = 60) {
  if (!lastUpdated) return true;

  const now = new Date();
  const updated = new Date(lastUpdated);
  const diffMinutes = (now - updated) / 1000 / 60;

  return diffMinutes > maxAgeMinutes;
}

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
