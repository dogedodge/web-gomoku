// src/features/online/slices/syncSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface StonePosition {
  x: number;
  y: number;
  value: number;
}

interface MoveSyncPayload {
  stone: StonePosition;
  playerId: string;
}

interface FullGameState {
  board: number[][];
  currentPlayer: string;
  moveHistory: StonePosition[];
}

interface SyncState {
  board: number[][];
  currentPlayer: string | null;
  moveHistory: StonePosition[];
}

const initialState: SyncState = {
  board: Array.from({ length: 15 }, () => Array(15).fill(0)), // Assuming a 15x15 board with empty cells initialized as 0
  currentPlayer: null,
  moveHistory: [],
};

const syncSlice = createSlice({
  name: "sync",
  initialState,
  reducers: {
    stonePlaced(state, action: PayloadAction<MoveSyncPayload>) {
      const { stone, playerId } = action.payload;
      state.board[stone.y][stone.x] = playerId === "player1" ? 1 : 2; // Example assumption: 1 for player1, 2 for player2
      state.currentPlayer = playerId === "player1" ? "player2" : "player1";
      state.moveHistory.push(stone);
    },
    gameSyncReceived(state, action: PayloadAction<FullGameState>) {
      state.board = action.payload.board;
      state.currentPlayer = action.payload.currentPlayer;
      state.moveHistory = action.payload.moveHistory;
    },
  },
});

export const { stonePlaced, gameSyncReceived } = syncSlice.actions;

export const gameActions = {
  stonePlaced,
  gameSyncReceived,
};

export default syncSlice.reducer;
