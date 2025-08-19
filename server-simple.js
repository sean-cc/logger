const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');
const Logger = require('./logger');

const port = 3000;

// 创建日志器实例
const logger = new Logger();

// MIME类型映射
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon'
};

// 处理静态文件请求
function serveStaticFile(filePath, response) {
    const extname = path.extname(filePath);
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                response.writeHead(404, { 'Content-Type': 'text/html' });
                response.end('<h1>404 Not Found</h1>');
            } else {
                response.writeHead(500, { 'Content-Type': 'text/html' });
                response.end('<h1>500 Internal Server Error</h1>');
            }
        } else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(data);
        }
    });
}

// 处理API请求
async function handleApiRequest(request, response) {
    const parsedUrl = url.parse(request.url);
    const pathname = parsedUrl.pathname;
    
    // 设置CORS头
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (request.method === 'OPTIONS') {
        response.writeHead(200);
        response.end();
        return;
    }
    
    if (pathname === '/api/logs' && request.method === 'POST') {
        try {
            let body = '';
            request.on('data', chunk => {
                body += chunk.toString();
            });
            
            request.on('end', async () => {
                try {
                    const queryOptions = JSON.parse(body);
                    
                    // 验证查询参数
                    if (queryOptions.meta && typeof queryOptions.meta === 'string') {
                        try {
                            queryOptions.meta = JSON.parse(queryOptions.meta);
                        } catch (e) {
                            response.writeHead(400, { 'Content-Type': 'application/json' });
                            response.end(JSON.stringify({ error: '元数据格式错误，请提供有效的JSON格式' }));
                            return;
                        }
                    }
                    
                    // 执行查询
                    const logs = await logger.query(queryOptions);
                    
                    response.writeHead(200, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify(logs));
                } catch (error) {
                    console.error('查询日志失败:', error);
                    response.writeHead(500, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({ error: '查询日志失败: ' + error.message }));
                }
            });
        } catch (error) {
            console.error('处理请求失败:', error);
            response.writeHead(500, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: '处理请求失败: ' + error.message }));
        }
    } else if (pathname === '/api/logs/stats' && request.method === 'GET') {
        try {
            const stats = await getLogStats();
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify(stats));
        } catch (error) {
            console.error('获取统计信息失败:', error);
            response.writeHead(500, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: '获取统计信息失败: ' + error.message }));
        }
    } else if (pathname === '/api/logs/sessions' && request.method === 'GET') {
        try {
            const sessions = await getSessionList();
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify(sessions));
        } catch (error) {
            console.error('获取会话列表失败:', error);
            response.writeHead(500, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: '获取会话列表失败: ' + error.message }));
        }
    } else {
        response.writeHead(404, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'API端点不存在' }));
    }
}

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

// 创建HTTP服务器
const server = http.createServer(async (request, response) => {
    const parsedUrl = url.parse(request.url);
    const pathname = parsedUrl.pathname;
    
    // 处理API请求
    if (pathname.startsWith('/api/')) {
        await handleApiRequest(request, response);
        return;
    }
    
    // 处理静态文件请求
    let filePath = pathname === '/' ? './log-viewer.html' : '.' + pathname;
    
    // 确保文件路径安全
    filePath = path.resolve(filePath);
    if (!filePath.startsWith(path.resolve('.'))) {
        response.writeHead(403, { 'Content-Type': 'text/html' });
        response.end('<h1>403 Forbidden</h1>');
        return;
    }
    
    serveStaticFile(filePath, response);
});

// 启动服务器
server.listen(port, () => {
    console.log(`🚀 日志查询系统启动成功！`);
    console.log(`📱 访问地址: http://localhost:${port}`);
    console.log(`📊 API地址: http://localhost:${port}/api/logs`);
    console.log(`🔧 按 Ctrl+C 停止服务器`);
});

// 优雅关闭
process.on('SIGINT', async () => {
    console.log('\n🛑 正在关闭服务器...');
    await logger.close();
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 正在关闭服务器...');
    await logger.close();
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});