// routes/summaryRoutes.js
import express from 'express';
import { generateDocumentSummary, getDocumentSummary, deleteDocumentSummary } from '../controllers/summaryController.js';
import { db } from '../db.js';

const router = express.Router();

/**
 * 为文档生成新摘要
 * POST /documents/:id/summary
 */
router.post('/documents/:id/summary', async (req, res) => {
    try {
        const documentId = parseInt(req.params.id);
        if (isNaN(documentId)) {
            return res.status(400).json({
                status: 'error',
                message: '无效的文档ID'
            });
        }

        // 检查文档是否存在
        const [documents] = await db.queryPromise(
            'SELECT id FROM documents WHERE id = ?',
            [documentId]
        );

        if (documents.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: '文档不存在'
            });
        }

        console.log(`开始生成文档ID ${documentId} 的摘要...`);
        const result = await generateDocumentSummary(documentId);

        res.status(200).json({
            status: 'success',
            message: '文档摘要生成成功',
            data: result
        });
    } catch (error) {
        console.error('生成文档摘要失败:', error);
        res.status(500).json({
            status: 'error',
            message: '生成文档摘要失败',
            error: error.message
        });
    }
});

/**
 * 获取文档最新摘要
 * GET /documents/:id/summary
 */
router.get('/documents/:id/summary', async (req, res) => {
    try {
        const documentId = parseInt(req.params.id);
        if (isNaN(documentId)) {
            return res.status(400).json({
                status: 'error',
                message: '无效的文档ID'
            });
        }

        const summary = await getDocumentSummary(documentId);

        if (!summary) {
            return res.status(404).json({
                status: 'error',
                message: '未找到文档摘要'
            });
        }

        res.status(200).json({
            status: 'success',
            data: summary
        });
    } catch (error) {
        console.error('获取文档摘要失败:', error);
        res.status(500).json({
            status: 'error',
            message: '获取文档摘要失败',
            error: error.message
        });
    }
});

/**
 * 获取文档所有摘要历史
 * GET /documents/:id/summaries
 */
router.get('/documents/:id/summaries', async (req, res) => {
    try {
        const documentId = parseInt(req.params.id);
        if (isNaN(documentId)) {
            return res.status(400).json({
                status: 'error',
                message: '无效的文档ID'
            });
        }

        const [summaries] = await db.queryPromise(
            `SELECT * FROM document_summaries WHERE document_id = ? ORDER BY created_at DESC`,
            [documentId]
        );

        res.status(200).json({
            status: 'success',
            count: summaries.length,
            data: summaries
        });
    } catch (error) {
        console.error('获取文档摘要历史失败:', error);
        res.status(500).json({
            status: 'error',
            message: '获取文档摘要历史失败',
            error: error.message
        });
    }
});

/**
 * 删除特定摘要
 * DELETE /summaries/:id
 */
router.delete('/summaries/:id', async (req, res) => {
    try {
        const summaryId = parseInt(req.params.id);
        if (isNaN(summaryId)) {
            return res.status(400).json({
                status: 'error',
                message: '无效的摘要ID'
            });
        }

        const success = await deleteDocumentSummary(summaryId);

        if (!success) {
            return res.status(404).json({
                status: 'error',
                message: '摘要不存在或已被删除'
            });
        }

        res.status(200).json({
            status: 'success',
            message: '摘要已成功删除'
        });
    } catch (error) {
        console.error('删除摘要失败:', error);
        res.status(500).json({
            status: 'error',
            message: '删除摘要失败',
            error: error.message
        });
    }
});

/**
 * 测试摘要功能
 * GET /test-summary/:id
 */
router.get('/test-summary/:id', async (req, res) => {
    try {
        const documentId = parseInt(req.params.id);
        console.log(`开始测试文档ID ${documentId} 的摘要生成...`);

        const result = await generateDocumentSummary(documentId);

        res.status(200).json({
            status: 'success',
            message: '摘要测试成功',
            data: result
        });
    } catch (error) {
        console.error('测试摘要生成失败:', error);
        res.status(500).json({
            status: 'error',
            message: '测试摘要生成失败',
            error: error.message,
            stack: error.stack
        });
    }
});

export default router;
