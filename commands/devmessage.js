const Discord = require('discord.js');
const config = require('../config')

module.exports = {
	data: new Discord.SlashCommandBuilder()
        .setName('devmessage')
		.setDescription('Ogłoszenia na wszystkie serwery używające bota')
        .addStringOption(o => {
            return o
                .setName("wiadomosc")
                .setDescription("Wiadomość")
                .setRequired(true)
        }),
	async execute(bot, interaction) {
        if (interaction.user.id != config.discord.ownerId) return interaction.reply({ embeds: [bot.prettyReply("**Hola hola, nie masz do tego uprawnień.**", interaction)], ephemeral: true })
        const data = await db("SELECT * FROM bots WHERE paid > NOW() AND enabled = 1")
        if (!data || data.length == 0) return interaction.reply({ embeds: [bot.prettyReply("Nie znaleziono organizacji!", interaction)], ephemeral: true })
        let failedMsg = []
        const embed = bot.prettyReply(interaction.options.getString("wiadomosc"), interaction)
        for (const d of data) {
            const guild = bot.guilds.cache.get(d.discord_id)
            const channel_id = JSON.parse(d.settings).discord.channels.news
            if (!guild || !channel_id || channel_id.length == 0) {
                failedMsg.push(d.paradise_id)
            } else {
                const channel = g.channels.cache.get(channel_id)
                if (!channel) {
                    failedMsg.push(d.paradise_id)
                } else {
                    channel.send({ embeds: [embed] })
                }
            }
        }
        return interaction.reply({ embeds: [bot.prettyReply("**Wyslano wiadomość o treści:**\n\n" + interaction.options.getString("wiadomosc") + "\n\n**Nie udało się wysłać do organizacji:**\n\n" + failedMsg.join(", "), interaction)] })
    },
};