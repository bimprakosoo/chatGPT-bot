const dotenv = require('dotenv');
const { Client, GatewayIntentBits, Collection} = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const path = require("path");
const helpCommand = require('../commands/help/help');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});
client.commands = new Collection();

client.on('ready', () => {
  console.log('Bot is ready !');
})

const configuration = new Configuration({
  apiKey: process.env.API_KEY, //change you OPEN AI API KEY in .env file
});
const openai = new OpenAIApi(configuration);
const conversationLogs = new Map(); //to collect multiple conversation from another user
const threadIds = new Map(); //to collect multiple thread id from another user
const handlerCommands = require('../functions/handler_commands');

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const userId = message.author.id;
  const userLog = conversationLogs.get(userId) || [];
  const contentBot = "Friendly"
  let conversationLog = [{ role: 'system', content: contentBot }];
  const mentionBot = message.mentions.users.has(client.user.id);

  if (mentionBot) {
    message.content = message.content.replace(`<@${client.user.id}>`, '').trim();
  } else {
    if (!threadIds.has(userId)) {
      return;
    }
  }

  await message.channel.sendTyping();

  let prevMessages = await message.channel.messages.fetch({ limit: 15});
  prevMessages.reverse();

  prevMessages.forEach((msg) => {
    if (message.content.startsWith('!')) return;
    if (msg.author.id !== client.user.id && message.author.bot) return;
    if (msg.author.id !== message.author.id) return;

    conversationLog.push({
      role: 'user',
      content: msg.content,
    })
  })

  const contentMatch = message.content.match(/\(([^)]\+)\)/);
  const content = contentMatch ? contentMatch[1] : contentBot;

  const result = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: conversationLog,
  });

  const botReply = result.data.choices[0].message.content.replace(contentBot, content);

  if (!threadIds.has(userId)) { // make a new thread for the user if it doesn't exist
    const thread = await message.startThread({
      name: `Conversation with ${message.author.tag}`,
      autoArchiveDuration: 60
    });

    threadIds.set(userId, thread.id);

    await thread.send({ content: botReply });
  } else { //reply to the existing thread
    const threadId = threadIds.get(userId);
    const threadChannel = await client.channels.fetch(threadId);

    // Check if the message is in a thread channel
    if (message.channel.isThread()) {
      await threadChannel.send({ content: botReply });
    } else {
      // Find the thread message and reply to it
      const threadMessage = await threadChannel.messages.fetch(threadId);
      await threadMessage.reply(botReply);
    }
  }
  conversationLogs.set(userId, [...userLog, ...conversationLog, {role: 'bot', content: botReply}]);
});

(async () => {
  const commandFolders = fs.readdirSync(path.join(__dirname, '..', 'commands'));

  handlerCommands(client, commandFolders, path.join(__dirname, '..', 'commands'));

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
    }
  });

  client.login(process.env.DISCORD_TOKEN);
})();