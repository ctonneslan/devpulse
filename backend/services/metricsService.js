/**
 * Metrics service for tracking application performance and usage statistics.
 * Uses Prometheus client for metrics collection and exposition.
 * @module metricsService
 */

import client from "prom-client";

/** @type {client.Registry} Prometheus registry for all application metrics */
const register = new client.Registry();

// Collect default Node.js metrics (memory, CPU, event loop, etc.)
client.collectDefaultMetrics({
  register,
  prefix: "devpulse_",
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

const httpRequestsTotal = new client.Counter({
  name: "devpulse_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

const githubApiCallsTotal = new client.Counter({
  name: "devpulse_github_api_calls_total",
  help: "Total number of GitHub API calls",
  labelNames: ["endpoint", "status"],
  registers: [register],
});

const cacheOperationsTotal = new client.Counter({
  name: "devpulse_cache_operations_total",
  help: "Total cache operations",
  labelNames: ["operation"],
  registers: [register],
});

const dbQueriesTotal = new client.Counter({
  name: "devpulse_db_queries_total",
  help: "Total database queries",
  labelNames: ["operation", "table"],
  registers: [register],
});

const errorsTotal = new client.Counter({
  name: "devpulse_errors_total",
  help: "Total number of errors",
  labelNames: ["type"],
  registers: [register],
});

const activeRequests = new client.Gauge({
  name: "devpulse_active_requests",
  help: "Number of requests currently being processed",
  registers: [register],
});

const githubRateLimitRemaining = new client.Gauge({
  name: "devpulse_github_rate_limit_remaining",
  help: "GitHub API rate limit remaining",
  registers: [register],
});

const cachedUsersCount = new client.Gauge({
  name: "devpulse_cached_users_count",
  help: "Number of users in cache",
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: "devpulse_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

const dbQueryDuration = new client.Histogram({
  name: "devpulse_db_query_duration_seconds",
  help: "Database query duration in seconds",
  labelNames: ["operation", "table"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

const githubApiDuration = new client.Histogram({
  name: "devpulse_github_api_duration_seconds",
  help: "GitHub API call duration in seconds",
  labelNames: ["endpoint"],
  buckets: [0.5, 1, 2, 5, 10],
  registers: [register],
});

const syncDuration = new client.Summary({
  name: "devpulse_sync_duration_seconds",
  help: "Duration of sync operations",
  labelNames: ["sync_type", "status"],
  percentiles: [0.5, 0.9, 0.95, 0.99],
  registers: [register],
});

/**
 * Records an HTTP request with its method, route, status code, and duration.
 * Increments the total request counter and records the duration histogram.
 *
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {string} route - Request route/endpoint
 * @param {number} statusCode - HTTP status code (200, 404, 500, etc.)
 * @param {number} durationSeconds - Request duration in seconds
 */
export function recordHttpRequest(method, route, statusCode, durationSeconds) {
  httpRequestsTotal.labels(method, route, statusCode).inc();
  httpRequestDuration
    .labels(method, route, statusCode)
    .observe(durationSeconds);
}

/**
 * Increments the gauge tracking currently active HTTP requests.
 * Should be called when a request starts processing.
 */
export function incrementActiveRequests() {
  activeRequests.inc();
}

/**
 * Decrements the gauge tracking currently active HTTP requests.
 * Should be called when a request completes processing.
 */
export function decrementActiveRequests() {
  activeRequests.dec();
}

/**
 * Records a GitHub API call with its endpoint, status, and duration.
 * Increments the API call counter and records the duration histogram.
 *
 * @param {string} endpoint - GitHub API endpoint called
 * @param {string} status - Response status (success, error, etc.)
 * @param {number} durationSeconds - API call duration in seconds
 */
export function recordGithubApiCall(endpoint, status, durationSeconds) {
  githubApiCallsTotal.labels(endpoint, status).inc();
  githubApiDuration.labels(endpoint).observe(durationSeconds);
}

/**
 * Records a cache operation (hit, miss, set, delete, etc.).
 * Increments the cache operation counter.
 *
 * @param {string} operation - Type of cache operation (hit, miss, set, delete, etc.)
 */
export function recordCacheOperation(operation) {
  cacheOperationsTotal.labels(operation).inc();
}

/**
 * Records a database query with its operation type, table, and duration.
 * Increments the query counter and records the duration histogram.
 *
 * @param {string} operation - Database operation (SELECT, INSERT, UPDATE, DELETE, etc.)
 * @param {string} table - Database table name
 * @param {number} durationSeconds - Query duration in seconds
 */
export function recordDbQuery(operation, table, durationSeconds) {
  dbQueriesTotal.labels(operation, table).inc();
  dbQueryDuration.labels(operation, table).observe(durationSeconds);
}

/**
 * Records an application error by type.
 * Increments the error counter for the specified error type.
 *
 * @param {string} errorType - Type or category of error
 */
export function recordError(errorType) {
  errorsTotal.labels(errorType).inc();
}

/**
 * Updates the GitHub API rate limit remaining gauge.
 * Sets the current number of remaining API calls.
 *
 * @param {number} remaining - Number of API calls remaining in the current rate limit window
 */
export function updateGithubRateLimit(remaining) {
  githubRateLimitRemaining.set(remaining);
}

/**
 * Updates the count of users currently in the cache.
 * Sets the gauge to the current number of cached users.
 *
 * @param {number} count - Number of users in the cache
 */
export function updateCachedUsersCount(count) {
  cachedUsersCount.set(count);
}

/**
 * Records the duration of a sync operation.
 * Observes the duration in a summary metric with percentile calculations.
 *
 * @param {string} syncType - Type of sync operation (user, repos, events, etc.)
 * @param {string} status - Status of the sync (success, failure, partial, etc.)
 * @param {number} durationSeconds - Sync operation duration in seconds
 */
export function recordSyncDuration(syncType, status, durationSeconds) {
  syncDuration.labels(syncType, status).observe(durationSeconds);
}

/**
 * Retrieves all metrics in Prometheus text format.
 * Used by the /metrics endpoint for Prometheus scraping.
 *
 * @returns {Promise<string>} Metrics in Prometheus exposition format
 */
export async function getMetrics() {
  return register.metrics();
}

/**
 * Retrieves all metrics as a JSON object.
 * Useful for debugging or alternative monitoring systems.
 *
 * @returns {Promise<Object[]>} Array of metric objects with their values
 */
export async function getMetricsJSON() {
  return register.getMetricsAsJSON();
}

/**
 * Resets all metrics in the registry to their initial values.
 * Useful for testing or clearing metrics state.
 */
export function resetMetrics() {
  register.resetMetrics();
}

export { register };
