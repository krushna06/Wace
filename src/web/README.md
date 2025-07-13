# Wace Web API

This directory contains the web API for the Wace Discord bot.

## Authentication

All API endpoints require authentication via the `Authorization` header. The value should match your bot's `WEB_SERVER.auth` configuration.

## Endpoints

### Player Management

- `GET /v1/players/:guildId` - Get player status
- `POST /v1/players/:guildId` - Create a new player
- `DELETE /v1/players/:guildId` - Destroy a player
- `PATCH /v1/players/:guildId/control` - Control player (play, pause, skip, etc.)
- `PATCH /v1/players/:guildId/shuffle` - Toggle shuffle mode

### Music Control

- `POST /v1/play/:guildId` - Play a track
- `GET /v1/search` - Search for tracks
- `GET /v1/queue/:guildId` - Get current queue
- `GET /v1/current/:guildId` - Get current track info

### Filters

- `GET /v1/filters` - Get all available filters
- `GET /v1/filters/:guildId` - Get current filter for a guild
- `POST /v1/filters/:guildId` - Apply a filter to a guild's player
- `DELETE /v1/filters/:guildId` - Clear all filters from a guild's player

#### Filter Usage Examples

**Get all available filters:**
```bash
curl -H "Authorization: your-auth-token" http://localhost:3000/v1/filters
```

**Apply a filter:**
```bash
curl -X POST -H "Authorization: your-auth-token" \
  -H "Content-Type: application/json" \
  -d '{"filter": "nightcore"}' \
  http://localhost:3000/v1/filters/123456789
```

**Apply bass filter with custom amount:**
```bash
curl -X POST -H "Authorization: your-auth-token" \
  -H "Content-Type: application/json" \
  -d '{"filter": "bass", "amount": 5}' \
  http://localhost:3000/v1/filters/123456789
```

**Clear all filters:**
```bash
curl -X DELETE -H "Authorization: your-auth-token" \
  http://localhost:3000/v1/filters/123456789
```

**Get current filter:**
```bash
curl -H "Authorization: your-auth-token" \
  http://localhost:3000/v1/filters/123456789
```

#### Available Filters

- `3d` - 3D audio effect
- `bass` - Bass boost (can use custom amount)
- `bassboost` - Bass boost filter
- `china` - Chinese radio effect
- `chipmunk` - Chipmunk voice effect
- `darthvader` - Darth Vader voice effect
- `daycore` - Daycore effect
- `doubletime` - Double time effect
- `earrape` - Earrape effect
- `electronic` - Electronic music filter
- `equalizer` - Equalizer preset
- `karaoke` - Karaoke filter
- `nightcore` - Nightcore effect
- `party` - Party filter
- `pitch` - Pitch shift
- `pop` - Pop music filter
- `radio` - Radio filter
- `rate` - Playback rate control
- `slow` - Slow motion effect
- `slowmotion` - Slow motion effect
- `soft` - Soft filter
- `speed` - Speed control
- `superbass` - Super bass effect
- `television` - Television effect
- `treblebass` - Treble and bass boost
- `tremolo` - Tremolo effect
- `vaporwave` - Vaporwave effect
- `vibrate` - Vibrate effect
- `vibrato` - Vibrato effect
- `clear` - Reset all filters

### Playlists

- `GET /v1/playlists/:userId` - Get user's playlists
- `GET /v1/playlist/:playlistId` - Get playlist details

### Premium

- `GET /v1/premium/user/:userId` - Get user premium status
- `GET /v1/premium/guild/:guildId` - Get guild premium status

### DJ System

- `GET /v1/dj/:guildId/userid` - Get DJ status for a user

### LastFM

- `GET /api/lastfm/callback` - LastFM OAuth callback

## WebSocket

The API also provides WebSocket endpoints for real-time updates:

- `ws://localhost:3000/v1/ws/:guildId` - WebSocket connection for guild updates

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

## Success Responses

Successful responses follow this format:

```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```
