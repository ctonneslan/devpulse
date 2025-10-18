import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error("❌ GITHUB_TOKEN is not set in environment variables!");
  console.log("Get a token from: https://github.com/settings/tokens");
}

const githubClient = axios.create({
  baseURL: GITHUB_API_BASE,
  headers: {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3+json",
  },
  timeout: 10000,
});

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
