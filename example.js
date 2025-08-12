const Logger = require('./logger');
const path = require('path');

// 创建日志器实例
const logger = new Logger();

// 示例：记录不同级别的日志
async function logExamples() {
  try {
    await logger.info('应用启动成功', { app: 'my-app', version: '1.0.0' });
    await logger.warn('内存使用率过高', { usage: '85%' });
    await logger.error('数据库连接失败', { error: 'Connection refused', code: 'ECONNREFUSED' });
    await logger.debug('用户登录', { userId: '123', username: 'testuser' });

    console.log('日志记录成功');

    // 示例：查询日志
    console.log('\n查询所有日志:');
    const allLogs = await logger.query({ limit: 10 });
    console.log(allLogs);

    console.log('\n查询错误级别日志:');
    const errorLogs = await logger.query({ level: 'error', limit: 10 });
    console.log(errorLogs);

    console.log('\n按元数据查询日志 (userId = 123):');
    const metaLogs = await logger.query({
      meta: { userId: '123' },
      limit: 10
    });
    console.log(metaLogs);

    // 不关闭数据库连接，留待备份完成后关闭
  } catch (err) {
    console.error('发生错误:', err);
    // 发生错误时关闭连接
    await logger.close();
  }
}

// 备份日志示例
async function backupExample() {
  try {
    // 备份7天前的日志到backup.json文件，并删除已备份的日志
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const backupResult = await logger.backupLogs(
      path.join(__dirname, 'backup.json'),
      sevenDaysAgo,
      true
    );
    
    console.log('\n备份结果:');
    console.log(`备份文件: ${backupResult.backupFile}`);
    console.log(`备份日志数量: ${backupResult.backedUpCount}`);
    console.log(`删除日志数量: ${backupResult.deletedCount || 0}`);
  } catch (err) {
    console.error('备份过程中发生错误:', err);
  } finally {
    // 无论成功失败，都关闭数据库连接
    await logger.close();
  }
}

// 运行示例
logExamples().then(backupExample);