# Wace Web API

This directory contains the web API for the Wace Discord bot.

## Authentication

All API endpoints require authentication via the `Authorization` header. The value should match your bot's `app.yml | WEB_SERVER` configuration.

## Endpoints

### Player Management

<table border="1">
<tr><th>Method</th><th>Path</th><th>Params</th><th>Description</th></tr>
<tr><td>GET</td><td>/v1/players/:guildId</td><td>Path: guildId<br>Header: [user-id] (optional)</td><td>Get player status for a guild</td></tr>
</table>

**Success Response**
```json
{
  "guildId": "...",
  "loop": "...",
  "pause": false,
  "member": "true/false/notGiven",
  "position": 12345,
  "current": { ... },
  "queue": [ ... ]
}
```
**Error Response**
```json
{
  "error": "Current player not found!"
}
```
<hr style="border: 2px solid #0078D7; margin: 32px 0;">

<table border="1">
<tr><th>Method</th><th>Path</th><th>Params</th><th>Description</th></tr>
<tr><td>PATCH</td><td>/v1/players/:guildId</td><td>Path: guildId<br>Body: { loop, skipMode, position, volume, add, paused, shuffle }</td><td>Control player (play, pause, skip, etc.)</td></tr>
</table>

**Success Response**
```json
{
  "loop": "...",
  "skiped": false,
  "previous": false,
  "position": 12345,
  "volume": 100,
  "added": [ ... ],
  "paused": false,
  "shuffled": false
}
```
**Error Response**
```json
{
  "error": "..."
}
```
<hr style="border: 2px solid #0078D7; margin: 32px 0;">

<table border="1">
<tr><th>Method</th><th>Path</th><th>Params</th><th>Description</th></tr>
<tr><td>DELETE</td><td>/v1/players/:guildId</td><td>Path: guildId</td><td>Destroy a player</td></tr>
</table>

**Success Response**
204 No Content
**Error Response**
```json
{
  "error": "Current player not found!"
}
```
<hr style="border: 2px solid #0078D7; margin: 32px 0;">

<table border="1">
<tr><th>Method</th><th>Path</th><th>Params</th><th>Description</th></tr>
<tr><td>POST</td><td>/v1/players</td><td>Body: { guildId, userId }</td><td>Create a new player</td></tr>
</table>

**Success Response**
```json
{
  "guildId": "...",
  "voiceId": "...",
  "textId": "...",
  "shardId": 0,
  "deaf": true,
  "volume": 100
}
```
**Error Response**
```json
{
  "error": "..."
}
```
<hr style="border: 2px solid #0078D7; margin: 32px 0;">

### Music Control

<table border="1">
<tr><th>Method</th><th>Path</th><th>Params</th><th>Description</th></tr>
<tr><td>GET</td><td>/v1/search</td><td>Query: identifier, requester, [source]</td><td>Search for tracks</td></tr>
</table>

**Success Response**
```json
{
  "type": "...",
  "playlistName": "...",
  "tracks": [ ... ]
}
```
**Error Response**
```json
{
  "error": "..."
}
```
<hr style="border: 2px solid #0078D7; margin: 32px 0;">

### Filters

<table border="1">
<tr><th>Method</th><th>Path</th><th>Params</th><th>Description</th></tr>
<tr><td>GET</td><td>/v1/filters</td><td>None</td><td>Get all available filters</td></tr>
</table>

**Success Response**
```json
{
  "success": true,
  "data": { ... }
}
```
**Error Response**
```json
{
  "success": false,
  "error": "..."
}
```
<hr style="border: 2px solid #0078D7; margin: 32px 0;">

<table border="1">
<tr><th>Method</th><th>Path</th><th>Params</th><th>Description</th></tr>
<tr><td>GET</td><td>/v1/filters/:guildId</td><td>Path: guildId</td><td>Get current filter for a guild</td></tr>
</table>

**Success Response**
```json
{
  "success": true,
  "data": {
    "guildId": "...",
    "currentFilter": "...",
    "hasFilter": true
  }
}
```
**Error Response**
```json
{
  "success": false,
  "error": "..."
}
```
<hr style="border: 2px solid #0078D7; margin: 32px 0;">

<table border="1">
<tr><th>Method</th><th>Path</th><th>Params</th><th>Description</th></tr>
<tr><td>POST</td><td>/v1/filters/:guildId</td><td>Path: guildId<br>Body: { filter, [amount] }</td><td>Apply a filter</td></tr>
</table>

**Success Response**
```json
{
  "success": true,
  "data": {
    "guildId": "...",
    "filter": "...",
    "commandName": "...",
    "message": "..."
  }
}
```
**Error Response**
```json
{
  "success": false,
  "error": "..."
}
```
<hr style="border: 2px solid #0078D7; margin: 32px 0;">

<table border="1">
<tr><th>Method</th><th>Path</th><th>Params</th><th>Description</th></tr>
<tr><td>DELETE</td><td>/v1/filters/:guildId</td><td>Path: guildId</td><td>Clear all filters</td></tr>
</table>

**Success Response**
```json
{
  "success": true,
  "data": { ... }
}
```
**Error Response**
```json
{
  "success": false,
  "error": "..."
}
```
<hr style="border: 2px solid #0078D7; margin: 32px 0;">

### Queue Management

<table border="1">
<tr><th>Method</th><th>Path</th><th>Params</th><th>Description</th></tr>
<tr><td>DELETE</td><td>/v1/queue/:guildId</td><td>Path: guildId</td><td>Clear the queue</td></tr>
</table>

**Success Response**
```json
{
  "success": true,
  "data": {
    "guildId": "...",
    "message": "Queue has been cleared successfully"
  }
}
```
**Error Response**
```json
{
  "success": false,
  "error": "..."
}
```
<hr style="border: 2px solid #0078D7; margin: 32px 0;">

<table border="1">
<tr><th>Method</th><th>Path</th><th>Params</th><th>Description</th></tr>
<tr><td>DELETE</td><td>/v1/queue/:guildId/:position</td><td>Path: guildId, position</td><td>Remove a track from queue</td></tr>
</table>

**Success Response**
```json
{
  "success": true,
  "data": {
    "guildId": "...",
    "position": 1,
    "message": "Removed song at position 1 from the queue",
    "removed": { ... }
  }
}
```
**Error Response**
```json
{
  "success": false,
  "error": "..."
}
```
<hr style="border: 2px solid #0078D7; margin: 32px 0;">

### Playlists

<table border="1">
<tr><th>Method</th><th>Path</th><th>Params</th><th>Description</th></tr>
<tr><td>GET</td><td>/v1/playlists/:userId</td><td>Path: userId</td><td>Get user's playlists</td></tr>
</table>

**Success Response**
```json
{
  "data": [ ...playlists ]
}
```
**Error Response**
```json
{
  "error": "..."
}
```
<hr style="border: 2px solid #0078D7; margin: 32px 0;">

<table border="1">
<tr><th>Method</th><th>Path</th><th>Params</th><th>Description</th></tr>
<tr><td>GET</td><td>/v1/playlist/:playlistId</td><td>Path: playlistId<br>Header: x-user-id</td><td>Get playlist details</td></tr>
</table>

**Success Response**
```json
{
  "data": { ...playlist }
}
```
**Error Response**
```json
{
  "error": "..."
}
```
<hr style="border: 2px solid #0078D7; margin: 32px 0;">

<table border="1">
<tr><th>Method</th><th>Path</th><th>Params</th><th>Description</th></tr>
<tr><td>POST</td><td>/v1/playlist</td><td>Body: { name, [description], owner }</td><td>Create playlist</td></tr>
</table>

**Success Response**
```json
{
  "success": true,
  "data": { ...playlist }
}
```
**Error Response**
```json
{
  "error": "..."
}
```
<hr style="border: 2px solid #0078D7; margin: 32px 0;">

<table border="1">
<tr><th>Method</th><th>Path</th><th>Params</th><th>Description</th></tr>
<tr><td>DELETE</td><td>/v1/playlist/:playlistId</td><td>Path: playlistId<br>Body: { owner } or Header: x-owner</td><td>Delete playlist</td></tr>
</table>

**Success Response**
```json
{
  "success": true,
  "message": "Playlist ... deleted"
}
```
**Error Response**
```json
{
  "error": "..."
}
```
<hr style="border: 2px solid #0078D7; margin: 32px 0;">

<table border="1">
<tr><th>Method</th><th>Path</th><th>Params</th><th>Description</th></tr>
<tr><td>PATCH</td><td>/v1/playlist/:playlistId</td><td>Path: playlistId<br>Body: { name, description, private, owner }</td><td>Edit playlist</td></tr>
</table>

**Success Response**
```json
{
  "success": true,
  "data": { ...playlist }
}
```
**Error Response**
```json
{
  "error": "..."
}
```
<hr style="border: 2px solid #0078D7; margin: 32px 0;">

### Premium

<table border="1">
<tr><th>Method</th><th>Path</th><th>Params</th><th>Description</th></tr>
<tr><td>GET</td><td>/v1/premium/user/:userId</td><td>Path: userId</td><td>Get user premium status</td></tr>
</table>

**Success Response**
```json
{
  "premium": true
}
```
**Error Response**
```json
{
  "error": "..."
}
```
<hr style="border: 2px solid #0078D7; margin: 32px 0;">

<table border="1">
<tr><th>Method</th><th>Path</th><th>Params</th><th>Description</th></tr>
<tr><td>GET</td><td>/v1/premium/guild/:guildId</td><td>Path: guildId</td><td>Get guild premium status</td></tr>
</table>

**Success Response**
```json
{
  "premium": false
}
```
**Error Response**
```json
{
  "error": "..."
}
```
<hr style="border: 2px solid #0078D7; margin: 32px 0;">

### DJ System

<table border="1">
<tr><th>Method</th><th>Path</th><th>Params</th><th>Description</th></tr>
<tr><td>GET</td><td>/v1/dj/:guildId/userid</td><td>Path: guildId<br>Query: userid</td><td>Get DJ status for a user</td></tr>
</table>

**Success Response**
```json
{
  "data": 1
}
```
**Error Response**
```json
{
  "error": "..."
}
```
<hr style="border: 2px solid #0078D7; margin: 32px 0;">

### Language

<table border="1">
<tr><th>Method</th><th>Path</th><th>Params</th><th>Description</th></tr>
<tr><td>GET</td><td>/v1/language/:guildId</td><td>Path: guildId</td><td>Get guild language</td></tr>
</table>

**Success Response**
```json
{
  "guildId": "...",
  "language": "en",
  "available": [ "en", "de", ... ]
}
```
**Error Response**
```json
{
  "error": "..."
}
```
<hr style="border: 2px solid #0078D7; margin: 32px 0;">

<table border="1">
<tr><th>Method</th><th>Path</th><th>Params</th><th>Description</th></tr>
<tr><td>PATCH</td><td>/v1/language/:guildId</td><td>Path: guildId<br>Body: { language }</td><td>Set guild language</td></tr>
</table>

**Success Response**
```json
{
  "success": true,
  "language": "en"
}
```
**Error Response**
```json
{
  "error": "..."
}
```
<hr style="border: 2px solid #0078D7; margin: 32px 0;">

### Stats

<table border="1">
<tr><th>Method</th><th>Path</th><th>Params</th><th>Description</th></tr>
<tr><td>GET</td><td>/v1/stats/user/:userId</td><td>Path: userId</td><td>Get user stats (all guilds)</td></tr>
</table>

**Success Response**
```json
{
  "userId": "...",
  "songsPlayed": 123,
  "commandsExecuted": 456
}
```
**Error Response**
```json
{
  "error": "User stats not found"
}
```
<hr style="border: 2px solid #0078D7; margin: 32px 0;">

<table border="1">
<tr><th>Method</th><th>Path</th><th>Params</th><th>Description</th></tr>
<tr><td>GET</td><td>/v1/stats/guild/:guildId</td><td>Path: guildId</td><td>Get guild stats</td></tr>
</table>

**Success Response**
```json
{
  "guildId": "...",
  "songsPlayed": 789,
  "commandsExecuted": 101
}
```
**Error Response**
```json
{
  "error": "Guild stats not found"
}
```
<hr style="border: 2px solid #0078D7; margin: 32px 0;">

### Miscellaneous

<table border="1">
<tr><th>Method</th><th>Path</th><th>Params</th><th>Description</th></tr>
<tr><td>GET</td><td>/v1/commands</td><td>None</td><td>Get all bot commands</td></tr>
</table>

**Success Response**
```json
{
  "data": [ ...commands ]
}
```
<hr style="border: 2px solid #0078D7; margin: 32px 0;">

<table border="1">
<tr><th>Method</th><th>Path</th><th>Params</th><th>Description</th></tr>
<tr><td>GET</td><td>/v1/guild-checker/:guildId/:userId</td><td>Path: guildId, userId</td><td>Check if user is in guild/voice</td></tr>
</table>

**Success Response**
```json
{
  "inGuild": true,
  "inSameVoice": false,
  "userVoiceChannelId": "...",
  "botVoiceChannelId": "..."
}
```
**Error Response**
```json
{
  "inGuild": false,
  "inSameVoice": null,
  "error": "..."
}
```
<hr style="border: 2px solid #0078D7; margin: 32px 0;">

<table border="1">
<tr><th>Method</th><th>Path</th><th>Params</th><th>Description</th></tr>
<tr><td>GET</td><td>/api/lastfm/callback</td><td>Query: code, state</td><td>LastFM OAuth callback</td></tr>
</table>

**Success Response**
(varies)
<hr style="border: 2px solid #0078D7; margin: 32px 0;">

<table border="1">
<tr><th>Method</th><th>Path</th><th>Params</th><th>Description</th></tr>
<tr><td>GET</td><td>/catgirls</td><td>None</td><td>Fun endpoint</td></tr>
</table>

**Success Response**
```json
{
  "wace": "..."
}
```
<hr style="border: 2px solid #0078D7; margin: 32px 0;">

### WebSocket

<table border="1">
<tr><th>Path</th><th>Description</th></tr>
<tr><td>ws://localhost:3000/v1/ws/:guildId</td><td>WebSocket connection for guild updates</td></tr>
</table>

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
