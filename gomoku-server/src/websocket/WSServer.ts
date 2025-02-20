import WebSocket, { WebSocketServer } from "ws";
import { ClientMessage } from "../types/messages";

export class WSServer {
  private wss: WebSocketServer;

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.setupHandlers();
  }

  private setupHandlers() {
    this.wss.on("connection", (ws) => {
      ws.on("message", (raw) => {
        const message = raw.toString();
        this.handleMessage(message, ws);
      });
      ws.on("close", () => this.handleDisconnect(ws));
    });
  }

  private async handleMessage(raw: string, ws: WebSocket) {
    try {
      const message: ClientMessage = JSON.parse(raw);
      // 使用策略模式路由到对应的处理器
      // const handler = getHandler(message.type);
      // await handler(message.data, ws);
    } catch (err) {
      this.sendError(ws, err);
    }
  }

  private handleDisconnect(ws: WebSocket) {
    console.log("Client disconnected");
  }
  private sendError(ws: WebSocket, err: Error) {
    ws.send(JSON.stringify({ type: "error", data: err.message }));
  }
}
