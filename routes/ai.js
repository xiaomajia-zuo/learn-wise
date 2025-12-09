const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { callAI, getAIConfig } = require('../services/aiService');

// 生成摘要
router.post('/summary', async (req, res) => {
  try {
    const { content, type = 'text' } = req.body;

    if (!content) {
      return res.status(400).json({ error: '内容不能为空' });
    }

    let prompt = '';
    switch (type) {
      case 'code':
        prompt = `请为以下代码生成一个详细的摘要，包括：
1. 代码的主要功能
2. 使用的关键技术/库
3. 代码结构说明
4. 关键算法或逻辑
5. 可能的改进建议

代码：
\`\`\`
${content}
\`\`\`

请用中文回答：`;
        break;
      case 'video':
        prompt = `请为以下视频字幕/文本内容生成摘要，包括：
1. 视频主题和主要内容
2. 关键知识点
3. 重要概念解释
4. 学习要点总结

视频内容：
${content}

请用中文回答：`;
        break;
      default:
        prompt = `请为以下学习资料生成一个详细的摘要，包括：
1. 主要内容概述
2. 核心知识点
3. 重要概念
4. 学习要点

内容：
${content}

请用中文回答：`;
    }

    const messages = [
      {
        role: 'system',
        content: '你是一个专业的学习助手，擅长为各种学习资料生成清晰、结构化的摘要。'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const summary = await callAI(messages, {
      temperature: 0.7,
      max_tokens: 2000
    });

    res.json({
      success: true,
      summary: summary
    });
  } catch (error) {
    console.error('生成摘要错误:', error);
    
    // 返回更友好的错误信息
    const statusCode = error.status || 500;
    const response = {
      success: false,
      error: error.message || '生成摘要时出错',
      ...(error.details && { details: error.details }),
      ...(error.provider && { provider: error.provider })
    };
    
    // 开发环境下返回更多调试信息
    if (process.env.NODE_ENV === 'development') {
      response.stack = error.stack;
    }
    
    res.status(statusCode).json(response);
  }
});

// 从文件生成摘要
router.post('/summary/file/:fileId', async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const filePath = path.join(uploadDir, fileId);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '文件不存在' });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const fileType = path.extname(filePath).substring(1).toLowerCase();
    const isCode = ['js', 'py', 'java', 'cpp', 'c', 'html', 'css'].includes(fileType);

    // 调用摘要生成逻辑
    const type = isCode ? 'code' : 'text';
    let prompt = '';
    switch (type) {
      case 'code':
        prompt = `请为以下代码生成一个详细的摘要，包括：
1. 代码的主要功能
2. 使用的关键技术/库
3. 代码结构说明
4. 关键算法或逻辑
5. 可能的改进建议

代码：
\`\`\`
${content}
\`\`\`

请用中文回答：`;
        break;
      default:
        prompt = `请为以下学习资料生成一个详细的摘要，包括：
1. 主要内容概述
2. 核心知识点
3. 重要概念
4. 学习要点

内容：
${content}

请用中文回答：`;
    }

    const messages = [
      {
        role: 'system',
        content: '你是一个专业的学习助手，擅长为各种学习资料生成清晰、结构化的摘要。'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const summary = await callAI(messages, {
      temperature: 0.7,
      max_tokens: 2000
    });

    res.json({
      success: true,
      summary: summary
    });
  } catch (error) {
    console.error('处理文件摘要错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI配置诊断接口
router.get('/config', (req, res) => {
  try {
    const config = getAIConfig();
    res.json({
      provider: config.provider,
      model: config.model,
      baseURL: config.baseURL,
      hasApiKey: !!config.apiKey,
      apiKeyPrefix: config.apiKey ? config.apiKey.substring(0, 7) + '...' : '未配置'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

