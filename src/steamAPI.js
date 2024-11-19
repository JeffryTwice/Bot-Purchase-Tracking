import fetch from 'node-fetch';
import { config } from './config.js';

export async function getFriendsList() {
  try {
    const response = await fetch(
      `http://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key=${config.STEAM_API_KEY}&steamid=${config.STEAM_ID}&relationship=friend`
    );
    
    if (!response.ok) {
      throw new Error(`Steam API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.friendslist.friends;
  } catch (error) {
    console.error('Error fetching friends list:', error);
    throw error;
  }
}

export async function getOwnedGames(steamId) {
  try {
    const response = await fetch(
      `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${config.STEAM_API_KEY}&steamid=${steamId}&format=json&include_appinfo=1&include_played_free_games=1`
    );
    
    if (!response.ok) {
      throw new Error(`Steam API error: ${response.status}`);
    }
    
    const data = await response.json();
    const games = data.response.games || [];
    
    // Get detailed info for each game including acquisition time
    const gamesWithDetails = await Promise.all(
      games.map(async (game) => {
        try {
          const licenseResponse = await fetch(
            `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${config.STEAM_API_KEY}&steamid=${steamId}&appids_filter[0]=${game.appid}&include_played_free_games=1&include_extended_info=1`
          );
          const licenseData = await licenseResponse.json();
          const extendedInfo = licenseData.response.games?.[0];
          
          return {
            ...game,
            acquisition_time: extendedInfo?.rtime_last_acquired || 0
          };
        } catch (error) {
          console.error(`Error fetching license info for game ${game.appid}:`, error);
          return {
            ...game,
            acquisition_time: 0
          };
        }
      })
    );
    
    return gamesWithDetails;
  } catch (error) {
    console.error(`Error fetching owned games for ${steamId}:`, error);
    return [];
  }
}

export async function getUserInfo(steamId) {
  try {
    const response = await fetch(
      `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${config.STEAM_API_KEY}&steamids=${steamId}`
    );
    
    if (!response.ok) {
      throw new Error(`Steam API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.response.players[0];
  } catch (error) {
    console.error(`Error fetching user info for ${steamId}:`, error);
    return null;
  }
}

export async function getGameDetails(appId) {
  try {
    const response = await fetch(
      `http://store.steampowered.com/api/appdetails?appids=${appId}`
    );
    
    if (!response.ok) {
      throw new Error(`Steam API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data[appId].success ? data[appId].data : null;
  } catch (error) {
    console.error(`Error fetching game details for ${appId}:`, error);
    return null;
  }
}