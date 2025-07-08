# Wace | Music Bot Setup Guide

Welcome to the setup guide for **Wace**, a powerful and feature-rich Discord music bot. Follow these steps to get your own instance running!

---

## 🚦 Prerequisites

- **Node.js v16 or higher** ([Download Node.js](https://nodejs.org/))
- **npm** (comes with Node.js)
- **A Discord Bot Token** ([Create a bot](https://discord.com/developers/applications))
- (Optional) **Lavalink server** for music streaming ([Lavalink Guide](https://darrennathanael.com/lavalink/))
- (Optional) **MongoDB, MySQL, or PostgreSQL** for persistent storage

---

## ⚙️ Configuration

1. **Copy the example config:**
   ```sh
   cp example.app.yml app.yml
   ```
   Or manually create `app.yml` in the root directory.

2. **Edit `app.yml`:**
   - Set your Discord bot token(s) under `bot.TOKEN`.
   - Adjust other settings as needed (language, owner ID, database, etc).
   - For multi-bot/sharding, add multiple tokens to the array.

3. **(Optional) Environment Variables:**
   - You can use a `.env` file for secrets. Reference them in `app.yml` as `${VARNAME}`.

---

## 🛠️ Build

Build the TypeScript source code:
```sh
npm run build:full
```

---

## 🚀 Running the Bot

### Development Mode (with hot-reload):
```sh
npm run dev
```

### Production Mode:
```sh
npm start
```

### Using PM2 (recommended for production):
```sh
npm run build:full
npm run start:pm2
```

### Using the provided start script (Linux/macOS):
```sh
./start.sh
```

---

## 🌐 Web Dashboard / API
- The bot includes a Fastify-based web server (API & web player).
- Configure under `player.WEB_SERVER` in `app.yml`.
- Default: `http://localhost:3000`

---

## 🗃️ Database Support
- **Default:** QuickDB (JSON file, no setup needed)
- **MongoDB/MySQL/Postgres:**
  - Configure under `utilities.DATABASE` in `app.yml`.
  - Install and run your database server.

---

## 🎧 Lavalink Setup
- Lavalink is required for music playback.
- Configure Lavalink nodes in `app.yml` under `player.LAVALINK`.

---

## 🆘 Help & Support
- [Join the Support Server](https://discord.gg/TDRbRyW9PN)
- For issues or feature requests, open an issue on GitHub.

---

## 👤 Credits
- Developed by **n0step_**

---

Enjoy your music bot! 🎶 