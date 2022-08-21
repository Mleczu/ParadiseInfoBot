const Discord = require('discord.js')
const moment = require('moment')
const { GetReverseQueueNameMapping } = require('../functions')

module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(bot, interaction) {
        if (interaction.type != Discord.InteractionType.MessageComponent) return;
        if (interaction.componentType != Discord.ComponentType.Button) return;
        const cid = interaction.customId
        const cidData = cid.split('_')
        if (cidData[0] != "queue") return;
        await interaction.deferReply({ ephemeral: true })
        const gid = await bot.GetGroup(interaction.guild.id)
        if (!gid) return interaction.editReply({ embeds: [bot.prettyReply("**Hola hola, nie wykryto organizacji dla tego serwera.**", interaction)], ephemeral: true })
        if (!gid.paid) return interaction.editReply({ embeds: [bot.prettyReply("**Hola hola, bot dla tej organizacji nie jest opłacony.**", interaction)], ephemeral: true })
        switch (cidData[1]) {
            case "type": {
                let row = new Discord.ActionRowBuilder()
                row.addComponents(
                    new Discord.ButtonBuilder()
                        .setCustomId('queue_register_' + cidData[2])
                        .setLabel("Zapisz się")
                        .setStyle(Discord.ButtonStyle.Success),
                    new Discord.ButtonBuilder()
                        .setCustomId('queue_unregister_' + cidData[2])
                        .setLabel("Wypisz się")
                        .setStyle(Discord.ButtonStyle.Danger),
                    new Discord.ButtonBuilder()
                        .setURL("https://paradiseinfo.mleczu.tech/queue/" + gid.id + "/" + GetReverseQueueNameMapping(cidData[2]))
                        .setLabel("Podgląd tabeli")
                        .setStyle(Discord.ButtonStyle.Link),
                )
                interaction.editReply({ embeds: [bot.prettyReply("**Wybrana kategoria:** " + cidData[2] + "\n\n**Wybierz akcje**", interaction)], components: [row], ephemeral: true })
                break;
            }
            case "register": {
                let row = new Discord.ActionRowBuilder()
                row.addComponents(
                    new Discord.ButtonBuilder()
                        .setCustomId('queue_type_' + cidData[2])
                        .setLabel("Powrót")
                        .setStyle(Discord.ButtonStyle.Success)
                )
                const data = await bot.database("SELECT * FROM queue WHERE gid = " + gid.id + " AND type = '" + GetReverseQueueNameMapping(cidData[2]) + "' AND user IS NULL AND date > NOW()")
                if (!data) return interaction.editReply({ embeds: [bot.prettyReply("**Wystąpił błąd, spróbuj ponownie później**", interaction)], ephemeral: true })
                if (data.length == 0) return interaction.editReply({ embeds: [bot.prettyReply("**Wybrana kategoria:** " + cidData[2] + "\n\n**Wybrana akcja:** Zapisz się\n\nNiestety aktualnie nie ma wolnych godzin.", interaction)], components: [row], ephemeral: true })
                const dates = data.map(d => moment(d.date))
                const sorted = {}
                for (const d of dates) {
                    if (!sorted[d.dayOfYear()]) sorted[d.dayOfYear()] = []
                    sorted[d.dayOfYear()].push(d)
                }
                let checkrows = []
                for (const k in sorted) {
                    const d = sorted[k]
                    const r = new Discord.ActionRowBuilder()
                    let o = []
                    for (const dv of d) {
                        o.push({
                            label: dv.format('YYYY-MM-DD HH:mm'),
                            value: dv.format('YYYY-MM-DD_HH:mm')
                        })
                    }
                    r.addComponents(
                        new Discord.SelectMenuBuilder()
                            .setCustomId('queue_submitregister_' + cidData[2] + "_" + k)
                            .setPlaceholder('Wybierz godzine (Dzień: ' + d[0].format('YYYY-MM-DD') + ")")
                            .addOptions(...o),
                    )
                    checkrows.push(r)
                }
                interaction.editReply({ embeds: [bot.prettyReply("**Wybrana kategoria:** " + cidData[2] + "\n\n**Wybrana akcja:** Zapisz się\n\nWybierz godzinę z listy wolnych godzin.", interaction)], components: [...checkrows, row], ephemeral: true })
                break;
            }
            case "unregister": {
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
                const data = await bot.database("SELECT * FROM queue WHERE gid = " + gid.id + " AND type = '" + GetReverseQueueNameMapping(cidData[2]) + "' AND user = " + userCache.id + " AND date > NOW()")
                if (!data) return interaction.editReply({ embeds: [bot.prettyReply("**Wystąpił błąd, spróbuj ponownie później**", interaction)], ephemeral: true })
                if (data.length == 0) return interaction.editReply({ embeds: [bot.prettyReply("**Wybrana kategoria:** " + cidData[2] + "\n\n**Wybrana akcja:** Wypisz się\n\nNie jesteś zapisany.", interaction)], components: [row], ephemeral: true })
                const dates = data.map(d => moment(d.date))
                const sorted = {}
                for (const d of dates) {
                    if (!sorted[d.dayOfYear()]) sorted[d.dayOfYear()] = []
                    sorted[d.dayOfYear()].push(d)
                }
                let checkrows = []
                for (const k in sorted) {
                    const d = sorted[k]
                    const r = new Discord.ActionRowBuilder()
                    let o = []
                    for (const dv of d) {
                        o.push({
                            label: dv.format('YYYY-MM-DD HH:mm'),
                            value: dv.format('YYYY-MM-DD_HH:mm')
                        })
                    }
                    r.addComponents(
                        new Discord.SelectMenuBuilder()
                            .setCustomId('queue_submitunregister_' + cidData[2] + "_" + k)
                            .setPlaceholder('Wybierz godzine (Dzień: ' + d[0].format('YYYY-MM-DD') + ")")
                            .addOptions(...o),
                    )
                    checkrows.push(r)
                }
                interaction.editReply({ embeds: [bot.prettyReply("**Wybrana kategoria:** " + cidData[2] + "\n\n**Wybrana akcja:** Wypisz się\n\nWybierz godzinę z listy zajętych przez Ciebie godzin.", interaction)], components: [...checkrows, row], ephemeral: true })
                break;
            }
        }
    },
};