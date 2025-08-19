# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于Node.js和SQLite的轻量级日志模块项目。主要功能包括：

- 多级别日志记录（info、warn、error、debug）
- 支持元数据和会话ID
- 灵活的日志查询接口
- 日志备份和数据库空间管理
- 使用SQLite数据库存储，无需额外数据库服务

## 核心架构

### 主要文件结构
- `logger.js` - 核心Logger类实现
- `example.js` - 基本使用示例
- `session-example.js` - 会话ID功能示例
- `logs.db` - SQLite数据库文件（已在.gitignore中排除）

### Logger类核心方法
- `log(level, message, meta)` - 基础日志记录方法
- `info/warn/error/debug(message, meta)` - 便捷的级别特定方法
- `query(options)` - 灵活的日志查询接口
- `backupLogs(backupPath, beforeDate, deleteAfterBackup)` - 日志备份功能
- `vacuumDatabase()` - 数据库空间优化
- `getSessionId()/setSessionId()` - 会话ID管理

### 数据库架构
使用SQLite数据库，包含`logs`表：
- `id` - 主键
- `timestamp` - 时间戳
- `level` - 日志级别
- `message` - 日志消息
- `meta` - JSON格式的元数据
- `session_id` - 会话ID

## 开发命令

### 安装依赖
```bash
npm install sqlite3
```

### 运行示例
```bash
node example.js
node session-example.js
```

### 测试
当前项目没有配置测试框架，package.json中的测试脚本为默认占位符。

## 关键特性

### 会话ID管理
- 每个Logger实例自动生成唯一会话ID
- 支持手动设置会话ID
- 可按会话ID查询相关日志

### 元数据查询
- 使用SQLite的JSON_EXTRACT函数查询JSON字段
- 支持复杂的元数据过滤条件

### 日志备份
- 支持按日期范围备份日志
- 可选择备份后删除原日志
- 自动执行VACUUM优化数据库空间

## 使用约定

### 数据库连接
- 默认使用项目根目录下的`logs.db`文件
- 构造函数支持自定义数据库路径
- 记得在应用结束时调用`close()`方法

### 错误处理
- 所有异步方法都返回Promise
- 建议使用try-catch包装异步调用
- 示例代码展示了完整的错误处理模式

### 元数据格式
- 元数据以JSON格式存储
- 查询时自动解析为JavaScript对象
- 支持嵌套对象结构