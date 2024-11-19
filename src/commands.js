import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getFriendsList, getUserInfo, getOwnedGames, getGameDetails } from './steamAPI.js';

export const commands = [
  new SlashCommandBuilder()
    .setName('lastpurchase')
    .setDescription('Get the last purchase of a friend')
    .addStringOption(option =>
      option
        .setName('friendname')
        .setDescription('Name of the friend')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('listfriends')
    .setDescription('List all Steam friends')
];

export async function handleLastPurchase(interaction) {
  await interaction.deferReply();
  
  try {
    const friendName = interaction.options.getString('friendname');
    const friends = await getFriendsList();
    
    for (const friend of friends) {
      const userInfo = await getUserInfo(friend.steamid);
      
      if (userInfo && userInfo.personaname.toLowerCase().includes(friendName.toLowerCase())) {
        const games = await getOwnedGames(friend.steamid);
        
        if (games && games.length > 0) {
          // Sort games by acquisition time in descending order
          games.sort((a, b) => b.acquisition_time - a.acquisition_time);
          
          const lastGame = games[0];
          const gameDetails = await getGameDetails(lastGame.appid);
          
          const embed = new EmbedBuilder()
            .setTitle('Latest Game Purchase')
            .setColor(0x0099ff)
            .setThumbnail(userInfo.avatarfull);

          if (gameDetails && gameDetails.header_image) {
            embed.setImage(gameDetails.header_image);
          }

          const purchaseDate = new Date(lastGame.acquisition_time * 1000);
          
          embed.addFields(
            { name: 'Friend', value: userInfo.personaname },
            { name: 'Game', value: lastGame.name },
            { name: 'Purchase Date', value: purchaseDate.toLocaleDateString() },
            { name: 'Total Playtime', value: `${Math.floor(lastGame.playtime_forever / 60)} hours` }
          );

          if (gameDetails) {
            if (gameDetails.price_overview) {
              embed.addFields({
                name: 'Price',
                value: `${(gameDetails.price_overview.final / 100).toFixed(2)} ${gameDetails.price_overview.currency}`
              });
            }
            if (gameDetails.release_date) {
              embed.addFields({
                name: 'Release Date',
                value: gameDetails.release_date.date
              });
            }
          }

          embed.setTimestamp();
          await interaction.editReply({ embeds: [embed] });
          return;
        }
        
        await interaction.editReply(`${userInfo.personaname} has no games.`);
        return;
      }
    }
    
    await interaction.editReply('Friend not found. Please check the name and try again.');
  } catch (error) {
    console.error('Error in lastpurchase command:', error);
    await interaction.editReply('An error occurred while fetching the friend\'s recent purchases.');
  }
}

export async function handleListFriends(interaction) {
  await interaction.deferReply();
  
  try {
    const friends = await getFriendsList();
    const friendInfos = await Promise.all(
      friends.map(friend => getUserInfo(friend.steamid))
    );
    
    const validFriends = friendInfos.filter(friend => friend !== null);
    
    if (validFriends.length === 0) {
      await interaction.editReply('No friends found or error occurred while fetching friends list.');
      return;
    }

    const chunks = [];
    for (let i = 0; i < validFriends.length; i += 25) {
      chunks.push(validFriends.slice(i, i + 25));
    }

    const embeds = chunks.map((chunk, index) => {
      const embed = new EmbedBuilder()
        .setTitle(`Steam Friends List ${index + 1}/${chunks.length}`)
        .setColor(0x0099ff)
        .setTimestamp();

      chunk.forEach(friend => {
        embed.addFields({
          name: friend.personaname,
          value: `Status: ${friend.personastate === 1 ? '🟢 Online' : '⚫ Offline'}`
        });
      });

      return embed;
    });

    await interaction.editReply({ embeds: [embeds[0]] });
    for (let i = 1; i < embeds.length; i++) {
      await interaction.followUp({ embeds: [embeds[i]] });
    }
  } catch (error) {
    console.error('Error in listfriends command:', error);
    await interaction.editReply('An error occurred while fetching the friends list. Please make sure the Steam API key is valid.');
  }
}