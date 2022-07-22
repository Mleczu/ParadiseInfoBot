const Discord = require('discord.js')
const config = require('./config.json')

const replyEmbed = function(message, interaction) {
    const embed = new Discord.EmbedBuilder()
        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ format: 'png' })})
        .setColor(config.discord.color)
        .setTimestamp()
        .setDescription(message)
        .setThumbnail(config.paradise.gif)
    return embed
}

module.exports = { replyEmbed }