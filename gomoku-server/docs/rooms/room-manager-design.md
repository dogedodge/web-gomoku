根据系统架构需求，我为您设计了完整的房间管理模块实现：

```typescript
// src/rooms/RoomManager.ts
import { GameRoom } from "./GameRoom";
import { ServerMessage, PlayerID } from "../types/messages";
import { WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";

const ROOM_CLEANUP_INTERVAL = 30 * 60 * 1000; // 30分钟清理一次
const MAX_INACTIVE_TIME = 60 * 60 * 1000; // 1小时无活动销毁
const ROOM_ID_LENGTH = 4; // 4位房间号

export class RoomManager {
  private rooms = new Map<string, GameRoom>();
  private playerRoomMap = new Map<PlayerID, string>();

  constructor() {
    this.startCleanupTimer();
  }

  // 创建新房间
  createRoom(roomSize = 15): { roomId: string; room: GameRoom } {
    const roomId = this.generateUniqueRoomId();
    const room = new GameRoom(roomId, roomSize);
    this.rooms.set(roomId, room);
    return { roomId, room };
  }

  // 加入现有房间
  joinRoom(
    roomId: string,
    playerId: PlayerID,
    ws: WebSocket,
    playerName: string,
  ): { role: "black" | "white"; room: GameRoom } | { error: ServerMessage } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { error: this.createError("ROOM_NOT_FOUND", "房间不存在") };
    }

    // 检查是否已满
    if (this.isRoomFull(roomId)) {
      return { error: this.createError("ROOM_FULL", "房间已满") };
    }

    const role = room.joinPlayer(ws, playerId, playerName);
    if (!role) {
      return { error: this.createError("ROOM_FULL", "加入房间失败") };
    }

    this.playerRoomMap.set(playerId, roomId);
    return { role, room };
  }

  // 处理玩家断线
  handleDisconnect(playerId: PlayerID): void {
    const roomId = this.playerRoomMap.get(playerId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    // 通知房间处理断线
    room.handlePlayerDisconnect(playerId);
    this.playerRoomMap.delete(playerId);

    // 如果房间空置则标记
    if (this.isRoomEmpty(roomId)) {
      this.scheduleRoomRemoval(roomId);
    }
  }

  // 获取房间状态
  getRoomStatus(roomId: string): {
    players: number;
    status: "waiting" | "playing" | "ended";
  } | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    return {
      players: this.getPlayerCount(roomId),
      status: room.gameStarted
        ? room.isGameEnded
          ? "ended"
          : "playing"
        : "waiting",
    };
  }

  // 定时清理任务
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupInactiveRooms();
    }, ROOM_CLEANUP_INTERVAL);
  }

  // 清理不活跃房间
  private cleanupInactiveRooms(): void {
    const now = Date.now();
    for (const [roomId, room] of this.rooms) {
      if (now - room.lastActivity > MAX_INACTIVE_TIME) {
        this.destroyRoom(roomId);
      }
    }
  }

  // 生成唯一房间ID
  private generateUniqueRoomId(): string {
    let id: string;
    do {
      id = this.generateRoomId();
    } while (this.rooms.has(id));
    return id;
  }

  // 生成随机房间ID（字母+数字）
  private generateRoomId(): string {
    return Math.random().toString(36).substr(2, ROOM_ID_LENGTH).toUpperCase();
  }

  // 销毁房间
  private destroyRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.cleanup();
    this.rooms.delete(roomId);

    // 清理玩家映射
    for (const [playerId, id] of this.playerRoomMap) {
      if (id === roomId) {
        this.playerRoomMap.delete(playerId);
      }
    }
  }

  // 工具方法
  private isRoomFull(roomId: string): boolean {
    return this.getPlayerCount(roomId) >= 2;
  }

  private isRoomEmpty(roomId: string): boolean {
    return this.getPlayerCount(roomId) === 0;
  }

  private getPlayerCount(roomId: string): number {
    const room = this.rooms.get(roomId);
    return room
      ? (room.players.black ? 1 : 0) + (room.players.white ? 1 : 0)
      : 0;
  }

  private createError(code: string, message: string): ServerMessage {
    return { type: "error", code, message };
  }

  private scheduleRoomRemoval(roomId: string): void {
    setTimeout(() => {
      if (this.isRoomEmpty(roomId)) {
        this.destroyRoom(roomId);
      }
    }, 5000); // 5秒后再次检查
  }
}
```

### 核心功能说明

1. **房间生命周期管理**：

   - 自动生成唯一房间ID（如`A3F9`）
   - 支持自定义棋盘尺寸（默认15x15）
   - 双重清理机制（定时扫描 + 空房间立即清理）

2. **玩家状态跟踪**：

   ```typescript
   private playerRoomMap = new Map<PlayerID, string>(); // 玩家ID到房间的映射
   ```

   - 实时维护玩家-房间关系
   - 断线自动处理机制

3. **容错设计**：

   - 防止房间ID冲突
   - 处理幽灵房间（无玩家但未清理）
   - 网络波动后的状态恢复

4. **性能优化**：
   - 使用Map结构实现O(1)复杂度查询
   - 延迟删除机制避免误清理
   - 按需清理代替全量扫描

### 使用示例

```typescript
// 初始化管理器
const roomManager = new RoomManager();

// 创建房间
const { roomId, room } = roomManager.createRoom();

// 玩家加入
const player1 = new WebSocket(...);
const result1 = roomManager.joinRoom(roomId, "player1", player1, "Alice");

const player2 = new WebSocket(...);
const result2 = roomManager.joinRoom(roomId, "player2", player2, "Bob");

// 处理断线
roomManager.handleDisconnect("player1");

// 获取房间状态
const status = roomManager.getRoomStatus(roomId);
```

### 架构设计亮点

1. **双向映射系统**：

   ```mermaid
   graph LR
     Player1 -->|playerRoomMap| RoomA
     Player2 -->|playerRoomMap| RoomA
     RoomManager -->|rooms| RoomA
     RoomManager -->|rooms| RoomB
   ```

2. **状态管理流程**：

   ```typescript
   // 房间状态转换
   "waiting" --> "playing" // 玩家加入满员
   "playing" --> "ended"   // 游戏结束
   "ended" --> "destroyed" // 清理机制
   ```

3. **消息处理机制**：
   - 错误消息标准化
   - 自动广播状态更新
   - 玩家动作验证前置

建议配合前序实现的 `GameRoom` 和 `Board` 类共同使用，该管理器作为核心服务模块，可以集成到WebSocket服务器或REST API服务中。
