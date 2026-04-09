# Discord GitHub Webhook

A lightweight, simple Discord bot to receive GitHub repository events via webhooks and post them as clean embeds in your Discord channels.

## Features
- 🚀 **Fast & Lightweight:** Built with Node.js and Express.
- 🔗 **Multiple Webhooks:** Support for multiple repositories and channels.
- 🔐 **Secure:** Verification of GitHub signatures and unique UUID-based endpoints.
- 💾 **SQLite Persistence:** Keeps track of your webhooks across restarts.
- 🛠️ **Slash Commands:** Manage everything directly from Discord.

## Commands
All commands require the `AUTHORIZED_ID` permissions defined in your `.env` file.
- `/create-webhook [name] [channel]`: Create a new webhook.
- `/list-webhooks`: List all active webhooks and their stats.
- `/delete-webhook [name]`: Remove a webhook.

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/discord-githook.git
   cd discord-githook
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables:**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   DOMAIN=your_public_domain_or_ip
   DISCORD_CHANNEL_ID=your_discord_channel_id
   DISCORD_TOKEN=your_discord_bot_token
   AUTHORIZED_ID=your_discord_user_id
   
   GITHUB_WEBHOOK_SECRET=your_secret_string
   ```

4. **Start the bot:**
   ```bash
   node main.js
   ```

## GitHub Setup
Once you've created a webhook via Discord using `/create-webhook`, you'll receive a URL.
1. Go to your GitHub repository -> Settings -> Webhooks.
2. Click "Add webhook".
3. **Payload URL:** Paste the URL provided by the bot.
4. **Content type:** `application/json`.
5. **Secret:** Match the `GITHUB_WEBHOOK_SECRET` in your `.env`. (Optional but recommended for security.)
6. **Events:** Select "Just the push event" (currently supported).

## License
MIT
