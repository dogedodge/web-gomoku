以下是基于架构设计文档的 `getHandler` 实现示例，建议在 `websocket/handlers` 目录下创建：

```typescript
// src/websocket/handlers/index.ts
import { roomManager } from "../../rooms/RoomManager";
import { GameRoom } from "../../rooms/GameRoom";
import { WebSocket } from "ws";
import { ClientMessage } from "../../types/messages";

// 定义处理器函数类型
type MessageHandler = (data: any, ws: WebSocket) => Promise<void>;

// 处理器集合
const handlers: { [key: string]: MessageHandler } = {
  // 创建房间
  create_room: async (data, ws) => {
    const room = roomManager.createRoom();
    const response = {
      type: "room_created",
      room_id: room.id,
      player_id: "1",
      expire_time: 1800,
    };
    ws.send(JSON.stringify(response));
  },

  // 加入房间
  join_room: async (data, ws) => {
    const room = roomManager.getRoom(data.room_id);
    if (!room) {
      throw new Error("ROOM_NOT_FOUND");
    }

    if (room.isFull()) {
      throw new Error("ROOM_FULL");
    }

    const playerId = room.addPlayer(ws);
    const response = {
      type: "join_success",
      player_id: playerId,
      opponent_name: room.getOpponentName(playerId),
    };
    ws.send(JSON.stringify(response));
  },

  // 落子操作
  place_stone: async (data, ws) => {
    const room = roomManager.getRoom(data.room_id);
    if (!room) throw new Error("ROOM_NOT_FOUND");

    if (!room.isPlayerTurn(data.player_id)) {
      throw new Error("NOT_YOUR_TURN");
    }

    const [x, y] = data.position;
    room.placeStone(x, y, data.player_id);
  },

  // 心跳处理
  ping: async (data, ws) => {
    ws.send(
      JSON.stringify({
        type: "pong",
        timestamp: Date.now(),
      }),
    );
  },
};

// 获取处理器函数
export function getHandler(messageType: string): MessageHandler {
  const handler = handlers[messageType];
  if (!handler) {
    throw new Error(`INVALID_ACTION: Unsupported message type ${messageType}`);
  }
  return handler;
}

// 错误处理增强
export function handleError(error: Error, ws: WebSocket) {
  const errorCode = error.message.startsWith("INVALID_ACTION")
    ? error.message.split(":")[0]
    : "UNKNOWN_ERROR";

  ws.send(
    JSON.stringify({
      type: "error",
      code: errorCode,
      message: error.message,
    }),
  );
}
```

需要配套的消息类型定义（types/messages.ts）：

```typescript
// src/types/messages.ts
export type ClientMessage = {
  type: "create_room" | "join_room" | "place_stone" | "ping";
  room_id?: string;
  player_id?: string;
  position?: [number, number];
  player_name?: string;
};

export type ServerMessage = {
  type: "room_created" | "join_success" | "stone_placed" | "error" | "pong";
  // ...其他字段根据具体类型定义
};
```

在 WSServer 中的使用方式：

```typescript
// src/websocket/WSServer.ts
import { getHandler, handleError } from "./handlers";

class WSServer {
  // ...其他代码

  private async handleMessage(raw: string, ws: WebSocket) {
    try {
      const message: ClientMessage = JSON.parse(raw);
      const handler = getHandler(message.type);
      await handler(message, ws); // 传入完整消息对象
    } catch (err) {
      handleError(err, ws);
    }
  }
}
```

实现特点：

1. **类型安全**：使用 TypeScript 类型约束消息格式
2. **模块化设计**：每个消息类型对应独立的处理逻辑
3. **错误处理**：
   - 自动捕获异步错误
   - 标准化错误消息格式
   - 支持自定义错误码映射
4. **可扩展性**：通过添加新的处理器函数即可支持新消息类型
5. **状态管理**：与 RoomManager 紧密集成处理房间逻辑

建议的扩展方向：

1. 添加认证中间件：

```typescript
async function withAuth(handler: MessageHandler): MessageHandler {
  return async (data, ws) => {
    if (!validateToken(data.token)) {
      throw new Error("AUTH_FAILED");
    }
    return handler(data, ws);
  };
}
```

2. 添加日志记录：

```typescript
function withLogging(handler: MessageHandler): MessageHandler {
  return async (data, ws) => {
    console.log(`[${new Date().toISOString()}] Handling ${data.type}`);
    return handler(data, ws);
  };
}
```

3. 添加速率限制：

```typescript
import { RateLimiter } from "limiter";

const limiter = new RateLimiter({
  tokensPerInterval: 10,
  interval: "second",
});

function withRateLimit(handler: MessageHandler): MessageHandler {
  return async (data, ws) => {
    if (!(await limiter.removeTokens(1))) {
      throw new Error("RATE_LIMIT_EXCEEDED");
    }
    return handler(data, ws);
  };
}
```
