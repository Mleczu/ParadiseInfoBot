const Discord = require('discord.js')

module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(bot, interaction) {
        if (interaction.type != Discord.InteractionType.ApplicationCommand) return;
        const command = bot.commands.get(interaction.commandName);
        if (!command) return;
        try {
            bot.logger.info("Wykonanie komendy " + interaction.commandName + " przez " + interaction.user.tag)
            await command.execute(bot, interaction);
        } catch (error) {
            bot.logger.info("Bład przy wykonywaniu interakcji - " + interaction.commandName)
            console.log(error);
            await interaction.reply({ embeds: [bot.prettyReply('Wystąpił bład podczas wykonywania komendy!', interaction)], ephemeral: true });
        }
    },
};