import { BOARD_SIZE } from "../constant";
import { useAppSelector } from "../app/hooks";
import { Stone } from "./Stone";

interface GameBoardProps {
  size: number; // width & height in pixcel
  gridStrokeWidth: number;
}

export function GameBoard(props: GameBoardProps) {
  const { size, gridStrokeWidth } = props;
  const board = useAppSelector((state) => state.game.board);

  const stoneSize = size / 15;

  const lines: JSX.Element[] = [];

  for (let i = 0; i < BOARD_SIZE; i++) {
    // horizontal lines
    lines.push(
      <line
        key={`h${i}`}
        x1={stoneSize * 0.5}
        y1={stoneSize * (0.5 + i)}
        x2={size - stoneSize * 0.5}
        y2={stoneSize * (0.5 + i)}
        stroke="black"
        strokeWidth={gridStrokeWidth}
      ></line>,
    );

    // vertical lines
    lines.push(
      <line
        key={`v${i}`}
        x1={stoneSize * (0.5 + i)}
        y1={stoneSize * 0.5}
        x2={stoneSize * (0.5 + i)}
        y2={size - stoneSize * 0.5}
        stroke="black"
        strokeWidth={gridStrokeWidth}
      ></line>,
    );
  }

  const stoneList: JSX.Element[] = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      const cx = (0.5 + i) * stoneSize;
      const cy = (0.5 + j) * stoneSize;
      stoneList.push(
        <Stone
          key={`${i}-${j}`}
          cx={cx}
          cy={cy}
          xIndex={i}
          yIndex={j}
          size={stoneSize}
          state={board[i][j]}
        ></Stone>,
      );
    }
  }

  return (
    <svg width={size} height={size}>
      <rect width={size} height={size} fill="white"></rect>
      {lines}
      {stoneList}
    </svg>
  );
}
