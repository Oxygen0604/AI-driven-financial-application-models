import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import uploadRoutes from './routes/uploadRoutes.js';
import uploadQuesRoutes from "./routes/uploadQuesRoutes.js";
import { db, testConnection } from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// 获取当前目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8800;

// 日志中间件
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// 确保上传目录存在
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('上传目录已创建:', uploadsDir);
}

// 中间件
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// CORS 配置
app.use(cors({
    origin: function (origin, callback) {
        // 允许的前端地址
        const allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:3001',
            'https://localhost:3000'
        ];

        // 如果没有 origin（比如直接调用API）或者在允许列表中
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('不允许的跨域请求'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// 静态文件目录 - 用于访问上传的文件
app.use('/upload', express.static(uploadsDir));

// 路由
console.log('正在配置路由...');
app.use('/api/auth', authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/uploadQues', uploadQuesRoutes);
// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('未捕获的错误:', err);
    res.status(500).json({
        status: 'error',
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 初始化表的函数
const initializeTables = async () => {
    try {
        // 先创建用户表（如果不存在）
        await db.queryPromise(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nickname VARCHAR(100) NOT NULL,
                username VARCHAR(50) NOT NULL UNIQUE,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                code VARCHAR(6),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME,
                created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('用户表初始化成功');

        // 创建文档表（如果不存在）
        await db.queryPromise(`
            CREATE TABLE IF NOT EXISTS documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                original_filename VARCHAR(255) NOT NULL,
                stored_filename VARCHAR(255) NOT NULL,
                original_path VARCHAR(255) NOT NULL,
                txt_path VARCHAR(255) NOT NULL,
                file_type VARCHAR(100) NOT NULL,
                file_size BIGINT NOT NULL,
                text_content LONGTEXT,
                user_id INT,
                upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('文档表初始化成功');

        //如果不存在
        await db.queryPromise(`
        CREATE TABLE if not exists questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`);
        console.log('问题表初始化成功');
        return true;
    } catch (error) {
        console.error('初始化表失败:', error);
        return false;
    }
};

// 启动服务器
const startServer = async () => {
    try {
        // 测试数据库连接
        const connected = await testConnection();
        if (!connected) {
            console.error('无法连接到数据库，服务器启动失败');
            process.exit(1);
        }

        // 初始化数据库表
        await initializeTables();

        // 启动服务器
        app.listen(PORT, () => {
            console.log(`服务器成功运行在端口 ${PORT}`);
            console.log('服务器完全启动，等待请求...');
        });
    } catch (error) {
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
};

// 启动服务器
startServer();

// 优雅关闭
process.on('SIGINT', async () => {
    console.log('正在关闭服务器...');
    try {
        await db.close();
        console.log('数据库连接已关闭');
        process.exit(0);
    } catch (error) {
        console.error('关闭数据库连接出错:', error);
        process.exit(1);
    }
});