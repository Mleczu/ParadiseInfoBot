require('dotenv').config()

const config = {
    paradise: {
        gif: "https://media.discordapp.net/attachments/698342026386735205/1018570921973387304/same_logo.png"
    },
    database: {
        host: process.env.database_host,
        user: process.env.database_user,
        password: process.env.database_password,
        database: process.env.database_database
    },
    discord: {
        ownerId: "166576531982778369",
        clientId: "972557064142487602",
        token: process.env.discord_token,
        color: "#c077ce",
        invite: "https://discord.com/api/oauth2/authorize?client_id=972557064142487602&permissions=8&scope=bot%20applications.commands"
    },
    web: {
        port: 2137
    }
}

const getConfig = () => {
    return config;
}

module.exports = { getConfig }