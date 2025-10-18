import * as githubService from "./githubService.js";
import * as dbService from "./databaseService.js";

export async function syncUserProfile(username) {
  let syncLog = null;

  try {
    console.log(`📥 Fetching profile for ${username} from GitHub...`);
    const githubData = await githubService.getUserProfile(username);

    console.log(`💾 Storing profile for ${username} in database...`);
    const user = await dbService.upsertUser({
      username: githubData.username,
      github_id: githubData.github_id,
      name: githubData.name,
      avatar_url: githubData.avatar_url,
      bio: githubData.bio,
      public_repos: githubData.public_repos,
      followers: githubData.followers,
      following: githubData.following,
      created_at: githubData.created_at,
      updated_at: githubData.updated_at,
    });

    syncLog = await dbService.createSyncLog(user.id, "profile", "success", 1);

    console.log(`✅ Profile synced for ${username}...`);
    return user;
  } catch (error) {
    console.error(`❌ Error syncing profile for ${username}:`, error.message);

    if (syncLog) {
      await dbService.updateSyncLog(syncLog.id, "failed", 0, error.message);
    }

    throw error;
  }
}

export async function syncUserRepositories(username) {
  let syncLog = null;

  try {
    const user = await dbService.getUserByUsername(username);
    if (!user) {
      throw new Error(
        `User ${username} not found in database. Sync profile first.`
      );
    }

    // Start sync log
    syncLog = await dbService.createSyncLog(user.id, "repos", "started");

    // Fetch from GitHub
    console.log(`📥 Fetching repositories for ${username} from GitHub...`);
    const repos = await githubService.getUserRepositories(username);

    // Store in database
    console.log(`💾 Storing ${repos.length} repositories in database...`);
    const syncedCount = await dbService.upsertRepositories(user.id, repos);

    // Update sync log
    await dbService.updateSyncLog(syncLog.id, "success", syncedCount);

    console.log(`✅ Synced ${syncedCount} repositories for ${username}`);
    return syncedCount;
  } catch (error) {
    console.error(
      `❌ Error syncing repositories for ${username}:`,
      error.message
    );

    if (syncLog) {
      await dbService.updateSyncLog(syncLog.id, "failed", 0, error.message);
    }

    throw error;
  }
}

export async function syncUserEvents(username) {
  let syncLog = null;

  try {
    const user = await dbService.getUserByUsername(username);
    if (!user) {
      throw new Error(
        `User ${username} not found in database. Sync profile first.`
      );
    }

    // Start sync log
    syncLog = await dbService.createSyncLog(user.id, "events", "started");

    // Fetch from GitHub
    console.log(`📥 Fetching events for ${username} from GitHub...`);
    const events = await githubService.getUserEvents(username);

    // Store in database
    console.log(`💾 Storing ${events.length} events in database...`);
    const syncedCount = await dbService.insertEvents(user.id, events);

    console.log(`✅ Synced ${syncedCount} new events for ${username}`);
    return syncedCount;
  } catch (error) {
    console.error(`❌ Error syncing events for ${username}:`, error.message);

    if (syncLog) {
      await dbService.updateSyncLog(syncLog.id, "failed", 0, error.message);
    }

    throw error;
  }
}

export async function syncUserComplete(username) {
  console.log(`🔄 Starting complete sync for ${username}...`);
  try {
    const user = await syncUserProfile(username);
    const reposCount = await syncUserRepositories(username);
    const eventsCount = await syncUserEvents(username);

    console.log(`✅ Complete sync finished for ${username}`);
    return {
      user,
      reposCount,
      eventsCount,
    };
  } catch (error) {
    console.error(`❌ Complete sync failed for ${username}:`, error.message);
    throw error;
  }
}
