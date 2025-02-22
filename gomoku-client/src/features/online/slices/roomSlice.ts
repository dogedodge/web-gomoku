// Room Slice for Redux state management using Redux Toolkit
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Define the RoomState interface
interface RoomState {
  roomId: string | null;
  players: Player[];
  maxPlayers: number;
  isHost: boolean;
}

// Define the initial state of the Room Slice
const initialState: RoomState = {
  roomId: null,
  players: [],
  maxPlayers: 2,
  isHost: false,
};

// Create the Room Slice using Redux Toolkit's createSlice function
const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    // Handle room joined action
    roomJoined: (state, action: PayloadAction<RoomAuthPayload>) => {
      state.roomId = action.payload.roomId;
      state.players = action.payload.players;
      state.maxPlayers = action.payload.maxPlayers;
      state.isHost = action.payload.isHost;
    },
    // Handle room updated action
    roomUpdated: (state, action: PayloadAction<RoomUpdatePayload>) => {
      if (action.payload.players) state.players = action.payload.players;
      if (action.payload.maxPlayers)
        state.maxPlayers = action.payload.maxPlayers;
      if (action.payload.isHost !== undefined)
        state.isHost = action.payload.isHost;
    },
  },
});

// Export actions and the reducer function from the Room Slice
export const { roomJoined, roomUpdated } = roomSlice.actions;

export default roomSlice.reducer;

// Define interfaces for payload types used in actions
export interface Player {
  id: string;
  name: string;
  rank?: string;
}

export interface RoomAuthPayload {
  roomId: string;
  players: Player[];
  maxPlayers: number;
  isHost: boolean;
}

export interface RoomUpdatePayload {
  players?: Player[];
  maxPlayers?: number;
  isHost?: boolean;
}
