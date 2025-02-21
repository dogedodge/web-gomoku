// types.ts

type PlayerRole = "host" | "guest";
interface PlayerInfo {
  id: string;
  name: string;
  role: PlayerRole;
  ready: boolean;
}

export type GameStatus =
  | "waiting_players"
  | "countdown"
  | "playing"
  | "finished";

type WsMessageType = "SYNC" | "CHAT" | "ROOM_UPDATE";

interface BaseWsMessage<T extends WsMessageType> {
  type: T;
  timestamp: number;
  payload: object;
}

interface BoardSyncMessage extends BaseWsMessage<"SYNC"> {
  payload: {
    board: string[][];
    currentPlayer: string;
    sequence: number;
  };
}

interface RoomUpdateMessage extends BaseWsMessage<"ROOM_UPDATE"> {
  payload: {
    roomCode: string;
    status: string;
    players: PlayerInfo[];
  };
}

interface ChatMessage extends BaseWsMessage<"CHAT"> {
  payload: {
    senderId: string;
    message: string;
  };
}

export type WsMessage = BoardSyncMessage | RoomUpdateMessage | ChatMessage;

type RoomMode = "create" | "join";

export interface RoomFormProps {
  initialMode: RoomMode;
  onCreateRoom: (config: { maxPlayers?: number; password?: string }) => void;
  onJoinRoom: (roomId: string, password?: string) => void;
}
