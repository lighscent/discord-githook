const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete-webhook')
        .setDescription('Deletes a webhook by name')
        .addStringOption(option =>
            option.setName('webhook_name')
                .setDescription('The exact name of the webhook to delete')
                .setRequired(true)),

    async execute(interaction, db) {
        const name = interaction.options.getString('webhook_name');

        // Find by name instead of partial UUID
        const rows = db.getAllWebhooks();
        const webhook = rows.find(r => r.name.toLowerCase() === name.toLowerCase());

        if (!webhook) {
            return await interaction.reply({ content: `No webhook found with the name: **${name}**`, ephemeral: true });
        }

        // Confirmation buttons
        const confirm = new ButtonBuilder()
            .setCustomId('confirm_delete')
            .setLabel('Confirm')
            .setStyle(ButtonStyle.Danger);

        const cancel = new ButtonBuilder()
            .setCustomId('cancel_delete')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(confirm, cancel);

        const response = await interaction.reply({
            content: `Are you sure you want to delete the webhook **${webhook.name}**? This action is **not reversible**.`,
            components: [row],
            ephemeral: true
        });

        // Collector for the buttons
        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 30000
        });

        collector.on('collect', async i => {
            if (i.customId === 'confirm_delete') {
                db.deleteWebhook(webhook.uuid);
                await i.update({ content: `Webhook **${webhook.name}** has been successfully deleted.`, components: [] });
            } else {
                await i.update({ content: 'Deletion cancelled.', components: [] });
            }
            collector.stop();
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                await interaction.editReply({ content: 'Deletion timed out.', components: [] });
            }
        });
    }
};