import WebSocket, { WebSocketServer } from "ws";
import { ClientMessage } from "../types/messages";

export class WSServer {
  private wss: WebSocketServer;

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.setupHandlers();
    console.log(`WebSocket server started on port ${port}`);
  }

  private setupHandlers() {
    this.wss.on("connection", (ws) => {
      ws.send("Welcome to the WebSocket server!");
      console.log("Client connected");

      ws.on("message", (raw) => {
        const message = raw.toString();
        this.handleMessage(message, ws);
      });
      ws.on("close", () => this.handleDisconnect(ws));
    });
  }

  private async handleMessage(raw: string, _ws: WebSocket) {
    // try {
    const message: ClientMessage = JSON.parse(raw);
    console.log("Received message:", message);
    // 使用策略模式路由到对应的处理器
    // const handler = getHandler(message.type);
    // await handler(message.data, ws);
    // } catch (err) {
    //   this.sendError(ws, err);
    // }
  }

  private handleDisconnect(_ws: WebSocket) {
    console.log("Client disconnected");
  }
  private sendError(ws: WebSocket, err: Error) {
    ws.send(JSON.stringify({ type: "error", data: err.message }));
  }
}
