const Discord = require('discord.js');
const { CheckIfUserHasProfile, CreateUserProfile, NumberWithSpaces } = require('../functions')

module.exports = {
	data: new Discord.SlashCommandBuilder()
        .setName('edytuj')
		.setDescription('Edytuj konto')
        .addSubcommand(o => {
            return o.setName("dodaj")
                    .setDescription("Dodaj pieniądze do konta")
                    .addUserOption(u => {
                        return u.setName("gracz")
                                .setDescription("Dodaj pieniądze do konta gracza")
                                .setRequired(true)
                    })
                    .addIntegerOption(c => {
                        return c.setName("ilosc")
                                .setDescription("Ilość pieniędzy do dodania")
                                .setRequired(true)
                    })
        })
        .addSubcommand(o => {
            return o.setName("usun")
                    .setDescription("Usuń pieniądze z konta")
                    .addUserOption(u => {
                        return u.setName("gracz")
                                .setDescription("Usuń pieniądze z konta gracza")
                                .setRequired(true)
                    })
                    .addIntegerOption(c => {
                        return c.setName("ilosc")
                                .setDescription("Ilość pieniędzy do usunięcia")
                                .setRequired(true)
                    })
        })
        .addSubcommand(o => {
            return o.setName("ustaw")
                    .setDescription("Ustaw pieniądze na koncie")
                    .addUserOption(u => {
                        return u.setName("gracz")
                                .setDescription("Ustaw pieniądze na koncie gracza")
                                .setRequired(true)
                    })
                    .addIntegerOption(c => {
                        return c.setName("ilosc")
                                .setDescription("Ilość pieniędzy do ustawienia")
                                .setRequired(true)
                    })
        })
        .addSubcommand(o => {
            return o.setName("dodajpunkty")
                    .setDescription("Dodaj punkty do konta")
                    .addUserOption(u => {
                        return u.setName("gracz")
                                .setDescription("Dodaj punkty do konta gracza")
                                .setRequired(true)
                    })
                    .addIntegerOption(c => {
                        return c.setName("ilosc")
                                .setDescription("Ilość punktów do dodania")
                                .setRequired(true)
                    })
        })
        .addSubcommand(o => {
            return o.setName("usunpunkty")
                    .setDescription("Usuń punkty z konta")
                    .addUserOption(u => {
                        return u.setName("gracz")
                                .setDescription("Usuń punkty z konta gracza")
                                .setRequired(true)
                    })
                    .addIntegerOption(c => {
                        return c.setName("ilosc")
                                .setDescription("Ilość punktów do usunięcia")
                                .setRequired(true)
                    })
        })
        .addSubcommand(o => {
            return o.setName("ustawpunkty")
                    .setDescription("Ustaw punkty na koncie")
                    .addUserOption(u => {
                        return u.setName("gracz")
                                .setDescription("Ustaw punkty na koncie gracza")
                                .setRequired(true)
                    })
                    .addIntegerOption(c => {
                        return c.setName("ilosc")
                                .setDescription("Ilość punktów do ustawienia")
                                .setRequired(true)
                    })
        })
        .setDMPermission(false)
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.Administrator),
	async execute(bot, interaction) {
        const gid = await bot.GetGroup(interaction.guild.id)
        if (!gid) return interaction.reply({ embeds: [bot.prettyReply("**Hola hola, nie wykryto organizacji dla tego serwera.**", interaction)], ephemeral: true })
        if (!gid.paid) return interaction.reply({ embeds: [bot.prettyReply("**Hola hola, bot dla tej organizacji nie jest opłacony.**", interaction)], ephemeral: true })
        const member = interaction.options.getMember("gracz")
        if (!member) return interaction.reply({ embeds: [bot.prettyReply("Nieprawidłowy gracz", interaction)], ephemeral: true })
        const memberName = member.displayName
        const paradiseUser = await bot.paradise.GetUserByName(memberName)
        if (!paradiseUser) return interaction.reply({ embeds: [bot.prettyReply("Nie znaleziono gracza z nickiem `" + memberName + "` na serwerze", interaction)], ephemeral: true })
        const count = interaction.options.getInteger("ilosc")
        let message = "Brak odpowiedzi..."
        let subcmd = interaction.options.getSubcommand()
        switch (subcmd) {
            case "dodaj": {
                query = "cash = cash + " + count
                message = "Dodano %count%$ na konto użytkownika %user%"
                break;
            }
            case "usun": {
                query = "cash = cash - " + count
                message = "Usunięto %count%$ z konta użytkownika %user%"
                break;
            }
            case "ustaw": {
                query = "cash = " + count
                message = "Ustawiono stan konta %user% na %count%$"
                break;
            }
            case "dodajpunkty": {
                query = "points = points + " + count
                message = "Dodano %count% punktów na konto użytkownika %user%"
                break;
            }
            case "usunpunkty": {
                query = "points = points - " + count
                message = "Usunięto %count% punktów z konta użytkownika %user%"
                break;
            }
            case "ustawpunkty": {
                query = "points = " + count
                message = "Ustawiono punkty %user% na %count%$"
                break;
            }
        }
        const profileCheck = await CheckIfUserHasProfile(bot, gid.id, paradiseUser)
        if (!profileCheck) await CreateUserProfile(bot, gid.id, paradiseUser)
        await bot.database("UPDATE users SET " + query + " WHERE gid = " + gid.id + " AND uid = " + paradiseUser.id)
        interaction.reply({ embeds: [bot.prettyReply(message.replace(/%user%/g, paradiseUser.login).replace(/%count%/g, NumberWithSpaces(count)), interaction)] })
        return
    },
};