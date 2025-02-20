export class Board {
  private size: number;
  private grid: number[][];
  private lastMove: [number, number] | null = null;

  constructor(size = 15) {
    this.size = size;
    // 初始化空棋盘 (0=空, 1=黑棋, 2=白棋)
    this.grid = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => 0),
    );
  }

  /**
   * 放置棋子
   * @returns 是否成功放置
   */
  placeStone(x: number, y: number, player: 1 | 2): boolean {
    if (!this.isValidPosition(x, y) || this.grid[x][y] !== 0) {
      return false;
    }

    this.grid[x][y] = player;
    this.lastMove = [x, y];
    return true;
  }

  /**
   * 检查位置有效性
   */
  isValidPosition(x: number, y: number): boolean {
    return x >= 0 && x < this.size && y >= 0 && y < this.size;
  }

  /**
   * 检查是否获胜
   * @returns 胜方（1/2）或 null
   */
  checkWinner(): 1 | 2 | null {
    if (!this.lastMove) return null;

    const [x, y] = this.lastMove;
    const player = this.grid[x][y] as 1 | 2;

    // 四个检查方向（右、下、右下、左下）
    const directions: [number, number][] = [
      [1, 0], // 水平
      [0, 1], // 垂直
      [1, 1], // 正斜线
      [1, -1], // 反斜线
    ];

    for (const [dx, dy] of directions) {
      let consecutive = 1;

      // 正向检测
      for (let step = 1; step <= 5; step++) {
        const nx = x + dx * step;
        const ny = y + dy * step;
        if (this.grid[nx]?.[ny] !== player) break;
        consecutive++;
      }

      // 反向检测
      for (let step = 1; step <= 5; step++) {
        const nx = x - dx * step;
        const ny = y - dy * step;
        if (this.grid[nx]?.[ny] !== player) break;
        consecutive++;
      }

      if (consecutive >= 5) return player;
    }

    return null;
  }

  /**
   * 获取当前棋盘快照（可用于序列化和状态恢复）
   */
  getBoardSnapshot(): number[][] {
    return this.grid.map((row) => [...row]);
  }

  /**
   * 重置棋盘状态
   */
  reset(): void {
    this.grid = Array.from({ length: this.size }, () =>
      Array.from({ length: this.size }, () => 0),
    );
    this.lastMove = null;
  }

  /**
   * 打印文本棋盘（调试用）
   */
  debugPrint(): void {
    const symbols = ["·", "●", "○"];
    console.log("  " + [...Array(this.size).keys()].join(" "));

    this.grid.forEach((row, i) => {
      console.log(
        i.toString().padStart(2, " ") +
          " " +
          row.map((cell) => symbols[cell]).join(" "),
      );
    });
  }
}
