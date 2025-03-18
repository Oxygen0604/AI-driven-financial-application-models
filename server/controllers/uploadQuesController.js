import { db } from '../db.js';

// 存储用户输入的文本问题
const uploadQuestion = async (req, res) => {
    try {
        const { question } = req.body;

        if (!question || question.trim() === '') {
            return res.status(400).json({
                status: 'error',
                message: '问题内容不能为空'
            });
        }

        // 将问题存储到数据库
        const [result] = await db.queryPromise(
            `INSERT INTO questions (
                question_text
            ) VALUES (?)`,
            [question.trim()]
        );

        res.status(200).json({
            status: 'success',
            message: '问题上传成功',
            data: {
                id: result.insertId,
                question: question.trim()
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

// 获取问题列表
const getQuestions = async (req, res) => {
    try {
        const [questions] = await db.queryPromise(`
            SELECT 
                id, 
                question_text, 
                created_at 
            FROM questions 
            ORDER BY created_at DESC
        `);

        res.status(200).json({
            status: 'success',
            data: questions
        });
    } catch (error) {
        console.error('获取问题列表失败:', error);
        res.status(500).json({
            status: 'error',
            message: '获取问题列表失败',
            error: error.message
        });
    }
};

// 获取单个问题详情
const getQuestionById = async (req, res) => {
    try {
        const { id } = req.params;

        // 查询问题详情
        const [questions] = await db.queryPromise(`
            SELECT 
                id, 
                question_text, 
                created_at 
            FROM questions 
            WHERE id = ?
        `, [id]);

        // 检查问题是否存在
        if (questions.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: '问题不存在'
            });
        }

        // 返回问题详情
        res.status(200).json({
            status: 'success',
            data: questions[0]
        });
    } catch (error) {
        console.error('获取问题详情失败:', error);
        res.status(500).json({
            status: 'error',
            message: '获取问题详情失败',
            error: error.message
        });
    }
};

// 删除问题
const deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;

        // 先检查问题是否存在
        const [questions] = await db.queryPromise(
            'SELECT id FROM questions WHERE id = ?',
            [id]
        );

        if (questions.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: '问题不存在'
            });
        }

        // 删除数据库记录
        await db.queryPromise('DELETE FROM questions WHERE id = ?', [id]);

        res.status(200).json({
            status: 'success',
            message: '问题删除成功'
        });
    } catch (error) {
        console.error('删除问题失败:', error);
        res.status(500).json({
            status: 'error',
            message: '删除问题失败',
            error: error.message
        });
    }
};

// 搜索问题
const searchQuestions = async (req, res) => {
    try {
        const { query: searchQuery } = req.query;

        if (!searchQuery || searchQuery.trim() === '') {
            return res.status(400).json({
                status: 'error',
                message: '搜索关键词不能为空'
            });
        }

        const [questions] = await db.queryPromise(`
            SELECT 
                id, 
                question_text, 
                created_at 
            FROM questions 
            WHERE question_text LIKE ? 
            ORDER BY created_at DESC
        `, [`%${searchQuery}%`]);

        res.status(200).json({
            status: 'success',
            count: questions.length,
            data: questions
        });
    } catch (error) {
        console.error('搜索问题失败:', error);
        res.status(500).json({
            status: 'error',
            message: '搜索问题失败',
            error: error.message
        });
    }
};

export default {
    uploadQuestion,
    getQuestions,
    getQuestionById,
    deleteQuestion,
    searchQuestions
};