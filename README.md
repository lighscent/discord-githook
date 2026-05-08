# Discord GitHub Webhook

A lightweight, simple Discord bot to receive GitHub repository events via webhooks and post them as clean embeds in your Discord channels.

## Features
- 🚀 **Fast & Lightweight:** Built with Node.js and Express.
- 🔗 **Multiple Webhooks:** Support for multiple repositories and channels.
- 🔐 **Secure:** Verification of GitHub signatures and unique UUID-based endpoints.
- 💾 **SQLite Persistence:** Keeps track of your webhooks across restarts.
- 🛠️ **Slash Commands:** Manage everything directly from Discord.
- 🎨 **Customizable Embeds:** Fine-tune how GitHub events appear in Discord with detailed settings.

## Commands
All commands require the `AUTHORIZED_ID` permissions defined in your `.env` file.
- `/create-webhook [name] [channel]`: Create a new webhook.
- `/list-webhooks`: List all active webhooks and their stats.
- `/delete-webhook [name]`: Remove a webhook.

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/lighscent/discord-githook.git
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
   DISCORD_TOKEN=your_discord_bot_token
   AUTHORIZED_ID=your_discord_user_id
   
   GITHUB_WEBHOOK_SECRET=your_secret_string
   ```

4. **Start the bot:**
   ```bash
   node main.js
   ```

## Configuration

The bot's behavior can be customized using the `settings.json` file. This file allows you to control how GitHub events are displayed in Discord embeds.

### Settings Overview

- **behavior**: Controls what information is shown and how pushes are handled.
  - `oneCommitPerMessage`: Send one embed per commit (true) or group commits (false).
  - `showFileNames`: Include file names in the embed.
  - `showCommitUrls`: Include links to commits.
  - `showCommitMessageBody`: Show full commit messages.
  - `showCompareLink`: Include compare links for pushes.
  - `onlyDefaultBranch`: Only process pushes to the default branch.

- **limits**: Set limits to prevent spam.
  - `maxCommitsPerEmbed`: Maximum commits per embed.
  - `maxEmbedsPerPush`: Maximum embeds per push event.
  - `maxFilesPerCommit`: Maximum files shown per commit.

- **display**: Customize embed appearance.
  - `showRepoNameInTitle`: Include repository name in embed title.
  - `showBranchInTitle`: Include branch name in title.
  - `showCommitCountInTitle`: Show commit count in title.
  - `embedDescriptionSeparator`: Separator for descriptions.
  - `fileListPrefix`: Prefix for file lists.

- **embed**: Embed styling.
  - `embedColor`: Hex color for embeds (default: Discord blue).
  - `footerText`: Text in embed footer.

- **author**: Author display options.
  - `showAuthorIcon`: Show author avatar.
  - `useAuthorUrl`: Link to author's GitHub profile.
  - `authorUsePusher`: Use pusher instead of author for commits.

## GitHub Setup
Once you've created a webhook via Discord using `/create-webhook`, you'll receive a URL.
1. Go to your GitHub repository -> Settings -> Webhooks.
2. Click "Add webhook".
3. **Payload URL:** Paste the URL provided by the bot.
4. **Content type:** `application/json`.
5. **Secret:** Match the `GITHUB_WEBHOOK_SECRET` in your `.env`. (Optional but recommended for security.)
6. **Events:** Select "Just the push event" (currently supported).

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
