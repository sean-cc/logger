const express = require('express');
const path = require('path');
const Logger = require('./logger');

const app = express();
const port = 3000;

// 中间件
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 创建日志器实例
const logger = new Logger();

// API路由
app.post('/api/logs', async (req, res) => {
    try {
        const queryOptions = req.body;
        
        // 验证查询参数
        if (queryOptions.meta && typeof queryOptions.meta === 'string') {
            try {
                queryOptions.meta = JSON.parse(queryOptions.meta);
            } catch (e) {
                return res.status(400).json({ error: '元数据格式错误，请提供有效的JSON格式' });
            }
        }

        // 执行查询
        const logs = await logger.query(queryOptions);
        
        res.json(logs);
    } catch (error) {
        console.error('查询日志失败:', error);
        res.status(500).json({ error: '查询日志失败: ' + error.message });
    }
});

// 获取日志级别统计
app.get('/api/logs/stats', async (req, res) => {
    try {
        const stats = await getLogStats();
        res.json(stats);
    } catch (error) {
        console.error('获取统计信息失败:', error);
        res.status(500).json({ error: '获取统计信息失败: ' + error.message });
    }
});

// 获取会话ID列表
app.get('/api/logs/sessions', async (req, res) => {
    try {
        const sessions = await getSessionList();
        res.json(sessions);
    } catch (error) {
        console.error('获取会话列表失败:', error);
        res.status(500).json({ error: '获取会话列表失败: ' + error.message });
    }
});

// 辅助函数：获取日志统计信息
async function getLogStats() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                level,
                COUNT(*) as count,
                MIN(timestamp) as earliest,
                MAX(timestamp) as latest
            FROM logs 
            GROUP BY level
            ORDER BY count DESC
        `;
        
        logger.db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// 辅助函数：获取会话列表
async function getSessionList() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT DISTINCT session_id, 
                   COUNT(*) as log_count,
                   MIN(timestamp) as first_log,
                   MAX(timestamp) as last_log
            FROM logs 
            GROUP BY session_id 
            ORDER BY last_log DESC
            LIMIT 100
        `;
        
        logger.db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// 主页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'log-viewer.html'));
});

// 启动服务器
app.listen(port, () => {
    console.log(`🚀 日志查询系统启动成功！`);
    console.log(`📱 访问地址: http://localhost:${port}`);
    console.log(`📊 API地址: http://localhost:${port}/api/logs`);
    console.log(`🔧 按 Ctrl+C 停止服务器`);
});

// 优雅关闭
process.on('SIGINT', async () => {
    console.log('\n🛑 正在关闭服务器...');
    await logger.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 正在关闭服务器...');
    await logger.close();
    process.exit(0);
});