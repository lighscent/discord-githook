const { EmbedBuilder } = require('discord.js');

class GitHubEmbedBuilder {
    constructor(settings, payload) {
        this.settings = settings;
        this.payload = payload;
    }

    build(title, description, url, timestamp) {
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setColor(this.settings.getEmbedColor())
            .setFooter({ text: this.settings.getEmbed('footerText') })
            .setTimestamp(timestamp ? new Date(timestamp) : new Date());

        if (url) {
            embed.setURL(url);
        }

        const authorName = this.settings.getAuthor('authorUsePusher')
            ? this.payload.pusher?.name
            : this.payload.sender?.login;
        const authorUrl = this.settings.getAuthor('useAuthorUrl') ? this.payload.sender?.html_url : undefined;
        const authorIcon = this.settings.getAuthor('showAuthorIcon') ? this.payload.sender?.avatar_url : undefined;

        embed.setAuthor({ name: authorName || 'GitHub', iconURL: authorIcon, url: authorUrl });

        if (description) {
            embed.setDescription(description);
        }

        return embed;
    }
}

module.exports = GitHubEmbedBuilder;
