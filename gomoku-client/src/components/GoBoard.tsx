import { GoState, LINE_NUM } from "../constant";
import { useAppSelector } from "../store/hooks";
import { Go } from "./Go";

interface GoBoardProps {
  size: number; // width & height in pixcel
  gridStrokeWidth: number;
}

export function GoBoard(props: GoBoardProps) {
  const {
    size,
    gridStrokeWidth
  } = props;
  const goStateMap = useAppSelector(state=>state.game.goStateMap);

  const goSize = size / 15;

  const lines: JSX.Element[] = [];


  for (let i = 0; i < LINE_NUM; i++) {
    // horizontal lines
    lines.push(<line
      key={`h${i}`}
      x1={goSize * 0.5}
      y1={goSize * (0.5 + i)}
      x2={size - goSize * 0.5}
      y2={goSize * (0.5 + i)}
      stroke="black"
      strokeWidth={gridStrokeWidth}
    ></line>)

    // vertical lines
    lines.push(<line
      key={`v${i}`}
      x1={goSize * (0.5 + i)}
      y1={goSize * 0.5}
      x2={goSize * (0.5 + i)}
      y2={size - goSize * 0.5}
      stroke="black"
      strokeWidth={gridStrokeWidth}
    ></line>)
  }

  const goList: JSX.Element[] = [];
  for (let i = 0; i < LINE_NUM; i++) {
    for (let j = 0; j < LINE_NUM; j++) {
      const cx = (0.5 + i) * goSize;
      const cy = (0.5 + j) * goSize;
      goList.push(<Go 
        key={`${i}-${j}`}
        cx={cx} 
        cy={cy}
        xIndex={i}
        yIndex={j}
        size={goSize} 
        state={goStateMap[i][j]}></Go>)
    }
  }

  return (
    <svg width={size} height={size}>
      <rect width={size} height={size} fill="white"></rect>
      {lines}
      {goList}
    </svg>
  )
}