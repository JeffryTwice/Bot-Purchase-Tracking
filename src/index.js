import { Client, GatewayIntentBits } from 'discord.js';
import { config } from './config.js';
import { commands, handleLastPurchase, handleListFriends } from './commands.js';
import { checkNewPurchases } from './purchaseTracker.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ]
});

client.once('ready', async () => {
  console.log('Discord bot is ready!');
  
  try {
    await client.application.commands.set(commands);
    console.log('Commands registered successfully!');
  } catch (error) {
    console.error('Error registering commands:', error);
  }

  // Check for new purchases every 30 minutes
  setInterval(() => checkNewPurchases(client, config.CHANNEL_ID), 30 * 60 * 1000);
  checkNewPurchases(client, config.CHANNEL_ID);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  switch (interaction.commandName) {
    case 'lastpurchase':
      await handleLastPurchase(interaction);
      break;
    case 'listfriends':
      await handleListFriends(interaction);
      break;
  }
});

client.login(config.DISCORD_TOKEN);