基于需求文档和技术栈要求，以下是前端架构设计与组件规划：

---

### **一、前端架构分层**

```
├── core              // 核心业务逻辑
├── features          // 功能模块
├── app               // 应用根组件
├── common            // 通用组件
└── lib               // 第三方库封装
```

---

### **二、核心组件清单**

#### **1. 路由级组件**

| 组件                | 类型 | 职责             | 技术要点            |
| ------------------- | ---- | ---------------- | ------------------- |
| `AppRouter`         | 容器 | 应用路由管理     | react-router-dom v6 |
| `HomeScreen`        | 展示 | 模式选择入口     | 含过渡动画          |
| `OfflineGamePage`   | 容器 | 原单机模式兼容   | 继承既有实现        |
| `OnlineLobbyLayout` | 布局 | 联机模式通用布局 | 含网络状态指示      |

#### **2. 联机对战模块**

| 组件               | 类型 | 职责         | 技术要点          |
| ------------------ | ---- | ------------ | ----------------- |
| `RoomCreationForm` | 容器 | 房间创建表单 | Formik + Yup校验  |
| `RoomJoinForm`     | 容器 | 房间加入表单 | 二维码生成支持    |
| `RoomLobby`        | 展示 | 房间等待大厅 | 玩家准备状态管理  |
| `GameSession`      | 容器 | 对战主界面   | WebSocket事件绑定 |
| `ChessBoard`       | 展示 | 棋盘渲染     | Canvas/SVG双模式  |
| `GameStatusPanel`  | 展示 | 对战信息面板 | 含回合倒计时      |

#### **3. 网络相关组件**

| 组件                | 类型 | 职责         | 技术要点          |
| ------------------- | ---- | ------------ | ----------------- |
| `WebSocketProvider` | 容器 | WS连接管理   | 自动重连机制      |
| `NetworkStatusBar`  | 展示 | 网络状态提示 | Redux连接状态监听 |
| `ReconnectModal`    | 容器 | 断线重连处理 | 倒计时触发器      |

#### **4. 公共组件**

| 组件            | 类型 | 职责         | 技术要点     |
| --------------- | ---- | ------------ | ------------ |
| `AsyncButton`   | 展示 | 带状态按钮   | 加载/禁用态  |
| `CodeCopyField` | 展示 | 房间号输入框 | 剪贴板支持   |
| `PlayerBadge`   | 展示 | 玩家标识     | 段位图标集成 |

---

### **三、Redux状态设计（使用Redux Toolkit）**

#### **1. Slice划分**

```typescript
// 房间模块
interface RoomState {
  roomId: string | null;
  players: Player[];
  maxPlayers: number;
  isHost: boolean;
}

// 游戏状态模块
interface GameState {
  board: number[][];
  currentPlayer: Player["id"];
  moveHistory: Move[];
}

// 网络模块
interface NetworkState {
  isConnected: boolean;
  lastPing: number;
  errors: WebSocketError[];
}
```

#### **2. 主要Actions**

```typescript
// 房间相关
roomJoined(state, action: PayloadAction<RoomAuthPayload>)
roomUpdated(state, action: PayloadAction<RoomUpdatePayload>)

// 游戏同步
stonePlaced(state, action: PayloadAction<MoveSyncPayload>)
gameSyncReceived(state, action: PayloadAction<FullGameState>)

// 网络事件
connectionStateChanged(state, action: PayloadAction<boolean>)
```

---

### **四、关键技术实现方案**

1. **WebSocket集成**

```typescript
// 封装WS服务
const createSocketMiddleware = () => {
  return ({ dispatch }) => {
    let socket: WebSocket;

    return (next) => (action) => {
      if (action.type === "WS_CONNECT") {
        socket = new WebSocket(ENDPOINT);

        socket.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          dispatch(gameActions[msg.type](msg.payload));
        };
      }

      next(action);
    };
  };
};
```

2. **增量同步优化**

```typescript
// 对比棋盘差异
const getBoardDiff = (prev: number[][], current: number[][]) => {
  return current.flatMap((row, y) =>
    row.flatMap((cell, x) =>
      cell !== prev[y][x] ? [{ x, y, value: cell }] : [],
    ),
  );
};
```

---

### **五、组件层级关系**

```
AppRouter
├── HomeScreen
│   ├── ModeSwitch
│   ├── OfflineStartButton
│   └── OnlineStartButton
├── OnlineLobbyLayout
│   ├── RoomCreationForm
│   ├── RoomJoinForm
│   └── RoomLobby
│       ├── PlayerList
│       └── ReadyButton
└── GameSession
    ├── ChessBoard
    │   └── Stone
    ├── GameStatusPanel
    └── ChatPanel
```

---

### **六、开发顺序建议**

1. 优先实现核心路径：模式选择 → 房间创建 → 棋盘同步
2. 次优先级实现异常路径：断线提示 → 重连机制
3. 完成状态同步验证：Redux状态 ↔ WS事件 ↔ 视图渲染
4. 最后完善UI表现：加载状态 → 动画效果 → 错误提示

建议配合Storybook开发基础组件，全程使用TypeScript严格模式以确保类型安全。

### **七、文件结构**

以下是根据需求文档和技术栈要求生成的完整前端项目文件结构树形图：

```tree
src/
├── app/
│   ├── store.ts                # Redux Toolkit 主 store 配置
│   └── rootReducer.ts          # 组合所有 slice 的根 reducer
│
├── assets/
│   ├── images/                 # 静态图片资源
│   │   └── chess-pieces/       # 棋子样式图片
│   ├── sounds/                 # 音效文件
│   └── styles/                 # 全局样式
│       ├── base.scss           # 基础样式
│       └── variables.scss      # SCSS 变量
│
├── common/
│   ├── components/             # 通用 UI 组件
│   │   ├── AsyncButton/        # 带加载状态的按钮
│   │   │   ├── index.tsx
│   │   │   └── styles.module.scss
│   │   ├── CodeCopyField/
│   │   └── PlayerBadge/
│   │
│   ├── hooks/                  # 自定义 Hook
│   │   ├── useWebSocket.ts     # WS 连接管理 Hook
│   │   └── useReconnection.ts  # 重连逻辑 Hook
│   │
│   └── utils/
│       ├── chessLogic.ts       # 棋局规则工具函数
│       └── diffPatch.ts        # 增量同步对比工具
│
├── features/
│   ├── online/                 # 联机模块
│   │   ├── components/
│   │   │   ├── RoomCreationForm/
│   │   │   ├── RoomLobby/
│   │   │   └── GameSession/
│   │   │
│   │   ├── hooks/
│   │   │   └── useRoomSync.ts
│   │   │
│   │   └── slices/
│   │       ├── roomSlice.ts    # 房间相关状态
│   │       └── syncSlice.ts    # 网络同步状态
│   │
│   └── offline/                # 单机模式模块
│       └── ...                 # 保留原有实现
│
├── services/
│   ├── websocket/              # WS 服务封装
│   │   ├── connection.ts
│   │   └── middleware.ts       # Redux middleware
│   │
│   └── api/                    # REST API 服务(预留)
│
├── routes/
│   ├── AppRouter.tsx           # 主路由配置
│   ├── AuthRoutes.tsx          # 需要认证的路由(预留)
│   └── routes.ts               # 路由路径常量
│
├── types/                      # 全局类型定义
│   ├── chess.d.ts              # 棋局相关类型
│   └── websocket.d.ts          # WS 消息类型
│
├── test/                       # 测试配置
│   ├── mocks/
│   └── utils/
│
├── App.tsx                     # 应用根组件
├── main.tsx                    # 入口文件
│
└── 环境配置文件
    ├── .eslintrc
    ├── .prettierrc
    ├── tsconfig.json
    └── docker/                 # Docker 部署配置
```

### 文件结构说明：

1. **模块化特征**：

- 按业务功能划分的 `features/online` 和 `features/offline`
- 每个特性模块包含自己的组件、hooks 和状态管理

2. **网络层隔离**：

- WebSocket 实现集中在 `services/websocket`
- 同步逻辑相关工具函数在 `common/utils/diffPatch.ts`

3. **状态管理**：

- Redux Toolkit 的 slice 按功能划分在 features 模块内
- 主 store 配置在 `app/store.ts`

4. **类型安全**：

- 全局类型定义在 `types/` 目录
- 各组件/模块都有对应的 .d.ts 类型文件

5. **扩展性设计**：

- `public_api.ts` 文件为将来微前端架构预留出口
- `assets/styles/variables.scss` 集中管理设计变量

该结构符合业界推荐的 Feature-Sliced 设计模式，同时保留单机/联机功能的开发隔离性。对于当前需求的主要实现路径，应重点关注 `features/online` 和 `services/websocket` 目录的开发。
