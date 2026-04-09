const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-webhook')
        .setDescription('Create a new GitHub webhook')
        .addStringOption(option =>
            option.setName('wh_name')
                .setDescription('Name displayed at the top of the embed')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel_id')
                .setDescription('Channel where to send notifications')
                .setRequired(true)),

    async execute(interaction, db, port) {
        const whName = interaction.options.getString('wh_name');
        const channel = interaction.options.getChannel('channel_id');
        const newUuid = require('uuid').v6();

        try {
            db.createWebhook(newUuid, channel.id, whName);

            const webhookUrl = `http://${process.env.DOMAIN || 'YOUR_IP'}:${port}/github/${newUuid}`;

            await interaction.reply({
                content: `Webhook **${whName}** created for <#${channel.id}> !\n\n**GitHub URL:**\n\`${webhookUrl}\`\n\n*Keep this URL secret.*`,
                ephemeral: true
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "Error while creating the webhook.", ephemeral: true });
        }
    }
};