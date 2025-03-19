import React, { useState, useRef, useEffect } from 'react';
import './documentProcess.scss';
import axios, { AxiosError, AxiosResponse } from 'axios';

// 配置 Axios 全局默认值
axios.defaults.baseURL = 'http://localhost:8800/api';
axios.defaults.withCredentials = true;

// 添加请求拦截器，打印更多调试信息
axios.interceptors.request.use(config => {
    console.log('请求配置:', {
        url: config.url,
        method: config.method,
        headers: config.headers
    });
    return config;
}, error => {
    return Promise.reject(error);
});

// 文档接口类型定义
interface Document {
    id: number;
    original_filename: string;
    file_type: string;
    file_size: number;
    created_at: string;
}

// 错误响应接口
interface ErrorResponse {
    message?: string;
}

const DocumentProcess: React.FC = () => {
    // 文件上传相关状态
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

    // 文档列表相关状态
    const [documents, setDocuments] = useState<Document[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');

    // 文件输入引用
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 文件选择处理
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setUploadError(null);
            setUploadSuccess(false);
            setUploadProgress(0);
        }
    };

    const uploadFile = async () => {
        if (!file) {
            setUploadError('请选择文件');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        // 详细的文件信息日志
        console.log('准备上传文件:', {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size
        });

        setIsUploading(true);
        setUploadProgress(0);
        setUploadError(null);

        try {
            const response = await axios.post('/upload/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const progress = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setUploadProgress(progress);
                    }
                }
            });

            // 详细的响应日志
            console.log('上传响应:', {
                status: response.status,
                data: response.data
            });

            // 重新获取文档列表
            fetchDocuments();

            // 显示成功消息
            setUploadSuccess(true);
        } catch (error) {
            // 详细的错误日志
            if (axios.isAxiosError(error)) {
                console.error('上传失败 - 完整错误对象:', error);
                console.error('错误响应:', error.response);
                console.error('错误请求:', error.request);
                console.error('错误消息:', error.message);

                // 更具体的错误信息
                if (error.response) {
                    // 服务器返回错误
                    setUploadError(
                        error.response.data?.message ||
                        `上传失败：${error.response.status} ${error.response.statusText}`
                    );
                } else if (error.request) {
                    // 请求已发送但没有收到响应
                    setUploadError('服务器无响应，请检查网络连接');
                } else {
                    // 发送请求时发生错误
                    setUploadError(`文件传输失败：${error.message}`);
                }
            } else {
                // 非 Axios 错误
                console.error('未知错误:', error);
                setUploadError('发生未知错误，请重新尝试');
            }
        } finally {
            setIsUploading(false);
        }
    };

    // 获取文档列表
    const fetchDocuments = async () => {
        try {
            const response = await axios.get<{ data: Document[] }>('/upload/documents');
            setDocuments(response.data.data);
        } catch (error) {
            // 使用类型守卫处理错误
            if (axios.isAxiosError<ErrorResponse>(error)) {
                if (error.response) {
                    console.error('获取文档列表失败:', error.response.data);
                    setUploadError(
                        error.response.data?.message ||
                        '无法获取文档列表'
                    );
                } else if (error.request) {
                    console.error('无响应的请求:', error.request);
                    setUploadError('服务器无响应，请检查网络连接');
                } else {
                    console.error('请求设置错误:', error.message);
                    setUploadError('获取文档列表失败');
                }
            } else {
                console.error('未知错误:', error);
                setUploadError('发生未知错误，请重新尝试');
            }
        }
    };

    // 搜索文档
    const searchDocuments = async () => {
        if (!searchQuery.trim()) {
            fetchDocuments();
            return;
        }

        try {
            const response = await axios.get<{ data: Document[] }>(
                `/upload/search?query=${encodeURIComponent(searchQuery)}`
            );
            setDocuments(response.data.data);
        } catch (error) {
            // 使用类型守卫处理错误
            if (axios.isAxiosError<ErrorResponse>(error)) {
                if (error.response) {
                    console.error('搜索文档失败:', error.response.data);
                    setUploadError(
                        error.response.data?.message ||
                        '搜索文档失败'
                    );
                } else if (error.request) {
                    console.error('无响应的请求:', error.request);
                    setUploadError('服务器无响应，请检查网络连接');
                } else {
                    console.error('请求设置错误:', error.message);
                    setUploadError('搜索文档失败');
                }
            } else {
                console.error('未知错误:', error);
                setUploadError('发生未知错误，请重新尝试');
            }
        }
    };

    // 删除文档
    const deleteDocument = async (id: number) => {
        if (!window.confirm('确定要删除这个文档吗？')) return;

        try {
            await axios.delete(`/upload/documents/${id}`);
            fetchDocuments();
        } catch (error) {
            // 使用类型守卫处理错误
            if (axios.isAxiosError<ErrorResponse>(error)) {
                if (error.response) {
                    console.error('删除文档失败:', error.response.data);
                    setUploadError(
                        error.response.data?.message ||
                        '删除文档失败'
                    );
                } else if (error.request) {
                    console.error('无响应的请求:', error.request);
                    setUploadError('服务器无响应，请检查网络连接');
                } else {
                    console.error('请求设置错误:', error.message);
                    setUploadError('删除文档失败');
                }
            } else {
                console.error('未知错误:', error);
                setUploadError('发生未知错误，请重新尝试');
            }
        }
    };

    // 文件大小格式化
    const formatFileSize = (size: number): string => {
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
        return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    };

    // 初始加载文档列表
    useEffect(() => {
        fetchDocuments();
    }, []);

    return (
        <div className="document-process">
            <div className="document-upload">
                <h2 className="text-xl font-semibold mb-4">文件上传</h2>

                <div
                    className="file-selector"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {file ? file.name : '点击选择文件'}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        disabled={isUploading}
                    />
                </div>

                {file && (
                    <button
                        className="upload-button"
                        onClick={uploadFile}
                        disabled={isUploading}
                    >
                        {isUploading ? '上传中...' : '上传文件'}
                    </button>
                )}

                {isUploading && (
                    <div className="progress-bar">
                        <div
                            className="progress"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                )}

                {uploadError && (
                    <div className="error-message">
                        {uploadError}
                    </div>
                )}

                {uploadSuccess && (
                    <div className="success-message">
                        文件上传成功！
                    </div>
                )}
            </div>

            <div className="search-container">
                <input
                    type="text"
                    placeholder="搜索文档..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button onClick={searchDocuments}>搜索</button>
            </div>

            <div className="documents-list">
                <h2 className="text-xl font-semibold mb-4">文档列表</h2>
                {documents.length === 0 ? (
                    <p className="text-center text-gray-500">暂无文档</p>
                ) : (
                    <table>
                        <thead>
                        <tr>
                            <th>文件名</th>
                            <th>类型</th>
                            <th>大小</th>
                            <th>上传时间</th>
                            <th>操作</th>
                        </tr>
                        </thead>
                        <tbody>
                        {documents.map((doc) => (
                            <tr key={doc.id}>
                                <td>{doc.original_filename}</td>
                                <td>{doc.file_type}</td>
                                <td>{formatFileSize(doc.file_size)}</td>
                                <td>{new Date(doc.created_at).toLocaleString()}</td>
                                <td className="actions">
                                    <button
                                        className="view"
                                        onClick={() => {
                                            // 查看文档逻辑
                                            window.open(
                                                `http://localhost:8800/api/upload/documents/${doc.id}`,
                                                '_blank'
                                            );
                                        }}
                                    >
                                        查看
                                    </button>
                                    <button
                                        className="delete"
                                        onClick={() => deleteDocument(doc.id)}
                                    >
                                        删除
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default DocumentProcess;