const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list-webhooks')
        .setDescription('Lists active GitHub webhooks'),

    async execute(interaction, db) {
        const rows = db.getAllWebhooks();
        if (rows.length === 0) {
            return await interaction.reply({ content: 'No active webhooks.', ephemeral: true });
        }

        const lines = rows.map(row => {
            const partial = row.uuid.substring(0, 8);
            const channelRef = `<#${row.channelId}>`;
            const last = row.lastTriggered ? `<t:${Math.floor(new Date(row.lastTriggered).getTime() / 1000)}:R>` : 'Never';
            return `**${row.name}** | ${channelRef} | \`${partial}...\` | triggers: ${row.triggerCount} | last: ${last}`;
        });

        await interaction.reply({
            content: `**Active webhooks (${rows.length}):**\n\n${lines.slice(0, 10).join('\n\n')}${rows.length > 10 ? '\n\n...and ' + (rows.length - 10) + ' more.' : ''}`,
            ephemeral: true
        });
    }
};