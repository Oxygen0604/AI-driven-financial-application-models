import express from 'express';
import extractResponseController from '../controllers/extractResponseController.js';

const router = express.Router();

// 提取 AI 生成的答案
router.get('/extract-response/:questionId', extractResponseController.extractAIResponse);

export default router;