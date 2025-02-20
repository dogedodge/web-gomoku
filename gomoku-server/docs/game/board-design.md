以下是一个基于前面架构设计的 `Board` 类实现示例，包含核心棋子管理和胜利判定功能：

```typescript
// src/game/Board.ts

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
```

### 关键功能说明

1. **坐标系统**：

```typescript
// 使用从 0 开始的索引坐标系统：
// (0,0) → (14,14) 对应棋盘左上到右下
```

2. **胜利判断优化**：

- 聚焦最后落子的位置
- 仅检查四个主要方向
  Makefile

3. **调试方法**：

```typescript
/* 示例输出：
   0 1 2 3 4 5 6 7 8 9 10 11 12 13 14
0 · · · · · · · · · · · · · · ·
1 · · · · · · · · · ● · · · · ·
2 · · · · · · ● · ● · · · · · ·
3 · · · · · ● · ● · · · · · · ·
4 · · · · ● · · · · · · · · · ·
5 · · · · · · · · · · · · · · ·
*/
```

4. **使用示例**：

```typescript
const board = new Board();

// 黑棋（玩家1）下在中央
board.placeStone(7, 7, 1);

// 白棋（玩家2）下方回应
board.placeStone(7, 8, 2);

// 检查胜利状态
console.log(board.checkWinner()); // → null

// 模拟五连珠
[
  [8, 7],
  [9, 7],
  [10, 7],
  [11, 7],
].map((pos) => board.placeStone(pos[0], pos[1], 1));

console.log(board.checkWinner()); // → 1
```

### 扩展建议

1. 添加 **禁手规则**（适合专业五子棋）：

```typescript
class TournamentBoard extends Board {
  // 添加三三禁手、四四禁手等专业规则检查
  isForbiddenMove(x: number, y: number, player: 1): boolean {
    // 实现复杂禁手判断逻辑
  }
}
```

2. **历史追溯**：

```typescript
class HistoryBoard extends Board {
  private moveHistory: Array<[number, number]> = [];

  placeStone(x: number, y: number, player: 1 | 2): boolean {
    const success = super.placeStone(x, y, player);
    if (success) this.moveHistory.push([x, y]);
    return success;
  }

  undoLastMove(): void {
    if (this.moveHistory.length === 0) return;
    const [x, y] = this.moveHistory.pop()!;
    this.grid[x][y] = 0;
  }
}
```

3. **优化存储**（大棋盘时）：

```typescript
// 使用 TypedArray 节省内存
class CompressedBoard {
  private grid: Uint8Array;

  constructor(size = 15) {
    this.grid = new Uint8Array(size * size);
  }

  // 通过索引计算访问元素
  getCell(x: number, y: number): number {
    return this.grid[x * this.size + y];
  }
}
```

这个棋盘类实现了五子棋的核心逻辑，可以作为游戏服务端的基础。实际使用中需要配合前文中的 `GameRoom` 和 `RuleChecker` 类共同工作，建议通过单元测试确保各边界条件的正确性。
