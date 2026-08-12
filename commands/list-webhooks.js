const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');

const PAGE_SIZE = 10;
const COLLECTOR_TIMEOUT = 5 * 60 * 1000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list-webhooks')
        .setDescription('Lists active GitHub/Forgejo webhooks'),

    async execute(interaction, db) {
        const rows = db.getAllWebhooks()
            .filter(row => interaction.guild.channels.cache.has(row.channelId));

        if (rows.length === 0) {
            return await interaction.reply({ content: 'No active webhooks.', flags: MessageFlags.Ephemeral });
        }

        let page = 0;
        const totalPages = () => Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
        const pageRows = () => rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

        const buildEmbed = () => {
            const embed = new EmbedBuilder()
                .setTitle(`Active webhooks (${rows.length})`)
                .setDescription('Use the buttons below to delete a webhook or navigate pages.')
                .setColor(0x7289DA)
                .setFooter({ text: `Page ${page + 1}/${totalPages()}` })
                .setTimestamp();

            for (const row of pageRows()) {
                const partial = row.uuid.substring(0, 8);
                const last = row.lastTriggered
                    ? `<t:${Math.floor(new Date(row.lastTriggered).getTime() / 1000)}:R>`
                    : 'Never';
                const comment = row.comment ? `\n> *${row.comment}*` : '';
                const platformLabel = row.platform === 'forgejo' ? 'Forgejo' : 'GitHub';

                embed.addFields({
                    name: `${row.name} — ${platformLabel}`,
                    value: `<#${row.channelId}> | \`${partial}...\`\nTriggers: ${row.triggerCount} | Last: ${last}${comment}`
                });
            }

            return embed;
        };

        const buildComponents = () => {
            const pageWebhooks = pageRows();
            const deleteRows = [];

            for (let i = 0; i < pageWebhooks.length; i += 5) {
                const deleteRow = new ActionRowBuilder();
                for (const row of pageWebhooks.slice(i, i + 5)) {
                    deleteRow.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`delete_${row.uuid}`)
                            .setLabel(`Delete ${row.name}`.slice(0, 80))
                            .setStyle(ButtonStyle.Danger)
                    );
                }
                deleteRows.push(deleteRow);
            }

            const navRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('page_prev')
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === 0),
                    new ButtonBuilder()
                        .setCustomId('page_next')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page >= totalPages() - 1),
                    new ButtonBuilder()
                        .setCustomId('close_list')
                        .setLabel('Close')
                        .setStyle(ButtonStyle.Secondary)
                );

            return [...deleteRows, navRow];
        };

        const response = await interaction.reply({
            embeds: [buildEmbed()],
            components: buildComponents(),
            flags: MessageFlags.Ephemeral,
            withResponse: true
        });

        const message = response.resource.message;

        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: COLLECTOR_TIMEOUT
        });

        collector.on('collect', async i => {
            const customId = i.customId;

            if (customId === 'page_prev') {
                page = Math.max(0, page - 1);
                return await i.update({ embeds: [buildEmbed()], components: buildComponents() });
            }

            if (customId === 'page_next') {
                page = Math.min(totalPages() - 1, page + 1);
                return await i.update({ embeds: [buildEmbed()], components: buildComponents() });
            }

            if (customId === 'close_list') {
                await i.update({ components: [] });
                return collector.stop();
            }

            if (customId.startsWith('delete_')) {
                const uuid = customId.slice('delete_'.length);
                db.deleteWebhook(uuid);

                const index = rows.findIndex(row => row.uuid === uuid);
                if (index !== -1) rows.splice(index, 1);

                if (rows.length === 0) {
                    await i.update({ content: 'No active webhooks.', embeds: [], components: [] });
                    return collector.stop();
                }

                page = Math.min(page, totalPages() - 1);
                await i.update({ embeds: [buildEmbed()], components: buildComponents() });
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                await interaction.editReply({ components: [] }).catch(() => {});
            }
        });
    }
};
