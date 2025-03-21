import { db } from '../db.js';

// 从数据库中提取 AI 生成的答案
const extractAIResponse = async (req, res) => {
    try {
        const { questionId } = req.params;

        // 检查问题 ID 是否为空
        if (!questionId) {
            return res.status(400).json({
                status: 'error',
                message: '问题 ID 不能为空'
            });
        }

        // 查询数据库中与问题 ID 匹配的 AI 答案
        const responses = await db.queryPromise(`
            SELECT 
                r.id AS response_id,
                r.response_text,
                r.created_at AS response_time,
                q.question_text,
                q.created_at AS question_time
            FROM ai_responses r
            INNER JOIN user_questions q ON r.question_id = q.id
            WHERE r.question_id = ?
            ORDER BY r.created_at DESC
        `, [questionId]);

        // 检查是否找到答案
        if (responses.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: '未找到与问题 ID 匹配的 AI 答案'
            });
        }

        // 返回 AI 生成的答案
        res.status(200).json({
            status: 'success',
            data: responses.map(response => ({
                responseId: response.response_id,
                question: response.question_text,
                response: response.response_text,
                questionTime: response.question_time,
                responseTime: response.response_time
            }))
        });
    } catch (error) {
        console.error('提取 AI 答案失败:', error);
        res.status(500).json({
            status: 'error',
            message: '提取 AI 答案失败',
            error: error.message
        });
    }
};

export default {
    extractAIResponse
};