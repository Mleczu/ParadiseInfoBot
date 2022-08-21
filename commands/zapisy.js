const Discord = require('discord.js');
const { CheckIfUserHasProfile, CreateUserProfile, GetQueueNameMapping } = require('../functions')

module.exports = {
	data: new Discord.SlashCommandBuilder()
        .setName('zapisy')
		.setDescription('Lista zapisów')
        .setDMPermission(false),
    async execute(bot, interaction) {
        const gid = await bot.GetGroup(interaction.guild.id)
        if (!gid) return interaction.reply({ embeds: [bot.prettyReply("**Hola hola, nie wykryto organizacji dla tego serwera.**", interaction)], ephemeral: true })
        if (!gid.paid) return interaction.reply({ embeds: [bot.prettyReply("**Hola hola, bot dla tej organizacji nie jest opłacony.**", interaction)], ephemeral: true })
        if (!interaction.member) return;
        let memberName = interaction.member.displayName
        const userCache = await bot.paradise.GetUserByName(memberName)
        if (!userCache) return interaction.reply({ embeds: [bot.prettyReply("Nie znaleziono profilu użytkownika.", interaction)], ephemeral: true })
        const profileCheck = await CheckIfUserHasProfile(bot, gid.id, userCache)
        if (!profileCheck) await CreateUserProfile(bot, gid.id, userCache)
        let available = []
        for (const key in gid.settings.queue) {
            if (!gid.settings.queue[key].status) continue;
            available.push(GetQueueNameMapping(key))
        }
        if (available.length == 0) return interaction.reply({ embeds: [bot.prettyReply("**Brak dostępnych zapisów**", interaction)] })
        const types = ["Primary", "Secondary", "Danger", "Success"]
        let row = new Discord.ActionRowBuilder()
        for (const i of available) {
            row.addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId('queue_type_' + i)
                    .setLabel(i)
                    .setStyle(Discord.ButtonStyle[types[Math.floor(Math.random() * types.length)]])
            )
        }
        return interaction.reply({ embeds: [bot.prettyReply("**Dostępne kategorie zapisów**", interaction)], components: [row], ephemeral: true })
    }
}