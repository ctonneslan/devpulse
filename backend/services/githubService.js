/**
 * @fileoverview GitHub API service for interacting with GitHub's REST API.
 * Provides functions to fetch user profiles, repositories, events, and rate limits.
 * Uses axios for HTTP requests with authentication and error handling.
 * @module services/githubService
 */

import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

/**
 * GitHub API base URL.
 * @constant {string}
 */
const GITHUB_API_BASE = "https://api.github.com";

/**
 * GitHub personal access token from environment variables.
 * @constant {string}
 */
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error("❌ GITHUB_TOKEN is not set in environment variables!");
  console.log("Get a token from: https://github.com/settings/tokens");
}

/**
 * Configured axios client for GitHub API requests.
 * Includes authentication header and 10-second timeout.
 * @constant {axios.AxiosInstance}
 */
const githubClient = axios.create({
  baseURL: GITHUB_API_BASE,
  headers: {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3+json",
  },
  timeout: 10000,
});

/**
 * Fetches a GitHub user's profile information.
 *
 * @async
 * @function getUserProfile
 * @param {string} username - GitHub username to fetch
 * @returns {Promise<Object>} User profile data
 * @returns {number} return.github_id - GitHub user ID
 * @returns {string} return.username - GitHub login username
 * @returns {string} return.name - User's display name
 * @returns {string} return.avatar_url - Avatar image URL
 * @returns {string} return.bio - User biography
 * @returns {number} return.public_repos - Number of public repositories
 * @returns {number} return.followers - Number of followers
 * @returns {number} return.following - Number of users being followed
 * @returns {string} return.created_at - Account creation timestamp
 * @returns {string} return.updated_at - Last update timestamp
 * @throws {Error} If user not found (404)
 * @throws {Error} If rate limit exceeded or invalid token (403)
 * @throws {Error} If network error or other API error occurs
 */
export async function getUserProfile(username) {
  try {
    const response = await githubClient.get(`/users/${username}`);

    return {
      github_id: response.data.id,
      username: response.data.login,
      name: response.data.name,
      avatar_url: response.data.avatar_url,
      bio: response.data.bio,
      public_repos: response.data.public_repos,
      followers: response.data.followers,
      following: response.data.following,
      created_at: response.data.created_at,
      updated_at: response.data.updated_at,
    };
  } catch (error) {
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error(`Github user ${username} not found`);
      } else if (error.response.status === 403) {
        throw new Error("Github API rate limit exceeded or invalid token");
      }
      throw new Error(`Github API error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error("No response from Github API - network error");
    } else {
      throw new Error(`Error setting up Github request: ${error.message}`);
    }
  }
}

/**
 * Fetches recent GitHub events/activity for a user.
 *
 * @async
 * @function getUserEvents
 * @param {string} username - GitHub username to fetch events for
 * @param {number} [perPage=30] - Number of events to retrieve per page
 * @returns {Promise<Array<Object>>} Array of event objects
 * @returns {string} return[].id - Event ID
 * @returns {string} return[].type - Event type (e.g., PushEvent, IssueEvent)
 * @returns {string} return[].repo - Repository name
 * @returns {string} return[].created_at - Event creation timestamp
 * @returns {Object} return[].payload - Event payload data
 * @throws {Error} If user not found (404)
 * @throws {Error} If rate limit exceeded or invalid token (403)
 * @throws {Error} If network error or other API error occurs
 */
export async function getUserEvents(username, perPage = 30) {
  try {
    const response = await githubClient.get(`/users/${username}/events`, {
      params: {
        per_page: perPage,
      },
    });

    return response.data.map((event) => ({
      id: event.id,
      type: event.type,
      repo: event.repo.name,
      created_at: event.created_at,
      payload: event.payload,
    }));
  } catch (error) {
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error(`Github user ${username} not found`);
      } else if (error.response.status === 403) {
        throw new Error("Github API rate limit exceeded or invalid token");
      }
      throw new Error(`Github API error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error("No response from Github API - network error");
    } else {
      throw new Error(`Error fetching events: ${error.message}`);
    }
  }
}

/**
 * Fetches public repositories for a GitHub user.
 *
 * @async
 * @function getUserRepositories
 * @param {string} username - GitHub username to fetch repositories for
 * @param {number} [perPage=30] - Number of repositories to retrieve per page
 * @returns {Promise<Array<Object>>} Array of repository objects sorted by most recently updated
 * @returns {number} return[].id - Repository ID
 * @returns {string} return[].name - Repository name
 * @returns {string} return[].full_name - Full repository name (owner/repo)
 * @returns {string} return[].description - Repository description
 * @returns {string} return[].language - Primary programming language
 * @returns {number} return[].stargazers_count - Number of stars
 * @returns {number} return[].forks_count - Number of forks
 * @returns {number} return[].open_issues_count - Number of open issues
 * @returns {string} return[].created_at - Repository creation timestamp
 * @returns {string} return[].updated_at - Last update timestamp
 * @returns {string} return[].pushed_at - Last push timestamp
 * @throws {Error} If user not found (404)
 * @throws {Error} If rate limit exceeded or invalid token (403)
 * @throws {Error} If network error or other API error occurs
 */
export async function getUserRepositories(username, perPage = 30) {
  try {
    const response = await githubClient.get(`/users/${username}/repos`, {
      params: {
        per_page: perPage,
        sort: "updated",
        direction: "desc",
      },
    });

    return response.data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      open_issues_count: repo.open_issues_count,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      pushed_at: repo.pushed_at,
    }));
  } catch (error) {
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error(`Github user ${username} not found`);
      } else if (error.response.status === 403) {
        throw new Error("Github API rate limit exceeded or invalid token");
      }
      throw new Error(`Github API error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error("No response from Github API - network error");
    } else {
      throw new Error(`Error fetching repositories: ${error.message}`);
    }
  }
}

/**
 * Fetches the current GitHub API rate limit status.
 *
 * @async
 * @function getRateLimit
 * @returns {Promise<Object>} Rate limit information
 * @returns {number} return.limit - Maximum number of requests per hour
 * @returns {number} return.remaining - Number of requests remaining in current hour
 * @returns {Date} return.reset - Time when rate limit resets
 * @throws {Error} If rate limit check fails
 */
export async function getRateLimit() {
  try {
    const response = await githubClient.get("/rate_limit");
    return {
      limit: response.data.resources.core.limit,
      remaining: response.data.resources.core.remaining,
      reset: new Date(response.data.resources.core.reset * 1000),
    };
  } catch (error) {
    console.error("Error fetching rate limit:", error);
    throw error;
  }
}
