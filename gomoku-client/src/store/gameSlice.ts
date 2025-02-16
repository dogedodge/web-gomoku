import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { GoState, BOARD_SIZE } from "../constant";
// import { checkWin } from "../utils/checkWin";
import { checkWinner } from "../utils/checkWinner";

interface GameState {
  currentTurn: GoState;
  goStateMap: GoState[][];
  winner: GoState;
}

const gameSlice = createSlice({
  name: "game",
  initialState: {
    currentTurn: GoState.BLACK,
    goStateMap: Array.from({ length: BOARD_SIZE }, () =>
      Array(BOARD_SIZE).fill(0),
    ),
    winner: GoState.NONE,
  } as GameState,
  reducers: {
    placeGo: (state, action: PayloadAction<{ x: number; y: number }>) => {
      if (state.winner !== GoState.NONE) {
        console.log(`${state.winner} already win!`);
        return;
      }
      const { x, y } = action.payload;
      if (state.goStateMap[x][y] !== GoState.NONE) {
        console.log(`Already a go there!`);
        return;
      }

      state.goStateMap[x][y] = state.currentTurn;
      if (checkWinner(state.goStateMap, x, y, state.currentTurn)) {
        state.winner = state.currentTurn;
        console.log(`Winner: ${state.winner}`);
      }
      // other side take turn
      state.currentTurn =
        state.currentTurn === GoState.BLACK ? GoState.WHITE : GoState.BLACK;
    },
  },
});

export default gameSlice.reducer;

export const { placeGo } = gameSlice.actions;
