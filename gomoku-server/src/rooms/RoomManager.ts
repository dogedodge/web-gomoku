// src/rooms/RoomManager.ts
import { GameRoom } from "./GameRoom";
import { ServerMessage, PlayerID, ErrorCode } from "../types/messages";
import { WebSocket } from "ws";
// import { v4 as uuidv4 } from "uuid";

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
      status: room.getGameStarted()
        ? room.getIsGameEnded()
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
      if (now - room.getLastActivity() > MAX_INACTIVE_TIME) {
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
    // return room ? (room.players.black ? 1 : 0) + (room.players.white ? 1 : 0) : 0;
    return room ? room.getPlayerCount() : 0;
  }

  private createError(code: ErrorCode, message: string): ServerMessage {
    return { type: "error", code, message };
  }

  private scheduleRoomRemoval(roomId: string): void {
    setTimeout(() => {
      if (this.isRoomEmpty(roomId)) {
        this.destroyRoom(roomId);
      }
    }, 5000); // 5秒后再次检查
  }

  public getRooms() {
    return this.rooms;
  }

  public cleanUpAllRooms(): void {
    this.rooms.forEach((room, roomId) => {
      this.destroyRoom(roomId);
    });
  }
}

// export const roomManager = new RoomManager();
