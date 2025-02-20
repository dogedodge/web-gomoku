// src/websocket/WSServer.ts
import WebSocket from "ws";
import { RoomManager } from "../rooms/RoomManager";
import { GameWebSocketHandler } from "./handlers";
import http from "http";
import { ServerMessage } from "../types/messages";
import dotenv from "dotenv";

// Extend the WebSocket interface to include the isAlive property
interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
}

dotenv.config(); // 加载环境变量

type ServerConfig = {
  port?: number;
  maxConnections?: number;
  pingInterval?: number;
};

export class WSServer {
  private wss: WebSocket.Server;
  private httpServer?: http.Server;
  private roomManager: RoomManager;
  private handler?: GameWebSocketHandler;
  private config: Required<ServerConfig>;

  constructor(config: ServerConfig = {}) {
    // 合并默认配置
    this.config = {
      port: parseInt(process.env.WS_PORT || "8080"),
      maxConnections: 1000,
      pingInterval: 30000,
      ...config,
    };

    // 初始化核心模块
    this.roomManager = new RoomManager();
    // 创建 WebSocket Server
    this.wss = new WebSocket.Server({
      port: this.config.port,
      clientTracking: true,
      perMessageDeflate: true,
      maxPayload: 1024 * 1024, // 1MB
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      // 创建 HTTP 服务器用于健康检查
      // this.httpServer = http.createServer((req, res) => {
      //   if (req.url === "/health") {
      //     res.writeHead(200, { "Content-Type": "application/json" });
      //     res.end(JSON.stringify({ status: "healthy" }));
      //     return;
      //   }
      //   res.writeHead(404);
      //   res.end();
      // });
      // 初始化消息处理器
      this.handler = new GameWebSocketHandler(this.wss, this.roomManager);

      // 配置保活机制
      this.configureKeepAlive();

      // 监听 HTTP 服务器
      // this.httpServer.listen(this.config.port, () => {
      //   console.log(`🚀 WebSocket server started on port ${this.config.port}`);
      //   resolve();
      // });

      // 注册优雅关闭
      this.registerGracefulShutdown();

      // 处理 WebSocket 连接
      this.wss.on("connection", (ws) => {
        const extendedWs = ws as ExtendedWebSocket;
        extendedWs.isAlive = true;

        ws.on("pong", () => {
          extendedWs.isAlive = true;
        });

        ws.on("close", () => {
          console.log("Client disconnected");
        });
      });
    });
  }

  private configureKeepAlive() {
    setInterval(() => {
      this.wss.clients.forEach((client) => {
        const ws = client as ExtendedWebSocket;
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
      });
    }, this.config.pingInterval);
  }

  private registerGracefulShutdown() {
    const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];

    signals.forEach((signal) => {
      process.on(signal, async () => {
        console.log(`\nReceived ${signal}, shutting down...`);

        // 关闭新连接
        this.wss.close();

        // 断开已有连接
        this.wss.clients.forEach((client) => {
          this.sendSystemMessage(client, "SERVER_SHUTDOWN", "服务器即将关闭");
          client.close(1001, "Server going down");
        });

        // 清理房间数据
        this.roomManager.cleanUpAllRooms();

        // 关闭HTTP服务器
        await new Promise<void>((resolve) =>
          this.httpServer?.close(() => resolve()),
        );

        console.log("Server shutdown complete");
        process.exit(0);
      });
    });
  }

  private sendSystemMessage(
    ws: WebSocket,
    code: string,
    message: string,
  ): void {
    if (ws.readyState !== ws.OPEN) return;

    ws.send(
      JSON.stringify({
        type: "system",
        code,
        message,
        timestamp: Date.now(),
      } as ServerMessage),
    );
  }

  // 获取服务器状态
  get serverStatus() {
    return {
      connections: this.wss.clients.size,
      rooms: this.roomManager.getRooms().size,
      uptime: process.uptime(),
    };
  }
}
