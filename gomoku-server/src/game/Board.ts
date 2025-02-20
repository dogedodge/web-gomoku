import { Coord } from "../types/messages";

// src/game/Board.ts
export class Board {
  private grid: Array<Array<0 | 1 | 2>>;
  private lastMove: Coord | null = null;

  constructor(private size: number = 15) {
    this.grid = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => 0),
    );
  }

  placeStone(x: number, y: number, player: 1 | 2): boolean {
    if (!this.isValidPosition(x, y) || this.grid[x][y] !== 0) {
      return false;
    }
    this.grid[x][y] = player;
    this.lastMove = [x, y];
    return true;
  }

  isValidPosition(x: number, y: number): boolean {
    return x >= 0 && x < this.size && y >= 0 && y < this.size;
  }

  getBoardState(): Array<Array<0 | 1 | 2>> {
    return this.grid.map((row) => [...row]);
  }

  getCompressedState(): string {
    // 使用简单压缩算法：每行用数字字符串表示
    return this.grid.map((row) => row.join("")).join(";");
  }

  getLastMove(): Coord | null {
    return this.lastMove;
  }

  reset() {
    this.grid = Array.from({ length: this.size }, () =>
      Array.from({ length: this.size }, () => 0),
    );
    this.lastMove = null;
  }
}
