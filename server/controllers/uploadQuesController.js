import { db } from '../db.js';
import path from 'path';
import fs from 'fs-extra';

// 存储用户输入的文本问题
const uploadQuestion = async (req, res) => {
    try {
        const date = new Date();
        const timestamp = new Date(date.getTime()+ 8 * 60 * 60 * 1000)
                                    .toISOString()
                                    .replace(/[:.]/g, '-')
                                    .replace('Z', '');
        const filename = `request-${timestamp}.json`;
        
        // 定义保存路径
        const saveDir = path.join('posts', 'saved-requests');
        //await fs.ensureDir(saveDir); // 确保目录存在

        // 保存的内容（包含请求头、请求体、时间戳）
        const requestData = {
        timestamp: timestamp,
        body: req.body,
        };
        console.log(requestData);

        // 写入文件
        await fs.writeJSON(path.join(saveDir, filename), requestData, { spaces: 2 });

        res.status(200).json({
            status: 'success',
            message: '问题已保存',
            filename: filename
          });

    } catch (error) {
        console.error('问题处理错误:', error);
        res.status(500).json({
            status: 'error',
            message: '问题上传失败',
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