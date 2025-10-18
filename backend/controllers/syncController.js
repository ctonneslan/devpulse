import * as syncService from "../services/syncService.js";
import * as dbService from "../services/databaseService.js";

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
