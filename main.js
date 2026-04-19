require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const DatabaseManager = require('./db/database');
const GitHubHandler = require('./utils/github');
const { createDiscordBot } = require('./utils/discord');

const app = express();
const port = process.env.PORT || 3000;

const db = new DatabaseManager();
const discordBot = createDiscordBot(db, port, app);
const githubHandler = new GitHubHandler(db, discordBot.client);

app.use(bodyParser.json());

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

discordBot.start(process.env.DISCORD_TOKEN);

process.on('SIGINT', () => {
    db.close();
    discordBot.client.destroy();
    process.exit(0);
});
