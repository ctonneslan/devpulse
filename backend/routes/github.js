/**
 * @fileoverview GitHub API routes for DevPulse application.
 * Defines Express routes for fetching GitHub user data, events, repositories,
 * and API rate limit information.
 * @module routes/github
 */

import express from "express";
import {
  getUser,
  getEvents,
  getRepositories,
  getEventStats,
  checkRateLimit,
} from "../controllers/githubController.js";

/**
 * Express router for GitHub-related endpoints.
 * @type {express.Router}
 */
const router = express.Router();

/**
 * GET /user/:username
 * Retrieves GitHub user profile information for the specified username.
 * @name GetUser
 * @route {GET} /user/:username
 * @routeparam {string} username - GitHub username to fetch profile for
 */
router.get("/user/:username", getUser);

/**
 * GET /events/:username
 * Retrieves recent GitHub events/activity for the specified username.
 * @name GetEvents
 * @route {GET} /events/:username
 * @routeparam {string} username - GitHub username to fetch events for
 */
router.get("/events/:username", getEvents);

/**
 * GET /repos/:username
 * Retrieves all public repositories for the specified GitHub username.
 * @name GetRepositories
 * @route {GET} /repos/:username
 * @routeparam {string} username - GitHub username to fetch repositories for
 */
router.get("/repos/:username", getRepositories);

/**
 * GET /stats/:username
 * Retrieves aggregated statistics for the specified GitHub username's events.
 * @name GetEventStats
 * @route {GET} /stats/:username
 * @routeparam {string} username - GitHub username to calculate event statistics for
 */
router.get("/stats/:username", getEventStats);

/**
 * GET /rate-limit
 * Checks the current GitHub API rate limit status.
 * @name CheckRateLimit
 * @route {GET} /rate-limit
 */
router.get("/rate-limit", checkRateLimit);

export default router;
