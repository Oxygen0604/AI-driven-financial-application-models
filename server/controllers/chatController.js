import { spawn } from 'child_process';
import { db } from '../db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const chatWithBot = async (req, res) => {
    try {
        // 支持message和question字段
        const messageText = req.body.message || req.body.question;

        // 检查消息是否为空
        if (!messageText || messageText.trim() === '') {
            return res.status(400).json({
                status: 'error',
                message: '消息内容不能为空'
            });
        }

        // 将用户消息存储到数据库
        const questionId = await db.insertPromise(
            'INSERT INTO user_questions (question_text) VALUES (?)',
            [messageText.trim()]
        );

        // 构建Python脚本路径
        const scriptPath = path.join(__dirname, '..', '..', 'AI chatbot', 'LLM.py');
        console.log('Python脚本路径:', scriptPath);
        
        // 启动Python脚本进行对话
        const pythonProcess = spawn('python', [
            scriptPath,
            '--model', 'deepseek-chat',
            '--message', messageText.trim()
        ]);
        
        // 检查Python进程是否成功启动
        if (!pythonProcess.pid) {
            console.error('Python进程启动失败');
            return res.status(500).json({
                status: 'error',
                message: 'Python进程启动失败'
            });
        }

        let responseData = '';
        let errorData = '';

        // 收集Python脚本的输出
        pythonProcess.stdout.on('data', (data) => {
            responseData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
        });

        // 处理Python脚本执行完成
        pythonProcess.on('close', async (code) => {
            if (code !== 0) {
                console.error('Python脚本执行错误:', errorData);
                return res.status(500).json({
                    status: 'error',
                    message: '聊天机器人处理失败',
                    error: errorData
                });
            }

            try {
                // 存储AI响应到数据库
                await db.insertPromise(
                    'INSERT INTO ai_responses (question_id, response_text) VALUES (?, ?)',
                    [questionId, responseData.trim()]
                );

                // 返回成功响应
                res.status(200).json({
                    status: 'success',
                    message: '对话成功',
                    data: {
                        id: questionId,
                        question: messageText.trim(),
                        response: responseData.trim()
                    }
                });
            } catch (dbError) {
                console.error('数据库操作错误:', dbError);
                res.status(500).json({
                    status: 'error',
                    message: '保存对话记录失败',
                    error: dbError.message
                });
            }
        });
    } catch (error) {
        console.error('对话处理错误:', error);
        res.status(500).json({
            status: 'error',
            message: '对话处理失败',
            error: error.message
        });
    }
};

// 获取AI回答的方法
const getAIResponse = async (req, res) => {
    try {
        const { questionId } = req.params;

        // 检查问题ID是否为空
        if (!questionId) {
            return res.status(400).json({
                status: 'error',
                message: '问题ID不能为空'
            });
        }

        // 从数据库中获取AI回答
        const responses = await db.queryPromise(
            `SELECT 
                ai_responses.id AS response_id,
                ai_responses.response_text,
                ai_responses.created_at AS response_time,
                user_questions.question_text,
                user_questions.created_at AS question_time
            FROM ai_responses
            INNER JOIN user_questions ON ai_responses.question_id = user_questions.id
            WHERE ai_responses.question_id = ?
            ORDER BY ai_responses.created_at DESC
            LIMIT 1`,
            [questionId]
        );

        // 检查是否找到回答
        if (responses.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: '未找到AI回答'
            });
        }

        // 返回最新的AI回答
        const response = responses[0];
        res.status(200).json({
            status: 'success',
            data: {
                responseId: response.response_id,
                question: response.question_text,
                response: response.response_text,
                questionTime: response.question_time,
                responseTime: response.response_time
            }
        });
    } catch (error) {
        console.error('获取AI回答失败:', error);
        res.status(500).json({
            status: 'error',
            message: '获取AI回答失败',
            error: error.message
        });
    }
};

export default {
    chatWithBot,
    getAIResponse
};