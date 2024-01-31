import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { GoState, LINE_NUM } from "../constant";

interface GameState {
  currentTurn: GoState;
  goStateMap: GoState[][]
}

const gameSlice = createSlice({
  name: 'game',
  initialState: {
    currentTurn: GoState.BLACK,
    goStateMap: Array.from({ length: LINE_NUM }, () => Array(LINE_NUM).fill(0))
  } as GameState,
  reducers: {
    placeGo: (state, action: PayloadAction<{ x: number, y: number }>) => {
      const {x, y} = action.payload;
      state.goStateMap[x][y] = state.currentTurn;
      // take turn
      state.currentTurn = state.currentTurn === GoState.BLACK ? GoState.WHITE : GoState.BLACK;
    }
  }
});

export default gameSlice.reducer;

export const {
  placeGo
} = gameSlice.actions;