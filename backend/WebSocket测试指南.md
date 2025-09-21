# WebSocket 实时功能测试指南

## 🚀 Socket.io 集成概述

### 已实现功能
- ✅ **实时通知系统** - 点赞、评论、归档通知
- ✅ **在线用户管理** - 用户在线状态追踪
- ✅ **实时数据更新** - 灵感创建、更新实时推送
- ✅ **房间管理** - 用户分组和主题讨论
- ✅ **打字状态** - 实时打字提示
- ✅ **系统广播** - 管理员公告推送

### 技术特性
- **多房间支持** - 全局房间、用户专属房间、主题房间
- **自动重连** - 网络断开自动重连机制
- **错误处理** - 完善的错误捕获和处理
- **性能优化** - 合理的心跳检测和超时设置

## 🔌 连接测试

### 1. 基础连接测试

创建HTML测试页面：

```html
<!DOCTYPE html>
<html>
<head>
    <title>WebSocket测试</title>
    <script src="https://cdn.socket.io/4.7.4/socket.io.min.js"></script>
</head>
<body>
    <div id="status">未连接</div>
    <div id="messages"></div>
    
    <script>
        // 连接Socket.io服务器
        const socket = io('http://localhost:3001', {
            transports: ['websocket', 'polling']
        });

        const statusDiv = document.getElementById('status');
        const messagesDiv = document.getElementById('messages');

        function addMessage(message) {
            messagesDiv.innerHTML += '<p>' + new Date().toLocaleTimeString() + ': ' + message + '</p>';
        }

        // 连接事件
        socket.on('connect', () => {
            statusDiv.innerHTML = '已连接 - ID: ' + socket.id;
            addMessage('✅ 连接成功');
            
            // 用户加入
            socket.emit('user:join', {
                userId: 'test_user_' + Date.now(),
                userName: '测试用户'
            });
        });

        // 用户连接确认
        socket.on('user:connected', (data) => {
            addMessage('👋 用户连接确认: ' + JSON.stringify(data));
        });

        // 在线用户数更新
        socket.on('stats:online_users', (data) => {
            addMessage('👥 在线用户数: ' + data.count);
        });

        // 接收通知
        socket.on('notification:new', (data) => {
            addMessage('🔔 新通知: ' + data.title);
        });

        // 数据更新
        socket.on('data:update', (data) => {
            addMessage('📊 数据更新: ' + data.type);
        });

        // 断开连接
        socket.on('disconnect', () => {
            statusDiv.innerHTML = '已断开连接';
            addMessage('❌ 连接断开');
        });

        // 错误处理
        socket.on('error', (error) => {
            addMessage('❌ 错误: ' + error.message);
        });
    </script>
</body>
</html>
```

### 2. 命令行测试（使用wscat）

```bash
# 安装wscat
npm install -g wscat

# 连接测试
wscat -c "ws://localhost:3001/socket.io/?EIO=4&transport=websocket"
```

## 📡 API接口测试

### 1. 通知相关接口

```bash
# 获取用户通知列表
curl "http://localhost:3001/api/notifications?page=1&limit=10" \
  -H "X-User-ID: user_001"

# 获取未读通知数
curl "http://localhost:3001/api/notifications/unread-count" \
  -H "X-User-ID: user_001"

# 标记通知为已读
curl -X PUT "http://localhost:3001/api/notifications/notif_123/read" \
  -H "X-User-ID: user_001"

# 标记所有通知为已读
curl -X PUT "http://localhost:3001/api/notifications/read-all" \
  -H "X-User-ID: user_001"

# 获取连接状态
curl "http://localhost:3001/api/notifications/connection-status" \
  -H "X-User-ID: user_001"

# 发送测试通知
curl -X POST "http://localhost:3001/api/notifications/test" \
  -H "X-User-ID: user_001"

# 发送系统广播（需要管理员权限）
curl -X POST "http://localhost:3001/api/notifications/broadcast" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: admin_user" \
  -d '{
    "title": "系统维护通知",
    "message": "系统将在今晚22:00进行维护，预计持续2小时",
    "metadata": {"priority": "high"}
  }'
```

### 2. 实时事件触发测试

```bash
# 创建灵感（会触发实时更新）
curl -X POST "http://localhost:3001/api/ideas" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: user_002" \
  -H "X-User-Name: 测试用户2" \
  -d '{
    "content": "测试实时功能：这是一个用于测试WebSocket的灵感",
    "tags": ["测试", "WebSocket", "实时"]
  }'

# 点赞灵感（会触发通知和实时更新）
curl -X POST "http://localhost:3001/api/ideas/[IDEA_ID]/like" \
  -H "X-User-ID: user_003" \
  -H "X-User-Name: 测试用户3"

# 评论灵感（会触发通知和实时更新）
curl -X POST "http://localhost:3001/api/ideas/[IDEA_ID]/comments" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: user_004" \
  -H "X-User-Name: 测试用户4" \
  -d '{
    "content": "这是一个测试评论，用于验证实时通知功能"
  }'
```

## 🎯 Socket.io 事件说明

### 客户端发送事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `user:join` | `{userId, userName}` | 用户加入系统 |
| `room:join` | `roomId` | 加入特定房间 |
| `room:leave` | `roomId` | 离开特定房间 |
| `typing:start` | `{roomId}` | 开始打字 |
| `typing:stop` | `{roomId}` | 停止打字 |

### 服务端推送事件

| 事件名 | 数据格式 | 说明 |
|--------|----------|------|
| `user:connected` | `{message, userId, onlineCount}` | 用户连接确认 |
| `stats:online_users` | `{count}` | 在线用户数更新 |
| `notification:new` | 通知对象 | 新通知推送 |
| `notification:broadcast` | 广播对象 | 系统广播 |
| `data:update` | `{type, data, timestamp}` | 实时数据更新 |
| `room:user_joined` | `{userId, timestamp}` | 用户加入房间 |
| `typing:user_typing` | `{userId, userName, timestamp}` | 用户正在打字 |
| `typing:user_stopped` | `{userId, timestamp}` | 用户停止打字 |

## 🧪 完整测试流程

### 1. 多用户连接测试

1. 打开多个浏览器标签页或窗口
2. 每个页面使用不同的 `userId` 连接
3. 观察在线用户数的实时更新

### 2. 通知功能测试

1. 用户A创建灵感
2. 用户B点赞灵感
3. 验证用户A收到点赞通知
4. 用户C评论灵感
5. 验证用户A收到评论通知

### 3. 实时数据更新测试

1. 用户A创建灵感
2. 验证所有连接的用户收到数据更新事件
3. 用户B点赞灵感
4. 验证所有用户看到点赞数实时更新

### 4. 房间功能测试

1. 多个用户加入同一个房间
2. 一个用户开始打字
3. 验证房间内其他用户收到打字状态
4. 用户离开房间
5. 验证不再收到该房间的消息

## 📊 性能测试

### 1. 并发连接测试

```javascript
// 模拟多个连接
for (let i = 0; i < 100; i++) {
    const socket = io('http://localhost:3001');
    socket.emit('user:join', {
        userId: `test_user_${i}`,
        userName: `测试用户${i}`
    });
}
```

### 2. 消息频率测试

```javascript
// 快速发送消息测试
setInterval(() => {
    socket.emit('typing:start', { roomId: 'test_room' });
    setTimeout(() => {
        socket.emit('typing:stop', { roomId: 'test_room' });
    }, 100);
}, 500);
```

## 🔍 故障排查

### 常见问题

1. **连接失败**
   - 检查端口是否正确 (3001)
   - 确认服务器已启动
   - 查看CORS配置

2. **事件不触发**
   - 检查事件名是否正确
   - 确认用户已正确加入
   - 查看服务器日志

3. **通知不显示**
   - 确认用户ID正确
   - 检查通知服务是否正常
   - 验证房间加入状态

### 调试方法

```javascript
// 启用Socket.io调试
localStorage.debug = 'socket.io-client:socket';

// 监听所有事件
socket.onAny((event, ...args) => {
    console.log('事件:', event, '数据:', args);
});
```

### 服务器日志

启动时会看到类似日志：
```
✅ Socket.io服务初始化成功
🔗 Socket连接: abc123
👋 用户 测试用户(user_001) 已连接，在线用户数: 1
📤 用户 abc123 离开房间: test_room
📥 用户 abc123 加入房间: test_room
👋 用户 测试用户(user_001) 已断开连接，在线用户数: 0
```

## 🎉 测试成功标志

当以下功能正常工作时，说明WebSocket系统运行正常：

✅ 用户可以正常连接和断开  
✅ 在线用户数实时更新  
✅ 点赞和评论触发实时通知  
✅ 数据变化实时推送到所有客户端  
✅ 房间功能正常工作  
✅ 系统广播可以发送  
✅ 错误处理正确  

**恭喜！您的实时功能系统已经准备就绪！** 🚀
