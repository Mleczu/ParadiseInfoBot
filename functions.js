const fetch = require('cross-fetch')

const warehouseNameMappings = {
    "400":"Landstalker","401":"Bravura","402":"Buffalo","403":"Linerunner","404":"Perennial","405":"Sentinel","406":"Dumper","407":"Fire Truck","408":"Trashmaster","409":"Stretch","410":"Manana","411":"Infernus","412":"Voodoo","413":"Pony","414":"Mule","415":"Cheetah","416":"Ambulance","417":"Leviathan","418":"Moonbeam","419":"Esperanto","421":"Washington","422":"Bobcat","423":"Mr. Whoopee","424":"BF Injection","425":"Hunter","426":"Premier","427":"Enforcer","428":"Securicar","429":"Banshee","430":"Predator","431":"Bus","432":"Rhino","433":"Barracks","434":"Hotknife","435":"Trailer 1","436":"Previon","437":"Coach","439":"Stallion","440":"Rumpo","441":"RC Bandit","442":"Romero","443":"Packer","444":"Monster","445":"Admiral","446":"Squalo","447":"Seasparrow","448":"Pizzaboy","449":"Tram","450":"Trailer 2","451":"Turismo","452":"Speeder","453":"Reefer","454":"Tropic","455":"Flatbed","456":"Yankee","457":"Caddy","458":"Solair","459":"Berkley's RC Van",
    "460":"Skimmer","461":"PCJ-600","462":"Faggio","463":"Freeway","464":"RC Baron","465":"RC Raider","466":"Glendale","467":"Oceanic","468":"Sanchez","469":"Sparrow","470":"Patriot","471":"Quadbike","472":"Coastguard","473":"Dinghy","474":"Hermes","475":"Sabre","476":"Rustler","477":"ZR-350","478":"Walton","479":"Regina","480":"Comet","481":"BMX","482":"Burrito","483":"Camper","484":"Marquis","485":"Baggage","486":"Dozer","487":"Maverick","488":"News Chopper","489":"Rancher","490":"FBI Rancher","491":"Virgo","492":"Greenwood","493":"Jetmax","495":"Sandking","496":"Blista Compact","497":"Police Maverick","498":"Boxville","499":"Benson","500":"Mesa","501":"RC Goblin","504":"Bloodring Banger","505":"Rancher Lure","506":"Super GT","507":"Elegant","508":"Journey","509":"Bike","510":"Mountain Bike","511":"Beagle","512":"Cropduster","513":"Stuntplane","514":"Tanker","515":"Roadtrain","516":"Nebula","517":"Majestic","518":"Buccaneer","519":"Shamal","520":"Hydra","521":"FCR-900","522":"NRG-500","523":"HPV1000","524":"Cement Truck","525":"Towtruck","526":"Fortune","527":"Cadrona","528":"FBI Truck","529":"Willard","530":"Forklift","531":"Tractor","532":"Combine Harvester","533":"Feltzer","534":"Remington","535":"Slamvan","536":"Blade","537":"Freight","538":"Streak","539":"Vortex","540":"Vincent","541":"Bullet","542":"Clover","543":"Sadler","544":"Fire Truck Ladder","545":"Hustler","546":"Intruder","547":"Primo","548":"Cargobob","549":"Tampa","550":"Sunrise","551":"Merit","552":"Utility Van","553":"Nevada","554":"Yosemite","555":"Windsor","556":"Monster 2","557":"Monster 3","558":"Uranus","559":"Jester","560":"Sultan","561":"Stratum","562":"Elegy","563":"Raindance","564":"RC Tiger","565":"Flash","566":"Tahoma","567":"Savanna","568":"Bandito","569":"Freight Train Flatbed","570":"Streak Train Trailer","571":"Kart","572":"Mower","573":"Dune","574":"Sweeper","575":"Broadway","576":"Tornado","577":"AT-400","578":"DFT-30","579":"Huntley","580":"Stafford","581":"BF-400","582":"Newsvan","583":"Tug","584":"Trailer (Tanker Commando)","585":"Emperor","586":"Wayfarer","587":"Euros","588":"Hotdog","589":"Club","590":"Box Freight","591":"Trailer 3","592":"Andromada","593":"Dodo","594":"RC Cam","595":"Launch","596":"Police LS","597":"Police SF","598":"Police LV","599":"Police Ranger","600":"Picador","601":"S.W.A.T.","602":"Alpha","603":"Phoenix","606":"Baggage Trailer (Covered)","608":"Baggage Trailer (Uncovered)","608":"Baggage Trailer (Stairs)","609":"Boxville",
    // PARADISE
    "420":"Wraith","438":"Hammerhead","494":"Rattler","502":"Diablo","503":"Venom","604":"Torero","605":"Walnus","2001": "Titan","2002": "Soprano","2003": "Magnum","2004": "Fusion","2005": "Reaper","2006": "Bulldog","2007": "Garbus","2008": "Baron"
}

const channelMappings = {
    "channelNews": "news",
    "channelImport": "import_success",
    "channelImportFailed": "import_fail",
    "channelArtifactStart": "artifact_start",
    "channelArtifactEnd": "artifact_end",
    "channelExport": "export",
    "channelPawnshop": "pawnshop",
    "channelPriceChange": "price_change",
    "channelHotDeals": "hot_deals",
    "channelDailyReports": "daily_reports",
    "channelPayoutPreview": "payout_preview",
    "news": "channelNews",
    "import_success": "channelImport",
    "import_fail": "channelImportFailed",
    "artifact_start": "channelArtifactStart",
    "artifact_end": "channelArtifactEnd",
    "export": "channelExport",
    "pawnshop": "channelPawnshop",
    "price_change": "channelPriceChange",
    "hot_deals": "channelHotDeals",
    "daily_reports": "channelDailyReports",
    "payout_preview": "channelPayoutPreview"
}

const queueNames = {
    "import": "Import",
    "artifact": "Artefakt"
}

const maxImportPrices = {
    "Reaper": 15000000,
    "Fusion": 12000000,
    "Venom": 7800000,
    "Wraith": 6300000,
    "Rattler": 5700000,
    "Bulldog": 5250000,
    "Diablo": 4120000,
    "Magnum": 3750000,
    "Hammerhead": 3000000,
    "Torrero": 2250000,
    "Titan": 1500000,
    "Soprano": 1500000,
    "Turismo": 2370000,
    "Bullet": 2150000,
    "Infernus": 1996500,
    "Walnus": 1500000,
    "Banshee": 1306500,
    "Cheetah": 1234500,
    "Sultan": 1045500,
    "Elegy": 987000,
    "Hotknife": 915000,
    "Comet": 842250,
    "Jester": 769500,
    "Uranus": 652500,
    "Super GT": 580500,
    "Flash": 508500,
    "ZR-350": 500850
}

const GetMaxImportPrice = (vehicle) => {
    return maxImportPrices[`${vehicle}`] || 0
}

const GetWarehouseNameMapping = (id) => {
    return warehouseNameMappings[`${id}`] || "unknown"
}

const GetWarehousePriceMapping = (name) => {
    return warehousePriceMappings[name]
}

const GetChannelNameMapping = (name) => {
    return channelMappings[name]
}

const GetQueueNameMapping = (name) => {
    return queueNames[name] || name
}

const GetReverseQueueNameMapping = (name) => {
    return Object.keys(queueNames).find(key => queueNames[key] === name) || name
}

const MakeRequest = async (token, path, body) => {
    let data
    if (token && token.length > 0) {
        if (body) {
            data = await fetch(path, {
                method: "POST",
                body: JSON.stringify(body),
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                }
            }).then(res=>res.json())
        } else {
            data = await fetch(path, {
                method: "GET",
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                }
            }).then(res=>res.json())
        }
    } else {
        if (body) {
            data = await fetch(path, {
                method: "POST",
                body: JSON.stringify(body),
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(res=>res.json())
        } else {
            data = await fetch(path, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(res=>res.json())
        }
    }
    return data;
}

const CheckIfUserHasProfile = async (bot, group, user) => {
    const data = await bot.database("SELECT id FROM users WHERE gid = " + group + " AND uid = " + user.id + " LIMIT 1")
    if (data && data.length > 0) return true;
    return false;
}

const CreateUserProfile = async (bot, group, user) => {
    await bot.database("INSERT INTO `users` (`gid`, `uid`) VALUES ('" + group + "', '" + user.id + "');")
}

const NumberWithSpaces = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

const makeRequiredValues = (json) => {
    if (!json.discord) json.discord = {}
    if (!json.discord.channels) json.discord.channels = {}
    if (!json.discord.pings) json.discord.pings = {}
    if (!json.client) json.client = {}
    if (!json.payouts) json.payouts = {}
    if (!json.payouts.import) json.payouts.import = {}
    if (!json.payouts.export) json.payouts.export = {}
    if (!json.payouts.artifact) json.payouts.artifact = {}
    if (!json.payouts.pawnshop) json.payouts.pawnshop = {}
    if (!json.queue) json.queue = {}
    if (!json.queue.import) json.queue.import = { status: false, time: 6, channel: "" }
    if (!json.queue.artifact) json.queue.artifact = { status: false, time: 6, channel: "" }
    if (!json.autoedit) json.autoedit = {}
    if (!json.autoedit.queues) json.autoedit.queues = {}
    if (!json.autoedit.queues.import) json.autoedit.queues.import = { status: false, channel: "", message: "" }
    if (!json.autoedit.queues.artifact) json.autoedit.queues.artifact = { status: false, channel: "", message: "" }
    return json
}

const ContainsPolishChars = (name) => {
    const polishCharsRegex = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
    return polishCharsRegex.test(name);
}


module.exports = { MakeRequest, CheckIfUserHasProfile, CreateUserProfile, NumberWithSpaces, GetWarehouseNameMapping, GetWarehousePriceMapping, makeRequiredValues, GetChannelNameMapping, GetQueueNameMapping, GetReverseQueueNameMapping, GetMaxImportPrice, ContainsPolishChars }