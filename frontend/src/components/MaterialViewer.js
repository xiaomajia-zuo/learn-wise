import React, { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import './MaterialViewer.css';
import { API_BASE_URL } from '../config';

function MaterialViewer({ file }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfError, setPdfError] = useState(false);

  useEffect(() => {
    if (!file) return;

    const ext = file.filename.split('.').pop().toLowerCase();

    // 如果是视频文件
    if (file.mimetype?.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov'].includes(ext)) {
      setLoading(false);
      return;
    }

    // 如果是PDF或EPUB文件
    if (ext === 'pdf' || ext === 'epub') {
      setLoading(false);
      setPdfError(false); // 重置PDF错误状态
      return;
    }

    // 如果是文本文件，获取内容
    if (['txt', 'md', 'js', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json', 'xml'].includes(ext)) {
      fetch(`${API_BASE_URL}/upload/${file.id}/content`)
        .then(res => res.json())
        .then(data => {
          setContent(data.content);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [file]);

  const getLanguage = () => {
    if (!file) return 'text';
    const ext = file.filename.split('.').pop().toLowerCase();
    const langMap = {
      'js': 'javascript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'xml': 'xml',
      'md': 'markdown'
    };
    return langMap[ext] || 'text';
  };

  if (!file) return null;

  const ext = file.filename.split('.').pop().toLowerCase();
  const isVideo = file.mimetype?.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov'].includes(ext);
  const isPDF = ext === 'pdf';
  const isEPUB = ext === 'epub';

  // 视频文件
  if (isVideo) {
    const videoTypeMap = {
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'ogg': 'video/ogg',
      'mov': 'video/quicktime'
    };
    const videoType = videoTypeMap[ext] || file.mimetype || 'video/mp4';
    
    return (
      <div className="material-viewer">
        <div className="panel-header">学习资料：{file.filename}</div>
        <div className="panel-content video-container">
          <video controls className="video-player">
            <source src={`${API_BASE_URL}/upload/${file.id}/content`} type={videoType} />
            您的浏览器不支持视频播放。
          </video>
        </div>
      </div>
    );
  }

  // PDF文件
  if (isPDF) {
    // 编码文件ID以避免特殊字符问题
    const encodedFileId = encodeURIComponent(file.id);
    const pdfUrl = `${API_BASE_URL}/upload/${encodedFileId}/content`;
    
    return (
      <div className="material-viewer">
        <div className="panel-header">学习资料：{file.filename}</div>
        <div className="panel-content pdf-container">
          {/* 方案1：使用iframe（兼容性最好） */}
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
            className="pdf-viewer"
            title={file.filename}
            style={{ border: 'none' }}
            allow="fullscreen"
          />
          {/* 备用方案：如果embed不支持，提供下载和新窗口打开选项 */}
          <div className="pdf-actions" style={{ 
            padding: '0.5rem', 
            backgroundColor: '#f8f9fa', 
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            gap: '0.5rem'
          }}>
            <a 
              href={pdfUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="download-button"
              style={{ 
                fontSize: '0.85rem', 
                padding: '0.5rem 1rem',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              🔗 在新窗口打开
            </a>
            <a 
              href={pdfUrl} 
              download={file.filename} 
              className="download-button"
              style={{ 
                fontSize: '0.85rem', 
                padding: '0.5rem 1rem',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              ⬇️ 下载PDF
            </a>
          </div>
        </div>
      </div>
    );
  }

  // EPUB文件（使用iframe尝试显示，如果浏览器不支持会提示下载）
  if (isEPUB) {
    return (
      <div className="material-viewer">
        <div className="panel-header">学习资料：{file.filename}</div>
        <div className="panel-content epub-container">
          <div className="epub-notice">
            <p>⚠️ 浏览器可能无法直接显示EPUB文件</p>
            <p>建议：</p>
            <ul>
              <li>下载文件后使用EPUB阅读器打开</li>
              <li>或使用在线EPUB阅读器</li>
            </ul>
            <a
              href={`${API_BASE_URL}/upload/${file.id}/content`}
              download={file.filename}
              className="download-button"
            >
              下载EPUB文件
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="material-viewer">
        <div className="panel-header">学习资料：{file.filename}</div>
        <div className="panel-content loading">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="material-viewer">
        <div className="panel-header">学习资料：{file.filename}</div>
        <div className="panel-content error">加载失败: {error}</div>
      </div>
    );
  }

  const language = getLanguage();
  const isCode = ['javascript', 'python', 'java', 'cpp', 'c', 'html', 'css', 'json', 'xml'].includes(language);
  const isMarkdown = language === 'markdown';

  return (
    <div className="material-viewer">
      <div className="panel-header">学习资料：{file.filename}</div>
      <div className="panel-content">
        {isMarkdown ? (
          <ReactMarkdown className="markdown-content">{content}</ReactMarkdown>
        ) : isCode ? (
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            showLineNumbers
            customStyle={{ margin: 0, borderRadius: 0 }}
          >
            {content}
          </SyntaxHighlighter>
        ) : (
          <pre className="text-content">{content}</pre>
        )}
      </div>
    </div>
  );
}

export default MaterialViewer;

