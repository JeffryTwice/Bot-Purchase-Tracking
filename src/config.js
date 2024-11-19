import dotenv from 'dotenv';
dotenv.config();

export const config = {
  STEAM_API_KEY: process.env.STEAM_API_KEY,
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  CHANNEL_ID: process.env.CHANNEL_ID,
  STEAM_ID: '76561198061569660',
  STEAM_PROFILE_URL: 'https://steamcommunity.com/profiles/76561198061569660/friends'
};