import React from 'react';
import ReactMarkdown from 'react-markdown';
import './SummaryPanel.css';

function SummaryPanel({ summary, isLoading, error, onRegenerate }) {
  return (
    <div className="summary-panel">
      <div className="panel-header">
        <span>资料摘要</span>
        {(summary || error) && (
          <button className="regenerate-btn" onClick={onRegenerate}>
            重新生成
          </button>
        )}
      </div>
      <div className="panel-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>正在生成摘要...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>{error.message}</h3>
            {error.details && (
              <div className="error-details">
                <pre>{error.details}</pre>
              </div>
            )}
            {error.message.includes('余额不足') && (
              <div className="error-solution">
                <p><strong>解决方案：</strong></p>
                <ul>
                  <li>访问 <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer">DeepSeek平台</a> 充值账户</li>
                  <li>或切换到其他AI服务（查看"国内AI服务配置指南.md"）</li>
                </ul>
              </div>
            )}
            {error.message.includes('API密钥') && (
              <div className="error-solution">
                <p><strong>解决方案：</strong></p>
                <ul>
                  <li>检查 .env 文件中的API密钥配置</li>
                  <li>确认API密钥是否正确且有效</li>
                </ul>
              </div>
            )}
          </div>
        ) : summary ? (
          <ReactMarkdown className="summary-content">{summary}</ReactMarkdown>
        ) : (
          <div className="empty-state">
            <p>暂无摘要</p>
            <p className="hint">上传文本或代码文件后将自动生成摘要</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SummaryPanel;

