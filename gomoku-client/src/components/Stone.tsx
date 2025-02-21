import { StoneState } from "../constant";
import { placeStone } from "../store/gameSlice";
import { useAppDispatch } from "../store/hooks";

interface StoneProps {
  state: StoneState;
  size: number;
  cx: number;
  cy: number;
  xIndex: number;
  yIndex: number;
}

export function Stone(props: StoneProps) {
  const { state, size, cx, cy, xIndex, yIndex } = props;

  const dispatch = useAppDispatch();

  const fill =
    state === StoneState.BLACK
      ? "black"
      : state === StoneState.WHITE
        ? "white"
        : "transparent";

  const r = size / 2 - 2; // hard code

  function onClick() {
    // console.log(`click ${cx} ${cy}`);
    dispatch(placeStone({ x: xIndex, y: yIndex }));
  }

  return (
    <>
      <circle
        onClick={onClick}
        cx={cx}
        cy={cy}
        r={r}
        fill={fill}
        stroke="black"
        strokeWidth={state === StoneState.NONE ? 0 : 2}
      ></circle>
    </>
  );
}
