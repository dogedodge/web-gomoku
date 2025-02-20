// src/websocket/handlers.ts
import { WebSocketServer, WebSocket, RawData } from "ws";
import { RoomManager } from "../rooms/RoomManager";
import { GameRoom } from "../rooms/GameRoom";
import {
  ServerMessage,
  ClientMessage,
  PlayerID,
  CreateRoomMessage,
  JoinRoomMessage,
  ErrorMessage,
  PlaceStoneMessage,
  ErrorCode,
} from "../types/messages";
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

  private async handleMessage(ws: WebSocket, data: RawData) {
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

        case "place_stone":
          await this.handlePlayerMove(ws, message, ctx);
          break;

        // case "reconnect":
        //   await this.handleReconnect(ws, message, ctx);
        //   break;

        // case "chat":
        //   this.handleChatMessage(ws, message, ctx);
        //   break;

        default:
          throw new Error("未知消息类型");
      }
    } catch (error) {
      if (error instanceof Error) {
        this.sendError(ws, "INVALID_MESSAGE", error.message);
      } else {
        this.sendError(ws, "INVALID_MESSAGE", String(error));
      }
    }
  }

  private async handleCreateRoom(ws: WebSocket, msg: CreateRoomMessage) {
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
    msg: JoinRoomMessage,
    ctx: ConnectionContext,
  ) {
    const result = this.roomManager.joinRoom(
      msg.roomId,
      msg.playerId!,
      ws,
      msg.playerName,
    );

    if ("error" in result) {
      throw new Error((result.error as ErrorMessage).message);
    }

    Object.assign(ctx, {
      playerId: msg.playerId,
      roomId: msg.roomId,
      role: result.role,
    });

    this.send(ws, {
      type: "join_success",
      playerId: msg.playerId!,
      roomId: msg.roomId,
      role: result.role,
    });
  }

  private async handlePlayerMove(
    ws: WebSocket,
    msg: PlaceStoneMessage,
    ctx: ConnectionContext,
  ) {
    if (!ctx.roomId || !ctx.playerId) {
      throw new Error("玩家未加入房间");
    }

    const room = this.getValidRoom(ctx.roomId);
    const error = await room.handleMove(ctx.playerId, msg.position);

    if (error) {
      if (error instanceof Error) {
        this.sendError(ws, error.code, error.message);
      } else {
        this.sendError(ws, "UNKNOWN_ERROR", String(error));
      }
    }
  }

  // private async handleReconnect(
  //   ws: WebSocket,
  //   msg: ClientMessage<"reconnect">,
  //   ctx: ConnectionContext
  // ) {
  //   const prevConnection = [...this.connections.entries()]
  //     .find(([_, c]) => c.playerId === msg.playerId)?.[0];

  //   if (prevConnection) {
  //     prevConnection.close(); // 断开旧连接
  //     this.connections.delete(prevConnection);
  //   }

  //   const room = this.getValidRoom(msg.roomId);
  //   const fullState = room.getFullState();

  //   Object.assign(ctx, {
  //     playerId: msg.playerId,
  //     roomId: msg.roomId,
  //     role: msg.role
  //   });

  //   this.send(ws, fullState);
  // }

  // private handleChatMessage(
  //   ws: WebSocket,
  //   msg: ClientMessage<"chat">,
  //   ctx: ConnectionContext
  // ) {
  //   if (!ctx.roomId) return;

  //   const room = this.rooms.get(ctx.roomId);
  //   room?.broadcast({
  //     type: "chat",
  //     from: ctx.playerId!,
  //     message: msg.content,
  //     timestamp: Date.now()
  //   });
  // }

  private handleDisconnect(ws: WebSocket) {
    const ctx = this.connections.get(ws);
    if (!ctx?.playerId) return;

    this.roomManager.handleDisconnect(ctx.playerId);
    this.connections.delete(ws);
  }

  private handleError(ws: WebSocket, err: Error) {
    console.error(`WebSocket error: ${err.message}`);
    if (err instanceof Error) {
      this.sendError(ws, "SERVER_ERROR", `服务器错误: ${err.message}`);
    } else {
      this.sendError(ws, "SERVER_ERROR", String(err));
    }
  }

  private getValidRoom(roomId: string): GameRoom {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error("房间不存在或已关闭");
    }
    return room;
  }

  private parseMessage(data: RawData): ClientMessage {
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
      type: "welcome",
      message,
      timestamp: Date.now(),
    });
  }

  private sendError(ws: WebSocket, code: ErrorCode, message: string) {
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
    return this.roomManager.getRooms();
  }
}
