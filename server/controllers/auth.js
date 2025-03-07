import {db} from "../db.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import nodemailer from "nodemailer";

export const register =(req,res)=>{
    const q = "SELECT * FROM users WHERE email = ? OR username = ?"
    db.query(q,[req.body.email,req.body.username],(err,data)=>{
        if(err) return res.json(err)
        if(data.length) return res.status(409).json({ 
            status: "error",
            message: "用户已存在（邮箱或用户名重复）" 
          })
        const salt = bcrypt.genSaltSync(10)
        const hash = bcrypt.hashSync(req.body.password,salt)

        const q = "INSERT INTO users(`nickname`,`username`,`email`,`password`) VALUES (?)"
        const values =[
            req.body.nickname,
            req.body.username,
            req.body.email,
            hash,
        ]
        db.query(q,[values],(err,data)=>{
            if(err) return res.json(err)
            return res.status(200).json("用户创建成功！")
        })
    })
}
export const login =async (req,res)=>{
    
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        status: "error",
        message: "必须提供登录标识（邮箱/用户名）和密码"
      });
    }

    const isEmail = /\S+@\S+\.\S+/.test(identifier);
    const queryField = isEmail ? 'email' : 'username';
    
    const q = `SELECT * FROM users WHERE ${queryField} = ?`;
    

   const [data] = await new Promise((resolve, reject) => {
    db.query(q, [identifier], (err, data) => {
      err ? reject(err) : resolve(data);
    });
  });


  if (!data || data.length === 0) {
    return res.status(404).json({
      status: "error",
      message: "用户不存在"
    });
  }

  const isPasswordCorrect = await bcrypt.compare(password, data.password);
  if (!isPasswordCorrect) {
    return res.status(401).json({ 
      status: "error",
      message: "密码错误" 
    });
  }
  
  const token = jwt.sign({id:data.id},"jwtkey")
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


}
export const logout =(req,res)=>{

}
// 邮件发送配置
const transporter = nodemailer.createTransport({
    service: 'QQ',
    auth: {
        user: '2245274685@qq.com',
        pass: 'dzguguzxeafyeafe'
    }
});

// 新增密码找回相关方法
export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    // 1. 验证邮箱是否存在
    const checkUser = "SELECT * FROM users WHERE email = ?";
    const [user] = await new Promise((resolve, reject) => {
        db.query(checkUser, [email], (err, data) => {
            err ? reject(err) : resolve(data);
        });
    });

    if (!user) {
        return res.status(404).json({
            status: "error",
            message: "该邮箱未注册"
        });
    }

    // 2. 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const createdAt = new Date(Date.now());
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15分钟有效期

    // 3. 存储到数据库
    const updateCode = `
    UPDATE users 
    SET code = ?, expires_at = ?, created_at = ?
    WHERE email = ?  -- 通过邮箱定位目标行
    `;

    try {
        await new Promise((resolve, reject) => {
            db.query(updateCode, [code, expiresAt,createdAt, email], (err) => {
                err ? reject(err) : resolve();
            });
        });

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

    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            message: "服务器错误"
        });
    }
};

export const resetPassword = async (req, res) => {
    const { email,verificationCode, newPassword } = req.body;

    try {
        
    // 1. 查询最新验证码
    const checkCode = "SELECT * FROM users WHERE email = ? ";
    const [result] = await new Promise((resolve, reject) => {
        db.query(checkCode, [email], (err, data) => {
            err ? reject(err) : resolve(data);
        });
    });

    // 2. 验证有效性
    if (!result.code) {
        return res.status(400).json({
            status: "error",
            message: "请先获取验证码"
        });
    }

    if (new Date() > new Date(result.expires_at)) {
        return res.status(400).json({
            status: "error",
            message: "验证码已过期"
        });
    }

    if (result.code !== verificationCode) {
        return res.status(400).json({
            status: "error",
            message: "验证码错误"
        });
    }

    
        // 4. 更新密码
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(newPassword, salt);

        // 5. 清除验证记录
        const updateQuery = `
            UPDATE users 
            SET 
                code = NULL, 
                created_at = NULL, 
                expires_at = NULL,
                password = ?  
            WHERE email = ?
        `;
        await new Promise((resolve, reject) => {
            db.query(updateQuery, [newPassword,email], (err) => {
                err ? reject(err) : resolve();
            });
        });

        res.status(200).json({
            status: "success",
            message: "密码重置成功"
        });

    } catch (err) {
        console.error(err);
        res.status(401).json({
            status: "error",
            message: "服务器出错，请稍后再试"
        });
    }
};

// 添加到原有导出对象
export default { register, login, logout, forgotPassword, resetPassword };
