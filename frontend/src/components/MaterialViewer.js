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

  useEffect(() => {
    if (!file) return;

    // 如果是视频文件
    if (file.mimetype?.startsWith('video/')) {
      setLoading(false);
      return;
    }

    // 如果是文本文件，获取内容
    const ext = file.filename.split('.').pop().toLowerCase();
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

  if (file.mimetype?.startsWith('video/')) {
    return (
      <div className="material-viewer">
        <div className="panel-header">学习资料：{file.filename}</div>
        <div className="panel-content video-container">
          <video controls className="video-player">
            <source src={`${API_BASE_URL}/upload/${file.id}/content`} type={file.mimetype || 'video/mp4'} />
            您的浏览器不支持视频播放。
          </video>
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

