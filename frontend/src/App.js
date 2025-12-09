import React, { useState } from 'react';
import Split from 'react-split';
import './App.css';
import FileUpload from './components/FileUpload';
import MaterialViewer from './components/MaterialViewer';
import SummaryPanel from './components/SummaryPanel';
import ChatPanel from './components/ChatPanel';
import { API_BASE_URL } from './config';

function App() {
  const [currentFile, setCurrentFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [conversationId, setConversationId] = useState(null);

  const handleFileUpload = async (fileInfo) => {
    setCurrentFile(fileInfo);
    setSummary('');
    setSummaryError(null);
    setConversationId(null);
    
    // 自动生成摘要
    if (fileInfo.mimetype.startsWith('text/') || 
        ['js', 'py', 'java', 'cpp', 'c', 'html', 'css', 'md', 'txt'].includes(
          fileInfo.filename.split('.').pop().toLowerCase()
        )) {
      await generateSummary(fileInfo);
    }
  };

  const generateSummary = async (fileInfo) => {
    setIsLoadingSummary(true);
    setSummaryError(null);
    try {
      // 判断是否为文本/代码文件
      const ext = fileInfo.filename.split('.').pop().toLowerCase();
      const isTextFile = ['txt', 'md', 'js', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json', 'xml'].includes(ext);
      
      if (!isTextFile) {
        setIsLoadingSummary(false);
        return;
      }

      // 获取文件内容
      const contentResponse = await fetch(`${API_BASE_URL}/upload/${fileInfo.id}/content`);
      if (!contentResponse.ok) {
        throw new Error('获取文件内容失败');
      }
      const { content } = await contentResponse.json();

      // 判断文件类型
      const isCode = ['js', 'py', 'java', 'cpp', 'c', 'html', 'css'].includes(ext);
      
      // 生成摘要
      const summaryResponse = await fetch(`${API_BASE_URL}/ai/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content,
          type: isCode ? 'code' : 'text'
        })
      });

      const result = await summaryResponse.json();
      
      if (!summaryResponse.ok || !result.success) {
        // 处理错误响应
        const errorMsg = result.error || '生成摘要失败';
        const errorDetails = result.details || errorMsg;
        setSummaryError({
          message: errorMsg,
          details: errorDetails,
          provider: result.provider
        });
        return;
      }

      if (result.success) {
        setSummary(result.summary);
        setSummaryError(null);
      }
    } catch (error) {
      console.error('生成摘要失败:', error);
      setSummaryError({
        message: '生成摘要失败',
        details: error.message || '网络错误或服务器无响应'
      });
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const getContextForChat = () => {
    if (!currentFile || !summary) return '';
    return `学习资料：${currentFile.filename}\n\n摘要：\n${summary}`;
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>LearnWise - 智能学习助手</h1>
        <FileUpload onFileUpload={handleFileUpload} />
      </header>

      {currentFile ? (
        <div className="main-content">
          <Split
            sizes={[40, 30, 30]}
            minSize={200}
            gutterSize={8}
            className="split-container"
            direction="horizontal"
          >
            <div className="panel material-panel">
              <MaterialViewer file={currentFile} />
            </div>

            <div className="panel summary-panel">
              <SummaryPanel 
                summary={summary}
                isLoading={isLoadingSummary}
                error={summaryError}
                onRegenerate={() => generateSummary(currentFile)}
              />
            </div>

            <div className="panel chat-panel">
              <ChatPanel
                conversationId={conversationId}
                onConversationStart={setConversationId}
                context={getContextForChat()}
              />
            </div>
          </Split>
        </div>
      ) : (
        <div className="welcome-screen">
          <h2>欢迎使用 LearnWise</h2>
          <p>请上传学习资料开始使用</p>
          <p className="hint">支持视频、文本、代码等多种格式</p>
        </div>
      )}
    </div>
  );
}

export default App;

