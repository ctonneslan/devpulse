import * as dbService from "./databaseService.js";
import * as githubService from "./githubService.js";
import * as metricsService from "./metricsService.js";

let intervalId = null;

/**
 * Start the metrics updater
 * Runs the update function every X seconds
 *
 * @param {number} intervalSeconds - How often to update (default: 60s)
 */
export function startMetricsUpdater(intervalSeconds = 60) {
  console.log(`📊 Starting metrics updater (every ${intervalSeconds}s)...`);

  // Run immediately on start (don't wait for first interval)
  updateMetrics();

  // Then run periodically
  // setInterval() runs a function repeatedly with a delay
  intervalId = setInterval(updateMetrics, intervalSeconds * 1000);
}

/**
 * Stop the metrics updater
 * Called during graceful shutdown
 */
export function stopMetricsUpdater() {
  if (intervalId) {
    // clearInterval() stops the repeating function
    clearInterval(intervalId);
    intervalId = null;
    console.log("📊 Metrics updater stopped");
  }
}

/**
 * Update all gauge metrics
 * This function runs periodically to refresh gauge values
 */
async function updateMetrics() {
  try {
    // 1. Update cached users count
    // This tells us how many users we're tracking
    const stats = await dbService.getDatabaseStats();
    metricsService.updateCachedUsersCount(stats.totalUsers);

    // 2. Update GitHub rate limit
    // This tells us how many API calls we have left
    try {
      const rateLimit = await githubService.getRateLimit();
      metricsService.updateGithubRateLimit(rateLimit.remaining);

      console.log(
        `✓ Metrics updated: ${stats.totalUsers} cached users, ${rateLimit.remaining} API calls remaining`
      );
    } catch (error) {
      // Don't fail the entire update if rate limit check fails
      // Just log the error and continue
      console.error("Failed to update rate limit metric:", error.message);

      // Still log that we updated user count
      console.log(`✓ Metrics updated: ${stats.totalUsers} cached users`);
    }
  } catch (error) {
    // If the entire update fails, log it and record as error
    console.error("Error updating metrics:", error.message);
    metricsService.recordError("metrics_updater");
  }
}
