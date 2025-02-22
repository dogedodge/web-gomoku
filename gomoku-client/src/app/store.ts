// import { combineReducers, configureStore } from "@reduxjs/toolkit";
// import gameSlice from "../store/gameSlice";

// export const store = configureStore({
//   reducer: combineReducers({ game: gameSlice }),
// });

// export type RootState = ReturnType<typeof store.getState>;
// // Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
// export type AppDispatch = typeof store.dispatch;

import { combineReducers, configureStore } from "@reduxjs/toolkit";
import gameSlice from "../features/online/slices/syncSlice"; // Adjust the import path if necessary
import { createSocketMiddleware } from "../services/websocket/middleware";
import roomSlice from "../features/online/slices/roomSlice";
// import { createSocketMiddleware } from "../../services/websocket/middleware"; // Adjust the import path if necessary

// Combine all reducers
const rootReducer = combineReducers({
  game: gameSlice,
  room: roomSlice,
  // Add other reducers here if needed
});

// Create the store with combined reducers and custom middleware
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(createSocketMiddleware()),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
