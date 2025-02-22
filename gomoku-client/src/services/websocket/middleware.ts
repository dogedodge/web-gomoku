// middleware.ts

import { Middleware } from "@reduxjs/toolkit";
import { PayloadAction } from "@reduxjs/toolkit";
import { gameActions } from "../../features/online/slices/syncSlice";
// import { ENDPOINT } from "../../config"; // Make sure to import ENDPOINT from your config

export const createSocketMiddleware = (): Middleware => {
  return ({ dispatch }) => {
    let socket: WebSocket;

    return (next) => (_action) => {
      const action = _action as PayloadAction;
      if (action.type === "WS_CONNECT") {
        socket = new WebSocket("ws://localhost:3030"); // Replace with your WebSocket server URL

        socket.onopen = () => {
          console.log("WebSocket connection established");
        };

        socket.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          console.log("Received message:", msg); // Log the received message for debugging purposes
          const action = gameActions[msg.type];
          if (action) {
            dispatch(action(msg.payload));
          } else {
            console.error("Unknown action type received:", msg.type);
          }
        };

        socket.onerror = (error) => {
          console.error("WebSocket error observed:", error);
        };

        socket.onclose = () => {
          console.log("WebSocket connection closed");
        };
      } else if (action.type === "WS_SEND") {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify(action.payload));
        } else {
          console.error("WebSocket is not open.");
        }
      } else if (action.type === "WS_DISCONNECT") {
        if (socket) {
          socket.close();
        }
      }

      return next(action);
    };
  };
};
