// src/rooms/GameRoom.ts
import WebSocket from "ws";
import { Board } from "../game/Board";
import { RuleChecker, WinResult } from "../game/RuleChecker";
import {
  ServerMessage,
  ErrorMessage,
  PlayerID,
  Coord,
  PlayerRole,
} from "../types/messages";

// type PlayerRole = "black" | "white";

export class GameRoom {
  private board: Board;
  private ruleChecker: RuleChecker;
  private players: {
    black?: { ws: WebSocket; id: PlayerID; name: string };
    white?: { ws: WebSocket; id: PlayerID; name: string };
  } = {};
  private moveHistory: Array<{
    player: PlayerID;
    position: Coord;
    timestamp: number;
  }> = [];
  private lastActivity = Date.now();
  private gameStarted = false;
  private isGameEnded = false;
  private moveLock = false;

  constructor(
    public readonly id: string,
    private size = 15,
  ) {
    this.board = new Board(size);
    this.ruleChecker = new RuleChecker();
  }

  // 玩家加入房间
  joinPlayer(
    ws: WebSocket,
    playerId: PlayerID,
    playerName: string,
  ): PlayerRole | null {
    if (!this.players.black) {
      this.players.black = { ws, id: playerId, name: playerName };
      this.updateActivity();
      return "black";
    }
    if (!this.players.white) {
      this.players.white = { ws, id: playerId, name: playerName };
      this.updateActivity();
      this.startGame();
      return "white";
    }
    return null;
  }

  // 处理落子操作
  async handleMove(
    playerId: PlayerID,
    position: Coord,
  ): Promise<ErrorMessage | null> {
    if (this.moveLock) {
      return {
        type: "error",
        code: "SYSTEM_BUSY",
        message: "Server is processing another move",
      };
    }
    this.moveLock = true;

    try {
      // 验证游戏状态
      if (!this.gameStarted)
        return this.createError("GAME_NOT_STARTED", "Game has not started");
      const boardLastMove = this.board.getLastMove();
      if (
        boardLastMove &&
        this.ruleChecker.checkWinCondition(
          this.board.getBoardState(),
          boardLastMove,
        )
      )
        return this.createError("GAME_ALREADY_ENDED", "Game has ended");

      // 验证玩家身份
      const currentPlayer = this.getCurrentPlayer();
      if (currentPlayer?.id !== playerId) {
        return this.createError("NOT_YOUR_TURN", "It is not your turn to move");
      }

      // 执行落子
      const [x, y] = position;
      if (
        !this.board.placeStone(x, y, currentPlayer.role === "black" ? 1 : 2)
      ) {
        return this.createError("INVALID_MOVE", "Invalid move position");
      }

      // 记录历史
      this.moveHistory.push({
        player: playerId,
        position,
        timestamp: Date.now(),
      });

      // 检查胜负
      const winResult = this.ruleChecker.checkWinCondition(
        this.board.getBoardState(),
        position,
      );
      const nextTurn =
        currentPlayer.role === "black"
          ? this.players.white!.id
          : this.players.black!.id;

      // 广播落子结果
      this.broadcast({
        type: "stone_placed",
        playerId,
        position,
        next_turn: winResult ? null : nextTurn,
        board_state: this.board.getCompressedState(),
      });

      // 处理游戏结束
      if (winResult) {
        this.handleGameOver(winResult);
      }

      this.updateActivity();
      return null;
    } finally {
      this.moveLock = false;
    }
  }

  // 获取完整房间状态（用于断线重连）
  getFullState(): ServerMessage {
    return {
      type: "full_state",
      current_turn: this.getCurrentPlayer()?.id || "",
      board: this.board.getBoardState(),
      move_history: [...this.moveHistory],
    };
  }

  // 广播消息给所有玩家
  broadcast(message: ServerMessage) {
    [this.players.black, this.players.white].forEach((player) => {
      if (player?.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify(message));
      }
    });
  }

  private startGame() {
    this.gameStarted = true;
    this.broadcast({
      type: "game_start",
      black_player: this.players.black!.name,
      white_player: this.players.white!.name,
      current_turn: this.players.black!.id,
    });
  }

  private handleGameOver(winResult: WinResult) {
    const winnerId =
      winResult!.winner === 1 ? this.players.black!.id : this.players.white!.id;
    this.broadcast({
      type: "game_over",
      winner: winnerId,
      win_reason: "FIVE_IN_ROW",
      win_positions: winResult!.positions,
    });
    this.isGameEnded = true;
    this.cleanup();
  }

  private createError(
    code: ErrorMessage["code"],
    message: string,
  ): ErrorMessage {
    return { type: "error", code, message };
  }

  private getCurrentPlayer(): { id: PlayerID; role: PlayerRole } | null {
    if (!this.gameStarted) return null;
    const lastMove = this.moveHistory[this.moveHistory.length - 1];
    if (!lastMove) return { id: this.players.black!.id, role: "black" };
    return lastMove.player === this.players.black?.id
      ? { id: this.players.white!.id, role: "white" }
      : { id: this.players.black!.id, role: "black" };
  }

  private updateActivity() {
    this.lastActivity = Date.now();
  }

  public getLastActivity() {
    return this.lastActivity;
  }

  public cleanup() {
    [this.players.black, this.players.white].forEach((player) => {
      player?.ws.close();
    });
  }

  public handlePlayerDisconnect(playerId: string) {
    // todo

    console.log("Player disconnected: ", playerId);
  }

  public getGameStarted() {
    return this.gameStarted;
  }

  public getIsGameEnded() {
    return this.isGameEnded;
  }

  public getPlayerCount(): number {
    let playerCount = 0;
    if (this.players.black) {
      playerCount++;
    }
    if (this.players.white) {
      playerCount++;
    }
    return playerCount;
  }
}
