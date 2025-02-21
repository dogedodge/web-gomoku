import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { StoneState, BOARD_SIZE, Board } from "../constant";
// import { checkWin } from "../utils/checkWin";
import { checkWinner } from "../utils/checkWinner";

interface GameState {
  currentTurn: StoneState;
  board: Board;
  winner: StoneState;
}

const gameSlice = createSlice({
  name: "game",
  initialState: {
    currentTurn: StoneState.BLACK,
    board: Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0)),
    winner: StoneState.NONE,
  } as GameState,
  reducers: {
    placeStone: (state, action: PayloadAction<{ x: number; y: number }>) => {
      if (state.winner !== StoneState.NONE) {
        console.log(`${state.winner} already win!`);
        return;
      }
      const { x, y } = action.payload;
      if (state.board[x][y] !== StoneState.NONE) {
        console.log(`Already a stone there!`);
        return;
      }

      state.board[x][y] = state.currentTurn;
      if (checkWinner(state.board, x, y, state.currentTurn)) {
        state.winner = state.currentTurn;
        console.log(`Winner: ${state.winner}`);
      }
      // other side take turn
      state.currentTurn =
        state.currentTurn === StoneState.BLACK
          ? StoneState.WHITE
          : StoneState.BLACK;
    },
  },
});

export default gameSlice.reducer;

export const { placeStone } = gameSlice.actions;
