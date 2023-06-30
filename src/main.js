const dotenv = require('dotenv');
const { Client, IntentsBitField} = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const path = require("path");

dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ]
});

client.on('ready', () => {
  console.log('Bot is ready !');
})

const configuration = new Configuration({
  apiKey: process.env.API_KEY, //change you OPEN AI API KEY in .env file
});
const openai = new OpenAIApi(configuration);
const conversationLogs = new Map(); //to collect multiple conversation from another user
const threadIds = new Map(); //to collect multiple thread id from another user

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.content.startsWith('!')) return;

  const userId = message.author.id;
  const userLog = conversationLogs.get(userId) || [];

  let conversationLog = [{ role: 'system', content: "You are a friendly chat-bot." }];

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

  const result = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: conversationLog,
  });

  const botReply = result.data.choices[0].message.content;

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

client.login(process.env.DISCORD_TOKEN); //change your discord token in .env