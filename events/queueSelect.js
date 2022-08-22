const Discord = require('discord.js')
const moment = require('moment')
const { GetReverseQueueNameMapping } = require('../functions')

module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(bot, interaction) {
        if (interaction.type != Discord.InteractionType.MessageComponent) return;
        if (interaction.componentType != Discord.ComponentType.SelectMenu) return;
        const cid = interaction.customId
        const cidData = cid.split('_')
        if (cidData[0] != "queue") return;
        await interaction.deferReply({ ephemeral: true })
        const gid = await bot.GetGroup(interaction.guild.id)
        if (!gid) return interaction.editReply({ embeds: [bot.prettyReply("**Hola hola, nie wykryto organizacji dla tego serwera.**", interaction)], ephemeral: true })
        if (!gid.paid) return interaction.editReply({ embeds: [bot.prettyReply("**Hola hola, bot dla tej organizacji nie jest opłacony.**", interaction)], ephemeral: true })
        switch (cidData[1]) {
            case "submitregister": {
                let row = new Discord.ActionRowBuilder()
                row.addComponents(
                    new Discord.ButtonBuilder()
                        .setCustomId('queue_type_' + cidData[2])
                        .setLabel("Powrót")
                        .setStyle(Discord.ButtonStyle.Success)
                )
                let memberName = interaction.member.displayName
                const userCache = await bot.paradise.GetUserByName(memberName)
                if (!userCache) return interaction.reply({ embeds: [bot.prettyReply("Nie znaleziono profilu użytkownika.", interaction)], ephemeral: true })
                const formatDate = moment(interaction.values[0].replace('_',' ')).format('YYYY-MM-DD HH:mm')
                const data = await bot.database("SELECT * FROM queue WHERE gid = " + gid.id + " AND type = '" + GetReverseQueueNameMapping(cidData[2]) + "' AND user IS NULL AND date = '" + formatDate + "'")
                if (!data) return interaction.editReply({ embeds: [bot.prettyReply("**Wystąpił błąd, spróbuj ponownie później**", interaction)], ephemeral: true })
                if (data.length == 0) return interaction.editReply({ embeds: [bot.prettyReply("Podana godzina nie jest możliwa do wyboru lub została już zajęta.", interaction)], components: [row], ephemeral: true })
                const update = await bot.database("UPDATE queue SET user = " + userCache.id + " WHERE type = '" + GetReverseQueueNameMapping(cidData[2]) + "' AND date = '" + formatDate + "' AND gid = " + gid.id)
                if (!update) return interaction.editReply({ embeds: [bot.prettyReply("**Wystąpił błąd, spróbuj ponownie później**", interaction)], ephemeral: true })
                bot.SendQueueLog(gid.id, GetReverseQueueNameMapping(cidData[2]), "**" + userCache.login + "** (<@" + interaction.member.id + ">) zapisał się na " + cidData[2] + " **" + formatDate + "**")
                interaction.editReply({ embeds: [bot.prettyReply("Pomyślnie zapisano na " + formatDate + " w kategorii " + cidData[2], interaction, true, true)], components: [row], ephemeral: true })
                break;
            }
            case "submitunregister": {
                let row = new Discord.ActionRowBuilder()
                row.addComponents(
                    new Discord.ButtonBuilder()
                        .setCustomId('queue_type_' + cidData[2])
                        .setLabel("Powrót")
                        .setStyle(Discord.ButtonStyle.Success)
                )
                let memberName = interaction.member.displayName
                const userCache = await bot.paradise.GetUserByName(memberName)
                if (!userCache) return interaction.reply({ embeds: [bot.prettyReply("Nie znaleziono profilu użytkownika.", interaction)], ephemeral: true })
                const formatDate = moment(interaction.values[0].replace('_',' ')).format('YYYY-MM-DD HH:mm')
                const data = await bot.database("SELECT * FROM queue WHERE gid = " + gid.id + " AND type = '" + GetReverseQueueNameMapping(cidData[2]) + "' AND user = " + userCache.id + " AND date = '" + formatDate + "'")
                if (!data) return interaction.editReply({ embeds: [bot.prettyReply("**Wystąpił błąd, spróbuj ponownie później**", interaction)], ephemeral: true })
                if (data.length == 0) return interaction.editReply({ embeds: [bot.prettyReply("Nie jesteś zapisany na tą godzine.", interaction)], components: [row], ephemeral: true })
                const update = await bot.database("UPDATE queue SET user = NULL WHERE type = '" + GetReverseQueueNameMapping(cidData[2]) + "' AND date = '" + formatDate + "' AND gid = " + gid.id + "")
                if (!update) return interaction.editReply({ embeds: [bot.prettyReply("**Wystąpił błąd, spróbuj ponownie później**", interaction)], ephemeral: true })
                bot.SendQueueLog(gid.id, GetReverseQueueNameMapping(cidData[2]), "**" + userCache.login + "** (<@" + interaction.member.id + ">) wypisał się z " + cidData[2] + " **" + formatDate + "**")
                interaction.editReply({ embeds: [bot.prettyReply("Pomyślnie wypisano z " + formatDate + " w kategorii " + cidData[2], interaction, true, true)], components: [row], ephemeral: true })
                break;
            }
        }
    },
};