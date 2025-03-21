import express from 'express';
import uploadQuesController from '../controllers/uploadQuesController.js';

const router = express.Router();

// 存储用户输入的文本问题
router.post('/upload-question', uploadQuesController.uploadQuestion);

// 获取问题列表
router.get('/questions', uploadQuesController.getQuestions);

// 获取单个问题详情
router.get('/questions/:id', uploadQuesController.getQuestionById);

// 删除问题
router.delete('/questions/:id', uploadQuesController.deleteQuestion);

// 搜索问题
router.get('/search-questions', uploadQuesController.searchQuestions);

export default router;