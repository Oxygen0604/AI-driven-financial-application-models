import mysql from 'mysql2/promise';

// 数据库配置
const dbConfig = {
    host: 'localhost',     // 数据库主机
    user: 'root',          // 数据库用户名（建议使用实际的用户名）
    password: '123456',          // 数据库密码（如果有）
    database: 'ai_financial_app', // 数据库名称
    charset: 'utf8mb4', // 确保使用 utf8mb4 编码
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

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