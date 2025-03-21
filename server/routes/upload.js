import express from 'express';
import uploadController from '../controllers/uploadControllers.js';

const router = express.Router();

// 单文件上传路由
router.post('/upload',
    uploadController.upload.single('file'),
    uploadController.uploadSingleFile
);

// 获取文档列表
router.get('/documents', uploadController.getDocuments);

// 获取单个文档详情
router.get('/documents/:id', uploadController.getDocumentById);

// 删除文档
router.delete('/documents/:id', uploadController.deleteDocument);

// 搜索文档
router.get('/search', uploadController.searchDocuments);

export default router;