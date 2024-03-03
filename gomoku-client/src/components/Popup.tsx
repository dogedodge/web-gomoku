import { GoState } from "../constant";
import { useAppSelector } from "../store/hooks";

export function Popup() {
  const winner = useAppSelector((state) => state.game.winner);
  const username = winner === GoState.BLACK ? "Black side" : "White side";

  return <>{!!winner && <div>{`${username} win! Congratulation!`}</div>}</>;
}
