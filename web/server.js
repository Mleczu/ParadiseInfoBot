const config = require('../config').getConfig();
const Database = require('../database/database')
const express = require('express');
const cookieSession = require('cookie-session')
const path = require('path');
const { engine } = require('express-edge')
const logger = require('../logger')
const db = Database.connect(config.database)
const { escape } = require('mysql')
const sha256 = require("crypto-js/sha256");
const moment = require('moment')
const Discord = require('discord.js')

const { GetChannelNameMapping, makeRequiredValues } = require('../functions')

let bot

const init = (b) => {
    bot = b
}

module.exports = { init }

const vehicleMappings = {
    "400":"Landstalker",
    "401":"Bravura",
    "402":"Buffalo",
    "403":"Linerunner",
    "404":"Perennial",
    "405":"Sentinel",
    "406":"Dumper",
    "407":"Fire Truck",
    "408":"Trashmaster",
    "409":"Stretch",
    "410":"Manana",
    "411":"Infernus",
    "412":"Voodoo",
    "413":"Pony",
    "414":"Mule",
    "415":"Cheetah",
    "416":"Ambulance",
    "417":"Leviathan",
    "418":"Moonbeam",
    "419":"Esperanto",
    "421":"Washington",
    "422":"Bobcat",
    "423":"Mr. Whoopee",
    "424":"BF Injection",
    "425":"Hunter",
    "426":"Premier",
    "427":"Enforcer",
    "428":"Securicar",
    "429":"Banshee",
    "430":"Predator",
    "431":"Bus",
    "432":"Rhino",
    "433":"Barracks",
    "434":"Hotknife",
    "435":"Trailer 1",
    "436":"Previon",
    "437":"Coach",
    "439":"Stallion",
    "440":"Rumpo",
    "441":"RC Bandit",
    "442":"Romero",
    "443":"Packer",
    "444":"Monster",
    "445":"Admiral",
    "446":"Squalo",
    "447":"Seasparrow",
    "448":"Pizzaboy",
    "449":"Tram",
    "450":"Trailer 2",
    "451":"Turismo",
    "452":"Speeder",
    "453":"Reefer",
    "454":"Tropic",
    "455":"Flatbed",
    "456":"Yankee",
    "457":"Caddy",
    "458":"Solair",
    "459":"Berkley's RC Van",
    "460":"Skimmer",
    "461":"PCJ-600",
    "462":"Faggio",
    "463":"Freeway",
    "464":"RC Baron",
    "465":"RC Raider",
    "466":"Glendale",
    "467":"Oceanic",
    "468":"Sanchez",
    "469":"Sparrow",
    "470":"Patriot",
    "471":"Quadbike",
    "472":"Coastguard",
    "473":"Dinghy",
    "474":"Hermes",
    "475":"Sabre",
    "476":"Rustler",
    "477":"ZR-350",
    "478":"Walton",
    "479":"Regina",
    "480":"Comet",
    "481":"BMX",
    "482":"Burrito",
    "483":"Camper",
    "484":"Marquis",
    "485":"Baggage",
    "486":"Dozer",
    "487":"Maverick",
    "488":"News Chopper",
    "489":"Rancher",
    "490":"FBI Rancher",
    "491":"Virgo",
    "492":"Greenwood",
    "493":"Jetmax",
    "495":"Sandking",
    "496":"Blista Compact",
    "497":"Police Maverick",
    "498":"Boxville",
    "499":"Benson",
    "500":"Mesa",
    "501":"RC Goblin",
    "504":"Bloodring Banger",
    "505":"Rancher Lure",
    "506":"Super GT",
    "507":"Elegant",
    "508":"Journey",
    "509":"Bike",
    "510":"Mountain Bike",
    "511":"Beagle",
    "512":"Cropduster",
    "513":"Stuntplane",
    "514":"Tanker",
    "515":"Roadtrain",
    "516":"Nebula",
    "517":"Majestic",
    "518":"Buccaneer",
    "519":"Shamal",
    "520":"Hydra",
    "521":"FCR-900",
    "522":"NRG-500",
    "523":"HPV1000",
    "524":"Cement Truck",
    "525":"Towtruck",
    "526":"Fortune",
    "527":"Cadrona",
    "528":"FBI Truck",
    "529":"Willard",
    "530":"Forklift",
    "531":"Tractor",
    "532":"Combine Harvester",
    "533":"Feltzer",
    "534":"Remington",
    "535":"Slamvan",
    "536":"Blade",
    "537":"Freight",
    "538":"Streak",
    "539":"Vortex",
    "540":"Vincent",
    "541":"Bullet",
    "542":"Clover",
    "543":"Sadler",
    "544":"Fire Truck Ladder",
    "545":"Hustler",
    "546":"Intruder",
    "547":"Primo",
    "548":"Cargobob",
    "549":"Tampa",
    "550":"Sunrise",
    "551":"Merit",
    "552":"Utility Van",
    "553":"Nevada",
    "554":"Yosemite",
    "555":"Windsor",
    "556":"Monster 2",
    "557":"Monster 3",
    "558":"Uranus",
    "559":"Jester",
    "560":"Sultan",
    "561":"Stratum",
    "562":"Elegy",
    "563":"Raindance",
    "564":"RC Tiger",
    "565":"Flash",
    "566":"Tahoma",
    "567":"Savanna",
    "568":"Bandito",
    "569":"Freight Train Flatbed",
    "570":"Streak Train Trailer",
    "571":"Kart",
    "572":"Mower",
    "573":"Dune",
    "574":"Sweeper",
    "575":"Broadway",
    "576":"Tornado",
    "577":"AT-400",
    "578":"DFT-30",
    "579":"Huntley",
    "580":"Stafford",
    "581":"BF-400",
    "582":"Newsvan",
    "583":"Tug",
    "584":"Trailer (Tanker Commando)",
    "585":"Emperor",
    "586":"Wayfarer",
    "587":"Euros",
    "588":"Hotdog",
    "589":"Club",
    "590":"Box Freight",
    "591":"Trailer 3",
    "592":"Andromada",
    "593":"Dodo",
    "594":"RC Cam",
    "595":"Launch",
    "596":"Police LS",
    "597":"Police SF",
    "598":"Police LV",
    "599":"Police Ranger",
    "600":"Picador",
    "601":"S.W.A.T.",
    "602":"Alpha",
    "603":"Phoenix",
    "606":"Baggage Trailer (Covered)",
    "608":"Baggage Trailer (Uncovered)",
    "608":"Baggage Trailer (Stairs)",
    "609":"Boxville",
    // PARADISE
    "420":"Wraith",
    "438":"Hammerhead",
    "494":"Rattler",
    "502":"Diablo",
    "503":"Venom",
    "604":"Torero",
    "605":"Walnus",
    "2001": "Titan",
    "2002": "Soprano",
    "2003": "Magnum",
    "2004": "Fusion",
    "2005": "Reaper",
    "2006": "Bulldog",
    "2007": "Garbus",
    "2008": "Baron"
}

const vehiclePrices = {
    "Reaper": 13500000,
    "Fusion": 10000000,
    "Venom": 7000000,
    "Wraith": 5600000,
    "Rattler": 5000000,
    "Bulldog": 4700000,
    "Diablo": 3900000,
    "Magnum": 3100000,
    "Hammerhead": 2750000,
    "Torero": 2000000,
    "Turismo": 2100000,
    "Bullet": 1900000,
    "Infernus": 1800000,
    "Soprano": 1350000,
    "Titan": 1350000,
    "Walnus": 1150000,
    "Banshee": 1045440,
    "Cheetah": 1000000,
    "Sultan": 875000,
    "Elegy": 800000,
    "Hotknife": 750000,
    "Comet": 707000,
    "Jester": 625000,
    "Uranus": 500000,
    "Super GT": 460000,
    "Flash": 425000,
    "ZR-350": 400000,
    "Huntley": 240000,
}

const hoursSet = {
    1: "1 godzina",
    2: "2 godziny",
    3: "3 godziny",
    6: "6 godzin",
    12: "12 godzin",
    24: "24 godziny",
    48: "48 godzin"
}

const app = express()

app.set('trust proxy', 1)
app.use(cookieSession({
    name: 'session',
    keys: ['dhjfauersdacjnxnzjsajkdhsarjqewfhcdsacasnbasjhqewdjsnd']
  }))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));
app.use(engine);
app.set('views', `${__dirname}/views`);

app.use(function (req, res, next) {
    req.sessionOptions.maxAge = req.session.maxAge || req.sessionOptions.maxAge
    next()
})

app.get('/', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect("/login")
    return res.redirect("/dashboard")
})

app.get('/login', (req, res) => {
    if (req.session.isLoggedIn) return res.redirect("/dashboard")
    let message
    switch (req.session.loginCode) {
        case 1: { message = "Nie znaleziono konta z podanym nickiem lub hasłem" }
    }
    req.session.loginCode = null
    return res.render("login", { message })
})

app.get('/info', (req, res) => {
    if (req.session.isLoggedIn) return res.redirect("/dashboard")
    return res.render("info")
})

app.get('/invite', (req, res) => {
    return res.redirect(config.discord.invite)
})

app.post('/auth', async (req, res) => {
    if (!req.body.username || !req.body.password) {
        req.session.loginCode = 1
        return res.redirect('/login')
    }
    const data = await db("SELECT * FROM bots WHERE ((paid > NOW() AND enabled = 1) OR (web_name = 'admin')) AND web_name = " + escape(req.body.username) + " AND web_password = '" + sha256(escape(req.body.password)) + "'")
    if (!data || data.length == 0) {
        req.session.loginCode = 1
        logger.warn("Nieudana próba logowania do panelu przez " + (req.headers['x-forwarded-for'] || req.socket.remoteAddress) + " pod nickiem " + req.body.username)
        return res.redirect('/login')            
    }
    const d = data[0]
    req.session.isLoggedIn = true;
    req.session.username = JSON.parse(d.settings).client.username;
    req.session.account = JSON.parse(d)
    logger.info("Pomyślne logowanie do panelu przez " + (req.headers['x-forwarded-for'] || req.socket.remoteAddress) + " pod nickiem " + req.body.username)
    return res.redirect("/dashboard")
})

app.get('/logout', (req, res) => {
    req.session.isLoggedIn = false
    return res.redirect("/")
})

app.get('/dashboard', (req, res) => {
    console.log(req.session)
    if (!req.session.isLoggedIn) return res.redirect("/")
    return res.redirect("/dashboard/organisation")
})

app.get('/dashboard/organisation', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect("/")
    return res.render("organisation", { name: req.session.username, account: req.session.account })
})

app.get('/dashboard/exportPrices', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect("/")
    return res.render("exportPrices", { name: req.session.username, account: req.session.account, vehicleList: Object.values(vehicleMappings).sort((a, b) => a.localeCompare(b)) })
})

app.get('/dashboard/members', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect("/")
    return res.render("members", { name: req.session.username, account: req.session.account, showOnlyManageable: req.session.showOnlyManageable || true })
})

app.get('/dashboard/queues', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect("/")
    return res.render("queueList", { name: req.session.username, account: req.session.account, hoursSet })
})

app.get('/dashboard/profile/:id?', async (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect("/")
    if (!req.params.id || isNaN(req.params.id)) return res.redirect("/dashboard/members")
    const checkIfOrganisation = await db("SELECT id FROM users WHERE gid = " + req.session.account.paradise_id + " AND uid = " + req.params.id)
    if (!checkIfOrganisation || checkIfOrganisation.length == 0) return res.redirect("/dashboard/members")
    return res.render("profile", { name: req.session.username, account: req.session.account, profile: req.params.id })
})

app.get('/queue/:id/:type', async (req, res) => {
    const types = ["artifact", "import"]
    if (!types.includes(req.params.type) || !req.params.id || isNaN(req.params.id)) return res.redirect("/")
    const data = await db("SELECT * FROM queue WHERE gid = " + req.params.id + " AND date > (NOW() - INTERVAL 1 DAY) AND type = '" + req.params.type + "' ORDER BY date ASC")
    if (!data) return res.redirect("/")
    let resdata = ""
    for (const d of data) {
        let u = { login: "---" }
        if (d.user) {
            u = await bot.paradise.GetUserById(d.user)
        }
        resdata += "<tr><th>" + moment(d.date).format('DD-MM-YYYY') + "</th><th>" + moment(d.date).format('HH:mm') + "</th><td>" + u.login + "</td></tr>"
    }
    return res.render("queue", { data: resdata })
})

app.get('/api/gethash/:pass', async (req, res) => {
    if (!req.session.isLoggedIn) return res.status(403).json({ message: "Brak uprawnień" })
    const pass = req.params.pass
    if (!pass) return res.status(400).json({ message: "Pass parameter not found" })
    return res.json({ pass, hash: sha256(escape(pass)).toString() })
})

app.get('/api/balance/:date?', async (req, res) => {
    if (!req.session.isLoggedIn) return res.status(403).json({ message: "Brak uprawnień" })
    const stringDate = req.params.date
    if (!stringDate) return res.status(400).json({ message: "Date parameter not found" })
    let date = new Date(stringDate)
    if (!date || date == "Invalid Date") return res.status(500).json({ message: "Could not parse date" })
    const dateString = [date.getFullYear(), date.getMonth(), date.getDate()].join("-")
    const data = await db("SELECT * FROM balance_history WHERE gid = " + req.session.account.paradise_id + " AND `date` = '" + dateString + "' ORDER BY id DESC LIMIT 1")
    if (!data || data.length == 0) return res.json({})
    return res.json({ in: data[0].in, out: data[0].out })
})

app.get('/api/channels', async (req, res) => {
    if (!req.session.isLoggedIn) return res.status(403).json({ message: "Brak uprawnień" })
    const data = await db("SELECT settings FROM bots WHERE paradise_id = " + req.session.account.paradise_id + " ORDER BY id DESC LIMIT 1")
    if (!data || data.length == 0) return res.json({})
    const c = JSON.parse(data[0].settings).discord.channels
    const re = {}
    for (const k in c) {
        re[GetChannelNameMapping(k)] = c[k]
    }
    return res.json(re || {})
})

app.post('/api/channels', async (req, res) => {
    if (!req.session.isLoggedIn) return res.status(403).json({ message: "Brak uprawnień" })
    let values = req.body
    if (!values.data) return res.status(400).json({ message: "Bad request" })
    values = values.data
    const before = await db("SELECT settings FROM bots WHERE paradise_id = " + req.session.account.paradise_id + " ORDER BY id DESC LIMIT 1")
    if (!before || before.length == 0) return res.status(500).json({ message: "Server error" })
    const beforeJson = makeRequiredValues(JSON.parse(before[0].settings))
    for (const v of values) {
        beforeJson.discord.channels[GetChannelNameMapping(v.name)] = v.value
    }
    const data = await db("UPDATE bots SET settings = '" + JSON.stringify(beforeJson) + "' WHERE paradise_id = " + req.session.account.paradise_id + " ORDER BY id DESC LIMIT 1")
    if (!data || data.length == 0) return res.status(500).json({ message: "Server error" })
    return res.json({ message: "Updated", success: true })
})

app.get('/api/pings', async (req, res) => {
    if (!req.session.isLoggedIn) return res.status(403).json({ message: "Brak uprawnień" })
    const data = await db("SELECT settings FROM bots WHERE paradise_id = " + req.session.account.paradise_id + " ORDER BY id DESC LIMIT 1")
    if (!data || data.length == 0) return res.json({})
    res.json(JSON.parse(data[0].settings).discord.pings || {})
})

app.post('/api/pings', async (req, res) => {
    if (!req.session.isLoggedIn) return res.status(403).json({ message: "Brak uprawnień" })
    let values = req.body
    if (!values.data) return res.status(400).json({ message: "Bad request" })
    values = values.data
    const before = await db("SELECT settings FROM bots WHERE paradise_id = " + req.session.account.paradise_id + " ORDER BY id DESC LIMIT 1")
    if (!before || before.length == 0) return res.status(500).json({ message: "Server error" })
    const beforeJson = makeRequiredValues(JSON.parse(before[0].settings))
    for (const v of values) {
        beforeJson.discord.pings[v.name] = v.value
    }
    const data = await db("UPDATE bots SET settings = '" + JSON.stringify(beforeJson) + "' WHERE paradise_id = " + req.session.account.paradise_id + " ORDER BY id DESC LIMIT 1")
    if (!data || data.length == 0) return res.status(500).json({ message: "Server error" })
    return res.json({ message: "Updated", success: true })
})

app.get('/api/exportPrices', async (req, res) => {
    if (!req.session.isLoggedIn) return res.status(403).json({ message: "Brak uprawnień" })
    const data = await db("SELECT * FROM export_prices WHERE gid = " + req.session.account.paradise_id + " ORDER BY price DESC")
    if (!data) return res.json([])
    return res.json(data)
})

app.post('/api/exportPrices', async (req, res) => {
    if (!req.session.isLoggedIn) return res.status(403).json({ message: "Brak uprawnień" })
    let values = req.body
    if (!values.data) return res.status(400).json({ message: "Bad request" })
    values = values.data
    if (!values.model || !values.price) return res.status(400).json({ message: "Niewystarczające informajce" })
    if (values.price < 1 || values.price > 100000000) return res.status(400).json({ message: "Niepoprawny zakres cen" })
    const before = await db("SELECT * FROM export_prices WHERE gid = " + req.session.account.paradise_id + " AND model = '" + values.model + "' ORDER BY id DESC LIMIT 1")
    if (!before) return res.status(500).json({ message: "Server error" })
    if (before.length > 0) return res.status(200).json({ message: "Cena tego modelu została już ustalona" })
    if (!Object.values(vehicleMappings).includes(values.model)) return res.json({ message: "Niepoprawny model pojazdu" })
    const data = await db("INSERT INTO export_prices (`gid`, `model`, `price`) VALUES (" + req.session.account.paradise_id + ", '" + values.model + "', " + values.price + ")")
    if (!data) return res.status(500).json({ message: "Server error" })
    return res.json({ message: "Added", success: true })
})

app.delete('/api/exportPrices', async (req, res) => {
    if (!req.session.isLoggedIn) return res.status(403).json({ message: "Brak uprawnień" })
    let values = req.body
    if (!values.data) return res.status(400).json({ message: "Bad request" })
    values = values.data
    if (!values.model) return res.status(400).json({ message: "Bad request" })
    const data = await db("DELETE FROM export_prices WHERE gid = " + req.session.account.paradise_id + " AND model = '" + values.model + "' LIMIT 1")
    if (!data) return res.status(500).json({ message: "Server error" })
    return res.json({ message: "Updated", success: true })
})

app.patch('/api/exportPrices', async (req, res) => {
    if (!req.session.isLoggedIn) return res.status(403).json({ message: "Brak uprawnień" })
    const data = await db("SELECT * FROM export_prices WHERE gid = " + req.session.account.paradise_id + " LIMIT 1")
    if (!data) return res.status(500).json({ message: "Server error" })
    if (data.length != 0) return res.status(200).json({ message: "Usuń wszystkie pojazdy przed wczytaniem domyślnych ustawień" })
    for (const i in vehiclePrices) {
        const data = await db("INSERT INTO export_prices (`gid`, `model`, `price`) VALUES (" + req.session.account.paradise_id + ", '" + i + "', " + vehiclePrices[i] + ")")
        if (!data) return res.status(500).json({ message: "Server error" })
    }
    return res.json({ message: "Loaded", success: true })
})

app.get('/api/warehouse', async (req, res) => {
    if (!req.session.isLoggedIn) return res.status(403).json({ message: "Brak uprawnień" })
    const data = await db("SELECT * FROM imports WHERE gid = " + req.session.account.paradise_id + " ORDER BY id ASC")
    if (!data) return res.json([])
    return res.json(data)
})

app.delete('/api/warehouse', async (req, res) => {
    if (!req.session.isLoggedIn) return res.status(403).json({ message: "Brak uprawnień" })
    let values = req.body
    if (!values.data) return res.status(400).json({ message: "Bad request" })
    values = values.data
    if (!values.id) return res.status(400).json({ message: "Bad request" })
    const data = await db("DELETE FROM imports WHERE gid = " + req.session.account.paradise_id + " AND id = '" + values.id + "' LIMIT 1")
    if (!data) return res.status(500).json({ message: "Server error" })
    return res.json({ message: "Updated", success: true })
})

app.get('/api/members', async (req, res) => {
    if (!req.session.isLoggedIn) return res.status(403).json({ message: "Brak uprawnień" })
    const data = await db("SELECT uid,cash FROM users WHERE gid = " + req.session.account.paradise_id + " ORDER BY cash DESC")
    if (!data) return res.json([])
    return res.json(data)
})

app.get('/api/profile/:id?', async (req, res) => {
    if (!req.session.isLoggedIn) return res.status(403).json({ message: "Brak uprawnień" })
    if (!req.params.id || isNaN(req.params.id)) return res.status(400).json({ message: "Invalid data" })
    const data = await db("SELECT * FROM users WHERE gid = " + req.session.account.paradise_id + " AND uid = " + req.params.id + " ORDER BY cash DESC")
    let importCount = 0
    const importData = await db("SELECT COUNT(*) FROM imports WHERE gid = " + req.session.account.paradise_id + " AND uid = " + req.params.id)
    if (importData) {
        importCount = (importData.length > 0) ? importData[0]["COUNT(*)"] : 0
    }
    if (!data) return res.json({})
    if (data.length == 0) return res.json({})
    let json = data[0]
    json.waiting = importCount
    return res.json(json)
})

app.post('/api/profile/:id?', async (req, res) => {
    if (!req.session.isLoggedIn) return res.status(403).json({ message: "Brak uprawnień" })
    if (!req.params.id || isNaN(req.params.id)) return res.status(400).json({ message: "Invalid data" })
    let operator
    let value = req.body.value
    switch (req.body.action) {
        case "increase": {
            operator = "cash = cash + " + value
            break;
        }
        case "set": {
            operator = "cash = " + value
            break;
        }
        case "decrease": {
            operator = "cash = cash - " + value
            break;
        }
    }
    
    if (!operator || !value) return res.status(400).json({ message: "Invalid data"})
    const data = await db("UPDATE users SET " + operator + " WHERE gid = " + req.session.account.paradise_id + " AND uid = " + req.params.id)
    if (!data) return res.status(500).json({ message: "Server error" })
    return res.json({ message: "Updated", success: true })
})

app.delete('/api/profile/:id?', async (req, res) => {
    if (!req.session.isLoggedIn) return res.status(403).json({ message: "Brak uprawnień" })
    if (!req.params.id || isNaN(req.params.id)) return res.status(400).json({ message: "Invalid data" })
    await db("DELETE FROM users WHERE gid = " + req.session.account.paradise_id + " AND uid = " + req.params.id + " LIMIT 1")
    await db("DELETE FROM imports WHERE gid = " + req.session.account.paradise_id + " AND uid = " + req.params.id + " LIMIT 1")
    await db("DELETE FROM data_history WHERE gid = " + req.session.account.paradise_id + " AND uid = " + req.params.id + " LIMIT 1")
    return res.json({ message: "Updated", success: true })
})

app.get('/api/dataHistory/:id?', async (req, res) => {
    if (!req.session.isLoggedIn) return res.status(403).json({ message: "Brak uprawnień" })
    if (!req.params.id || isNaN(req.params.id)) return res.status(400).json({ message: "Invalid data" })
    const data = await db("SELECT * FROM data_history WHERE gid = " + req.session.account.paradise_id + " AND uid = " + req.params.id + " ORDER BY id DESC LIMIT 672")
    if (!data || data.length == 0) return res.json([])
    return res.json(data.map(d => { return { date: d.date, info: JSON.parse(d.info)} }).reverse())
})

app.get('/api/queue/data', async (req, res) => {
    if (!req.session.isLoggedIn) return res.status(403).json({ message: "Brak uprawnień" })
    const data = await db("SELECT settings FROM bots WHERE paradise_id = " + req.session.account.paradise_id + " ORDER BY id DESC LIMIT 1")
    if (!data || data.length == 0) return res.json({})
    const data2 = await db("SELECT * FROM queue WHERE gid = " + req.session.account.paradise_id + " AND date > (NOW() - INTERVAL 1 DAY) ORDER BY date ASC")
    if (!data2 || data2.length == 0) return res.json({})
    let result = makeRequiredValues(JSON.parse(data[0].settings)).queue
    for (const d of data2) {
        if (!result[d.type].table) result[d.type].table = []
        result[d.type].table.push(d)
    }
    return res.json(result)
})

app.post('/api/queue/status', async (req, res) => {
    if (!req.session.isLoggedIn) return res.status(403).json({ message: "Brak uprawnień" })
    if (!req.body.data.where) return res.status(400).json({ message: "Bad request" })
    const data = await db("SELECT settings FROM bots WHERE paradise_id = " + req.session.account.paradise_id)
    if (!data || data.length == 0) return res.json({ message: "Server error" })
    let jsonData = makeRequiredValues(JSON.parse(data[0].settings))
    jsonData.queue[req.body.data.where].status = req.body.data.status
    await db("UPDATE bots SET settings = '" + JSON.stringify(jsonData) + "' WHERE paradise_id = " + req.session.account.paradise_id + " ORDER BY id DESC LIMIT 1")
    return res.json({ message: "Updated", success: true })
})

app.post('/api/queue/edit', async (req, res) => {
    if (!req.session.isLoggedIn) return res.status(403).json({ message: "Brak uprawnień" })
    if (!req.body.data.where) return res.status(400).json({ message: "Bad request" })
    const data = await db("SELECT settings FROM bots WHERE paradise_id = " + req.session.account.paradise_id)
    if (!data || data.length == 0) return res.json({ message: "Server error" })
    let jsonData = makeRequiredValues(JSON.parse(data[0].settings))
    jsonData.queue[req.body.data.where].channel = req.body.data.channel
    jsonData.queue[req.body.data.where].time = req.body.data.time
    await db("UPDATE bots SET settings = '" + JSON.stringify(jsonData) + "' WHERE paradise_id = " + req.session.account.paradise_id + " ORDER BY id DESC LIMIT 1")
    return res.json({ message: "Updated", success: true })
})

app.post('/api/queue/delete', async (req, res) => {
    if (!req.session.isLoggedIn) return res.status(403).json({ message: "Brak uprawnień" })
    if (!req.body.data.where || !req.body.data.date) return res.status(400).json({ message: "Bad request" })
    await db("UPDATE queue SET user = NULL WHERE `gid` = " + req.session.account.paradise_id + " AND `type` = '" + req.body.data.where + "' AND `date` = '" + req.body.data.date + "' LIMIT 1")
    return res.json({ message: "Updated", success: true })
})

app.get('/api/paradise/:id', async (req, res) => {
    if (!req.session.isLoggedIn) return res.status(403).json({ message: "Brak uprawnień" })
    if (!req.params.id || isNaN(req.params.id)) return res.status(400).json({ message: "Bad request" })
    const data = await bot.paradise.GetUserById(req.params.id)
    return res.json({ id: req.params.id, account: data || {login: "Brak danych"} })
})

app.get('/api/discordList', async (req, res) => {
    if (!req.session.isLoggedIn) return res.status(403).json({ message: "Brak uprawnień" })
    const query = await db("SELECT discord_id, settings FROM bots WHERE paradise_id = " + req.session.account.paradise_id + " LIMIT 1")
    if (!query || query.length == 0) return res.json({data: { channels: [], roles: [] }})
    const server = await bot.guilds.fetch(query[0].discord_id)
    if (!server) return res.json({data: { channels: [], roles: [] }})
    const channels = server.channels.cache.filter(c => c.type == Discord.ChannelType.GuildText).sort((a, b) => a.rawPosition - b.rawPosition ).map(c => {return { id: c.id, name: c.name, position: c.rawPosition }})
    const roles = server.roles.cache.filter(c => c.managed == true).sort((a, b) => a.rawPosition - b.rawPosition ).map(c => {return { id: c.id, name: c.name, position: c.rawPosition }})
    return res.json({data: { channels, roles }})
})

app.get('*', (req, res) => {
    return res.redirect("/")
})

app.listen(config.web.port, () => {
    logger.info("Uruchomiono serwer na porcie " + config.web.port)
})
