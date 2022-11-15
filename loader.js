const config = require('./config').getConfig();
const Database = require('./database/database')
const Discord = require('discord.js')
const path = require('path')
const fs = require('fs')
const cron = require('cron').CronJob
const logger = require('./logger')
const { MakeRequest } = require('./functions')
const { replyEmbed } = require('./prettyReply')
const db = Database.connect(config.database)

const Instance = require('./bot')

let bots = []
let groups = []

let bot
const CreateDiscordBot = () => {
    bot = new Discord.Client(
        {
            intents:
            [
                Discord.GatewayIntentBits.DirectMessages,
                Discord.GatewayIntentBits.GuildMembers,
                Discord.GatewayIntentBits.GuildMessages,
                Discord.GatewayIntentBits.Guilds,
                Discord.GatewayIntentBits.MessageContent
            ]
        }
    )
    bot.once("ready", () => {
        logger.info("Połączono do Discorda jako " + bot.user.tag)
        setInterval(() => {
            bot.user.setPresence({
                activities: [
                    {
                        name: groups.length + ((groups.length >= 5) ? " organizacji" : " organizacje"),
                        type: Discord.ActivityType.Watching
                    }
                ],
                status: 'online'
            })
        }, 15 * 1000)
    })
    bot.login(config.discord.token)
    bot.database = db
    bot.PublishOrganisationData = (data) => {
        groups = groups.filter(g => g.id != data.id && g.time > (new Date().getTime() - (1.5 * 60 * 1000)))
        groups.push(data)
    }
    bot.GetGroup = async (guild) => {
        const query = await db("SELECT paradise_id, paid, settings FROM bots WHERE discord_id = " + guild + " LIMIT 1")
        if (!query || query.length == 0) return
        const paidTo = new Date(query[0].paid)
        let paid = true
        if (new Date() > paidTo) paid = false
        return { id: query[0].paradise_id, paid, paidTo: query[0].paid, settings: JSON.parse(query[0].settings) }
    }
    bot.GetActiveGroups = () => {
        return bots
    }
    bot.ReloadBots = () => {
        Load(false)
    }
    bot.paradise = {}
    bot.paradise.cache = []
    bot.paradise.GetUserByName = async (name) => {
        if (bot.paradise.cache.filter(m => m.ttl > Date.now()).map(m => m.login).includes(name)) return bot.paradise.cache.filter(m => m.ttl > Date.now() && m.login == name)[0]
        if (name.match(/^[^ĄąĆćĘęŁłŃńÓóŚśŹźŻż]/)) return;
        const data = await MakeRequest("", "https://ucp.paradise-rpg.pl/api/search?login=" + name, false)
        if (!data || data.length == 0) return;
        let user = data.filter(d => d.login.toLowerCase() == name.toLowerCase())
        if (user.length == 0) return
        user = user[0]
        user.ttl = Date.now() + (60 * 60 * 1000)
        bot.paradise.cache.push(user)
        return user
    }
    bot.paradise.GetUserById = async (id) => {
        if (bot.paradise.cache.filter(m => m.ttl > Date.now()).map(m => m.id).includes(id)) return bot.paradise.cache.filter(m => m.ttl > Date.now() && m.id == id)[0]
        const data = await MakeRequest("", "https://ucp.paradise-rpg.pl/api/profile/" + id, false)
        if (!data || data.length == 0) return;
        let user = {
            id: data.account.id,
            login: data.account.login,
            rank: data.account.rank,
            skin: data.account.skin,
            ttl: Date.now() + (60 * 60 * 1000)
        }
        bot.paradise.cache.push(user)
        return user
    }
    bot.SendActionLog = async (group, author, type, data) => {
        try {
        const query = await db("SELECT discord_id, settings FROM bots WHERE paradise_id = " + group + " LIMIT 1")
        if (!query || query.length == 0) return;
        const server = await bot.guilds.fetch(query[0].discord_id)
        if (!server) return
        const channelId = JSON.parse(query[0].settings).discord.channels[type]
        if (!channelId || channelId.length == 0) return
        const channel = await server.channels.fetch(channelId)
        if (!channel) return
        const embed = new Discord.EmbedBuilder().setColor(config.discord.color).setThumbnail(config.paradise.gif).setTimestamp()
        switch (type) {
            case "pawnshop": {
                embed.setAuthor({ name: author.login, iconURL: bot.user.displayAvatarURL() }).addFields([
                    {name: "Ilość przedmiotów", value: `${data.items} ` + ((data.items >= 5 || data.items == 0) ? "przedmiotów" : ((data.items > 1) ? "przedmioty" : "przedmiot"))},
                    {name: "Zarobione pieniądze", value: `${data.price}$`},
                    {name: "Lombard", value: `${data.shop}`}
                ])
                break;
            }
            case "import_success": {
                embed.setAuthor({ name: author.login, iconURL: bot.user.displayAvatarURL() }).addFields([
                    {name: "Pojazd", value: `${data.vehicle}`},
                    {name: "Wartość pojazdu", value: `${data.price}$`}
                ])
                break;
            }
            case "import_fail": {
                embed.setAuthor({ name: author.login, iconURL: bot.user.displayAvatarURL() }).addFields([
                    {name: "Pojazd", value: "IMPORT NIEUDANY"},
                    {name: "Wartość pojazdu", value: `${data.price}`}
                ])
                break;
            }
            case "artifact_start": {
                embed.setAuthor({ name: author.login, iconURL: bot.user.displayAvatarURL() })
                    .setDescription("Rozpoczęto poszukiwanie artefaktu")
                break;
            }
            case "artifact_end": {
                embed.setAuthor({ name: author.login, iconURL: bot.user.displayAvatarURL() }).addFields([
                    {name: "Wartość artefaktu", value: `${data.price}$`},
                    {name: "Zdobyte doświadczenie", value: `${data.experience} EXP`}
                ])
                break;
            }
            case "export": {
                embed.setAuthor({ name: author.login, iconURL: bot.user.displayAvatarURL() }).addFields([
                    {name: "Importer", value: `${data.importer}`},
                    {name: "Model pojazdu", value: `${data.vehicle}`},
                    {name: "Wartość pojazdu", value: `${data.price}$`},
                    {name: "Zdobyte doświadczenie", value: `${data.experience} EXP`}
                ])
                break;
            }
            case "hot_deals": {
                embed.setAuthor({ name: author, iconURL: bot.user.displayAvatarURL() }).addFields(data.fields)
                if (data.mention) channel.send({ content: "@everyone" })
                break;
            }
            case "price_change": {
                embed.setAuthor({ name: author, iconURL: bot.user.displayAvatarURL() }).addFields(data.fields)
                break;
            }
            case "news": {
                embed.setAuthor({ name: author, iconURL: bot.user.displayAvatarURL() }).setDescription(data.message)
                break;
            }
        }
        channel.send({embeds: [embed]})
        } catch(e) {}
    }
    bot.SendQueueLog = async (group, queue, message) => {
        if (!queue) return
        try {
        const query = await db("SELECT discord_id, settings FROM bots WHERE paradise_id = " + group + " LIMIT 1")
        if (!query || query.length == 0) return;
        const server = await bot.guilds.fetch(query[0].discord_id)
        if (!server) return
        const channelId = JSON.parse(query[0].settings).queue[queue].channel
        if (!channelId || channelId.length == 0) return
        const channel = await server.channels.fetch(channelId)
        if (!channel) return
        const embed = new Discord.EmbedBuilder().setColor(config.discord.color).setTimestamp().setDescription(message)
        channel.send({embeds: [embed]})
        } catch(e) {}
    }
    bot.logger = logger
    bot.prettyReply = replyEmbed
    bot.commands = new Discord.Collection();
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    const eventsPath = path.join(__dirname, 'events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            bot.once(event.name, (...args) => event.execute(bot, ...args));
        } else {
            bot.on(event.name, (...args) => event.execute(bot, ...args));
        }
    }

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        bot.commands.set(command.data.name, command);
    }
}

const Load = async (first) => {
    if (first) await CreateDiscordBot()
    logger.info("Ładowanie botów...")
    const data = await db("SELECT * FROM bots WHERE paid > NOW() AND enabled = 1 AND paradise_id = 1154")
    for (const d of data) {
        if (bots.map(b => b.data.id).includes(d.id)) continue;
        const instance = await new Instance().Create(d, bot)
        bots.push(instance)
    }
    if (first) {
        require('./web/server').init(bot)
        const dataHistoryJob = new cron('0,30 * * * *', async () => {
            const data = await db("SELECT users.* FROM users INNER JOIN bots ON users.gid = bots.paradise_id WHERE bots.enabled = 1")
            if (!data || data.length == 0) return;
            for (const d of data) {
                const jsonData = {
                    cash: d.cash,
                    count: {
                        artifact: d.count_artifact,
                        import: d.count_import,
                        import_fail: d.count_importfail,
                        export: d.count_export,
                        pawnshop: d.count_pawnshop
                    },
                    earn: {
                        artifact: d.earn_artifact,
                        import: d.earn_import,
                        export: d.earn_export,
                        pawnshop: d.earn_pawnshop
                    }
                }
                db("INSERT INTO data_history (`gid`, `uid`, `info`) VALUES (" + d.gid + ", " + d.uid + ", '" + JSON.stringify(jsonData) + "')")
            }
        })
        dataHistoryJob.start()
        const scanNotPaidJob = new cron('* * * * *', async () => {
            const data = await db("SELECT * FROM bots WHERE paid < NOW() AND enabled = 1")
            if (!data || data.length == 0) return;
            for (const d of data) {
                const b = bots.filter(c => c.group == d.paradise_id)
                if (b.length == 0) continue;
                b[0].DestroyIntervals()
                delete b[0]
                bots = bots.filter(c => c.group != d.paradise_id)
            }
        })
        scanNotPaidJob.start()
        const scanPaidJob = new cron('* * * * *', async () => {
            const data = await db("SELECT * FROM bots WHERE paid > NOW() AND enabled = 1")
            if (!data || data.length == 0) return;
            for (const d of data) {
                const b = bots.filter(c => c.group == d.paradise_id)
                if (b.length !== 0) continue;
                const instance = await new Instance().Create(d, bot)
                bots.push(instance)
            }
        })
        scanPaidJob.start()
    }
}

Load(true)

process.on('uncaughtException', function (err) {
    console.error(err);
    console.log("Nieoczekiwany błąd");
});