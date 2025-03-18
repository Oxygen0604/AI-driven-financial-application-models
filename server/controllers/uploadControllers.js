import fs from 'fs';
import path from 'path';
import multer from 'multer';
import textract from 'textract';
import { promisify } from 'util';
import { db } from '../db.js';
import chardet from 'chardet';
import iconv from 'iconv-lite';
import mammoth from 'mammoth';
//import pdf from 'pdf-parse';
import xlsx from 'xlsx';
import { exec } from 'child_process';

// 确保上传目录存在
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置存储方式
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExt = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExt);
    }
});

// 配置文件过滤器
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'application/rtf',
        'text/csv',
        'application/json',
        'text/html',
        'text/xml',
        // 添加图像类型
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/bmp',
        'image/tiff',
        'image/webp'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('不支持的文件类型'), false);
    }
};

// 配置上传
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB 限制
    }
});

// 使用Python脚本处理文件
const processPythonScript = async (filePath) => {
    return new Promise((resolve, reject) => {
        const pythonScript = 'F:\\Files\\bisai\\huaqi\\AI chatbot\\transform.py';
        const command = `python "${pythonScript}" "${filePath}"`;
        
        console.log(`执行Python脚本: ${command}`);
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`执行Python脚本错误: ${error}`);
                return reject(error);
            }
            if (stderr) {
                console.warn(`Python脚本警告: ${stderr}`);
            }
            
            console.log(`Python脚本输出: ${stdout}`);
            
            // 生成的txt文件路径
            const txtFilePath = filePath.replace(path.extname(filePath), '.txt');
            
            // 检查文件是否存在
            if (fs.existsSync(txtFilePath)) {
                // 读取生成的文本文件
                const content = fs.readFileSync(txtFilePath, 'utf-8');
                resolve(content);
            } else {
                reject(new Error('Python脚本处理后未找到生成的文本文件'));
            }
        });
    });
};

// 文本提取函数
async function extractFileText(filePath, mimeType) {
    try {
        const buffer = fs.readFileSync(filePath);

        // 根据 MIME 类型选择解析方式
        if (mimeType === 'application/pdf' || mimeType.startsWith('image/')) {
            // 使用Python脚本处理PDF和图像文件
            return await processPythonScript(filePath);
        }
        
        switch (mimeType) {
            // Word 文档处理
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                const { value } = await mammoth.extractRawText({ buffer });
                return value.replace(/\s+/g, ' ').trim();

            // Excel 处理
            case 'application/vnd.ms-excel':
            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                const workbook = xlsx.read(buffer, { type: 'buffer' });
                return workbook.SheetNames
                    .map(sheet => xlsx.utils.sheet_to_csv(workbook.Sheets[sheet]))
                    .join('\n\n')
                    .trim();

            // 纯文本文件处理（TXT/CSV/HTML 等）
            default:
                return handleTextFile(buffer, filePath);
        }
    } catch (error) {
        console.error(`[${mimeType}] 解析失败:`, error.message);
        return handleTextFile(buffer, filePath); // 兜底处理
    }
}

// 通用文本文件处理（含编码检测）
function handleTextFile(buffer, filePath) {
    try {
        // 检测文件编码
        const detectedEncoding = chardet.detect(buffer) || 'utf-8';
        console.log(`检测到编码: ${detectedEncoding}`);

        // 解码内容
        const decodedText = iconv.decode(buffer, detectedEncoding);
        return decodedText.replace(/\s+/g, ' ').trim();
    } catch (error) {
        console.error('文本文件处理失败:', error.message);
        return '无法提取内容';
    }
}
// 上传单个文件
const uploadSingleFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: '没有文件被上传'
            });
        }

        const {
            originalname,
            filename,
            path: filePath,
            mimetype,
            size
        } = req.file;

        // 详细的文件信息日志
        console.log('文件详情:', {
            originalname,
            filename,
            filePath,
            mimetype,
            size
        });

        // 提取文本
        const textContent = await extractFileText(filePath, mimetype);

        // 存储到数据库
        const [result] = await db.queryPromise(
            `INSERT INTO documents (
                original_filename, 
                stored_filename, 
                original_path, 
                txt_path, 
                file_type, 
                file_size, 
                text_content
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                originalname,
                filename,
                filePath,
                filePath.replace(path.extname(filePath), '.txt'),
                mimetype,
                size,
                textContent
            ]
        );

        // 将文本保存到独立文件（便于调试）
        const txtFilePath = filePath.replace(path.extname(filePath), '.txt');
        if (!fs.existsSync(txtFilePath)) {
            // 仅当文件不存在时才写入（避免覆盖Python脚本已生成的文件）
            fs.writeFileSync(txtFilePath, textContent, 'utf8');
        }

        res.status(200).json({
            status: 'success',
            message: '文件上传成功',
            data: {
                id: result.insertId,
                filename: originalname,
                size: size,
                type: mimetype,
                textLength: textContent.length
            }
        });
    } catch (error) {
        console.error('文件处理错误:', error);
        res.status(500).json({
            status: 'error',
            message: '文件处理失败',
            error: error.message
        });
    }
};

// 获取文档列表
const getDocuments = async (req, res) => {
    try {
        const [documents] = await db.queryPromise(`
            SELECT 
                id, 
                original_filename, 
                file_type, 
                file_size, 
                upload_date as created_at 
            FROM documents 
            ORDER BY upload_date DESC
        `);

        res.status(200).json({
            status: 'success',
            data: documents
        });
    } catch (error) {
        console.error('获取文档列表失败:', error);
        res.status(500).json({
            status: 'error',
            message: '获取文档列表失败',
            error: error.message
        });
    }
};
const getDocumentById = async (req, res) => {
    try {
        const { id } = req.params;

        // 查询文档详情
        const [documents] = await db.queryPromise(`
            SELECT 
                id, 
                original_filename, 
                file_type, 
                file_size, 
                text_content,
                upload_date as created_at 
            FROM documents 
            WHERE id = ?
        `, [id]);

        // 检查文档是否存在
        if (documents.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: '文档不存在'
            });
        }

        // 返回文档详情
        res.status(200).json({
            status: 'success',
            data: documents[0]
        });
    } catch (error) {
        console.error('获取文档详情失败:', error);
        res.status(500).json({
            status: 'error',
            message: '获取文档详情失败',
            error: error.message
        });
    }
};

// 删除文档
const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;

        // 先获取文档信息
        const [documents] = await db.queryPromise(
            'SELECT original_path, txt_path FROM documents WHERE id = ?',
            [id]
        );

        if (documents.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: '文档不存在'
            });
        }

        // 删除物理文件
        const { original_path, txt_path } = documents[0];
        if (original_path && fs.existsSync(original_path)) {
            fs.unlinkSync(original_path);
        }
        if (txt_path && fs.existsSync(txt_path)) {
            fs.unlinkSync(txt_path);
        }

        // 删除数据库记录
        await db.queryPromise('DELETE FROM documents WHERE id = ?', [id]);

        res.status(200).json({
            status: 'success',
            message: '文档删除成功'
        });
    } catch (error) {
        console.error('删除文档失败:', error);
        res.status(500).json({
            status: 'error',
            message: '删除文档失败',
            error: error.message
        });
    }
};

// 搜索文档
const searchDocuments = async (req, res) => {
    try {
        const { query: searchQuery } = req.query;

        if (!searchQuery || searchQuery.trim() === '') {
            return res.status(400).json({
                status: 'error',
                message: '搜索关键词不能为空'
            });
        }

        const [documents] = await db.queryPromise(`
            SELECT 
                id, 
                original_filename, 
                file_type, 
                file_size, 
                upload_date as created_at 
            FROM documents 
            WHERE text_content LIKE ? 
            ORDER BY upload_date DESC
        `, [`%${searchQuery}%`]);

        res.status(200).json({
            status: 'success',
            count: documents.length,
            data: documents
        });
    } catch (error) {
        console.error('搜索文档失败:', error);
        res.status(500).json({
            status: 'error',
            message: '搜索文档失败',
            error: error.message
        });
    }
};

export default {
    upload,
    uploadSingleFile,
    getDocuments,
    getDocumentById,
    deleteDocument,
    searchDocuments
};