const Discord = require('discord.js');
const config = require('../config')

module.exports = {
	data: new Discord.SlashCommandBuilder()
        .setName('reload')
		.setDescription('Przeładuj boty'),
	async execute(bot, interaction) {
        if (interaction.user.id != config.discord.ownerId) return interaction.reply({ embeds: [bot.prettyReply("**Hola hola, nie masz do tego uprawnień.**", interaction)], ephemeral: true })
        interaction.reply({ embeds: [bot.prettyReply("Przeładowano boty!", interaction)], ephemeral: true })
        bot.ReloadBots()
    },
};