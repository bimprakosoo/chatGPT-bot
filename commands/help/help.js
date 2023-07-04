const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Help commands for the bot'),
  async execute(interaction, client){
    await interaction.reply({ content: 'You need to mention this bot to make it works.\n' +
        'Add ("custom_personality") for variant answer from the bot, example = @bot (sarcasm) what is 1+1 ?.\n' + 'For right now there is only 2 kind of personalities supported : \n' +
        '1.Friendly (default)\n' + '2.Sarcasm\n' });
  }
}