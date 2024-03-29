const Discord = require('discord.js')
const { ContainsPolishChars } = require('../functions')

module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(bot, interaction) {
        if (interaction.type != Discord.InteractionType.ApplicationCommand) return;
        const command = bot.commands.get(interaction.commandName);
        if (!command) return;
        try {
            let displayName = interaction.user.username
            if (interaction.member) displayName = interaction.member.displayName
            if (ContainsPolishChars(displayName)) return interaction.reply({ embeds: [bot.prettyReply('Twój nick zawiera polskie znaki. Usuń je przed użyciem komendy!', interaction)], ephemeral: true});
            bot.logger.info("Wykonanie komendy " + interaction.commandName + " przez " + interaction.user.tag)
            await command.execute(bot, interaction);
        } catch (error) {
            bot.logger.info("Bład przy wykonywaniu interakcji - " + interaction.commandName)
            console.log(error);
            await interaction.reply({ embeds: [bot.prettyReply('Wystąpił bład podczas wykonywania komendy!', interaction)], ephemeral: true });
        }
    },
};