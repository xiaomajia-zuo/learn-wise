const express = require('express');
const router = express.Router();
const { callAI } = require('../services/aiService');

// 存储会话历史（实际应用中应使用数据库）
const conversations = new Map();

// AI对话
router.post('/', async (req, res) => {
  try {
    const { message, conversationId, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: '消息不能为空' });
    }

    // 获取或创建对话历史
    const convId = conversationId || Date.now().toString();
    if (!conversations.has(convId)) {
      conversations.set(convId, []);
    }
    const history = conversations.get(convId);

    // 构建系统提示词
    let systemPrompt = '你是一个专业的学习助手，能够帮助学生理解学习资料、解答问题、提供学习建议。';
    if (context) {
      systemPrompt += `\n\n当前学习资料的上下文信息：\n${context}`;
    }

    // 添加用户消息到历史
    history.push({
      role: 'user',
      content: message
    });

    // 构建消息数组
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...history.slice(-10) // 只保留最近10轮对话
    ];

    // 调用AI服务
    const aiResponse = await callAI(messages, {
      temperature: 0.7,
      max_tokens: 2000
    });

    // 添加AI回复到历史
    history.push({
      role: 'assistant',
      content: aiResponse
    });

    res.json({
      success: true,
      conversationId: convId,
      response: aiResponse
    });
  } catch (error) {
    console.error('对话错误:', error);
    res.status(500).json({ 
      error: error.message || '对话处理时出错',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 获取对话历史
router.get('/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  const history = conversations.get(conversationId) || [];
  res.json({ history });
});

// 清除对话历史
router.delete('/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  conversations.delete(conversationId);
  res.json({ success: true });
});

module.exports = router;

