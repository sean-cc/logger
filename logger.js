const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Logger {
  constructor(dbPath = path.join(__dirname, 'logs.db')) {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Could not connect to database:', err.message);
      } else {
        console.log('Connected to the SQLite database.');
        this.initTable();
      }
    });
  }

  initTable() {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        level TEXT,
        message TEXT,
        meta TEXT
      );
    `;

    this.db.run(createTableSql, (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      }
    });
  }

  log(level, message, meta = {}) {
    return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO logs (level, message, meta) VALUES (?, ?, ?)';
      this.db.run(sql, [level, message, JSON.stringify(meta)], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  }

  info(message, meta = {}) {
    return this.log('info', message, meta);
  }

  warn(message, meta = {}) {
    return this.log('warn', message, meta);
  }

  error(message, meta = {}) {
    return this.log('error', message, meta);
  }

  debug(message, meta = {}) {
    return this.log('debug', message, meta);
  }

  async query(options = {}) {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM logs WHERE 1=1';
      const params = [];

      if (options.level) {
        sql += ' AND level = ?';
        params.push(options.level);
      }

      if (options.startTime) {
        sql += ' AND timestamp >= ?';
        params.push(options.startTime);
      }

      if (options.endTime) {
        sql += ' AND timestamp <= ?';
        params.push(options.endTime);
      }

      // 处理元数据查询条件
      if (options.meta) {
        for (const [key, value] of Object.entries(options.meta)) {
          // 使用JSON_EXTRACT函数查询JSON字段
          sql += ` AND JSON_EXTRACT(meta, '$.${key}') = ?`;
          params.push(value.toString());
        }
      }

      sql += ' ORDER BY timestamp DESC';

      if (options.limit) {
        sql += ' LIMIT ?';
        params.push(options.limit);
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Parse meta back to object
          rows.forEach(row => {
            try {
              row.meta = JSON.parse(row.meta);
            } catch (e) {
              row.meta = {};
            }
          });
          resolve(rows);
        }
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 备份日志到文件并可选删除已备份日志
   * @param {string} backupPath - 备份文件路径
   * @param {Date} beforeDate - 备份此日期之前的日志
   * @param {boolean} deleteAfterBackup - 是否删除已备份的日志
   * @returns {Promise<{backupFile: string, backedUpCount: number}>}
   */
  async backupLogs(backupPath, beforeDate, deleteAfterBackup = false) {
    return new Promise(async (resolve, reject) => {
      try {
        // 查询要备份的日志
        const logs = await this.query({
          endTime: beforeDate.toISOString().slice(0, 19).replace('T', ' '),
          limit: 0 // 不限制数量
        });

        if (logs.length === 0) {
          resolve({ backupFile: null, backedUpCount: 0 });
          return;
        }

        // 写入备份文件
        const fs = require('fs');
        fs.writeFileSync(backupPath, JSON.stringify(logs, null, 2));

        // 可选删除已备份的日志
        let deletedCount = 0;
        if (deleteAfterBackup) {
          const deleteResult = await new Promise((delResolve, delReject) => {
            this.db.run(
              'DELETE FROM logs WHERE timestamp <= ?',
              [beforeDate.toISOString().slice(0, 19).replace('T', ' ')],
              function(err) {
                if (err) {
                  delReject(err);
                } else {
                  delResolve(this.changes);
                }
              }
            );
          });
          deletedCount = deleteResult;

          // 释放空间
          await this.vacuumDatabase();
        }

        resolve({ backupFile: backupPath, backedUpCount: logs.length, deletedCount });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * 执行VACUUM命令释放数据库未使用空间
   * @returns {Promise<void>}
   */
  vacuumDatabase() {
    return new Promise((resolve, reject) => {
      this.db.run('VACUUM', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

module.exports = Logger;