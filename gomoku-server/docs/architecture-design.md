针对个人项目的简化实现方案，以下是推荐架构设计：

---

### 项目结构

```bash
src/
├── server.ts          # 入口文件
├── rooms/             # 房间管理模块
│   ├── RoomManager.ts # 房间管理器
│   └── GameRoom.ts    # 单个房间类
├── websocket/
│   ├── WSServer.ts    # WebSocket服务封装
│   └── handlers/      # 消息处理器
├── game/
│   ├── RuleChecker.ts # 胜负判定逻辑
│   └── Board.ts       # 棋盘状态管理
└── types/
    └── messages.ts    # 消息类型定义
```

---

### 核心模块设计

#### 1. WebSocket 服务 (WSServer.ts)

```typescript
import WebSocket, { WebSocketServer } from "ws";

class WSServer {
  private wss: WebSocket.Server;

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.setupHandlers();
  }

  private setupHandlers() {
    this.wss.on("connection", (ws) => {
      ws.on("message", (raw) => this.handleMessage(raw, ws));
      ws.on("close", () => this.handleDisconnect(ws));
    });
  }

  private async handleMessage(raw: string, ws: WebSocket) {
    try {
      const message: ClientMessage = JSON.parse(raw);
      // 使用策略模式路由到对应的处理器
      const handler = getHandler(message.type);
      await handler(message.data, ws);
    } catch (err) {
      this.sendError(ws, err);
    }
  }
}
```

---

#### 2. 房间管理 (RoomManager.ts)

```typescript
class RoomManager {
  private rooms = new Map<string, GameRoom>();
  private playerRoomMap = new Map<string, string>(); // 玩家ID -> 房间ID

  createRoom(playerId: string): GameRoom {
    const roomId = generateShortId(); // 生成4位字母数字组合
    const room = new GameRoom(roomId);
    this.rooms.set(roomId, room);
    this.playerRoomMap.set(playerId, roomId);
    return room;
  }

  getRoomByPlayer(playerId: string): GameRoom | null {
    const roomId = this.playerRoomMap.get(playerId);
    return roomId ? this.rooms.get(roomId) : null;
  }
}

// 单例模式导出
export const roomManager = new RoomManager();
```

---

#### 3. 游戏房间 (GameRoom.ts)

```typescript
class GameRoom {
  public board: Board;
  private players = {
    black?: WebSocket,
    white?: WebSocket
  };

  constructor(
    public readonly id: string,
    private size = 15
  ) {
    this.board = new Board(size);
  }

  joinPlayer(ws: WebSocket, role: 'black' | 'white') {
    this.players[role] = ws;
    this.broadcastState();
  }

  handleMove(x: number, y: number, playerRole: 'black' | 'white') {
    if (!this.board.isValidMove(x, y)) throw new Error('Invalid position');

    this.board.placeStone(x, y, playerRole);
    const winner = this.checkWinner();

    this.broadcast({
      type: 'stone_placed',
      data: { x, y, role: playerRole, nextPlayer: playerRole === 'black' ? 'white' : 'black' }
    });

    if (winner) {
      this.handleGameOver(winner);
    }
  }

  private broadcast(message: ServerMessage) {
    Object.values(this.players).forEach(ws => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }
}
```

---

#### 4. 游戏规则校验 (RuleChecker.ts)

```typescript
class RuleChecker {
  checkWinner(
    board: number[][],
    lastMove: [number, number],
  ): "black" | "white" | null {
    const [x, y] = lastMove;
    const stone = board[x][y];

    // 检查四个方向：横向、纵向、斜对角
    const directions = [
      [
        [1, 0],
        [-1, 0],
      ], // 横向
      [
        [0, 1],
        [0, -1],
      ], // 纵向
      [
        [1, 1],
        [-1, -1],
      ], // 正斜
      [
        [1, -1],
        [-1, 1],
      ], // 反斜
    ];

    for (const [d1, d2] of directions) {
      const line =
        this.checkDirection(board, x, y, d1) +
        this.checkDirection(board, x, y, d2) +
        1;
      if (line >= 5) return stone === 1 ? "black" : "white";
    }
    return null;
  }

  private checkDirection(
    board: number[][],
    x: number,
    y: number,
    [dx, dy]: number[],
  ): number {
    // ...具体实现方向检查
  }
}
```

---

### 关键技术选择

1. **通信协议**：使用原生WebSocket（ws库）保持轻量
2. **状态存储**：内存存储（适合个人项目，定期清理过期房间）
3. **并发控制**：Redis可以省略，使用简单锁机制：

```typescript
// 在GameRoom中添加
private moveLock = false;

async handleMove(...) {
  if (this.moveLock) return;
  this.moveLock = true;
  try {
    // ...处理逻辑
  } finally {
    this.moveLock = false;
  }
}
```

---

### 开发依赖推荐

```json
{
  "dependencies": {
    "ws": "^8.13.0",
    "uuid": "^9.0.0",
    "typescript": "^5.0.4"
  },
  "devDependencies": {
    "@types/ws": "^8.5.5",
    "ts-node": "^10.9.1",
    "nodemon": "^3.0.1"
  }
}
```

---

### 简化路线图

1. 基础通信搭建 (1天)

   - WebSocket连接管理
   - 房间创建/加入
   - 心跳检测

2. 核心游戏逻辑 (2天)

   - 棋盘状态管理
   - 落子校验
   - 单方向胜利判断

3. 增强功能 (1天)

   - 游戏重开
   - 认输处理
   - 错误提示

4. 基础界面联调 (可选，使用任何前端框架)

---

### 注意事项

1. 防内存泄漏：每小时清理超过12小时无活动的房间

```typescript
setInterval(() => {
  roomManager.cleanStaleRooms(12 * 3600 * 1000);
}, 3600 * 1000);
```

2. 部署建议：使用PM2启动（自带WebSocket支持）

```bash
pm2 start ./dist/server.js
```

3. 测试策略：优先开发手动测试工具：

```typescript
// 快速测试脚本
const ws1 = new WebSocket("ws://localhost:3000");
ws1.on("open", () => {
  ws1.send(
    JSON.stringify({
      type: "create_room",
      data: { player_name: "Tester1" },
    }),
  );
});
```

这个架构在保持简单的前提下实现了核心功能，能够方便地进行后续扩展（如：加入观战模式、禁手规则等）。如果需要持久化功能，后续可以添加 MongoDB 或 Redis 支持。
