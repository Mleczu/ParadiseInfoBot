const Discord = require('discord.js');
const { CheckIfUserHasProfile, CreateUserProfile, NumberWithSpaces } = require('../functions')

module.exports = {
	data: new Discord.SlashCommandBuilder()
        .setName('profil')
		.setDescription('Sprawdź profil')
        .addUserOption(o => {
            return o
                .setName("gracz")
                .setDescription("Sprawdź profil innego gracza")
        })
        .setDMPermission(false),
	async execute(bot, interaction) {
        const gid = await bot.GetGroup(interaction.guild.id)
        if (!gid) return interaction.reply({ embeds: [bot.prettyReply("**Hola hola, nie wykryto organizacji dla tego serwera.**", interaction)], ephemeral: true })
        if (!gid.paid) return interaction.reply({ embeds: [bot.prettyReply("**Hola hola, bot dla tej organizacji nie jest opłacony.**", interaction)], ephemeral: true })
        if (!interaction.member) return;
        let member = await interaction.options.getMember("gracz")
        if (!member) member = interaction.member
        let memberName = member.displayName
        const userCache = await bot.paradise.GetUserByName(memberName)
        if (!userCache) return interaction.reply({ embeds: [bot.prettyReply("Nie znaleziono profilu użytkownika.", interaction)], ephemeral: true })
        const profileCheck = await CheckIfUserHasProfile(bot, gid.id, userCache)
        if (!profileCheck) await CreateUserProfile(bot, gid.id, userCache)
        const data = {
            general: await bot.database("SELECT cash, count_import FROM users WHERE gid = " + gid.id + " AND uid = " + userCache.id + " LIMIT 1"),
            imports: await bot.database("SELECT COUNT(vehicle) FROM imports WHERE gid = " + gid.id + " AND uid = " + userCache.id)
        }

        const payout = data.general[0].cash || 0
        const imports = data.general[0].count_import || 0
        const waiting = data.imports[0]["COUNT(vehicle)"] || 0
        const fields = [
            { name: "**Pieniądze do wypłaty**", value: `${NumberWithSpaces(payout)}$`},
            { name: "**Pojazdy w magazynie**", value: `${waiting}`, inline: true},
            { name: "**Łączna ilość importów**", value: `${imports}`, inline: true}
        ]
        return interaction.reply({ embeds: [bot.prettyReply(((member == interaction.member) ? "**Twój profil**" : "**Profil " + memberName + "**"), interaction).addFields(fields).setAuthor({ name: member.displayName, iconURL: member.user.displayAvatarURL({ format: 'png' })})] })
    },
};