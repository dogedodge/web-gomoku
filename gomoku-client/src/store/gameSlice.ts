import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { GoState, LINE_NUM } from "../constant";
import { checkWin } from "../utils/checkWin";

interface GameState {
  currentTurn: GoState;
  goStateMap: GoState[][];
  winner: GoState;
}

const gameSlice = createSlice({
  name: "game",
  initialState: {
    currentTurn: GoState.BLACK,
    goStateMap: Array.from({ length: LINE_NUM }, () => Array(LINE_NUM).fill(0)),
    winner: GoState.NONE,
  } as GameState,
  reducers: {
    placeGo: (state, action: PayloadAction<{ x: number; y: number }>) => {
      if (state.winner === GoState.NONE) {
        const { x, y } = action.payload;
        state.goStateMap[x][y] = state.currentTurn;
        state.winner = checkWin(state.goStateMap);
        // other side take turn
        state.currentTurn =
          state.currentTurn === GoState.BLACK ? GoState.WHITE : GoState.BLACK;
      } else {
        console.log(`${state.winner} already win!`);
      }
    },
  },
});

export default gameSlice.reducer;

export const { placeGo } = gameSlice.actions;
