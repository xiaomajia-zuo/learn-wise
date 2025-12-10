import React, { useRef } from 'react';
import axios from 'axios';
import './FileUpload.css';
import { API_BASE_URL } from '../config';

function FileUpload({ onFileUpload }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = React.useState(false);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 检查文件大小（前端预检查，最大200MB）
    const maxSize = 200 * 1024 * 1024; // 200MB
    if (file.size > maxSize) {
      alert(`文件过大！文件大小: ${(file.size / (1024 * 1024)).toFixed(2)}MB，最大允许: ${maxSize / (1024 * 1024)}MB`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`上传进度: ${percentCompleted}%`);
        }
      });

      if (response.data.success) {
        onFileUpload(response.data.file);
      }
    } catch (error) {
      console.error('上传失败:', error);
      
      // 处理文件过大错误
      if (error.response?.status === 413 || error.response?.data?.error === '文件过大') {
        const maxSizeMB = error.response?.data?.maxSize || 200;
        alert(`文件上传失败：文件过大\n\n文件大小超过了限制（最大 ${maxSizeMB}MB）\n\n建议：\n1. 压缩文件后重新上传\n2. 或选择较小的文件`);
      } else {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
        alert('文件上传失败: ' + errorMsg);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="file-upload">
      <input
        ref={fileInputRef}
        type="file"
        id="file-input"
        onChange={handleFileSelect}
        accept="video/*,text/*,.js,.py,.java,.cpp,.c,.html,.css,.md,.json,.xml,.pdf,.epub,.mov"
        style={{ display: 'none' }}
      />
      <label
        htmlFor="file-input"
        className={`upload-button ${uploading ? 'uploading' : ''}`}
      >
        {uploading ? '上传中...' : '上传学习资料'}
      </label>
    </div>
  );
}

export default FileUpload;

