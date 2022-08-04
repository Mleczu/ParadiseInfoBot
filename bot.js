const logger = require('./logger')
const { MakeRequest, NumberWithSpaces, CheckIfUserHasProfile, CreateUserProfile, GetWarehouseNameMapping, GetWarehousePriceMapping } = require('./functions')
const cron = require('cron').CronJob;

let logTypes = {
    pawnshop: new RegExp(/W lombardzie \'(.*?)\' umieszczono (\d*) przedmiotów o wartości \$(\d*)/),
    import_success: new RegExp(/Import pojazdu (.*?) o kwocie \$(\d*) do magazynu/),
    import_fail: new RegExp(/Import pojazdu o kwocie \$(\d*) zakończony porażką./),
    artifact_start: new RegExp(/Rozpoczęcie akcji artefakt/),
    artifact_end: new RegExp(/Znalezienie artefaktu wartego \$(\d*) i (\d*) EXP/),
    export: new RegExp(/Eksport pojazdu (.*?) za \$(\d*) oraz (\d*) EXP/),
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

    async Create(datarec, botrec) {
        this.data = datarec;
        this.bot = botrec;
        this.group = this.data.paradise_id
        this.groupUrl = "https://ucp.paradise-rpg.pl/api/group/" + this.data.paradise_id
        this.settings = JSON.parse(this.data.settings)
        this.isEnabled = true
        await this.Login()
        this.intervalsList.push(setInterval(this.ProcessLogs.bind(this), 60 * 1000))
        this.intervalsList.push(setInterval(this.Login.bind(this), 1 * 60 * 60 * 1000))
        this.intervalsList.push(setInterval(this.PublishInformation.bind(this), 30 * 1000))
        const magazineTask = new cron('0 1 * * * *', this.CheckMagazine.bind(this));
        magazineTask.start()
        this.cronJobsList.push(magazineTask)
        const hotDealsTask = new cron('0 1 * * * *', this.CheckHotDeals.bind(this));
        hotDealsTask.start()
        this.cronJobsList.push(hotDealsTask)
        const warehouseLogTask = new cron('0 1 * * * *', this.LogWarehousePrices.bind(this));
        warehouseLogTask.start()
        this.cronJobsList.push(warehouseLogTask)
        const updateSettingsTask = new cron('0 0 * * * *', this.UpdateSettings.bind(this));
        updateSettingsTask.start()
        this.cronJobsList.push(updateSettingsTask)
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
            dateFrom: new Date(Date.now() - (6 * 60 * 60 * 1000)).toISOString(),
            dateTo: new Date().toISOString()
        }
        let result = await MakeRequest(this.token, this.groupUrl + "/logs", true, body)
        return result;
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
        await this.bot.database("INSERT INTO `imports` (`gid`, `uid`, `vehicle`) VALUES ('" + this.group + "','" + user.id + "','" + vehicle + "')")
    }
    
    async GetRank(id) {
        const userList = await MakeRequest(this.token, "https://ucp.paradise-rpg.pl/api/group/" + this.group, true)
        if (!userList) return "Not found"
        const user = userList.group.members.filter(u => u.account.id == id)[0] || { rank: "Not found"}
        let rank = user.rank
        if (rank.startsWith(" ") || rank.endsWith(" ")) rank = rank.trim()
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
        }
        const table = tempSettings.payouts[type]
        if (table[rank]) return table[rank]
        if (table["*"]) return table["*"]
        if (type == "export") return { count: 0, percent: true }
        return { count: 50, percent: true }
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
        this.AddBalanceHistory(count, false)
        const modifier = await this.GetPaymentModifier(user, type)
        count = ((modifier.percent) ? Math.floor((count * (modifier.count / 100))) : modifier.count)
        await this.bot.database("UPDATE `users` SET cash = cash + " + count + ", earn_" + type + " = earn_" + type + " + " + count + " WHERE uid = " + user.id + " AND gid = " + this.group + " LIMIT 1")
    }
    
    async LogProcess(author, type, data) {
        const profileCheck = await CheckIfUserHasProfile(this.bot, this.group, author)
        if (!profileCheck) await CreateUserProfile(this.bot, this.group, author)
        switch (type) {
            case "pawnshop": {
                this.IncreaseCount(author, "pawnshop", data[2])
                this.AddCash(author, data[3], "pawnshop")
                this.bot.SendActionLog(this.group, author, type, { items: data[2], price: data[3], shop: data[1] })
                break;
            }
            case "import_success": {
                this.IncreaseCount(author, "import")
                this.InsertImport(author, data[1])
                this.bot.SendActionLog(this.group, author, type, { vehicle: data[1], price: data[2] })
                break;
            }
            case "import_fail": {
                this.IncreaseCount(author, "importfail")
                this.bot.SendActionLog(this.group, author, type, { price: data[1] })
                break;
            }
            case "artifact__start": {
                this.bot.SendActionLog(this.group, author, type, {})
                break;
            }
            case "artifact_end": {
                this.IncreaseCount(author, "artifact")
                this.AddCash(author, data[1], "artifact")
                this.bot.SendActionLog(this.group, author, type, { price: data[1], experience: data[2] })
                break;
            }
            case "export": {
                this.IncreaseCount(author, "export")
                this.AddCash(author, data[2], "export")
                const importerData = await this.GetImporterData(data[1])
                if (!importerData) {
                    this.bot.SendActionLog(this.group, author, type, { importer: "Brak danych", vehicle: data[1], price: data[2], experience: data[3] })
                    break;
                }
                await this.RemoveImporterData(importerData.uid, data[1])
                this.AddCash({ id: importerData.uid }, data[2], "import")
                let importerName = await this.bot.paradise.GetUserById(importerData.uid);
                if (!importerName) importerName = { login: "Nieznany" }
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
                this.AddBalanceHistory(cash, true)
                await this.bot.database("UPDATE users SET cash = " + query + " WHERE uid = " + user.id + " AND gid = " + this.group + " LIMIT 1")
                break;
            }
        }
    }
    
    async CheckMagazine() {
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
        if (!this.settings.discord.channels.price_change) return;
        if (this.settings.discord.channels.price_change.length == 0) return;
        const data = await MakeRequest(this.token, this.groupUrl + "/warehouses", true)
        if (!data || !data.warehouse) return
        if (!data.warehouse.warehouse) return
        const vehicles = data.warehouse.warehouse.vehicles
        let veh = []
        for (const v of vehicles) {
            const vehicleName = GetWarehouseNameMapping(v.vehicle_model)
            veh.push({ name: vehicleName, value: NumberWithSpaces(v.vehicle_price) + "$", inline: true })
        }
        if (veh.length == 0) return;
        this.bot.SendActionLog(this.group, "Zmiana cen - Wszystkie oferty", "price_change", veh)
    }

    async CheckHotDeals() {
        if (!this.settings.discord.channels.hot_deals) return;
        const data = await MakeRequest(this.token, this.groupUrl + "/warehouses", true)
        if (!data || !data.warehouse) return
        if (!data.warehouse.warehouse) return
        const vehicles = data.warehouse.warehouse.vehicles
        let hotDeals = []
        for (const v of vehicles) {
            const vehicleName = GetWarehouseNameMapping(v.vehicle_model)
            const goodPrice = GetWarehousePriceMapping(vehicleName)
            if (goodPrice) {
                if (v.vehicle_price > goodPrice) {
                    hotDeals.push({ name: vehicleName, value: NumberWithSpaces(v.vehicle_price) + "$", inline: true })
                }
            }
        }
        if (hotDeals.length == 0) return;
        this.bot.SendActionLog(this.group, "Zmiana cen - Dobre oferty", "hot_deals", hotDeals)
    }

    async UpdateSettings() {
        const data = await this.bot.database("SELECT settings FROM bots WHERE paradise_id = " + this.group + " LIMIT 1")
        if (!data || data.length == 0) return;
        const newSettings = JSON.parse(data[0].settings)
        this.settings = newSettings
    }

    async AddBalanceHistory(count, out) {
        try {
            const date = new Date()
            const existCheck = await this.bot.database("SELECT id FROM balance_history WHERE `date` = date('" + date.toISOString() + "') AND gid = " + this.group)
            if (!existCheck) return;
            if (existCheck.length == 0) {
                await this.bot.database("INSERT INTO `balance_history` (`gid`, `date`, `in`, `out`) VALUES ('" + this.group + "', date('" + date.toISOString().split("T")[0] + "'), '0', '0');")
            }
            this.bot.database("UPDATE `balance_history` SET `" + ((out) ? "out" : "in") + "` = `" + ((out) ? "out" : "in") + "` + " + count + " WHERE `date` = date('" + date.toISOString().split("T")[0] + "') AND gid = " + this.group)
        } catch (e) {
            console.log(e)
        }
    }
}

module.exports = Instance