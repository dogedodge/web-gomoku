import { GoState } from "../constant";
import { placeGo } from "../store/gameSlice";
import { useAppDispatch } from "../store/hooks";


interface GoProps {
  state: GoState,
  size: number,
  cx: number,
  cy: number
  xIndex: number,
  yIndex: number,
}

export function Go(props: GoProps) {
  const { state, size, cx, cy, xIndex, yIndex } = props;

  const dispatch = useAppDispatch();

  const fill = state === GoState.BLACK ? 'black' : state === GoState.WHITE ? 'white' : 'transparent';

  const r = size / 2 - 2; // hard code

  function onClick() {
    console.log(`click ${cx} ${cy}`);
    dispatch(placeGo({ x: xIndex, y: yIndex }))
  }

  return (
    <circle onClick={onClick} cx={cx} cy={cy} r={r} fill={fill} stroke="black" strokeWidth={2}></circle>
  )
}