const Discord = require('discord.js');

const { NumberWithSpaces } = require('../functions')

module.exports = {
	data: new Discord.SlashCommandBuilder()
        .setName('wyplaty')
		.setDescription('Sprawdź komu należy wypłacić pieniądze')
    	.setDMPermission(false)
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.Administrator),
	async execute(bot, interaction) {
        await interaction.deferReply()
        const gid = await bot.GetGroup(interaction.guild.id)
        if (!gid) return interaction.editReply({ embeds: [bot.prettyReply("**Hola hola, nie wykryto organizacji dla tego serwera.**", interaction)] })
        if (!gid.paid) return interaction.editReply({ embeds: [bot.prettyReply("**Hola hola, bot dla tej organizacji nie jest opłacony.**", interaction)] })
        const data = await bot.database("SELECT uid, cash FROM users WHERE gid = " + gid.id + " WHERE cash <> 0 ORDER BY cash DESC LIMIT 25")
        if (!data || data.length == 0) return interaction.editReply({ embeds: [bot.prettyReply("Nikt nie ma nic do wypłacenia.", interaction)] })
        const payoutData = []
        let totalCash = 0
        for (const d of data) {
            const user = await bot.paradise.GetUserById(d.uid) || { login: "Brak danych" }
            payoutData.push("**" + user.login + "** - " + NumberWithSpaces(d.cash))
            totalCash = totalCash + d.cash
        }
        return interaction.editReply({ embeds: [bot.prettyReply("**Lista wypłat**\n\n" + payoutData.join("\n"), interaction).setFooter({ text: "Łącznie do wypłaty: " + NumberWithSpaces(totalCash) + "$" })] })
    },
};
