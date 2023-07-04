const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const path = require('path');
const clientId = process.env.CLIENT_ID; //change your client ID in .env

module.exports = (client, commandFolders, commandsPath) => {
  client.commands = new Map();
  client.commandArray = [];

  for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(path.join(commandsPath, folder)).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
      const command = require(path.join(commandsPath, folder, file));
      client.commands.set(command.data.name, command);
      client.commandArray.push(command.data.toJSON());
    }
  }

  const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

  (async () => {
    try {
      console.log('Refreshing (/) commands');

      await rest.put(
        Routes.applicationCommands(clientId),
        { body: client.commandArray },
      );

      console.log('Successfully reloaded (/) commands');
    } catch (error) {
      console.error(error);
    }
  })();
};
