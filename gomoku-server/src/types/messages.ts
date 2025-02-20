// src/types/messages.ts

/********************
 * 基础类型定义
 ********************/
export type Coord = [number, number]; // 棋盘坐标[x,y]
type StoneType = "black" | "white";
export type PlayerID = string;

/********************
 * 客户端发送消息类型
 ********************/
export type ClientMessage =
  | CreateRoomMessage
  | JoinRoomMessage
  | PlaceStoneMessage
  | RequestUndoMessage
  | RespondUndoMessage
  | HeartbeatMessage;

export interface BaseClientMessage {
  type: string;
  room_id?: string; // 大部分操作需要房间ID
  player_id?: PlayerID; // 部分操作需要玩家ID
}

// 创建房间
export interface CreateRoomMessage extends BaseClientMessage {
  type: "create_room";
  player_name: string;
}

// 加入房间
export interface JoinRoomMessage extends BaseClientMessage {
  type: "join_room";
  room_id: string; // 覆盖基类可选定义
  player_name: string;
}

// 落子操作
export interface PlaceStoneMessage extends BaseClientMessage {
  type: "place_stone";
  room_id: string;
  player_id: PlayerID;
  position: Coord;
}

// 悔棋请求
export interface RequestUndoMessage extends BaseClientMessage {
  type: "request_undo";
  room_id: string;
  player_id: PlayerID;
}

// 悔棋响应
export interface RespondUndoMessage extends BaseClientMessage {
  type: "respond_undo";
  room_id: string;
  player_id: PlayerID;
  accept: boolean;
}

// 心跳检测
export interface HeartbeatMessage {
  type: "ping";
}

/********************
 * 服务端发送消息类型
 ********************/
export type ServerMessage =
  | WelcomeMessage
  | RoomCreatedMessage
  | JoinSuccessMessage
  | ErrorMessage
  | GameStartMessage
  | StonePlacedMessage
  | GameOverMessage
  | UndoRequestedMessage
  | FullStateMessage
  | OpponentLeftMessage
  | HeartbeatResponseMessage;

export interface BaseServerMessage {
  type: string;
  timestamp?: number; // 可选时间戳
}

// 连接欢迎消息
export interface WelcomeMessage extends BaseServerMessage {
  type: "welcome";
  message: string;
}

// 房间创建成功
export interface RoomCreatedMessage extends BaseServerMessage {
  type: "room_created";
  room_id: string;
  player_id: PlayerID;
  expire_time: number;
}

// 加入房间成功
export interface JoinSuccessMessage extends BaseServerMessage {
  type: "join_success";
  player_id: PlayerID;
  opponent_name: string;
}

// 错误消息
export type ErrorCode =
  | "ROOM_NOT_FOUND"
  | "ROOM_FULL"
  | "INVALID_MOVE"
  | "NOT_YOUR_TURN"
  | "GAME_ALREADY_ENDED"
  | "INVALID_ACTION"
  | "SYSTEM_BUSY"
  | "GAME_NOT_STARTED";

export interface ErrorMessage extends BaseServerMessage {
  type: "error";
  code: ErrorCode;
  message: string;
}

// 游戏开始通知
export interface GameStartMessage extends BaseServerMessage {
  type: "game_start";
  black_player: string;
  white_player: string;
  current_turn: PlayerID;
}

// 落子广播
export interface StonePlacedMessage extends BaseServerMessage {
  type: "stone_placed";
  // room_id: string;
  player_id: PlayerID;
  position: Coord;
  next_turn: PlayerID | null;
  board_state?: string; // 可选压缩棋盘状态
}

// 游戏结束
export type WinReason = "FIVE_IN_ROW" | "RESIGNATION" | "DRAW" | "TIMEOUT";

export interface GameOverMessage extends BaseServerMessage {
  type: "game_over";
  winner: PlayerID | null;
  win_reason: WinReason;
  win_positions?: Coord[]; // 五连珠的具体坐标
}

// 悔棋请求通知
export interface UndoRequestedMessage extends BaseServerMessage {
  type: "undo_requested";
  requester: PlayerID;
}

// 完整状态同步（重连用）
export interface FullStateMessage extends BaseServerMessage {
  type: "full_state";
  current_turn: PlayerID;
  board: Array<Array<0 | 1 | 2>>; // 0:空 1:黑 2:白
  move_history: Array<{
    player: PlayerID;
    position: Coord;
    timestamp: number;
  }>;
}

// 对手离线通知
export interface OpponentLeftMessage extends BaseServerMessage {
  type: "opponent_left";
  reason: "disconnected" | "left";
}

// 心跳响应
export interface HeartbeatResponseMessage extends BaseServerMessage {
  type: "pong";
  timestamp: number;
}

/********************
 * 辅助类型
 ********************/
// 消息类型联合（用于类型守卫）
export type MessageType = ClientMessage["type"] | ServerMessage["type"];

// 类型映射工具类型
export type MessageOfType<T extends MessageType> =
  T extends ClientMessage["type"]
    ? ClientMessage
    : T extends ServerMessage["type"]
      ? ServerMessage
      : never;
