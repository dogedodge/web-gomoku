// src/services/websocket/actions.ts

import { createAction } from "@reduxjs/toolkit";

export const wsConnect = createAction("WS_CONNECT");
export const wsSend = createAction<{ type: string; [x: string]: string }>(
  "WS_SEND",
);
export const wsDisconnect = createAction("WS_DISCONNECT");
