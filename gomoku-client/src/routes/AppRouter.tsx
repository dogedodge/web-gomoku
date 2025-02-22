// src/routes/AppRouter.tsx

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Route, Routes } from "react-router-dom";

// Import your components
import HomeScreen from "../app/HomeScreen";
// import OnlineLobbyLayout from '../features/online/components/RoomLobby/OnlineLobbyLayout';
// import GameSession from '../features/online/components/GameSession/GameSession';

// Import the WS_CONNECT action
import { wsConnect } from "../services/websocket/actions";

const AppRouter = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Dispatch WS_CONNECT to establish the WebSocket connection
    dispatch(wsConnect());
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      {/* <Route path="/online" element={<OnlineLobbyLayout />} />
      <Route path="/game/:roomId" element={<GameSession />} /> */}
    </Routes>
  );
};

export default AppRouter;
