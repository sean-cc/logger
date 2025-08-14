# SQLite Logger 模块使用手册 / SQLite Logger Module User Manual

## 1. 模块介绍 / Module Introduction

这是一个基于Node.js和SQLite的轻量级日志模块，具有以下特点：
This is a lightweight logging module based on Node.js and SQLite with the following features:
- 支持多种日志级别：info、warn、error、debug
- Supports multiple log levels: info, warn, error, debug
- 支持添加元数据(meta)信息
- Supports adding metadata information
- 提供灵活的日志查询接口
- Provides flexible log query interface
- 支持日志备份和数据库空间释放
- Supports log backup and database space release
- 使用SQLite数据库存储，无需额外的数据库服务
- Uses SQLite database storage, no additional database service required
- 支持会话ID功能，可按会话查询日志
- Supports session ID functionality for querying logs by session

## 2. 安装方法 / Installation

1. 将模块文件复制到您的项目中
1. Copy the module files to your project
2. 安装依赖
2. Install dependencies

```bash
npm install sqlite3
```

## 3. 基本使用 / Basic Usage

### 3.1 引入模块 / Import Module

```javascript
const Logger = require('./logger');
```

### 3.2 创建日志实例 / Create Logger Instance

```javascript
// 使用默认数据库路径 (项目根目录下的logs.db)
// Use default database path (logs.db in project root directory)
const logger = new Logger();

// 或者指定自定义数据库路径
// Or specify custom database path
const logger = new Logger('/path/to/your/logs.db');
```

### 3.3 记录日志 / Record Logs

```javascript
// 记录info级别日志
// Record info level log
await logger.info('应用启动成功', { app: 'my-app', version: '1.0.0' });

// 记录warn级别日志
// Record warn level log
await logger.warn('内存使用率过高', { usage: '85%' });

// 记录error级别日志
// Record error level log
await logger.error('数据库连接失败', { error: 'Connection refused', code: 'ECONNREFUSED' });

// 记录debug级别日志
// Record debug level log
await logger.debug('用户登录', { userId: '123', username: 'testuser' });
```

### 3.4 查询日志 / Query Logs

```javascript
// 查询所有日志 (限制10条)
// Query all logs (limit 10)
const allLogs = await logger.query({ limit: 10 });

// 查询error级别日志
// Query error level logs
const errorLogs = await logger.query({ level: 'error', limit: 10 });

// 按时间范围查询
// Query by time range
const startDate = new Date('2025-08-01');
const endDate = new Date('2025-08-10');
const logsInRange = await logger.query({
  startTime: startDate.toISOString().slice(0, 19).replace('T', ' '),
  endTime: endDate.toISOString().slice(0, 19).replace('T', ' '),
  limit: 100
});

// 按元数据查询
// Query by metadata
const metaLogs = await logger.query({
  meta: { userId: '123' },
  limit: 10
});
```

### 3.5 备份日志 / Backup Logs

```javascript
// 备份7天前的日志到backup.json文件，并删除已备份的日志
// Backup logs from 7 days ago to backup.json file and delete backed up logs
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

const backupResult = await logger.backupLogs(
  '/path/to/backup.json',
  sevenDaysAgo,
  true
);

console.log('备份文件:', backupResult.backupFile);
console.log('备份日志数量:', backupResult.backedUpCount);
console.log('删除日志数量:', backupResult.deletedCount);
```

### 3.6 会话ID功能 / Session ID Functionality

```javascript
// 获取当前会话ID
// Get current session ID
const sessionId = logger.getSessionId();
console.log('当前会话ID:', sessionId);

// 设置新的会话ID
// Set new session ID
const newSessionId = logger.setSessionId();
console.log('新会话ID:', newSessionId);

// 或者使用自定义会话ID
// Or use custom session ID
logger.setSessionId('custom-session-id-123');

// 按会话ID查询日志
// Query logs by session ID
const sessionLogs = await logger.query({
  sessionId: sessionId,
  limit: 10
});

sessionLogs.forEach(log => {
  console.log(`${log.timestamp} [${log.level}] ${log.message} (会话ID: ${log.session_id})`);
});
```

### 3.7 关闭数据库连接 / Close Database Connection

```javascript
await logger.close();
```

## 4. API 参考 / API Reference

### 4.1 构造函数 / Constructor

```javascript
new Logger(dbPath)
```
- `dbPath` (可选): 数据库文件路径，默认为项目根目录下的`logs.db`
- `dbPath` (optional): Database file path, default is `logs.db` in project root directory

### 4.2 日志记录方法 / Logging Methods

```javascript
logger.log(level, message, meta)
logger.info(message, meta)
logger.warn(message, meta)
logger.error(message, meta)
logger.debug(message, meta)
```
- `level`: 日志级别 (string)
- `level`: Log level (string)
- `message`: 日志消息 (string)
- `message`: Log message (string)
- `meta` (可选): 元数据 (object)
- `meta` (optional): Metadata (object)
- 返回: Promise 对象
- Returns: Promise object

### 4.3 日志查询方法 / Log Query Method

```javascript
logger.query(options)
```
- `options`: 查询选项 (object)
- `options`: Query options (object)
  - `level` (可选): 日志级别过滤
  - `level` (optional): Log level filter
  - `startTime` (可选): 开始时间 (格式: 'YYYY-MM-DD HH:MM:SS')
  - `startTime` (optional): Start time (format: 'YYYY-MM-DD HH:MM:SS')
  - `endTime` (可选): 结束时间 (格式: 'YYYY-MM-DD HH:MM:SS')
  - `endTime` (optional): End time (format: 'YYYY-MM-DD HH:MM:SS')
  - `limit` (可选): 结果数量限制
  - `limit` (optional): Result count limit
  - `meta` (可选): 元数据过滤对象，例如 { userId: '123' }
  - `meta` (optional): Metadata filter object, e.g. { userId: '123' }
- 返回: Promise 对象，解析为日志数组
- Returns: Promise object, resolves to log array

### 4.4 日志备份方法 / Log Backup Method

```javascript
logger.backupLogs(backupPath, beforeDate, deleteAfterBackup)
```
- `backupPath`: 备份文件路径 (string)
- `backupPath`: Backup file path (string)
- `beforeDate`: 备份此日期之前的日志 (Date 对象)
- `beforeDate`: Backup logs before this date (Date object)
- `deleteAfterBackup` (可选): 是否删除已备份的日志，默认为`false`
- `deleteAfterBackup` (optional): Whether to delete backed up logs, default is `false`
- 返回: Promise 对象，解析为备份结果
- Returns: Promise object, resolves to backup result
  - `backupFile`: 备份文件路径
  - `backupFile`: Backup file path
  - `backedUpCount`: 备份的日志数量
  - `backedUpCount`: Number of backed up logs
  - `deletedCount`: 删除的日志数量 (如果`deleteAfterBackup`为`true`)
  - `deletedCount`: Number of deleted logs (if `deleteAfterBackup` is `true`)

### 4.5 数据库空间释放方法 / Database Space Release Method

```javascript
logger.vacuumDatabase()
```
- 返回: Promise 对象
- Returns: Promise object

### 4.6 会话ID管理方法 / Session ID Management Methods

```javascript
// 获取当前会话ID
// Get current session ID
logger.getSessionId()
```
- 返回: 当前会话ID (string)
- Returns: Current session ID (string)

```javascript
// 设置新的会话ID
// Set new session ID
logger.setSessionId(sessionId)
```
- `sessionId` (可选): 自定义会话ID，如果不提供则自动生成
- `sessionId` (optional): Custom session ID, automatically generated if not provided
- 返回: 新的会话ID (string)
- Returns: New session ID (string)

### 4.7 关闭数据库连接 / Close Database Connection

```javascript
logger.close()
```
- 返回: Promise 对象
- Returns: Promise object

## 5. 完整示例 / Complete Example

```javascript
const Logger = require('./logger');
const path = require('path');

// 创建日志器实例
// Create logger instance
const logger = new Logger();

// 示例：记录日志和备份
// Example: Record logs and backup
async function runExample() {
  try {
    // 记录不同级别的日志
    // Record logs of different levels
    await logger.info('应用启动成功', { app: 'my-app', version: '1.0.0' });
    await logger.warn('内存使用率过高', { usage: '85%' });
    await logger.error('数据库连接失败', { error: 'Connection refused', code: 'ECONNREFUSED' });
    await logger.debug('用户登录', { userId: '123', username: 'testuser' });

    console.log('日志记录成功');
    console.log('Log recording successful');

    // 查询日志
    // Query logs
    console.log('\n查询所有日志:');
    console.log('\nQuery all logs:');
    const allLogs = await logger.query({ limit: 10 });
    console.log(allLogs);

    // 备份日志
    // Backup logs
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const backupResult = await logger.backupLogs(
      path.join(__dirname, 'backup.json'),
      oneDayAgo,
      false // 不删除已备份的日志
      false // Do not delete backed up logs
    );
```