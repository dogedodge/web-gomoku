以下是完整的 WebSocket 消息处理模块实现，包含核心游戏操作和网络事件处理：

```typescript
// src/websocket/handlers.ts
import { WebSocketServer, WebSocket } from "ws";
import { RoomManager } from "../rooms/RoomManager";
import { GameRoom } from "../rooms/GameRoom";
import { ServerMessage, ClientMessage, PlayerID } from "../types/messages";
import { v4 as uuidv4 } from "uuid";

type ConnectionContext = {
  playerId?: PlayerID;
  roomId?: string;
  role?: "black" | "white";
};

export class GameWebSocketHandler {
  private connections = new Map<WebSocket, ConnectionContext>();

  constructor(
    private wss: WebSocketServer,
    private roomManager: RoomManager,
  ) {
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.wss.on("connection", (ws) => {
      const ctx: ConnectionContext = {};
      this.connections.set(ws, ctx);

      ws.on("message", (data) => this.handleMessage(ws, data));
      ws.on("close", () => this.handleDisconnect(ws));
      ws.on("error", (err) => this.handleError(ws, err));

      this.sendSystemMessage(ws, "CONNECTED", "成功连接到游戏服务器");
    });
  }

  private async handleMessage(ws: WebSocket, data: WebSocket.Data) {
    const ctx = this.connections.get(ws)!;

    try {
      const message = this.parseMessage(data);
      switch (message.type) {
        case "create_room":
          await this.handleCreateRoom(ws, message);
          break;

        case "join_room":
          await this.handleJoinRoom(ws, message, ctx);
          break;

        case "move":
          await this.handlePlayerMove(ws, message, ctx);
          break;

        case "reconnect":
          await this.handleReconnect(ws, message, ctx);
          break;

        case "chat":
          this.handleChatMessage(ws, message, ctx);
          break;

        default:
          throw new Error("未知消息类型");
      }
    } catch (error) {
      this.sendError(ws, "INVALID_MESSAGE", error.message);
    }
  }

  private async handleCreateRoom(
    ws: WebSocket,
    msg: ClientMessage<"create_room">,
  ) {
    const { roomId, room } = this.roomManager.createRoom();
    const playerId = this.generatePlayerId();
    const result = room.joinPlayer(ws, playerId, msg.playerName);

    if (!result) {
      throw new Error("创建房间失败");
    }

    const ctx = this.connections.get(ws)!;
    Object.assign(ctx, {
      playerId,
      roomId,
      role: result,
    });

    this.send(ws, {
      type: "room_created",
      roomId,
      playerId,
      role: result,
    });
  }

  private async handleJoinRoom(
    ws: WebSocket,
    msg: ClientMessage<"join_room">,
    ctx: ConnectionContext,
  ) {
    const result = this.roomManager.joinRoom(
      msg.roomId,
      msg.playerId,
      ws,
      msg.playerName,
    );

    if ("error" in result) {
      throw new Error(result.error.message);
    }

    Object.assign(ctx, {
      playerId: msg.playerId,
      roomId: msg.roomId,
      role: result.role,
    });

    this.send(ws, {
      type: "room_joined",
      roomId: msg.roomId,
      role: result.role,
    });
  }

  private async handlePlayerMove(
    ws: WebSocket,
    msg: ClientMessage<"move">,
    ctx: ConnectionContext,
  ) {
    if (!ctx.roomId || !ctx.playerId) {
      throw new Error("玩家未加入房间");
    }

    const room = this.getValidRoom(ctx.roomId);
    const error = await room.handleMove(ctx.playerId, msg.position);

    if (error) {
      this.sendError(ws, error.code, error.message);
    }
  }

  private async handleReconnect(
    ws: WebSocket,
    msg: ClientMessage<"reconnect">,
    ctx: ConnectionContext,
  ) {
    const prevConnection = [...this.connections.entries()].find(
      ([_, c]) => c.playerId === msg.playerId,
    )?.[0];

    if (prevConnection) {
      prevConnection.close(); // 断开旧连接
      this.connections.delete(prevConnection);
    }

    const room = this.getValidRoom(msg.roomId);
    const fullState = room.getFullState();

    Object.assign(ctx, {
      playerId: msg.playerId,
      roomId: msg.roomId,
      role: msg.role,
    });

    this.send(ws, fullState);
  }

  private handleChatMessage(
    ws: WebSocket,
    msg: ClientMessage<"chat">,
    ctx: ConnectionContext,
  ) {
    if (!ctx.roomId) return;

    const room = this.rooms.get(ctx.roomId);
    room?.broadcast({
      type: "chat",
      from: ctx.playerId!,
      message: msg.content,
      timestamp: Date.now(),
    });
  }

  private handleDisconnect(ws: WebSocket) {
    const ctx = this.connections.get(ws);
    if (!ctx?.playerId) return;

    this.roomManager.handleDisconnect(ctx.playerId);
    this.connections.delete(ws);
  }

  private getValidRoom(roomId: string): GameRoom {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error("房间不存在或已关闭");
    }
    return room;
  }

  private parseMessage(data: WebSocket.Data): ClientMessage {
    try {
      const message = JSON.parse(data.toString());
      if (!message.type) throw new Error("缺失消息类型");
      return message as ClientMessage;
    } catch (err) {
      throw new Error("无效的消息格式");
    }
  }

  private sendSystemMessage(ws: WebSocket, code: string, message: string) {
    this.send(ws, {
      type: "system",
      code,
      message,
      timestamp: Date.now(),
    });
  }

  private sendError(ws: WebSocket, code: string, message: string) {
    this.send(ws, {
      type: "error",
      code,
      message,
    });
  }

  private send(ws: WebSocket, message: ServerMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private generatePlayerId(): PlayerID {
    return `player_${uuidv4().substr(0, 8)}`;
  }

  // 类型守卫
  private get rooms() {
    return this.roomManager.rooms;
  }
}
```

### 核心功能分解

1. **连接生命周期管理**：

```typescript
// 连接状态跟踪
private connections = new Map<WebSocket, ConnectionContext>();

// 事件处理结构
setupEventHandlers() {
  this.wss.on("connection", (ws) => {
    // 初始化上下文
    // 绑定消息处理器
  });
}
```

2. **消息类型处理架构**：

```typescript
switch (message.type) {
  case "create_room": /* 处理创建房间 */
  case "join_room": /* 处理加入房间 */
  case "move": /* 处理落子操作 */
  case "reconnect": /* 断线重连处理 */
  case "chat": /* 聊天消息路由 */
}
```

3. **重连处理机制**：

```typescript
// 典型重连处理流程
handleReconnect() {
  // 1. 查找旧连接
  // 2. 替换连接上下文
  // 3. 发送完整状态
}
```

### 客户端消息示例

**创建房间**：

```json
{
  "type": "create_room",
  "playerName": "Alice"
}
```

**加入房间**：

```json
{
  "type": "join_room",
  "roomId": "A3F9",
  "playerId": "player_123",
  "playerName": "Bob"
}
```

**发送移动**：

```json
{
  "type": "move",
  "playerId": "player_123",
  "position": [7, 7]
}
```

**断线重连**：

```json
{
  "type": "reconnect",
  "roomId": "A3F9",
  "playerId": "player_123",
  "role": "black"
}
```

### 集成方式

```typescript
// 启动服务示例
import { WebSocketServer } from "ws";
import { RoomManager } from "../rooms/RoomManager";

const wss = new WebSocketServer({ port: 8080 });
const roomManager = new RoomManager();
new GameWebSocketHandler(wss, roomManager);
```

### 安全增强措施

1. **连接指纹验证**：

```typescript
// 在加入房间时验证玩家身份
joinRoom() {
  if (ctx.playerId !== msg.playerId) {
    throw new Error("身份验证失败");
  }
}
```

2. **速率限制**：

```typescript
// 添加移动操作限速
private moveCooldown = new Map<PlayerID, number>();

handlePlayerMove() {
  const lastMove = this.moveCooldown.get(ctx.playerId);
  if (lastMove && Date.now() - lastMove < 1000) {
    throw new Error("操作过于频繁");
  }
  this.moveCooldown.set(ctx.playerId, Date.now());
}
```

3. **消息加密验证**：

```typescript
// 使用JWT验证关键操作
verifyAuthToken(token: string) {
  // 实际生产应使用jwt.verify
  return jwt.verify(token, SECRET_KEY);
}
```

该处理器实现了完整的游戏通信协议，建议配合前序模块构成完整的服务器端架构，最后通过Nginx等反向代理暴露服务即可运行完整的五子棋对战系统。
