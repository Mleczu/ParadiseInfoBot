const Discord = require('discord.js');
const ping = require('ping')
const Promise = require('bluebird');

ping.sys.probeAsync = function(host) {
    return new Promise(function(resolve, reject) {
        ping.sys.probe(host, function(isAlive) {
            resolve({"host": host, "status": isAlive});
        });
    })
}

function checkConnection(hosts) {
    var promises = hosts.map(function(host) {
        return ping.sys.probeAsync(host);
    });
    return Promise.all(promises).then(function(results) {
        return {results: results, timestamp: new Date().getTime()};
    });
}

module.exports = {
	data: new Discord.SlashCommandBuilder()
        .setName('ping')
		.setDescription('Sprawdź ping bota'),
	async execute(bot, interaction) {
        await interaction.deferReply({ ephemeral: true })
        const nowTimestamp = Date.now()
        const pingRequest = await checkConnection(["https://ucp.paradise-rpg.pl/"])
        const pingParadise = pingRequest.timestamp - nowTimestamp
        return interaction.editReply({ embeds: [bot.prettyReply("**Ping bota**\n\n> **Paradise:** " + pingParadise + "ms\n> **Discord:** " + bot.ws.ping + " ms", interaction)], ephemeral: true })
	},
};