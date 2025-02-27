// src/game/RuleChecker.ts
import type { Coord } from "../types/messages";

type PlayerStone = 1 | 2;
export type WinResult = {
  winner: PlayerStone;
  positions: Coord[];
} | null;

interface Direction {
  dx: number;
  dy: number;
}

export class RuleChecker {
  private readonly WINNING_COUNT = 5;
  private directions: Direction[] = [
    { dx: 1, dy: 0 }, // 水平方向
    { dx: 0, dy: 1 }, // 垂直方向
    { dx: 1, dy: 1 }, // 正对角线
    { dx: 1, dy: -1 }, // 反对角线
  ];

  /**
   * 检查是否达成胜利条件
   * @param boardState - 当前棋盘状态
   * @param lastMove - 最后落子位置
   * @returns 胜利信息或 null
   */
  checkWinCondition(boardState: (0 | 1 | 2)[][], lastMove: Coord): WinResult {
    const [x, y] = lastMove;
    const player = boardState[x][y];

    // 防御性检查
    if (
      typeof player !== "number" ||
      player === 0 ||
      !this.isValidCoordinate(x, y, boardState)
    ) {
      return null;
    }

    // 扫描四个主要方向
    for (const { dx, dy } of this.directions) {
      const line = this.scanLine(x, y, dx, dy, player, boardState);

      if (line.length >= this.WINNING_COUNT) {
        return {
          winner: player as PlayerStone,
          positions: this.trimToWinningSegment(line),
        };
      }
    }

    return null;
  }

  /**
   * 局部扫描延伸线段
   */
  private scanLine(
    startX: number,
    startY: number,
    dirX: number,
    dirY: number,
    player: number,
    board: (0 | 1 | 2)[][],
  ): Coord[] {
    const line: Coord[] = [];

    // 双向扫描 (+/- 方向)
    for (let sign = -1; sign <= 1; sign += 2) {
      let currentX = startX;
      let currentY = startY;

      while (this.isValidCoordinate(currentX, currentY, board)) {
        if (board[currentX][currentY] !== player) break;

        // 记录连续棋子坐标
        const point: Coord = [currentX, currentY];
        if (sign === 1) {
          line.push(point);
        } else {
          line.unshift(point); // 逆序插入保持坐标顺序
        }

        currentX += dirX * sign;
        currentY += dirY * sign;
      }
    }

    return line.slice(1); // 移除重复的起点
  }

  /**
   * 截取实际获胜段 (保护连珠)
   */
  private trimToWinningSegment(line: Coord[]): Coord[] {
    if (line.length < this.WINNING_COUNT) return [];

    // 寻找连续5子核心段
    for (let i = 0; i <= line.length - this.WINNING_COUNT; i++) {
      const segment = line.slice(i, i + this.WINNING_COUNT);
      if (this.isContinuous(segment)) {
        return segment;
      }
    }
    return [];
  }

  /**
   * 验证坐标是否为真实连续的5连
   */
  private isContinuous(segment: Coord[]): boolean {
    // 检查X轴方向连续性
    const isHorizontal = segment.every(
      ([x], i) => i === 0 || x === segment[i - 1][0] + 1,
    );

    // 检查Y轴方向连续性
    const isVertical = segment.every(
      ([_, y], i) => i === 0 || y === segment[i - 1][1] + 1,
    );

    // 检查正对角线
    const isDiagonal1 = segment.every(
      ([x, y], i) =>
        i === 0 || (x === segment[i - 1][0] + 1 && y === segment[i - 1][1] + 1),
    );

    // 检查反对角线
    const isDiagonal2 = segment.every(
      ([x, y], i) =>
        i === 0 || (x === segment[i - 1][0] + 1 && y === segment[i - 1][1] - 1),
    );

    return isHorizontal || isVertical || isDiagonal1 || isDiagonal2;
  }

  /**
   * 校验坐标是否合法
   */
  private isValidCoordinate(
    x: number,
    y: number,
    board: (0 | 1 | 2)[][],
  ): boolean {
    return x >= 0 && y >= 0 && x < board.length && y < board[0]?.length;
  }
}
