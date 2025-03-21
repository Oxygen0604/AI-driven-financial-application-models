import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

// 读取 JSON 配置
const dbConfig = JSON.parse(
  readFileSync('./config/dbConfig.json', 'utf-8')
);

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 数据库操作对象
export const db = {
    // 执行查询
    queryPromise: async (sql, params = []) => {
        try {
            return await pool.execute(sql, params);
        } catch (error) {
            console.error('数据库查询错误:', error);
            throw error;
        }
    },

    // 关闭连接池
    close: async () => {
        await pool.end();
    }
};

// 单独导出测试连接的函数
export const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        connection.release();
        console.log('数据库连接成功');
        return true;
    } catch (error) {
        console.error('数据库连接失败:', error);
        return false;
    }
};

export default db;