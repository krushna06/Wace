import { Manager } from "../../manager.js";
import cron from "node-cron";
import fs from "fs";
import path from "path";

export class DatabaseBackupSetup {
  client: Manager;

  constructor(client: Manager) {
    this.client = client;
    this.execute();
  }

  async execute() {
    const cfg = this.client.config.utilities.DATABASE_BACKUP;
    if (!cfg?.enable) return;

    const dir = cfg.backup_dir ?? "./backups";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    cron.schedule("0 0 0 * * 0", () => this.runBackup(dir));
    this.client.logger.info("DatabaseBackup", "Weekly database backup scheduler registered (every Sunday 00:00).");
  }

  async runBackup(dir: string) {
    const driver = this.client.config.utilities.DATABASE.driver;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    if (driver === "json") {
      await this.backupJson(dir, timestamp);
    } else {
      await this.backupAllTables(dir, timestamp, driver);
    }
  }

  private async backupJson(dir: string, timestamp: string) {
    const srcPath = this.client.config.utilities.DATABASE.config?.path ?? "./wace.database.json";
    if (!fs.existsSync(srcPath)) {
      this.client.logger.warn("DatabaseBackup", `JSON database file not found at ${srcPath}`);
      return;
    }

    const destPath = path.join(dir, `wace.database.${timestamp}.json`);
    fs.copyFileSync(srcPath, destPath);
    this.client.logger.info("DatabaseBackup", `JSON backup saved to ${destPath}`);
    this.pruneOldBackups(dir, ".json");
  }

  private async backupAllTables(dir: string, timestamp: string, driver: string) {
    try {
      const tables = this.client.db;
      const snapshot: Record<string, unknown> = {};

      for (const [tableName, table] of Object.entries(tables)) {
        try {
          snapshot[tableName] = await (table as any).all();
        } catch {
          snapshot[tableName] = [];
        }
      }

      const destPath = path.join(dir, `wace.backup.${driver}.${timestamp}.json`);
      fs.writeFileSync(destPath, JSON.stringify(snapshot, null, 2), "utf-8");
      this.client.logger.info("DatabaseBackup", `${driver} backup saved to ${destPath}`);
      this.pruneOldBackups(dir, ".json");
    } catch (e) {
      this.client.logger.error("DatabaseBackup", `Backup failed: ${String(e)}`);
    }
  }

  private pruneOldBackups(dir: string, ext: string) {
    const cfg = this.client.config.utilities.DATABASE_BACKUP;
    const keepCount = cfg?.keep_backups ?? 4;

    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(ext))
      .map((f) => ({ name: f, time: fs.statSync(path.join(dir, f)).mtimeMs }))
      .sort((a, b) => b.time - a.time);

    const toDelete = files.slice(keepCount);
    for (const file of toDelete) {
      fs.unlinkSync(path.join(dir, file.name));
      this.client.logger.info("DatabaseBackup", `Pruned old backup: ${file.name}`);
    }
  }
}
