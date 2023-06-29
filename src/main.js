const dotenv = require('dotenv');
const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const path = require("path");

dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

client.on('ready', () => {
  console.log('Bot is ready !');
})

const configuration = new Configuration({
  apiKey: process.env.API_KEY, //change you OPEN AI API KEY in .env file
});
const openai = new OpenAIApi(configuration);

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.content.startsWith('!')) return;

  let conversationLog = [{ role: 'system', content: "You are a friendly chat-bot." }];

  if(message.mentions.has(client.user)) {
    await message.channel.sendTyping();

    const threadManager = message.guild.channels.cache.find(channel => channel.type === ChannelType.GuildCategory && channel.name === 'Threads');

    if (!threadManager) {
      console.log('Threads category not found');
      return;
    }

    const threadChannel = await message.channel.guild.channels.create({
      name: "Chat Thread",
      type: ChannelType.GuildText,
      parent: process.env.CATEGORY_CHANNEL, // Replace this with the actual ID of the your category channel
      reason: 'New chat thread created.',
    });

    conversationLog.push({
      role: 'user',
      content: message.content
    });

    const threadReply = await executeChat(message, threadChannel, conversationLog);
    message.reply(threadReply);
  }
});

const executeChat = async (message, threadChannel, conversationLog) => {
  while (true) {
    const result = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: conversationLog,
    });

    const botReply = result.data.choices[0].message.content;

    await threadChannel.send(botReply);

    const collectedMessages = await threadChannel.awaitMessages({ limit:1, time: 300000, errors: ['time']});
    const userMessage = collectedMessages.first().content;

    if (userMessage.toLowerCase() === 'stop') {
      await threadChannel.send('Chat session ended. Thread will be archived');
      threadChannel.setArchived(true, 'End of chat session.');
      break;
    }

    conversationLog.push({role: 'user', content: userMessage});
    conversationLog.push({role: 'assistant', content: botReply});
  }

  return 'Chat session ended';
}

client.login(process.env.DISCORD_TOKEN); //change your discord token in .env
