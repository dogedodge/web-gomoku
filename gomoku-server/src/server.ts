import { WSServer } from "./websocket/WSServer";

// 配置服务器
const server = new WSServer({
  port: parseInt(process.env.WS_PORT || "3030"),
  maxConnections: 1000,
});

// 启动服务
server.start().catch(console.error);
