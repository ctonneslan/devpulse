/**
 * @fileoverview Express middleware for collecting HTTP request metrics.
 * Tracks request duration, active requests, and request outcomes for monitoring.
 */

import * as metricsService from "../services/metricsService.js";

/**
 * Express middleware that collects metrics for HTTP requests.
 * Tracks request duration, active request count, and records metrics by method, route, and status code.
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 *
 * @example
 * app.use(metricsMiddleware);
 */
export function metricsMiddleware(req, res, next) {
  const startTime = Date.now();
  metricsService.incrementActiveRequests();
  const originalEnd = res.end;
  res.end = function (...args) {
    const durationSeconds = (Date.now() - startTime) / 1000;

    metricsService.decrementActiveRequests();

    const route = getRoutePattern(req.route?.path || req.path);

    metricsService.recordHttpRequest(
      req.method,
      route,
      res.statusCode.toString(),
      durationSeconds
    );

    return originalEnd.apply(this, args);
  };

  next();
}

/**
 * Normalizes a route path by replacing dynamic segments with generic placeholders.
 * This allows grouping of metrics by route pattern rather than specific parameter values.
 *
 * @param {string} path - The route path to normalize
 * @returns {string} The normalized route pattern with :id and :param placeholders
 *
 * @example
 * getRoutePattern('/users/123') // Returns '/users/:id'
 * getRoutePattern('/repos/my-repo') // Returns '/repos/:param'
 */
function getRoutePattern(path) {
  return path
    .replace(/\/[0-9]+/g, "/:id") // Numeric IDs
    .replace(/\/[a-zA-Z0-9_-]+$/g, "/:param"); // Username/slug at end
}
