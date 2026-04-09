const crypto = require('crypto');
const { EmbedBuilder } = require('discord.js');

class GitHubHandler {
    constructor(db, client) {
        this.db = db;
        this.client = client;
    }

    verifySignature(req) {
        const signature = req.headers['x-hub-signature-256'];
        if (process.env.GITHUB_WEBHOOK_SECRET && signature) {
            const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET);
            const digest = Buffer.from('sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex'), 'utf8');
            const checksum = Buffer.from(signature, 'utf8');

            if (checksum.length !== digest.length || !crypto.timingSafeEqual(digest, checksum)) {
                return false;
            }
        }
        return true;
    }

    async handlePush(uuid, payload) {
        const row = this.db.getWebhook(uuid);
        if (!row) {
            return { status: 404, message: 'Webhook not found' };
        }

        const { channelId } = row;

        this.db.updateWebhookTrigger(uuid);

        const repoName = payload.repository.full_name;
        const branch = payload.ref.split('/').pop();
        const commits = payload.commits || [];

        if (commits.length === 0) return { status: 200 };

        const embed = new EmbedBuilder()
            .setTitle(`[${repoName}:${branch}] ${commits.length} new commit(s)`)
            .setURL(payload.compare)
            .setAuthor({ name: payload.pusher.name, iconURL: payload.sender.avatar_url, url: payload.sender.html_url })
            .setColor(0x7289DA)
            .setFooter({ text: `Open-Source Project | github.com/lighscent/discord-githook` })
            .setTimestamp();

        const description = commits.slice(0, 5)
            .map(commit => `[\`${commit.id.substring(0, 7)}\`](${commit.url}) ${commit.message.split('\n')[0]}`)
            .join('\n');

        embed.setDescription(description || "No description");

        const channel = this.client.channels.cache.get(channelId);
        if (channel) {
            await channel.send({ embeds: [embed] });
        }

        return { status: 200 };
    }
}

module.exports = GitHubHandler;