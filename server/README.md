# AI Financial Application Server

## 项目概述
本服务器端应用是AI驱动的金融应用模型的后端部分，提供了文件处理、用户认证、内容管理等核心功能。

## 技术栈
- Node.js
- Express.js - Web应用框架
- MySQL - 数据库
- Multer - 文件上传处理
- textract, mammoth, xlsx - 文档解析
- Python集成 - 用于PDF和图像处理

## 目录结构
```
server/
├── config/           # 配置文件
│   └── dbConfig.json # 数据库配置
├── controllers/      # 控制器
│   ├── auth.js       # 认证控制器
│   ├── post.js       # 帖子控制器
│   ├── transform.py  # Python文件处理脚本
│   ├── uploadControllers.js    # 文件上传控制器
│   ├── uploadQuesController.js # 问题上传控制器
│   └── user.js      # 用户控制器
├── routes/          # 路由定义
│   ├── auth.js      # 认证路由
│   ├── posts.js     # 帖子路由
│   ├── upload.js    # 上传路由
│   ├── uploadQuesRoutes.js # 问题上传路由
│   └── users.js     # 用户路由
├── db.js           # 数据库连接配置
└── index.js        # 应用入口文件
```

## 环境要求
- Node.js >= 14.x
- MySQL >= 5.7
- Python >= 3.7（用于PDF和图像处理）

## 安装和配置
0.在主文件夹下cd server

1. 安装依赖
```bash
npm install
```

2. 配置数据库
在 `config/dbConfig.json` 中配置MySQL连接信息：
```json
{
  "host": "localhost",
  "user": "your_username",
  "password": "your_password",
  "database": "ai_financial_app",
  "port": 3306
}
```

3. Python环境配置（也可以不创虚拟环境直接下依赖）

首先创建并激活Python虚拟环境：
```bash
# 创建虚拟环境
python -m venv venv

# 在Windows上激活虚拟环境
.\venv\Scripts\activate

# 在Unix/Linux上激活虚拟环境
source venv/bin/activate
```

然后在虚拟环境中安装依赖：
```bash
pip install -r requirements.txt
```

注意：激活虚拟环境后，命令提示符前会出现(venv)前缀，表示当前在虚拟环境中。

## 启动服务器
```bash
npm start
```
服务器默认运行在 http://localhost:5000

## API接口文档

### 认证接口
- POST `/auth/register` - 用户注册
- POST `/auth/login` - 用户登录

### 文件上传接口
- POST `/upload/single` - 上传单个文件
- POST `/upload/multiple` - 上传多个文件
- GET `/upload/files` - 获取已上传文件列表

### 用户管理接口
- GET `/users/profile` - 获取用户信息
- PUT `/users/profile` - 更新用户信息

### 帖子管理接口
- GET `/posts` - 获取帖子列表
- POST `/posts` - 创建新帖子
- GET `/posts/:id` - 获取特定帖子
- PUT `/posts/:id` - 更新帖子
- DELETE `/posts/:id` - 删除帖子

## 文件处理功能
系统支持多种文件格式的处理：
- PDF文档
- Word文档（.doc, .docx）
- Excel表格（.xls, .xlsx）
- 文本文件（.txt, .csv）
- 图片文件（.jpg, .png, .gif等）

## 错误处理
系统实现了统一的错误处理机制：
- 400 - 请求参数错误
- 401 - 未授权访问
- 403 - 禁止访问
- 404 - 资源不存在
- 500 - 服务器内部错误

## 开发指南

### 添加新路由
1. 在 `routes` 目录下创建新的路由文件
2. 在 `controllers` 目录下创建对应的控制器
3. 在 `index.js` 中注册新路由

### 数据库操作
使用 `db.js` 中提供的数据库连接实例进行操作：
```javascript
import { db } from '../db.js';

// 使用Promise方式查询
const [rows] = await db.queryPromise('SELECT * FROM users');
```

### 文件上传
文件上传使用 `multer` 中间件处理，配置在 `uploadControllers.js` 中：
- 默认上传目录：`./uploads`
- 最大文件大小：10MB
- 支持的文件类型在 `fileFilter` 中配置

## 调试指南

### 常见问题
1. 数据库连接失败
   - 检查 `dbConfig.json` 配置是否正确
   - 确保MySQL服务正在运行
   - 验证数据库用户权限

2. 文件上传失败
   - 检查上传目录权限
   - 验证文件大小是否超过限制
   - 确认文件类型是否被支持

3. Python脚本执行错误
   - 确保Python环境正确配置
   - 检查所需Python包是否已安装
   - 验证文件路径是否正确

### 日志
系统使用 `console.log` 和 `console.error` 进行日志记录，建议在生产环境中配置proper日志系统。

## 安全注意事项
1. 确保 `dbConfig.json` 中的数据库凭据安全
2. 所有API端点都应该进行适当的权限验证
3. 文件上传需要进行类型和大小验证
4. 敏感信息应该使用环境变量管理

## 部署
1. 设置生产环境变量
2. 配置反向代理（如Nginx）
3. 使用进程管理器（如PM2）运行应用
4. 配置SSL证书实现HTTPS

## 贡献指南
1. Fork项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证
MIT License