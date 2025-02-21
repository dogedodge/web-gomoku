import { Board, StoneState } from "../constant";

export function checkWinner(
  board: Board,
  row: number,
  col: number,
  player: StoneState,
): boolean {
  if (!player) return false;

  const directions = [
    [1, 0], // horizontal
    [0, 1], // vertical
    [1, 1], // diagonal down
    [1, -1], // diagonal up
  ];

  const size = board.length;

  for (const [dx, dy] of directions) {
    let count = 1; // count the current piece

    // Check forward direction
    for (let i = 1; i < 5; i++) {
      const newRow = row + dx * i;
      const newCol = col + dy * i;

      if (
        newRow < 0 ||
        newRow >= size ||
        newCol < 0 ||
        newCol >= size ||
        board[newRow][newCol] !== player
      ) {
        break;
      }
      count++;
    }

    // Check backward direction
    for (let i = 1; i < 5; i++) {
      const newRow = row - dx * i;
      const newCol = col - dy * i;

      if (
        newRow < 0 ||
        newRow >= size ||
        newCol < 0 ||
        newCol >= size ||
        board[newRow][newCol] !== player
      ) {
        break;
      }
      count++;
    }

    if (count >= 5) return true;
  }

  return false;
}
