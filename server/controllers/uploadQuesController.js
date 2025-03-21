import { db } from '../db.js';

// 存储用户输入的问题
const uploadQuestion = async (req, res) => {
    try {
        const { question } = req.body;

        // 检查问题是否为空
        if (!question || question.trim() === '') {
            return res.status(400).json({
                status: 'error',
                message: '问题内容不能为空'
            });
        }

        // 将问题存储到数据库
        const questionId = await db.insertPromise(
            'INSERT INTO user_questions (question_text) VALUES (?)',
            [question.trim()]
        );

        // 返回成功响应
        res.status(200).json({
            status: 'success',
            message: '问题上传成功',
            data: {
                id: questionId, // 返回问题 ID
                question: question.trim() // 返回问题内容
            }
        });
    } catch (error) {
        console.error('问题处理错误:', error);
        res.status(500).json({
            status: 'error',
            message: '问题处理失败',
            error: error.message
        });
    }
};

export default {
    uploadQuestion
};