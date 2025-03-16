import React, { useState } from 'react';
import './App.css';

const FileUploader = () => {
  const [file, setFile] = useState(null);
  const [output, setOutput] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setOutput(`已选择文件: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setOutput(`已拖放文件: ${droppedFile.name} (${(droppedFile.size / 1024).toFixed(2)} KB)`);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      alert('请先选择一个文件！');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('https://example.com/process', { // 替换为你的 API 地址
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setOutput(result.processedData); // 假设后端返回的数据在 processedData 字段中
        alert('文件处理成功！');
      } else {
        throw new Error('文件处理失败');
      }
    } catch (error) {
      setOutput('文件处理失败，请重试。');
      alert('文件处理失败！');
    }
  };

  return (
    <div className="container">
      <title>法律文件总结</title>
      <link rel="icon" href="./link.png"></link>
      <div className="main-container">
        <div className="upload-output-container">
          <div
            className="upload-area"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              type="file"
              id="fileInput"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="fileInput" className="upload-label">
              <div className="upload-content">
                <p>点击选择文件 或 拖放文件到这里</p>
                <p>支持任意文件类型</p>
              </div>
            </label>
          </div>
        </div>

        <button className="submit-button" onClick={handleSubmit}>
          提交文件
        </button>

        <div className="output-area">
          <h3>处理结果：</h3>
          <div className="output-content">
            {output || "等待文件处理..."}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploader;