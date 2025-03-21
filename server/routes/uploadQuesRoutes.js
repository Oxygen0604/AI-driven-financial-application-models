import express from 'express';
import uploadQuesController from '../controllers/uploadQuesController.js';

const router = express.Router();

// 存储用户输入的问题
router.post('/upload-question', uploadQuesController.uploadQuestion);

export default router;