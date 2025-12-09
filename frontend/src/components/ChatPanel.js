import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './ChatPanel.css';
import { API_BASE_URL } from '../config';

function ChatPanel({ conversationId, onConversationStart, context }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConvId, setCurrentConvId] = useState(conversationId);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (conversationId && conversationId !== currentConvId) {
      setCurrentConvId(conversationId);
      setMessages([]);
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // 添加用户消息
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        message: userMessage,
        conversationId: currentConvId,
        context: context
      });

      if (response.data.success) {
        // 更新对话ID
        if (!currentConvId && response.data.conversationId) {
          setCurrentConvId(response.data.conversationId);
          onConversationStart?.(response.data.conversationId);
        }

        // 添加AI回复
        setMessages([
          ...newMessages,
          { role: 'assistant', content: response.data.response }
        ]);
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: '抱歉，发送消息时出现错误。请稍后重试。'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-panel">
      <div className="panel-header">AI 学习助手</div>
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <p>👋 你好！我是你的AI学习助手</p>
            <p>你可以向我提问关于学习资料的任何问题</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`message ${msg.role === 'user' ? 'user-message' : 'ai-message'}`}
            >
              <div className="message-content">{msg.content}</div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="message ai-message">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-input-form" onSubmit={handleSend}>
        <input
          type="text"
          className="chat-input"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="输入你的问题..."
          disabled={isLoading}
        />
        <button
          type="submit"
          className="send-button"
          disabled={isLoading || !inputMessage.trim()}
        >
          发送
        </button>
      </form>
    </div>
  );
}

export default ChatPanel;

