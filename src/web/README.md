# Wace Web API

This directory contains the web API for the Wace Discord bot.

## Authentication

All API endpoints require authentication via the `Authorization` header. The value should match your bot's `app.yml | WEB_SERVER` configuration.

## WebSocket

The WebSocket endpoint has been refactored to require authentication for each event request. The WebSocket now accepts connections without authentication but requires authentication for all event requests. This provides better security and flexibility.

### Connection Flow

#### 1. Establish Connection
Connect to the WebSocket endpoint without any authentication headers:
```
ws://your-server:3001/v1/websocket
```

#### 2. Authenticate
Send an authentication message immediately after connection:
```json
{
  "type": "auth",
  "auth": "your-auth-token"
}
```

**Response:**
```json
{
  "type": "auth_success",
  "message": "Authentication successful"
}
```

#### 3. Subscribe to Guild Events
After successful authentication, subscribe to a specific guild:
```json
{
  "type": "subscribe",
  "guildId": "123456789012345678"
}
```

**Response:**
```json
{
  "type": "subscribe_success",
  "guildId": "123456789012345678",
  "message": "Successfully subscribed to guild events"
}
```

### Message Types

#### Authentication
- **type**: `"auth"`
- **auth**: Your authentication token
- **Required**: Yes, for all other operations

#### Subscription
- **type**: `"subscribe"`
- **guildId**: Discord guild ID to subscribe to
- **Required**: Yes, to receive guild-specific events

#### Unsubscription
- **type**: `"unsubscribe"`
- **Required**: No parameters (unsubscribes from current guild)

#### Ping/Pong
- **type**: `"ping"`
- **Response**: `{"type": "pong", "timestamp": 1234567890}`

### Error Responses

All error responses follow this format:
```json
{
  "error": "Error description",
  "type": "error"
}
```

#### Common Errors
- `"Authentication required. Send auth message first."` - Send auth message before other operations
- `"Invalid auth token"` - Authentication token is incorrect
- `"Missing guildId"` - Required guildId parameter is missing
- `"Already have connection on this guild"` - Another connection is already subscribed to this guild
- `"Not subscribed to any guild"` - Trying to unsubscribe when not subscribed

### Example JavaScript Client

```javascript
const ws = new WebSocket('ws://your-server:3001/v1/websocket');

ws.onopen = function() {
  console.log('Connected to WebSocket');
  
  ws.send(JSON.stringify({
    type: 'auth',
    auth: 'your-auth-token'
  }));
};

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'auth_success':
      console.log('Authentication successful');
      ws.send(JSON.stringify({
        type: 'subscribe',
        guildId: '123456789012345678'
      }));
      break;
      
    case 'subscribe_success':
      console.log('Subscribed to guild events');
      break;
      
    case 'error':
      console.error('WebSocket error:', data.error);
      break;
      
    default:
      console.log('Received event:', data);
  }
};

ws.onclose = function() {
  console.log('WebSocket connection closed');
};
```

### Security Notes

1. **Authentication is required for all operations** except the initial auth message
2. **Each message is validated** against the stored authentication token
3. **Connections are cleaned up** automatically when the socket closes
4. **Only one connection per guild** is allowed to prevent conflicts
5. **Invalid JSON messages** are rejected with an error response

### Migration from Old System

If you were using the old WebSocket system with headers:
- Remove `guild-id` and `authorization` headers from connection
- Send authentication message after connection
- Send subscription message after authentication
- All other functionality remains the same

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
<tr><td>ws://localhost:3001/v1/websocket</td><td>WebSocket connection for guild updates</td></tr>
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
