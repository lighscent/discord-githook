require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, Events } = require('discord.js');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Import custom modules
const DatabaseManager = require('./db/database');
const GitHubHandler = require('./utils/github');

const app = express();
const port = process.env.PORT || 3000;

// Module initialization
const db = new DatabaseManager();
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

const githubHandler = new GitHubHandler(db, client);

app.use(bodyParser.json());

// Dynamic Webhook route using UUID
app.post('/github/:uuid', async (req, res) => {
    const { uuid } = req.params;

    if (!githubHandler.verifySignature(req)) {
        return res.status(401).send('Invalid signature');
    }

    const event = req.headers['x-github-event'];
    const payload = req.body;

    if (event === 'push') {
        const result = await githubHandler.handlePush(uuid, payload);
        res.sendStatus(result.status);
    } else {
        res.sendStatus(200);
    }
});

// Command loading
const commands = new Map();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.set(command.data.name, command);
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (process.env.AUTHORIZED_ID && interaction.user.id !== process.env.AUTHORIZED_ID) {
        return await interaction.reply({
            content: "You don't have permission to use this command.",
            ephemeral: true
        });
    }

    const command = commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction, db, port);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Error executing the command.', ephemeral: true });
    }
});

client.once(Events.ClientReady, async () => {
    console.log(`Bot ready: ${client.user.tag}`);

    const commandData = Array.from(commands.values()).map(cmd => cmd.data.toJSON());

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commandData });
        console.log('Slash Commands deployed.');
    } catch (error) {
        console.error(error);
    }

    app.listen(port, () => {
        console.log(`Server ready on port ${port}`);
    });
});

client.login(process.env.DISCORD_TOKEN);

process.on('SIGINT', () => {
    db.close();
    client.destroy();
    process.exit(0);
});
