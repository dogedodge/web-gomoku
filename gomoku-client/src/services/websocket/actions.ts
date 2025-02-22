// src/services/websocket/actions.ts

import { createAction } from "@reduxjs/toolkit";

export const wsConnect = createAction("WS_CONNECT");
export const wsSend = createAction<{ data: unknown }>("WS_SEND");
export const wsDisconnect = createAction("WS_DISCONNECT");
