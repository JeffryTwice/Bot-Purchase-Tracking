import { EmbedBuilder } from 'discord.js';
import { getFriendsList, getUserInfo, getUserRecentGames } from './steamAPI.js';

const recentPurchases = new Map();

export async function checkNewPurchases(client, channelId) {
  try {
    const friends = await getFriendsList();
    
    for (const friend of friends) {
      const games = await getUserRecentGames(friend.steamid);
      const userInfo = await getUserInfo(friend.steamid);
      
      if (!userInfo || !games) continue;
      
      if (!recentPurchases.has(friend.steamid)) {
        recentPurchases.set(friend.steamid, new Set(games.map(game => game.appid)));
        continue;
      }

      const oldGames = recentPurchases.get(friend.steamid);
      const newGames = new Set(games.map(game => game.appid));

      for (const game of games) {
        if (!oldGames.has(game.appid)) {
          const channel = await client.channels.fetch(channelId);
          
          const embed = new EmbedBuilder()
            .setTitle('New Game Purchase!')
            .setColor(0x00ff00)
            .setThumbnail(userInfo.avatarfull)
            .addFields(
              { name: 'Friend', value: userInfo.personaname },
              { name: 'Game', value: game.name },
              { name: 'Playtime', value: `${game.playtime_forever || 0} minutes` }
            )
            .setTimestamp();

          await channel.send({ embeds: [embed] });
        }
      }

      recentPurchases.set(friend.steamid, newGames);
    }
  } catch (error) {
    console.error('Error checking purchases:', error);
  }
}