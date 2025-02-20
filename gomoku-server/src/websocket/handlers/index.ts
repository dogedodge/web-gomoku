// src/websocket/handlers/index.ts
import { roomManager } from "../../rooms/RoomManager";
// import { GameRoom } from "../../rooms/GameRoom";
import { WebSocket } from "ws";
// import { ClientMessage } from "../../types/messages";

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
