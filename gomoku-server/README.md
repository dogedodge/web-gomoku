# Five in A Row WebSocket API

```json
{
  "name": "Five In A Row WebSocket API",
  "description": "Real-time multiplayer game server API for Five In A Row using WebSockets and JSON",
  "version": "1.0.0",
  "endpoints": [
    {
      "name": "Game Connection",
      "url": "ws://game.server.com/play",
      "protocol": "WebSocket"
    }
  ],
  "message_types": {
    "client_messages": [
      {
        "type": "create_game",
        "description": "Create new game session",
        "payload": {
          "playerName": "string"
        }
      },
      {
        "type": "join_game",
        "description": "Join existing game session",
        "payload": {
          "gameId": "string",
          "playerName": "string"
        }
      },
      {
        "type": "make_move",
        "description": "Place stone on board",
        "payload": {
          "gameId": "string",
          "playerId": "string",
          "x": "number",
          "y": "number"
        }
      },
      {
        "type": "leave_game",
        "description": "Leave current game session",
        "payload": {
          "gameId": "string",
          "playerId": "string"
        }
      }
    ],
    "server_messages": [
      {
        "type": "game_created",
        "description": "Confirm game creation",
        "payload": {
          "gameId": "string",
          "playerId": "string",
          "opponentName": "string|null"
        }
      },
      {
        "type": "game_update",
        "description": "Broadcast game state changes",
        "payload": {
          "gameId": "string",
          "boardState": "number[][]",
          "currentPlayer": "string",
          "winner": "string|null"
        }
      },
      {
        "type": "error",
        "description": "Error notifications",
        "payload": {
          "code": "number",
          "message": "string",
          "details": "object|null"
        }
      }
    ]
  },
  "error_codes": [
    {"code": 4001, "message": "Invalid move coordinates"},
    {"code": 4002, "message": "Not your turn"},
    {"code": 4003, "message": "Game not found"},
    {"code": 4004, "message": "Game already full"},
    {"code": 4005, "message": "Invalid player credentials"}
  ],
  "example_flow": {
    "client": {"type": "create_game", "payload": {"playerName": "Alice"}},
    "server": {"type": "game_created", "payload": {"gameId": "ABC123", "playerId": "PLAYER1", "opponentName": null}},
    "client2": {"type": "join_game", "payload": {"gameId": "ABC123", "playerName": "Bob"}},
    "server_broadcast": {"type": "game_update", "payload": {"gameId": "ABC123", "boardState": [[...]], "currentPlayer": "PLAYER1", "winner": null}}
  }
}
```
