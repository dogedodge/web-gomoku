import { combineReducers, configureStore } from "@reduxjs/toolkit";
import gameSlice from "../store/gameSlice";

export const store = configureStore({
  reducer: combineReducers({ game: gameSlice }),
});

export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
