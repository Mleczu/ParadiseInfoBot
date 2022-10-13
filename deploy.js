const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const config = require('./config').getConfig();
const logger = require('./logger')
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(config.discord.token);
rest.put(Routes.applicationCommands(config.discord.clientId), { body: commands })
	.then(() => logger.info('Pomyślnie zarejestrowano komendy.'))
	.catch(logger.error);