import {db} from "../db.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import nodemailer from "nodemailer";

export const register = async (req, res) => {
    try {
        // 记录注册尝试（忽略敏感信息）
        console.log("注册尝试:", {
            username: req.body.username,
            email: req.body.email,
            nickname: req.body.nickname
        });

        // 验证请求数据
        if (!req.body.username || !req.body.email || !req.body.password || !req.body.nickname) {
            console.log("注册数据不完整");
            return res.status(400).json({
                status: "error",
                message: "请提供所有必要的注册信息（用户名、邮箱、密码和昵称）"
            });
        }

        // 查询用户是否已存在 - 使用 Promise 方式
        const q = "SELECT * FROM users WHERE email = ? OR username = ?";
        const [existingUsers] = await db.queryPromise(q, [req.body.email, req.body.username]);

        // 检查用户是否已存在
        if (existingUsers.length > 0) {
            console.log("用户已存在:", req.body.email, req.body.username);
            return res.status(409).json({
                status: "error",
                message: "用户已存在（邮箱或用户名重复）"
            });
        }

        // 创建密码哈希
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(req.body.password, salt);

        // 准备插入用户
        console.log("准备创建新用户");
        const insertQuery = "INSERT INTO users(`nickname`,`username`,`email`,`password`) VALUES (?, ?, ?, ?)";

        // 执行插入操作 - 使用 Promise 方式
        await db.queryPromise(insertQuery, [
            req.body.nickname,
            req.body.username,
            req.body.email,
            hash
        ]);

        console.log("用户创建成功:", req.body.username);
        return res.status(200).json({
            status: "success",
            message: "用户创建成功！"
        });
    } catch (error) {
        console.error("注册过程中发生错误:", error);
        return res.status(500).json({
            status: "error",
            message: "用户创建失败",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const login = async (req, res) => {
    try {
        console.log("登录尝试");

        const { identifier, password } = req.body;

        // 验证输入
        if (!identifier || !password) {
            console.log("登录信息不完整");
            return res.status(400).json({
                status: "error",
                message: "必须提供登录标识（邮箱/用户名）和密码"
            });
        }

        // 确定查询字段（邮箱或用户名）
        const isEmail = /\S+@\S+\.\S+/.test(identifier);
        const queryField = isEmail ? 'email' : 'username';

        console.log(`通过${queryField}查询用户:`, identifier);
        const q = `SELECT * FROM users WHERE ${queryField} = ?`;

        // 查询用户信息 - 使用 Promise 方式
        const [users] = await db.queryPromise(q, [identifier]);

        // 检查用户是否存在
        if (!users || users.length === 0) {
            console.log("用户不存在:", identifier);
            return res.status(404).json({
                status: "error",
                message: "用户不存在"
            });
        }

        const user = users[0]; // 获取找到的用户

        // 验证密码
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            console.log("密码错误:", identifier);
            return res.status(401).json({
                status: "error",
                message: "密码错误"
            });
        }

        // 创建 JWT 令牌
        console.log("登录成功，正在创建 token");
        const token = jwt.sign({id: user.id}, "jwtkey");

        // 设置 cookie 并返回响应
        res
            .cookie("access_token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
            })
            .status(200)
            .json({
                status: "success",
                message: "登录成功",
            });
    } catch (error) {
        console.error("登录过程中发生错误:", error);
        res.status(500).json({
            status: "error",
            message: "登录失败",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const logout = (req, res) => {
    console.log("用户退出登录");
    try {
        res.clearCookie("access_token").status(200).json({
            status: "success",
            message: "成功退出登录"
        });
    } catch (error) {
        console.error("退出登录错误:", error);
        res.status(500).json({
            status: "error",
            message: "退出登录失败"
        });
    }
};

// 邮件发送配置
const transporter = nodemailer.createTransport({
    service: 'QQ',
    auth: {
        user: '2245274685@qq.com',
        pass: 'dzguguzxeafyeafe'
    }
});

// 密码找回相关方法
export const forgotPassword = async (req, res) => {
    try {
        console.log("密码找回请求");

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                status: "error",
                message: "请提供邮箱地址"
            });
        }

        // 验证邮箱是否存在
        console.log("验证邮箱:", email);
        const checkUser = "SELECT * FROM users WHERE email = ?";
        const [users] = await db.queryPromise(checkUser, [email]);

        if (!users || users.length === 0) {
            console.log("邮箱未注册:", email);
            return res.status(404).json({
                status: "error",
                message: "该邮箱未注册"
            });
        }

        // 生成6位验证码
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const createdAt = new Date(Date.now());
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15分钟有效期

        console.log("生成验证码:", code, "有效期:", expiresAt);

        // 存储到数据库
        const updateCode = `
            UPDATE users
            SET code = ?, expires_at = ?, created_at = ?
            WHERE email = ?
        `;

        await db.queryPromise(updateCode, [code, expiresAt, createdAt, email]);

        // 发送验证码邮件
        console.log("发送验证码邮件到:", email);
        await transporter.sendMail({
            from: '2245274685@qq.com',
            to: email,
            subject: '密码重置验证码',
            html: `<p>您的验证码是：<strong>${code}</strong>，15分钟内有效</p>`
        });

        res.status(200).json({
            status: "success",
            message: "验证码已发送"
        });

    } catch (error) {
        console.error("密码找回过程中发生错误:", error);
        res.status(500).json({
            status: "error",
            message: "服务器错误",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const resetPassword = async (req, res) => {
    try {
        console.log("密码重置请求");

        const { email, verificationCode, newPassword } = req.body;

        // 验证输入
        if (!email || !verificationCode || !newPassword) {
            return res.status(400).json({
                status: "error",
                message: "请提供所有必要信息（邮箱、验证码和新密码）"
            });
        }

        // 查询最新验证码
        console.log("查询验证码状态:", email);
        const checkCode = "SELECT * FROM users WHERE email = ?";
        const [users] = await db.queryPromise(checkCode, [email]);

        if (!users || users.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "用户不存在"
            });
        }

        const user = users[0];

        // 验证有效性
        if (!user.code) {
            console.log("未找到验证码:", email);
            return res.status(400).json({
                status: "error",
                message: "请先获取验证码"
            });
        }

        if (new Date() > new Date(user.expires_at)) {
            console.log("验证码已过期:", email);
            return res.status(400).json({
                status: "error",
                message: "验证码已过期"
            });
        }

        if (user.code !== verificationCode) {
            console.log("验证码错误:", email, verificationCode);
            return res.status(400).json({
                status: "error",
                message: "验证码错误"
            });
        }

        // 创建新密码哈希
        console.log("创建新密码哈希");
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(newPassword, salt);

        // 更新密码并清除验证记录
        console.log("更新密码:", email);
        const updateQuery = `
            UPDATE users
            SET
                code = NULL,
                created_at = NULL,
                expires_at = NULL,
                password = ?
            WHERE email = ?
        `;

        await db.queryPromise(updateQuery, [hash, email]);

        console.log("密码重置成功:", email);
        res.status(200).json({
            status: "success",
            message: "密码重置成功"
        });

    } catch (error) {
        console.error("密码重置过程中发生错误:", error);
        res.status(500).json({
            status: "error",
            message: "服务器出错，请稍后再试",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// 导出所有方法
export default { register, login, logout, forgotPassword, resetPassword };