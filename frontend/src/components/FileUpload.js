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
      alert('文件上传失败: ' + (error.response?.data?.error || error.message));
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
        accept="video/*,text/*,.js,.py,.java,.cpp,.c,.html,.css,.md,.json,.xml"
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

