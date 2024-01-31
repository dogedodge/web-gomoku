export enum GoState {
  NONE,
  BLACK,
  WHITE
}

interface GoProps {
  state: GoState,
  size: number,
  cx: number,
  cy: number
}

export function Go(props: GoProps) {
  const {state, size, cx, cy} = props;

  const fill = state === GoState.BLACK ? 'black' : state === GoState.WHITE ? 'white' : 'transparent';

  const r = size/2 - 2;

  function onClick(){
    console.log(`click ${cx} ${cy}`);
  }

  return (
    <circle onClick={onClick} cx={cx} cy={cy} r={r} fill={fill} stroke="black" strokeWidth={2}></circle>
  )
}