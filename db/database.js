const Database = require('better-sqlite3');

class DatabaseManager {
    constructor(dbPath = 'webhooks.db') {
        this.db = new Database(dbPath);
        this.init();
    }

    init() {
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS webhooks (
                uuid TEXT PRIMARY KEY,
                channelId TEXT,
                name TEXT,
                lastTriggered TEXT,
                triggerCount INTEGER DEFAULT 0
            )
        `).run();

        this.ensureColumn('webhooks', 'lastTriggered', 'TEXT');
        this.ensureColumn('webhooks', 'triggerCount', 'INTEGER DEFAULT 0');
        this.ensureColumn('webhooks', 'platform', "TEXT DEFAULT 'github'");
        this.ensureColumn('webhooks', 'comment', 'TEXT');
    }

    ensureColumn(table, column, type) {
        const exists = this.db.prepare(`PRAGMA table_info(${table})`).all().some(row => row.name === column);
        if (!exists) {
            this.db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
        }
    }

    createWebhook(uuid, channelId, name, platform = 'github', comment = null) {
        return this.db.prepare('INSERT INTO webhooks (uuid, channelId, name, lastTriggered, triggerCount, platform, comment) VALUES (?, ?, ?, ?, 0, ?, ?)')
            .run(uuid, channelId, name, null, platform, comment);
    }

    getWebhook(uuid) {
        return this.db.prepare('SELECT channelId, name FROM webhooks WHERE uuid = ?').get(uuid);
    }

    getWebhookInfo(uuid) {
        return this.db.prepare('SELECT uuid, channelId, name, platform, comment, lastTriggered, COALESCE(triggerCount, 0) as triggerCount FROM webhooks WHERE uuid = ?').get(uuid);
    }

    getAllWebhooks() {
        return this.db.prepare('SELECT uuid, channelId, name, platform, comment, lastTriggered, COALESCE(triggerCount, 0) as triggerCount FROM webhooks').all();
    }

    updateWebhookTrigger(uuid) {
        return this.db.prepare('UPDATE webhooks SET lastTriggered = ?, triggerCount = COALESCE(triggerCount, 0) + 1 WHERE uuid = ?')
            .run(new Date().toISOString(), uuid);
    }

    deleteWebhook(uuid) {
        return this.db.prepare('DELETE FROM webhooks WHERE uuid = ?').run(uuid);
    }

    findWebhooksByPartialUuid(partial) {
        return this.db.prepare('SELECT uuid, name FROM webhooks WHERE uuid LIKE ?').all(`${partial}%`);
    }

    close() {
        this.db.close();
    }
}

module.exports = DatabaseManager;