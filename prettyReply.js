const Discord = require('discord.js')
const config = require('./config')

const replyEmbed = function(message, interaction, noAuthor, noGif) {
    const embed = new Discord.EmbedBuilder()
        .setColor(config.discord.color)
        .setTimestamp()
        .setDescription(message)
    
    if (!noAuthor) embed.setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ format: 'png' })})
    if (!noGif) embed.setThumbnail(config.paradise.gif)
    return embed
}

module.exports = { replyEmbed }