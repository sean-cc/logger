const Logger = require('./logger');

async function runExample() {
  // 创建日志记录器实例
  const logger = new Logger();

  // 获取当前会话ID
  const sessionId = logger.getSessionId();
  console.log('当前会话ID:', sessionId);

  // 记录不同级别的日志
  await logger.info('这是一条信息日志', { user: 'admin', action: 'login' });
  await logger.warn('这是一条警告日志', { user: 'admin', action: 'failed_login' });
  await logger.error('这是一条错误日志', { user: 'admin', action: 'database_error' });

  // 更改会话ID
  const newSessionId = logger.setSessionId();
  console.log('新会话ID:', newSessionId);

  // 用新会话ID记录日志
  await logger.info('这是新会话的信息日志', { user: 'user1', action: 'view_page' });

  // 按会话ID查询日志
  console.log('\n查询第一个会话的日志:');
  const sessionLogs = await logger.query({
    sessionId: sessionId,
    limit: 10
  });
  sessionLogs.forEach(log => {
    console.log(`${log.timestamp} [${log.level}] ${log.message} (会话ID: ${log.session_id})`);
  });

  console.log('\n查询第二个会话的日志:');
  const newSessionLogs = await logger.query({
    sessionId: newSessionId,
    limit: 10
  });
  newSessionLogs.forEach(log => {
    console.log(`${log.timestamp} [${log.level}] ${log.message} (会话ID: ${log.session_id})`);
  });

  // 关闭数据库连接
  await logger.close();
}

runExample().catch(console.error);