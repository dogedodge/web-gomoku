const LINE_NUM = 15;

interface GoBoardProps {
  size: number; // width & height in pixcel
  gridStrokeWidth: number;
}

export function GoBoard(props: GoBoardProps) {
  const {
    size,
    gridStrokeWidth
  } = props;

  const goSize = size / 15;

  const lines: any[] = [];


  for (let i = 0; i < LINE_NUM; i++) {
    // horizontal lines
    lines.push(<line
      key={i}
      x1={goSize * 0.5}
      y1={goSize * (0.5 + i)}
      x2={size - goSize * 0.5}
      y2={goSize * (0.5 + i)}
      stroke="black"
      strokeWidth={gridStrokeWidth}
    ></line>)

    // vertical lines
    lines.push(<line
      key={i}
      x1={goSize * (0.5 + i)}
      y1={goSize * 0.5}
      x2={goSize * (0.5 + i)}
      y2={size - goSize * 0.5}
      stroke="black"
      strokeWidth={gridStrokeWidth}
    ></line>)
  }

  return (
    <svg width={size} height={size}>
      <rect width={size} height={size} fill="white"></rect>
      {lines}
    </svg>
  )
}