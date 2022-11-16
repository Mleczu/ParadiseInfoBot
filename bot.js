const logger = require('./logger')
const { MakeRequest, NumberWithSpaces, CheckIfUserHasProfile, CreateUserProfile, GetWarehouseNameMapping, makeRequiredValues, GetQueueNameMapping, GetMaxImportPrice } = require('./functions')
const cron = require('cron').CronJob;
const moment = require('moment');

let logTypes = {
    pawnshop: new RegExp(/W lombardzie \'(.*?)\' umieszczono (\d*) przedmiotów o wartości \$(\d*)/),
    import_success: new RegExp(/Import pojazdu (.*?) o kwocie \$(\d*) do magazynu/),
    import_fail: new RegExp(/Import pojazdu o kwocie \$(\d*) zakończony porażką./),
    import_fail_second: new RegExp(/Import pojazdu zakończony porażką./),
    artifact_start: new RegExp(/Rozpoczęcie akcji artefakt/),
    artifact_end: new RegExp(/Znalezienie artefaktu wartego \$(\d*) i (\d*) EXP/),
    export: new RegExp(/Eksport pojazdu (.*?) za \$(\d*) oraz (\d*) EXP/),
    export_fail: new RegExp(/Eksport pojazdu za \$(\d*) zakończony porażką./),
    member_add: new RegExp(/Dodanie (.*?) do grupy/),
    rank_change: new RegExp(/zmiana rangi członka (.*?) na (.*?)/),
    transfer_receive: new RegExp(/Wpłata na konto w kwocie \$(\d*)/),
    payout: new RegExp(/Wypłacono członkowi (.*?) \$(\d*)./)
}

class Instance {
    constructor() {
        this.token
        this.ProcessedCache = []
        this.intervalsList = []
        this.cronJobsList = []
        this.data
        this.bot
        this.group
        this.groupUrl
        this.settings
        this.isEnabled
    }

    createCronJob(interval, job) {
        const t = new cron(interval, job.bind(this));
        t.start()
        this.cronJobsList.push(t)
    }

    createInterval(job, interval) {
        this.intervalsList.push(setInterval(job.bind(this), interval))
    }

    async Create(datarec, botrec) {
        this.data = datarec;
        this.bot = botrec;
        this.group = this.data.paradise_id
        this.groupUrl = "https://ucp.paradise-rpg.pl/api/group/" + this.data.paradise_id
        this.settings = makeRequiredValues(JSON.parse(this.data.settings))
        this.isEnabled = true
        this.paid = this.data.paid
        await this.Login()
        this.ProcessQueue()
        this.createInterval(this.Login, 2 * 60 * 60 * 1000)
        this.createInterval(this.PublishInformation, 30 * 1000)
        this.createCronJob('0 */2 * * * *', this.ProcessLogs)
        this.createCronJob('0 1 * * * *', this.LogWarehousePrices);
        this.createCronJob('0 0 * * * *', this.UpdateSettings);
        this.createCronJob('30 0 * * * *', this.Ping1DayLeft);
        this.createCronJob('30 0 * * * *', this.Ping3DaysLeft);
        this.createCronJob('30 0 * * * *', this.Ping1DayLeftWarehouse);
        this.createCronJob('30 0 * * * *', this.Ping3DaysLeftWarehouse);
        this.createCronJob('1 * * * * *', this.ProcessQueue);
        this.createCronJob('0 59 23 * * *', this.GenerateDailyReport);
        return this
    }

    PublishInformation() {
        this.bot.PublishOrganisationData({
            time: new Date().getTime(),
            id: this.group,
            url: this.groupUrl,
            logs: this.ProcessedCache.length,
            enabled: this.isEnabled
        })
    }

    DestroyIntervals() {
        for (const j of this.cronJobsList) {
            j.stop()
        }
        for (const i of this.intervalsList) {
            clearInterval(i)
        }
    }

    GetInstance() {
        return this
    }

    async Login() {
        let body = {
            login: this.settings.client.username,
            password: this.settings.client.password,
            code: ""
        }
        let result = await MakeRequest("", "https://ucp.paradise-rpg.pl/api/login", false, body)
        this.token = result.token
        logger.info('Zalogowano jako ' + JSON.parse(result.user).login)
    }
    
    async CheckIfLogWasProcessed(id) {
        if (this.ProcessedCache.includes(id)) return true;
        const db = await this.bot.database("SELECT id FROM logs WHERE lid = " + id + " AND gid = " + this.group + " ORDER BY id DESC LIMIT 1")
        this.ProcessedCache.push(id)
        if (db && db.length != 0) {
            return true;
        };
        return false;
    }
    
    async MarkLogAsProcessed(id) {
        await this.bot.database("INSERT INTO logs (`id`, `lid`, `gid`) VALUES (NULL, '" + id + "', '" + this.group + "')")
    }
    
    async GetLogs() {
        if (!this.token) return logger.warn("Token not found")
        let body = {
            dateFrom: new Date(Date.now() - (24 * 60 * 60 * 1000)).toISOString(),
            dateTo: new Date().toISOString()
        }
        let result = await MakeRequest(this.token, this.groupUrl + "/logs", true, body)
        return result
    }

    async ProcessLogs() {
        const data = await this.GetLogs();
        if (data.error) return logger.warn("Prawdopodobnie niewystarczająca ranga w grupie " + this.group)
        for (const log of data) {
            const checkStatus = await this.CheckIfLogWasProcessed(log.id)
            if (!checkStatus) {
                await this.MarkLogAsProcessed(log.id)
                await this.ProcessLog(log)
            };
        }
    }

    GetLogType(log) {
        let type = "unknown"
        for (const [key, value] of Object.entries(logTypes)) {
            if (value.test(log.log)) type = key
        }
        return type
    }
    
    async IsUserIgnored(user) {
        const ignoredCheck = await this.bot.database("SELECT * FROM ignored_users WHERE gid = " + this.group + " AND uid = " + user.id + " LIMIT 1")
        if (ignoredCheck && ignoredCheck.length > 0) return true;
        return false;
    }
    
    async ProcessLog(log) {
        const type = this.GetLogType(log)
        const author = await this.bot.paradise.GetUserByName(log.member_name)
        if (!author) return
        const isUserIgnored = await this.IsUserIgnored(author)
        if (isUserIgnored) return;
        let data = [log.log]
        if (logTypes[type]) data = log.log.match(logTypes[type]) 
        await this.LogProcess(author, type, data)
    }
    
    async IncreaseCount(user, category, count) {
        await this.bot.database("UPDATE `users` SET count_" + category + " = count_" + category + " + " + ((count) ? count : "1") + " WHERE uid = " + user.id + " AND gid = " + this.group + " LIMIT 1")
    }
    
    async InsertImport(user, vehicle) {
        const modifier = await this.GetPaymentModifier(user, "import")
        if (modifier.instantPayout == true) {
            logger.info("Dodawanie nagrody za import dla " + user + " (" + vehicle + ") w organizacji " + this.group)
            this.AddCash(user, Math.floor(GetMaxImportPrice(vehicle) * (4 / 100)), "import")
        } else {
            logger.info("Dodawanie importu do kolejki dla " + user + " (" + vehicle + ") w organizacji " + this.group)
            await this.bot.database("INSERT INTO `imports` (`gid`, `uid`, `vehicle`) VALUES ('" + this.group + "','" + user.id + "','" + vehicle + "')")
        }
    }
    
    async GetRank(id) {
        const userList = await MakeRequest(this.token, "https://ucp.paradise-rpg.pl/api/group/" + this.group, true)
        if (!userList) return "Not found"
        const user = userList.group.members.filter(u => u.account.id == id)[0] || { rank: "Not found"}
        let rank = user.rank
        return rank
    }
    
    async GetPaymentModifier(user, type) {
        let rank = await this.GetRank(user.id)
        rank = rank.toLowerCase().replace(/#[A-Za-z0-9]{6}/g, "")
        let tempSettings = await this.bot.database("SELECT settings FROM bots WHERE paradise_id = " + this.group + " LIMIT 1")
        if (!tempSettings || tempSettings.length == 0) return { count: 50, percent: true }
        tempSettings = JSON.parse(tempSettings[0].settings)
        if (tempSettings.perUserRankSystem) {
            rank = rank.split("-")[0].trim()
        } else {
            rank = rank.trim()
        }
        const table = tempSettings.payouts[type]
        if (table[rank]) return table[rank]
        if (table["*"]) return table["*"]
        if (type == "export") return { count: 0, percent: true, instantPayout: false }
        return { count: 50, percent: true, instantPayout: false }
    }
    
    async GetImporterData(vehicle) {
        const data = await this.bot.database("SELECT * FROM imports WHERE vehicle = '" + vehicle + "' AND gid = " + this.group + " ORDER BY id DESC LIMIT 1")
        if (!data || data.length == 0) return
        return data[0]
    }
    
    async RemoveImporterData(importer, vehicle) {
        await this.bot.database("DELETE FROM imports WHERE vehicle = '" + vehicle + "' AND gid = " + this.group + " AND uid = " + importer + " ORDER BY id DESC LIMIT 1")
    }
    
    async AddCash(user, count, type) {
        const profileCheck = await CheckIfUserHasProfile(this.bot, this.group, user)
        if (!profileCheck) await CreateUserProfile(this.bot, this.group, user)
        const modifier = await this.GetPaymentModifier(user, type)
        count = ((modifier.percent) ? Math.floor((count * (modifier.count / 100))) : modifier.count)
        this.AddBalanceHistory(count, "in")
        await this.bot.database("UPDATE `users` SET cash = cash + " + count + ", earn_" + type + " = earn_" + type + " + " + count + " WHERE uid = " + user.id + " AND gid = " + this.group + " LIMIT 1")
    }
    
    async LogProcess(author, type, data) {
        const profileCheck = await CheckIfUserHasProfile(this.bot, this.group, author)
        if (!profileCheck) await CreateUserProfile(this.bot, this.group, author)
        switch (type) {
            case "pawnshop": {
                this.AddBalanceHistory(data[2], "pawnshop")
                this.IncreaseCount(author, "pawnshop", data[2])
                this.AddCash(author, data[3], "pawnshop")
                this.bot.SendActionLog(this.group, author, type, { items: data[2], price: data[3], shop: data[1] })
                break;
            }
            case "import_success": {
                this.AddBalanceHistory(1, "import")
                this.IncreaseCount(author, "import")
                this.InsertImport(author, data[1])
                this.bot.SendActionLog(this.group, author, type, { vehicle: data[1], price: data[2] })
                break;
            }
            case "import_fail": {
                this.AddBalanceHistory(1, "import_failed")
                this.IncreaseCount(author, "importfail")
                this.bot.SendActionLog(this.group, author, type, { price: data[1] + "$" })
                break;
            }
            case "import_fail_second": {
                this.AddBalanceHistory(1, "import_failed")
                this.IncreaseCount(author, "importfail")
                this.bot.SendActionLog(this.group, author, "import_fail", { price: "Brak danych" })
            }
            case "artifact__start": {
                this.bot.SendActionLog(this.group, author, type, {})
                break;
            }
            case "artifact_end": {
                this.AddBalanceHistory(1, "artifact")
                this.IncreaseCount(author, "artifact")
                this.AddCash(author, data[1], "artifact")
                this.bot.SendActionLog(this.group, author, type, { price: data[1], experience: data[2] })
                break;
            }
            case "export": {
                this.AddBalanceHistory(1, "export")
                this.IncreaseCount(author, "export")
                this.AddCash(author, data[2], "export")
                const importerData = await this.GetImporterData(data[1])
                if (!importerData) {
                    logger.info("Brak o importerze dla pojazdu " + data[1] + " w organizacji " + this.group)
                    this.bot.SendActionLog(this.group, author, type, { importer: false, vehicle: data[1], price: data[2], experience: data[3] })
                    break
                };
                await this.RemoveImporterData(importerData.uid, data[1])
                this.AddCash({ id: importerData.uid }, data[2], "import")
                let importerName = await this.bot.paradise.GetUserById(importerData.uid);
                if (!importerName) importerName = { login: "Nieznany" }
                logger.info("Pojazd " + data[1] + " zimportowany przez " + importerName.login + " w organizacji " + this.group)
                this.bot.SendActionLog(this.group, author, type, { importer: importerName.login, vehicle: data[1], price: data[2], experience: data[3] })
                break;
            }
            case "member_add": {
                break;
            }
            case "rank_change": {
                break;
            }
            case "transfer_receive": {
                break;
            }
            case "payout": {
                const user = await this.bot.paradise.GetUserByName(data[1])
                if (!user) break;
                const profileCheck = await CheckIfUserHasProfile(this.bot, this.group, user)
                if (!profileCheck) await CreateUserProfile(this.bot, this.group, user)
                const cash = data[2]
                const hasCash = await this.bot.database("SELECT cash FROM users WHERE uid = " + user.id + " AND gid = " + this.group + " LIMIT 1")
                if (!hasCash || hasCash.length == 0) break;
                let query = "cash - " + cash
                if (hasCash[0].cash < cash) {
                    query = "0"
                }
                this.AddBalanceHistory(cash, "out")
                await this.bot.database("UPDATE users SET cash = " + query + " WHERE uid = " + user.id + " AND gid = " + this.group + " LIMIT 1")
                break;
            }
            case "export_fail": {
                await this.CheckWarehouse()
                break;
            }
        }
    }
    
    async CheckWarehouse() {
        const dbData = await this.bot.database("SELECT * FROM imports WHERE gid = " + this.group + " ORDER BY id DESC")
        if (!dbData || dbData.length == 0) return;
        const data = await MakeRequest(this.token, this.groupUrl + "/warehouses", true)
        if (!data || !data.warehouse) return
        if (!data.warehouse.warehouse) return
        const vehicles = data.warehouse.warehouse.vehicles
        const vehiclesNames = vehicles.map(v => GetWarehouseNameMapping(v.vehicle_model))
        const databaseVehicles = await this.bot.database("SELECT * FROM imports WHERE gid = " + this.group + " ORDER BY id DESC")
        if (!databaseVehicles || databaseVehicles.length == 0) return
        const databaseVehiclesNames = databaseVehicles.map(v => v.vehicle)
        const toRemove = databaseVehiclesNames.filter(v => !vehiclesNames.includes(v))
        for (const v of toRemove) {
            logger.warn("Usuwanie pojazdu " + v + " z bazy danych organizacji " + this.group)
            await this.bot.database("DELETE FROM imports WHERE gid = " + this.group + " AND vehicle = '" + v + "' ORDER BY id ASC LIMIT 1")
        }
    }

    async LogWarehousePrices() {
        if (!this.settings.discord.channels.price_change && !this.settings.discord.channels.hot_deals) return;
        if (this.settings.discord.channels.price_change.length == 0 && this.settings.discord.channels.hot_deals.length == 0) return;
        const data = await MakeRequest(this.token, this.groupUrl + "/warehouses", true)
        if (!data || !data.warehouse) return
        if (!data.warehouse.warehouse) return
        const vehicles = data.warehouse.warehouse.vehicles
        if (this.settings.discord.channels.price_change && this.settings.discord.channels.price_change.length != 0) {
            let veh = []
            for (const v of vehicles) {
                const vehicleName = GetWarehouseNameMapping(v.vehicle_model)
                veh.push({ name: vehicleName, value: NumberWithSpaces(v.vehicle_price) + "$", inline: true })
            }
            if (veh.length != 0) {
                this.bot.SendActionLog(this.group, "Zmiana cen - Wszystkie oferty", "price_change",  { fields: veh })
            }
        }
        if (this.settings.discord.channels.hot_deals && this.settings.discord.channels.hot_deals.length != 0) {
            let hotDeals = []
            for (const v of vehicles) {
                const vehicleName = GetWarehouseNameMapping(v.vehicle_model)
                const vd = await this.bot.database("SELECT * FROM export_prices WHERE gid = " + this.group + " AND model = '" + vehicleName + "' LIMIT 1")
                if (vd && vd.length != 0) {
                    const goodPrice = vd[0].price
                    if (goodPrice) {
                        if (v.vehicle_price > goodPrice) {
                            hotDeals.push({ name: vehicleName, value: NumberWithSpaces(v.vehicle_price) + "$", inline: true })
                        }
                    }
                }
            }
            if (hotDeals.length != 0) {
                this.bot.SendActionLog(this.group, "Zmiana cen - Dobre oferty", "hot_deals", { fields: hotDeals, mention: (this.settings.discord.pings.switchPingGoodDeals || false) })
            }
        }
    }

    async UpdateSettings() {
        const data = await this.bot.database("SELECT settings, paid FROM bots WHERE paradise_id = " + this.group + " LIMIT 1")
        if (!data || data.length == 0) return;
        const newSettings = makeRequiredValues(JSON.parse(data[0].settings))
        this.settings = newSettings
        this.paid = new Date(data[0].paid)
    }

    async AddBalanceHistory(count, mode) {
        try {
            const date = new Date()
            const dateString = [date.getFullYear(), date.getMonth(), date.getDate()].join("-")
            const existCheck = await this.bot.database("SELECT id FROM balance_history WHERE `date` = '" + dateString + "' AND gid = " + this.group)
            if (!existCheck) return;
            if (existCheck.length == 0) {
                await this.bot.database("INSERT INTO `balance_history` (`gid`, `date`, `in`, `out`, `import`, `import_failed`, `export`, `artifact`, `pawnshop`) VALUES ('" + this.group + "', '" + dateString + "', '0', '0', '0', '0', '0', '0', '0');")
            }
            this.bot.database("UPDATE `balance_history` SET `" + mode + "` = `" + mode + "` + " + count + " WHERE `date` = '" + dateString + "' AND gid = " + this.group)
        } catch (e) {
            console.log(e)
        }
    }

    async Ping1DayLeft() {
        if (!this.settings.discord.pings.switchPing1DayLeft) return
        let pingDay = moment(this.paid).minute(0).seconds(0).milliseconds(0)
        const paidDay = pingDay.dayOfYear()
        pingDay = pingDay.dayOfYear((paidDay - 1))
        const nowDay = moment().minute(0).seconds(0).milliseconds(0)
        if (pingDay.dayOfYear() != nowDay.dayOfYear()) return
        if (pingDay.year() != nowDay.year()) return
        if (pingDay.month() != nowDay.month()) return
        if (pingDay.hour() != nowDay.hour()) return
        this.bot.SendActionLog(this.group, "Opłata", "news", { message: "**Bot wygasa za** `1 dzień` " })
    }

    async Ping3DaysLeft() {
        if (!this.settings.discord.pings.switchPing1DayLeft) return
        let pingDay = moment(this.paid).minute(0).seconds(0).milliseconds(0)
        const paidDay = pingDay.dayOfYear()
        pingDay = pingDay.dayOfYear((paidDay - 3))
        const nowDay = moment().minute(0).seconds(0).milliseconds(0)
        if (pingDay.dayOfYear() != nowDay.dayOfYear()) return
        if (pingDay.year() != nowDay.year()) return
        if (pingDay.month() != nowDay.month()) return
        if (pingDay.hour() != nowDay.hour()) return
        this.bot.SendActionLog(this.group, "Opłata", "news", { message: "**Bot wygasa za** `3 dni` " })
    }

    async Ping1DayLeftWarehouse() {
        if (!this.settings.discord.pings.switchPing1DayLeftWarehouse) return
        const data = await MakeRequest(this.token, this.groupUrl + "/warehouses", true)
        if (!data || !data.warehouse) return
        let pingDay = moment((data.warehouse.expires * 1000)).minute(0).seconds(0).milliseconds(0)
        const paidDay = pingDay.dayOfYear()
        pingDay = pingDay.dayOfYear((paidDay - 1))
        const nowDay = moment().minute(0).seconds(0).milliseconds(0)
        if (pingDay.dayOfYear() != nowDay.dayOfYear()) return
        if (pingDay.year() != nowDay.year()) return
        if (pingDay.month() != nowDay.month()) return
        if (pingDay.hour() != nowDay.hour()) return
        this.bot.SendActionLog(this.group, "Opłata", "news", { message: "**Magazyn wygasa za** `1 dzień` " })
    }

    async Ping3DaysLeftWarehouse() {
        if (!this.settings.discord.pings.switchPing3DaysLeftWarehouse) return
        const data = await MakeRequest(this.token, this.groupUrl + "/warehouses", true)
        if (!data || !data.warehouse) return
        let pingDay = moment((data.warehouse.expires * 1000)).minute(0).seconds(0).milliseconds(0)
        const paidDay = pingDay.dayOfYear()
        pingDay = pingDay.dayOfYear((paidDay - 3))
        const nowDay = moment().minute(0).seconds(0).milliseconds(0)
        if (pingDay.dayOfYear() != nowDay.dayOfYear()) return
        if (pingDay.year() != nowDay.year()) return
        if (pingDay.month() != nowDay.month()) return
        if (pingDay.hour() != nowDay.hour()) return
        this.bot.SendActionLog(this.group, "Opłata", "news", { message: "**Magazyn wygasa za** `3 dni` " })
    }

    async ProcessQueue() {
        const queueTypes = ["import", "artifact"]
        for (const type of queueTypes) {
            if (!this.settings.queue[type].status) continue
            const now = moment()
            const t = this.settings.queue[type].time
            for (let i = 1; i <= t; i++) {
                let add = now.hour() + i
                const end = moment().hours(add).minutes(0).seconds(0).milliseconds(0)
                if ((end.weekday() == 6 || end.weekday() == 0) && (end.hour() >= 19 && end.hour() <= 22)) {
                    const bonusMinutes = [0, 15, 30, 45]
                    for (const bm of bonusMinutes) {
                        const bonusEnd = moment().hours(add).minutes(bm).seconds(0).milliseconds(0)
                        const bonus = await this.GetQueueData(type, bonusEnd.format('YYYY-MM-DD HH:mm'))
                        if (!bonus) await this.CreateQueueData(type, bonusEnd.format('YYYY-MM-DD HH:mm'))
                    }
                } else {
                    const qd = await this.GetQueueData(type, end.format('YYYY-MM-DD HH:mm'))
                    if (!qd) await this.CreateQueueData(type, end.format('YYYY-MM-DD HH:mm'))
                }
            }
        }
    }

    async CreateQueueData(type, date) {
        await this.bot.database("INSERT INTO queue (`gid`, `type`, `date`) VALUES (" + this.group + ", '" + type + "', '" + date + "')")
        await this.bot.SendQueueLog(this.group, type, "Dostępne nowe zapisy: **" + date + "**")
    }

    async GetQueueData(type, date) {
        const data = await this.bot.database("SELECT * FROM queue WHERE `gid` = " + this.group + " AND `type` = '" + type + "' AND `date` = '" + date + "'")
        if (!data || data.length == 0) return
        return data[0]
    }

    async GenerateDailyReport() {
        if (!(this.settings.discord.channels.daily_reports && this.settings.discord.channels.daily_report.length != 0)) return
        const date = new Date()
        const dateString = [date.getFullYear(), date.getMonth(), date.getDate()].join("-")
        const existCheck = await this.bot.database("SELECT * FROM balance_history WHERE `date` = '" + dateString + "' AND gid = " + this.group + " LIMIT 1")
        let earnings = 0
        let out = 0
        let imp = 0
        let imp_f = 0
        let exp = 0
        let art = 0
        let pawn = 0
        if (existCheck && existCheck.length != 0) {
            earnings = existCheck[0].in
            out = existCheck[0].out
            imp = existCheck[0].import
            imp_f = existCheck[0].import_failed
            exp = existCheck[0].export
            art = existCheck[0].artifact
            pawn = existCheck[0].pawnshop
        }
        let fields = [
            { name: "Zarobione pieniądze", value: `${NumberWithSpaces(Math.floor(earnings))}$`, inline: true},
            { name: "Wypłacone pieniądze", value: `${NumberWithSpaces(Math.floor(out))}$`, inline: true},
            { name: "Bilans", value: `${NumberWithSpaces(Math.floor((earnings - out)))}$`, inline: true},
            { name: "Ilość: Importy", value: `${imp}`, inline: true},
            { name: "Ilość: Nieudane importy", value: `${imp_f}`, inline: true},
            { name: "Ilość: Exporty", value: `${exp}`, inline: true},
            { name: "Ilość: Artefakty", value: `${art}`, inline: true},
            { name: "Ilość: Lombard", value: `${pawn}`, inline: true}
        ]
        this.bot.SendActionLog(this.group, "Dzienny Report", "daily_reports", { fields })
    }
}

module.exports = Instance

process.on('uncaughtException', function (err) {
    console.error(err);
    console.log("Nieoczekiwany błąd");
});