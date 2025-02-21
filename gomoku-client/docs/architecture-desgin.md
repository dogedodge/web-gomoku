### 前端架构设计方案 (TypeScript)

#### 1. 组件结构树（类型增强）

```typescript
src/
├─ features/
│  ├─ online/
│  │  ├─ LobbyPage.tsx      // 联机大厅
│  │  ├─ RoomFormModal.tsx  // 创建/加入房间弹窗
│  │  └─ ReconnectModal.tsx
├─ game/
│  ├─ Board.tsx           // 棋盘组件（复用单机版）
│  ├─ GamePage.tsx        // 核心对战界面
│  └─ ModeSelect.tsx      // 模式选择入口
├─ store/
│  ├─ websocketMiddleware.ts // WS通信中间件
│  └─ slices/
│     ├─ roomSlice.ts     // 房间状态管理
│     ├─ gameSlice.ts     // 棋盘状态管理
│     └─ networkSlice.ts  // 连接状态管理
├─ types.ts
```

#### 2. 类型化核心组件接口

```typescript
// RoomFormModal.tsx
type RoomMode = "create" | "join";

interface RoomFormProps {
  initialMode: RoomMode;
  onCreateRoom: (config: { maxPlayers?: number; password?: string }) => void;
  onJoinRoom: (roomId: string, password?: string) => void;
}

const RoomFormModal: React.FC<RoomFormProps> = ({
  initialMode,
  onCreateRoom,
  onJoinRoom,
}) => {
  /* 实现 */
};

// websocketMiddleware.ts
import { Middleware } from "@reduxjs/toolkit";

const socketMiddleware: Middleware = (store) => (next) => (action) => {
  if (action.type === "WS_SEND") {
    const payload = action.payload as WsMessage;
    socket.send(JSON.stringify(payload));
  }
  return next(action);
};

// roomSlice.ts
interface RoomState {
  players: PlayerInfo[];
  status: "waiting" | "playing";
  roomCode: string | null;
}

const initialState: RoomState = {
  /* 初始化 */
};
```

#### 3. 类型安全的状态管理

```typescript
// gameSlice.ts
interface GameState {
  board: (null | "black" | "white")[][];
  currentPlayer: string;
  sequence: number;
}

interface SyncBoardAction {
  board: GameState["board"];
  sequence: number;
  lastMove?: [number, number];
}

const gameSlice = createSlice({
  name: "game",
  initialState: {} as GameState,
  reducers: {
    syncBoard: (state, action: PayloadAction<SyncBoardAction>) => {
      if (action.payload.sequence > state.sequence) {
        // 增量更新逻辑
      }
    },
  },
});
```

#### 4. 强化通信协议类型

```typescript
// types.ts
type WsMessageType = "SYNC" | "CHAT" | "ROOM_UPDATE";

interface BaseWsMessage<T extends WsMessageType> {
  type: T;
  timestamp: number;
  payload: object;
}

interface BoardSyncMessage extends BaseWsMessage<"SYNC"> {
  payload: {
    board: string[][];
    currentPlayer: string;
    sequence: number;
  };
}

type WsMessage = BoardSyncMessage | RoomUpdateMessage | ChatMessage;
```

#### 5. 类型优化的棋盘组件

```typescript
// Board.tsx
interface BoardProps {
  boardState: GameState;
  onPlaceStone: (pos: [number, number]) => void;
}

const Board: React.FC<BoardProps> = memo(
  ({ boardState, onPlaceStone }) => {
    // 渲染逻辑
  },
  (prevProps, nextProps) =>
    prevProps.boardState.sequence === nextProps.boardState.sequence,
);

// 类型守卫函数
const isMoveValid = (pos: unknown): pos is [number, number] => {
  return (
    Array.isArray(pos) &&
    pos.length === 2 &&
    typeof pos[0] === "number" &&
    typeof pos[1] === "number"
  );
};
```

#### 6. 增强的安全重连逻辑

```typescript
// networkSlice.ts
interface ReconnectState {
  lastRoomId?: string;
  retryCount: number;
  lastValidState?: GameState;
}

const reconnectLogic = createAsyncThunk<boolean, void, { state: RootState }>(
  "network/reconnect",
  async (_, { dispatch, getState }) => {
    const { roomCode } = getState().room;
    try {
      const res = await rejoinRoom(roomCode!); // 非空断言需配合运行时校验
      dispatch(roomSlice.actions.forceSync(res));
      return true;
    } catch (err) {
      showErrorToast((err as Error).message);
      return false;
    }
  },
);
```

---

### 类型系统增强说明

1. **全局类型定义**：

```typescript
// types.ts
type PlayerRole = "host" | "guest";
interface PlayerInfo {
  id: string;
  name: string;
  role: PlayerRole;
  ready: boolean;
}

type GameStatus = "waiting_players" | "countdown" | "playing" | "finished";
```

2. **Redux Toolkit 类型集成**：

```typescript
// store.ts
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
```

3. **WebSocket 事件类型守卫**：

```typescript
// websocketMiddleware.ts
function isBoardSync(msg: any): msg is BoardSyncMessage {
  return (
    msg?.type === "SYNC" &&
    Array.isArray(msg?.payload?.board) &&
    typeof msg?.payload?.sequence === "number"
  );
}

socket.onmessage = (event) => {
  const msg = parseMessage(event.data);
  if (isBoardSync(msg)) {
    dispatch(syncBoard(msg.payload));
  }
};
```

---

### 类型安全保证措施

1. **严格的类型检查配置**：

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

---

该方案在保留原有架构设计的同时，通过 TypeScript 实现以下增强：

1. **操作安全**：所有 Redux action 和 WebSocket 消息均被类型化
2. **组件契约**：明确 props/state 类型约束，避免无效属性传递
3. **数据完整**：棋盘坐标强制为元组类型，消除位置传错的潜在风险
4. **状态保护**：使用类型守卫确保运行时类型安全
