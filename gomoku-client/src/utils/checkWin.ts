import { GoState } from "../constant";

export function checkWin(goStateMap: GoState[][]) {
  // check vertical
  const verticalStr = goStateMap.map(column=>column.join('')).join('x');
  if(/1{5}/.test(verticalStr)){
    console.log('black win');
    return GoState.BLACK;
  }

  if(/2{5}/.test(verticalStr)){
    console.log('white win');
    return GoState.WHITE
  }




  return GoState.NONE;
}