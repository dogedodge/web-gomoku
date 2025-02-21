根据技术需求和API设计，以下是前端架构规划及组件/Redux结构设计：

### 前端架构规划

1. **WebSocket集成方案**

   - 使用`redux-websocket`中间件或自定义中间件管理双工通信
   - 设计MessageType类型守卫处理不同协议消息

2. **状态管理设计原则**

   - 全局状态选择器优先
   - 棋盘数据使用不可变更新
   - 网络状态与业务状态分离

3. **关键性能优化**
   - 棋盘渲染使用React.memo
   - 使用Web Workers处理AI计算（保留单机模式兼容）
   - 心跳检测单独线程管理

---

### 项目结构树

```markdown
src/
├── app/
│ ├── store.ts
│ ├── hooks.ts
│ └── rootReducer.ts
├── components/
│ ├── Home/
│ │ ├── HomePage.tsx
│ │ └── HomePage.module.scss
│ ├── Lobby/
│ │ ├── RoomList.tsx
│ │ ├── CreateRoomForm.tsx
│ │ └── JoinRoomForm.tsx
│ ├── Game/
│ │ ├── OnlineBoard.tsx
│ │ ├── Stone.tsx
│ │ └── BoardGrid.tsx
│ ├── Modals/
│ │ ├── ReconnectModal.tsx
│ │ ├── GameOverDialog.tsx
│ │ └── UndoRequestDialog.tsx
│ └── common/
│ ├── Header.tsx
│ └── LoadingSpinner.tsx
├── features/
│ ├── network/
│ │ ├── networkSlice.ts
│ │ └── websocketMiddleware.ts
│ ├── room/
│ │ └── roomSlice.ts
│ ├── game/
│ │ ├── gameSlice.ts
│ │ └── syncThunks.ts
│ └── user/
│ └── userSlice.ts
├── hooks/
│ ├── useWebSocket.ts
│ └── useReconnect.ts
├── utils/
│ ├── boardUtils.ts
│ ├── checkWin.ts
│ ├── reconnectManager.ts
│ └── dataSerializers.ts
├── types/
│ ├── wsMessage.ts
│ └── apiResponses.ts
├── constants/
│ └── game.ts
├── assets/
│ ├── styles/
│ │ ├── global.scss
│ │ └── variables.scss
│ └── icons/
├── services/
│ ├── api.ts
│ └── websocket.ts
├── stories/
│ ├── HomePage.stories.tsx
│ └── Board.stories.tsx
├── test-utils.tsx
├── App.tsx
└── main.tsx
```

---

### UI组件列表（按功能模块）

#### 1. 入口组件

```typescript
// components/HomePage.tsx
interface HomePageProps {
  onSelectMode: (mode: "single" | "online") => void;
}
```

#### 2. 联机模块

```typescript
// components/Lobby/RoomList.tsx
interface RoomListProps {
  rooms: Array<{
    roomId: string;
    playerCount: number;
    expireTime: number;
  }>;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
}

// components/Game/OnlineBoard.tsx
interface OnlineBoardProps {
  boardState: number[][];
  currentTurn: "1" | "2";
  playerId: string;
  onPlaceStone: (pos: [number, number]) => void;
}
```

#### 3. 状态模态框

```typescript
// components/Modals/ReconnectModal.tsx
interface ReconnectModalProps {
  remainingTime: number;
  onReconnect: () => void;
}

// components/Modals/GameOverDialog.tsx
interface GameOverDialogProps {
  winner: "1" | "2" | null;
  winPositions: Array<[number, number]>;
  onRematch: () => void;
}
```

---

### Redux Toolkit Slice设计

#### 1. 网络连接Slice

```typescript
// slices/networkSlice.ts
interface NetworkState {
  isConnected: boolean;
  lastPongTime: number;
  reconnectAttempts: number;
  latency: number;
}
```

#### 2. 房间管理Slice

```typescript
// slices/roomSlice.ts
interface RoomState {
  currentRoom: {
    id: string;
    players: string[];
    config: {
      maxPlayers: number;
      hasPassword: boolean;
    };
  } | null;
  roomList: Array<{
    id: string;
    playerCount: number;
    status: "waiting" | "playing";
  }>;
  playerId: string | null;
}
```

#### 3. 游戏状态Slice

```typescript
// slices/gameSlice.ts
interface GameState {
  board: number[][]; // 15x15棋盘
  currentTurn: "1" | "2";
  moveHistory: Array<{
    player: string;
    position: [number, number];
    timestamp: number;
  }>;
  gameStatus: "playing" | "ended" | "waiting";
  winner: {
    playerId: string;
    winType: "five" | "timeout" | "resign";
    positions: Array<[number, number]>;
  } | null;
}
```

#### 4. WebSocket消息处理Slice

```typescript
// slices/wsMiddleware.ts
const wsMiddleware = (store: MiddlewareAPI) => {
  const ws = new WebSocket(API_URL);

  ws.onmessage = (event) => {
    const message = parseMessage(event.data);

    switch (message.type) {
      case "stonePlaced":
        store.dispatch(applyStone(message));
        break;
      case "fullState":
        store.dispatch(syncGameState(message));
        break;
      // 处理其他协议类型...
    }
  };

  return (next) => (action) => {
    if (isWsAction(action)) {
      ws.send(serializeAction(action));
    }
    return next(action);
  };
};
```

---

### 关键技术实现点

1. **类型安全的协议处理**

```typescript
// types/wsMessage.ts
type WSMessage =
  | { type: "stonePlaced"; position: [number, number] }
  | { type: "gameStart"; blackPlayer: string; whitePlayer: string };
// 其他消息类型...

const isGameStartMessage = (
  msg: WSMessage,
): msg is Extract<WSMessage, { type: "gameStart" }> => msg.type === "gameStart";
```

2. **棋盘状态优化更新**

```typescript
// reducers/gameSlice
reducers: {
  applyMove(state, action: PayloadAction<StonePlacedPayload>) {
    return produce(state, draft => {
      draft.board[action.payload.x][action.payload.y] = action.payload.player
      draft.currentTurn = action.payload.nextTurn
    })
  }
}
```

3. **断线重连机制**

```typescript
// utils/reconnectManager.ts
const attemptReconnect = (store: Store) => {
  if (shouldReconnect(store.getState().network)) {
    dispatchReconnect();
    setupConnection(store);
  }
};
```

---

### 架构验证清单

1. **状态同步验证**

   - 断开网络模拟器查看重连流程
   - 实时修改Redux状态观察UI同步

2. **压力测试方案**

   - 自动生成高频落子事件
   - 网络延迟模拟测试

3. **异常流测试**
   - 对手断线时提交落子请求
   - 在非当前回合触发落子事件

建议在开发过程中采用Storybook进行组件隔离测试，优先保证核心游戏流程（创建房间-落子对战-结束返回）的完整性，再逐步实现扩展功能。
