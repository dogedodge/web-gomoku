"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WSServer = void 0;
const ws_1 = require("ws");
class WSServer {
  constructor(port) {
    this.wss = new ws_1.WebSocketServer({ port });
    this.setupHandlers();
    console.log(`WebSocket server started on port ${port}`);
  }
  setupHandlers() {
    this.wss.on("connection", (ws) => {
      ws.on("message", (raw) => {
        const message = raw.toString();
        this.handleMessage(message, ws);
      });
      ws.on("close", () => this.handleDisconnect(ws));
    });
  }
  async handleMessage(raw, _ws) {
    // try {
    const message = JSON.parse(raw);
    console.log("Received message:", message);
    // 使用策略模式路由到对应的处理器
    // const handler = getHandler(message.type);
    // await handler(message.data, ws);
    // } catch (err) {
    //   this.sendError(ws, err);
    // }
  }
  handleDisconnect(_ws) {
    console.log("Client disconnected");
  }
  sendError(ws, err) {
    ws.send(JSON.stringify({ type: "error", data: err.message }));
  }
}
exports.WSServer = WSServer;
//# sourceMappingURL=WSServer.js.map
