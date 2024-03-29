const Discord = require('discord.js');
const config = require('../config').getConfig();

module.exports = {
	data: new Discord.SlashCommandBuilder()
        .setName('organizacja')
		.setDescription('Sprawdź informacje dotyczące organizacji'),
	async execute(bot, interaction) {
        const gid = await bot.GetGroup(interaction.guild.id)
        if (!gid) return interaction.reply({ embeds: [bot.prettyReply("**Hola hola, nie wykryto organizacji dla tego serwera.**", interaction)], ephemeral: true })
        if (!gid.paid) return interaction.reply({ embeds: [bot.prettyReply("**Hola hola, bot dla tej organizacji nie jest opłacony.**", interaction)], ephemeral: true })
        const fields = [
            { name: "**Konto bota**", value: `${gid.settings.client.username}`, inline: true },
            { name: "**Haslo bota**", value: `${((interaction.user.id == config.discord.ownerId) ? gid.settings.client.password : "Ukryte")}`, inline: true },
            { name: "**ID organizacji**", value: `${gid.id}`, inline: true },
            { name: "**Opłacona do**", value: new Date(gid.paidTo).toLocaleDateString('pl-PL', { hour: '2-digit', minute: '2-digit', year: 'numeric', month: 'long', day: 'numeric' }), inline: true},
            { name: "**Kanał: Importy**", value: ((gid.settings.discord.channels.import_success) ? `<#${gid.settings.discord.channels.import_success}>` : "Brak"), inline: true },
            { name: "**Kanał: Nieudane importy**", value: ((gid.settings.discord.channels.import_fail) ? `<#${gid.settings.discord.channels.import_fail}>` : "Brak"), inline: true },
            { name: "**Kanał: Exporty**", value: ((gid.settings.discord.channels.export) ? `<#${gid.settings.discord.channels.export}>` : "Brak"), inline: true },
            { name: "**Kanał: Rozpoczęcie artefaktu**", value: ((gid.settings.discord.channels.artifact_start) ? `<#${gid.settings.discord.channels.artifact_start}>` : "Brak"), inline: true },
            { name: "**Kanał: Artefakty**", value: ((gid.settings.discord.channels.artifact_end) ? `<#${gid.settings.discord.channels.artifact_end}>` : "Brak"), inline: true },
            { name: "**Kanał: Lombard**", value: ((gid.settings.discord.channels.pawnshop) ? `<#${gid.settings.discord.channels.pawnshop}>` : "Brak"), inline: true },
            { name: "**Kanał: Dobre ceny**", value: ((gid.settings.discord.channels.hot_deals) ? `<#${gid.settings.discord.channels.hot_deals}>` : "Brak"), inline: true },
            { name: "**Kanał: Nowości**", value: ((gid.settings.discord.channels.news) ? `<#${gid.settings.discord.channels.news}>` : "Brak"), inline: true },
            
        ]
        return interaction.reply({ embeds: [bot.prettyReply("**Informajce o organizacji**", interaction).addFields(fields)], ephemeral: true })
	},
};