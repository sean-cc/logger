# SQLite Logger 模块使用手册

## 1. 模块介绍

这是一个基于Node.js和SQLite的轻量级日志模块，具有以下特点：
- 支持多种日志级别：info、warn、error、debug
- 支持添加元数据(meta)信息
- 提供灵活的日志查询接口
- 支持日志备份和数据库空间释放
- 使用SQLite数据库存储，无需额外的数据库服务

## 2. 安装方法

1. 将模块文件复制到您的项目中
2. 安装依赖

```bash
npm install sqlite3
```

## 3. 基本使用

### 3.1 引入模块

```javascript
const Logger = require('./logger');
```

### 3.2 创建日志实例

```javascript
// 使用默认数据库路径 (项目根目录下的logs.db)
const logger = new Logger();

// 或者指定自定义数据库路径
const logger = new Logger('/path/to/your/logs.db');
```

### 3.3 记录日志

```javascript
// 记录info级别日志
await logger.info('应用启动成功', { app: 'my-app', version: '1.0.0' });

// 记录warn级别日志
await logger.warn('内存使用率过高', { usage: '85%' });

// 记录error级别日志
await logger.error('数据库连接失败', { error: 'Connection refused', code: 'ECONNREFUSED' });

// 记录debug级别日志
await logger.debug('用户登录', { userId: '123', username: 'testuser' });
```

### 3.4 查询日志

```javascript
// 查询所有日志 (限制10条)
const allLogs = await logger.query({ limit: 10 });

// 查询error级别日志
const errorLogs = await logger.query({ level: 'error', limit: 10 });

// 按时间范围查询
const startDate = new Date('2025-08-01');
const endDate = new Date('2025-08-10');
const logsInRange = await logger.query({
  startTime: startDate.toISOString().slice(0, 19).replace('T', ' '),
  endTime: endDate.toISOString().slice(0, 19).replace('T', ' '),
  limit: 100
});

// 按元数据查询
const metaLogs = await logger.query({
  meta: { userId: '123' },
  limit: 10
});
```

### 3.5 备份日志

```javascript
// 备份7天前的日志到backup.json文件，并删除已备份的日志
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

### 3.6 关闭数据库连接

```javascript
await logger.close();
```

## 4. API 参考

### 4.1 构造函数

```javascript
new Logger(dbPath)
```
- `dbPath` (可选): 数据库文件路径，默认为项目根目录下的`logs.db`

### 4.2 日志记录方法

```javascript
logger.log(level, message, meta)
logger.info(message, meta)
logger.warn(message, meta)
logger.error(message, meta)
logger.debug(message, meta)
```
- `level`: 日志级别 (string)
- `message`: 日志消息 (string)
- `meta` (可选): 元数据 (object)
- 返回: Promise 对象

### 4.3 日志查询方法

```javascript
logger.query(options)
```
- `options`: 查询选项 (object)
  - `level` (可选): 日志级别过滤
  - `startTime` (可选): 开始时间 (格式: 'YYYY-MM-DD HH:MM:SS')
  - `endTime` (可选): 结束时间 (格式: 'YYYY-MM-DD HH:MM:SS')
  - `limit` (可选): 结果数量限制
  - `meta` (可选): 元数据过滤对象，例如 { userId: '123' }
- 返回: Promise 对象，解析为日志数组

### 4.4 日志备份方法

```javascript
logger.backupLogs(backupPath, beforeDate, deleteAfterBackup)
```
- `backupPath`: 备份文件路径 (string)
- `beforeDate`: 备份此日期之前的日志 (Date 对象)
- `deleteAfterBackup` (可选): 是否删除已备份的日志，默认为`false`
- 返回: Promise 对象，解析为备份结果
  - `backupFile`: 备份文件路径
  - `backedUpCount`: 备份的日志数量
  - `deletedCount`: 删除的日志数量 (如果`deleteAfterBackup`为`true`)

### 4.5 数据库空间释放方法

```javascript
logger.vacuumDatabase()
```
- 返回: Promise 对象

### 4.6 关闭数据库连接

```javascript
logger.close()
```
- 返回: Promise 对象

## 5. 完整示例

```javascript
const Logger = require('./logger');
const path = require('path');

// 创建日志器实例
const logger = new Logger();

// 示例：记录日志和备份
async function runExample() {
  try {
    // 记录不同级别的日志
    await logger.info('应用启动成功', { app: 'my-app', version: '1.0.0' });
    await logger.warn('内存使用率过高', { usage: '85%' });
    await logger.error('数据库连接失败', { error: 'Connection refused', code: 'ECONNREFUSED' });
    await logger.debug('用户登录', { userId: '123', username: 'testuser' });

    console.log('日志记录成功');

    // 查询日志
    console.log('\n查询所有日志:');
    const allLogs = await logger.query({ limit: 10 });
    console.log(allLogs);

    // 备份日志
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const backupResult = await logger.backupLogs(
      path.join(__dirname, 'backup.json'),
      oneDayAgo,
      false // 不删除已备份的日志
    );
    
    console.log('\n备份结果:');
    console.log(`备份文件: ${backupResult.backupFile}`);
    console.log(`备份日志数量: ${backupResult.backedUpCount}`);
  } catch (err) {
    console.error('发生错误:', err);
  } finally {
    // 关闭数据库连接
    await logger.close();
  }
}

// 运行示例
runExample();
```

## 6. 注意事项

1. 确保在使用完毕后调用`close()`方法关闭数据库连接
2. 备份日志时，建议选择适当的日期范围，避免备份过大的文件
3. 定期使用`vacuumDatabase()`方法可以释放数据库未使用的空间
4. 元数据会被序列化为JSON字符串存储，查询时会自动解析为对象
5. 本模块使用SQLite数据库，适合中小型应用，不建议用于高并发场景