const crypto = require('crypto');
const { EmbedBuilder } = require('discord.js');

class GitHubHandler {
    constructor(db, client, settings = {}) {
        this.db = db;
        this.client = client;
        this.settings = settings || {};
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

        const channel = this.client.channels.cache.get(channelId);
        if (!channel) {
            return { status: 200 };
        }

        const behavior = this.settings.behavior || {};
        const limits = this.settings.limits || {};
        const display = this.settings.display || {};
        const embedSettings = this.settings.embed || {};
        const authorSettings = this.settings.author || {};

        const oneCommitPerMessage = behavior.oneCommitPerMessage === true;
        const showFileNames = oneCommitPerMessage && behavior.showFileNames === true;
        const commitLimit = Number.isInteger(limits.maxCommitsPerEmbed) ? limits.maxCommitsPerEmbed : 5;
        const embedLimit = Number.isInteger(limits.maxEmbedsPerPush) ? limits.maxEmbedsPerPush : 20;
        const maxFiles = Number.isInteger(limits.maxFilesPerCommit) ? limits.maxFilesPerCommit : 10;
        const showCommitUrls = behavior.showCommitUrls !== false;
        const filePrefix = display.fileListPrefix || 'Files:';
        const descriptionSeparator = display.embedDescriptionSeparator || '\n\n';
        const embedColor = typeof embedSettings.embedColor === 'string'
            ? parseInt(embedSettings.embedColor.replace(/^#/, ''), 16)
            : (typeof embedSettings.embedColor === 'number' ? embedSettings.embedColor : 0x7289DA);
        const compareUrl = behavior.showCompareLink !== false ? payload.compare : undefined;
        const showRepoNameInTitle = display.showRepoNameInTitle !== false;
        const showBranchInTitle = display.showBranchInTitle !== false;
        const showCommitCountInTitle = display.showCommitCountInTitle !== false;
        const showCommitBody = behavior.showCommitMessageBody === true;
        const footerText = embedSettings.footerText || 'Open-Source Project | github.com/lighscent/discord-githook';
        const showAuthorIcon = authorSettings.showAuthorIcon !== false;
        const useAuthorUrl = authorSettings.useAuthorUrl !== false;
        const authorUsePusher = authorSettings.authorUsePusher !== false;

        const formatFileList = commit => {
            const files = [
                ...(commit.added || []).map(name => `+${name}`),
                ...(commit.modified || []).map(name => `~${name}`),
                ...(commit.removed || []).map(name => `-${name}`)
            ];

            if (files.length === 0) {
                return 'No changed files';
            }

            const shown = files.slice(0, maxFiles);
            return `${shown.join(', ')}${files.length > maxFiles ? `, +${files.length - maxFiles} more` : ''}`;
        };

        const buildTitle = (commitCount, commitId) => {
            const parts = [];
            if (showRepoNameInTitle && repoName) {
                parts.push(repoName);
            }
            if (showBranchInTitle && branch) {
                parts.push(branch);
            }

            const prefix = parts.length ? `[${parts.join(':')}] ` : '';
            if (oneCommitPerMessage && commitId) {
                return `${prefix}${commitId}`;
            }
            if (showCommitCountInTitle) {
                return `${prefix}${commitCount} new commit(s)`;
            }
            return prefix.trim() || 'GitHub push';
        };

        const buildDescription = commit => {
            const summary = commit.message.split('\n')[0];
            let description = summary;

            if (showCommitBody) {
                const body = commit.message.split('\n').slice(1).join('\n').trim();
                if (body) {
                    description += `\n\n${body}`;
                }
            }

            if (showFileNames) {
                description += `\n\n${filePrefix} ${formatFileList(commit)}`;
            }

            return description;
        };

        const buildEmbed = (title, description, url, timestamp) => {
            const embed = new EmbedBuilder()
                .setTitle(title)
                .setColor(embedColor)
                .setFooter({ text: footerText })
                .setTimestamp(timestamp ? new Date(timestamp) : new Date());

            if (url) {
                embed.setURL(url);
            }

            const authorName = authorUsePusher
                ? payload.pusher?.name
                : payload.sender?.login;
            const authorUrl = useAuthorUrl ? payload.sender?.html_url : undefined;
            const authorIcon = showAuthorIcon ? payload.sender?.avatar_url : undefined;

            embed.setAuthor({ name: authorName || 'GitHub', iconURL: authorIcon, url: authorUrl });

            if (description) {
                embed.setDescription(description);
            }

            return embed;
        };

        if (oneCommitPerMessage) {
            for (const commit of commits.slice(0, embedLimit)) {
                const commitId = commit.id.substring(0, 7);
                const title = buildTitle(1, commitId);
                const description = buildDescription(commit);
                const embed = buildEmbed(title, description, showCommitUrls ? commit.url : undefined, commit.timestamp);
                await channel.send({ embeds: [embed] });
            }

            return { status: 200 };
        }

        const description = commits.slice(0, commitLimit)
            .map(commit => {
                const summary = commit.message.split('\n')[0];
                const commitId = commit.id.substring(0, 7);
                return showCommitUrls
                    ? `[\`${commitId}\`](${commit.url}) ${summary}`
                    : `\`${commitId}\` ${summary}`;
            })
            .join(descriptionSeparator);

        const embed = buildEmbed(
            buildTitle(commits.length),
            description || 'No description',
            compareUrl,
            commits[0]?.timestamp
        );

        await channel.send({ embeds: [embed] });
        return { status: 200 };
    }
}

module.exports = GitHubHandler;