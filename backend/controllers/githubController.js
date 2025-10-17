import * as githubService from "../services/githubService.js";

export async function getUser(req, res) {
  const { username } = req.params;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    const userData = await githubService.getUserProfile(username);

    res.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error("Error in getUser controller:", error.message);

    if (error.message.includes("not found")) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes("rate limit")) {
      res.status(429).json({ error: error.message });
    } else {
      res
        .status(500)
        .json({ error: "Failed to fetch user data", message: error.message });
    }
  }
}

export async function getEvents(req, res) {
  const { username } = req.params;

  const limit = parseInt(req.query.limit) || 30;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  if (limit < 1 || limit > 100) {
    return res.status(400).json({ error: "Limit must be between 1 and 100" });
  }

  try {
    const events = await githubService.getUserEvents(username, limit);

    res.json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error("Error in getEvents controller:", error.message);
    if (error.message.includes("not found")) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes("rate limit")) {
      res.status(429).json({ error: error.message });
    } else {
      res.status(500).json({
        error: "Failed to fetch events",
        message: error.message,
      });
    }
  }
}

export async function getRepositories(req, res) {
  const { username } = req.params;

  const limit = parseInt(req.query.limit) || 30;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  if (limit < 1 || limit > 100) {
    return res.status(400).json({ error: "Limit must be between 1 and 100" });
  }

  try {
    const repos = await githubService.getUserRepositories(username, limit);

    res.json({
      success: true,
      count: repos.length,
      data: repos,
    });
  } catch (error) {
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

export async function checkRateLimit(req, res) {
  try {
    const rateLimit = await githubService.getRateLimit();

    res.json({
      success: true,
      data: rateLimit,
    });
  } catch (error) {
    console.error("Error checking rate limit:", error.message);
    res
      .status(500)
      .json({ error: "Failed to check rate limit", message: error.message });
  }
}
