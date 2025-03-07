import mysql from "mysql"

export const db = mysql.createPool({
    host:"localhost",
    user:"root",
    password:"123456",
    database:"app_db",
    connectionLimit: 10, // 控制并发连接数
    waitForConnections: true,
    queueLimit: 0
})
db.getConnection((err, connection) => {
    if (err) {
        console.error("连接池初始化失败:", err);
        return;
    }
    console.log("数据库连接池已就绪");
    connection.release(); // 立即释放回连接池
});