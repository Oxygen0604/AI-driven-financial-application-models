import express from 'express';
import chatController from '../controllers/chatController.js';

const router = express.Router();

// 处理用户聊天请求
router.post('/chat', chatController.chatWithBot);

// 获取AI回答
router.get('/chat/:questionId', chatController.getAIResponse);

export default router;