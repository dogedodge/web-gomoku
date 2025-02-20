以下是一个五子棋WebSocket API的设计方案，使用JSON作为数据交换格式：

---

### **1. 连接建立**

- 客户端通过WebSocket连接到服务器，URL格式示例：`ws://yourdomain.com/gomoku/ws`
- 连接成功后服务器发送欢迎消息

```json
// Server -> Client
{
  "type": "welcome",
  "message": "Connected to Gomoku Server"
}
```

---

### **2. 房间管理**

#### 创建房间

```json
// Client -> Server
{
  "type": "create_room",
  "player_name": "Alice"
}

// Server -> Client
{
  "type": "room_created",
  "room_id": "5XQ9L",
  "player_id": "1", // 先手玩家（黑棋）
  "expire_time": 1800 // 房间有效期（秒）
}
```

#### 加入房间

```json
// Client -> Server
{
  "type": "join_room",
  "room_id": "5XQ9L",
  "player_name": "Bob"
}

// Server -> Client (成功)
{
  "type": "join_success",
  "player_id": "2", // 后手玩家（白棋）
  "opponent_name": "Alice"
}

// Server -> Client (失败)
{
  "type": "error",
  "code": "ROOM_FULL",
  "message": "Room is full"
}
```

---

### **3. 游戏流程**

#### 游戏开始通知

```json
// Server -> Both Clients
{
  "type": "game_start",
  "black_player": "Alice",
  "white_player": "Bob",
  "current_turn": "1" // 当前行动玩家ID
}
```

#### 落子操作

```json
// Client -> Server
{
  "type": "place_stone",
  "room_id": "5XQ9L",
  "player_id": "1",
  "position": [8, 8] // 棋盘坐标(x,y)
}

// Server -> Both Clients
{
  "type": "stone_placed",
  "room_id": "5XQ9L",
  "player_id": "1",
  "position": [8, 8],
  "next_turn": "2",
  "board_state": "..." // 可选棋盘状态编码
}
```

#### 游戏结束

```json
// Server -> Both Clients
{
  "type": "game_over",
  "winner": "1",
  "win_reason": "FIVE_IN_ROW",
  "win_positions": [
    [6, 8],
    [7, 8],
    [8, 8],
    [9, 8],
    [10, 8]
  ]
}
```

---

### **4. 特殊操作**

#### 悔棋请求

```json
// Client -> Server
{
  "type": "request_undo",
  "room_id": "5XQ9L",
  "player_id": "2"
}

// Server -> Both Clients
{
  "type": "undo_requested",
  "requester": "2"
}

// 对方确认
// Client -> Server
{
  "type": "respond_undo",
  "room_id": "5XQ9L",
  "player_id": "1",
  "accept": true
}
```

#### 和棋请求

```json
// Server -> Both Clients (当双方都同意时)
{
  "type": "game_over",
  "winner": null,
  "win_reason": "DRAW"
}
```

---

### **5. 状态同步**

#### 棋盘全量状态

```json
// Server -> Client (断线重连时)
{
  "type": "full_state",
  "current_turn": "2",
  "board": [
    [0,0,0,...], // 0=空 1=黑 2=白
    [0,0,1,...],
    ...
  ],
  "move_history": [
    {"player":1, "pos":[8,8], "time": 1620000000},
    {"player":2, "pos":[7,7], "time": 1620000005}
  ]
}
```

---

### **6. 错误处理**

```json
{
  "type": "error",
  "code": "INVALID_MOVE",
  "message": "Position already occupied"
}

{
  "type": "error",
  "code": "NOT_YOUR_TURN",
  "message": "Please wait for your turn"
}
```

---

### **7. 心跳机制**

```json
// Client -> Server
{
  "type": "ping"
}

// Server -> Client
{
  "type": "pong",
  "timestamp": 1620000000
}
```

---

### **8. 连接关闭**

```json
// Server -> Client (当对手离开时)
{
  "type": "opponent_left",
  "reason": "disconnected"
}
```

---

### **错误码参考**

| Code               | 说明         |
| ------------------ | ------------ |
| ROOM_NOT_FOUND     | 房间不存在   |
| ROOM_FULL          | 房间已满     |
| INVALID_MOVE       | 无效落子位置 |
| NOT_YOUR_TURN      | 未轮到你行动 |
| GAME_ALREADY_ENDED | 游戏已结束   |
| INVALID_ACTION     | 非法操作类型 |

---

### **协议特点**

1. 使用`type`字段区分消息类型
2. 状态变更后服务器主动推送同步
3. 所有操作需要携带`room_id`和`player_id`
4. 坐标系统建议采用15x15棋盘（坐标范围0-14）
5. 支持断线重连时的状态恢复

需要客户端在连接后首先进行房间操作（创建/加入），之后才能进行游戏相关操作。服务器需要维护房间状态、玩家心跳和游戏逻辑验证。
