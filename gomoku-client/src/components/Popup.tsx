import { StoneState } from "../constant";
import { useAppSelector } from "../app/hooks";

export function Popup() {
  const winner = useAppSelector((state) => state.game.winner);
  const username = winner === StoneState.BLACK ? "Black side" : "White side";

  return <>{!!winner && <div>{`${username} win! Congratulation!`}</div>}</>;
}
