// controllers/summaryController.js
import fs from 'fs';
import { db } from '../db.js';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

// 获取当前目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 解析聊天机器人返回的摘要响应
 * @param {string} text - 聊天机器人的响应文本
 * @returns {Object} - 解析后的结构化数据
 */
function parseSummaryResponse(text) {
    console.log("开始解析摘要结果");

    const result = {
        keywords: '',
        keywordsExplanation: '',
        summary: '',
        outline: ''
    };

    try {
        // 提取关键词部分
        const keywordsMatch = text.match(/\*\*关键词\*\*：([\s\S]*?)(?=\*\*关键词解释\*\*|$)/);
        if (keywordsMatch) {
            result.keywords = keywordsMatch[1].trim().replace(/；$/, '');
        }

        // 提取关键词解释部分
        const explanationMatch = text.match(/\*\*关键词解释\*\*：([\s\S]*?)(?=\*\*文章摘要\*\*|$)/);
        if (explanationMatch) {
            result.keywordsExplanation = explanationMatch[1].trim().replace(/；$/, '');
        }

        // 提取文章摘要部分
        const summaryMatch = text.match(/\*\*文章摘要\*\*：([\s\S]*?)(?=\*\*文章大纲\*\*|$)/);
        if (summaryMatch) {
            result.summary = summaryMatch[1].trim().replace(/；$/, '');
        }

        // 提取文章大纲部分
        const outlineMatch = text.match(/\*\*文章大纲\*\*：([\s\S]*?)$/);
        if (outlineMatch) {
            result.outline = outlineMatch[1].trim();
        }

        console.log("解析结果:", result);
    } catch (error) {
        console.error("解析摘要响应时出错:", error);
    }

    return result;
}

/**
 * 直接使用Node.js调用API获取文档摘要
 * @param {number} documentId - 文档ID
 * @returns {Promise<Object>} - 返回处理结果
 */
const generateDocumentSummary = async (documentId) => {
    try {
        console.log(`开始为文档ID ${documentId} 生成摘要...`);

        // 1. 获取文档内容
        const [documents] = await db.queryPromise(
            `SELECT id, original_filename, text_content FROM documents WHERE id = ?`,
            [documentId]
        );

        if (documents.length === 0) {
            throw new Error(`文档ID ${documentId} 不存在`);
        }

        const document = documents[0];
        console.log(`处理文档: ${document.original_filename} (ID: ${documentId})`);

        // 2. 调用DeepSeek API
        try {
            // API配置
            const apiKey = process.env.CHATBOT_API_KEY || 'sk-bc13804410a748ed89d38020edf77024';
            const modelName = process.env.CHATBOT_MODEL || 'deepseek-chat';
            const baseUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com';

            console.log("开始调用DeepSeek API...");

            // 构建请求数据
            const requestData = {
                model: modelName,
                messages: [
                    {
                        role: "system",
                        content: `你是一个文本处理器，需要：
1. 提取文本关键词并解释
2. 总结文本内容
3. 生成文章大纲
4. 格式必须严格如下：
   **关键词**：关键词1，关键词2，...；
   **关键词解释**：对关键词的解释...；
   **文章摘要**：文章的总体摘要...；
   **文章大纲**：
   - 第一部分
   - 第二部分
   ...`
                    },
                    {
                        role: "user",
                        content: `请帮我总结以下文本内容：\n\n${document.text_content}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            };

            // 发送请求
            const response = await axios.post(
                `${baseUrl}/v1/chat/completions`,
                requestData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    }
                }
            );

            // 处理响应
            if (response.data && response.data.choices && response.data.choices.length > 0) {
                const summaryText = response.data.choices[0].message.content;
                console.log(`API调用成功，收到摘要响应`);

                return processSummaryResponse(summaryText, documentId, document);
            } else {
                throw new Error("API响应格式异常");
            }
        } catch (error) {
            console.error(`API调用失败:`, error);

            // 生成备用摘要
            const backupSummary = `**关键词**：文档分析；
**关键词解释**：对文档内容进行分析和处理；
**文章摘要**：这是一份文档内容，包含约${document.text_content.length/100}00字符。由于API调用失败，此摘要由系统自动生成；
**文章大纲**：
- 文档部分一
- 文档部分二
- 文档部分三`;

            console.log("生成了备用摘要");
            return processSummaryResponse(backupSummary, documentId, document);
        }
    } catch (error) {
        console.error(`生成文档摘要失败:`, error);
        throw error;
    }
};

/**
 * 处理摘要响应并保存到数据库
 * @param {string} summaryText - 摘要文本
 * @param {number} documentId - 文档ID
 * @param {Object} document - 文档信息
 * @returns {Promise<Object>} - 处理结果
 */
async function processSummaryResponse(summaryText, documentId, document) {
    try {
        console.log(`收到摘要，长度: ${summaryText.length} 字符`);

        // 检查是否已存在该文档的摘要
        const [existingSummaries] = await db.queryPromise(
            `SELECT id FROM document_summaries WHERE document_id = ?`,
            [documentId]
        );

        // 解析响应中的结构化数据
        const parsedData = parseSummaryResponse(summaryText);

        let result;

        if (existingSummaries.length > 0) {
            // 更新现有摘要
            console.log(`更新文档ID ${documentId} 的现有摘要...`);
            [result] = await db.queryPromise(
                `UPDATE document_summaries SET 
                    keywords = ?,
                    keywords_explanation = ?,
                    summary = ?,
                    outline = ?,
                    full_response = ?,
                    updated_at = NOW()
                WHERE document_id = ?`,
                [
                    parsedData.keywords,
                    parsedData.keywordsExplanation,
                    parsedData.summary,
                    parsedData.outline,
                    summaryText,
                    documentId
                ]
            );

            result.insertId = existingSummaries[0].id;
        } else {
            // 创建新摘要
            console.log(`创建文档ID ${documentId} 的新摘要...`);
            [result] = await db.queryPromise(
                `INSERT INTO document_summaries (
                    document_id,
                    keywords,
                    keywords_explanation,
                    summary,
                    outline,
                    full_response,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                [
                    documentId,
                    parsedData.keywords,
                    parsedData.keywordsExplanation,
                    parsedData.summary,
                    parsedData.outline,
                    summaryText
                ]
            );
        }

        console.log(`摘要已成功存储到数据库，ID: ${result.insertId}`);

        // 返回结果
        return {
            success: true,
            summaryId: result.insertId,
            documentId: documentId,
            data: parsedData
        };
    } catch (error) {
        console.error(`处理摘要响应时出错:`, error);
        throw error;
    }
}

/**
 * 获取文档摘要
 * @param {number} documentId - 文档ID
 * @returns {Promise<Object>} - 返回摘要数据
 */
const getDocumentSummary = async (documentId) => {
    try {
        const [summaries] = await db.queryPromise(
            `SELECT * FROM document_summaries WHERE document_id = ?
             ORDER BY created_at DESC LIMIT 1`,
            [documentId]
        );

        if (summaries.length === 0) {
            return null;
        }

        return summaries[0];
    } catch (error) {
        console.error(`获取文档摘要失败:`, error);
        throw error;
    }
};

/**
 * 删除文档摘要
 * @param {number} summaryId - 摘要ID
 * @returns {Promise<boolean>} - 返回操作结果
 */
const deleteDocumentSummary = async (summaryId) => {
    try {
        const [result] = await db.queryPromise(
            `DELETE FROM document_summaries WHERE id = ?`,
            [summaryId]
        );

        return result.affectedRows > 0;
    } catch (error) {
        console.error(`删除文档摘要失败:`, error);
        throw error;
    }
};

export {
    generateDocumentSummary,
    getDocumentSummary,
    deleteDocumentSummary
};
