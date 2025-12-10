/**
 * AI服务适配器 - 支持多个AI提供商
 * 支持的提供商：OpenAI, DeepSeek, 通义千问, 智谱GLM, Moonshot
 */

// 获取AI服务配置
function getAIConfig() {
  const provider = process.env.AI_PROVIDER || 'deepseek';
  const configs = {
    openai: {
      baseURL: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
    },
    deepseek: {
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat'
    },
    qwen: {
      baseURL: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      apiKey: process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY,
      model: process.env.QWEN_MODEL || 'qwen-turbo'
    },
    zhipu: {
      baseURL: 'https://open.bigmodel.cn/api/paas/v4',
      apiKey: process.env.ZHIPU_API_KEY,
      model: process.env.ZHIPU_MODEL || 'glm-4',
      // 智谱GLM需要JWT token，这里简化处理，实际使用时需要生成JWT
      needsJWT: true
    },
    moonshot: {
      baseURL: 'https://api.moonshot.cn/v1',
      apiKey: process.env.MOONSHOT_API_KEY,
      model: process.env.MOONSHOT_MODEL || 'moonshot-v1-8k'
    }
  };

  return {
    provider,
    ...configs[provider]
  };
}

// 创建AI客户端
function createAIClient() {
  const config = getAIConfig();
  
  // 验证配置
  if (!config.apiKey) {
    throw new Error(`未配置 ${config.provider} API Key，请在 .env 文件中设置相应的环境变量`);
  }

  // 如果使用智谱GLM，需要特殊处理
  if (config.provider === 'zhipu') {
    return createZhipuClient(config);
  }

  // 其他提供商可以使用OpenAI SDK（兼容API）
  const OpenAI = require('openai');
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    timeout: 60000, // 60秒超时
    maxRetries: 2
  });
}

// 智谱GLM客户端（需要特殊处理）
function createZhipuClient(config) {
  // 智谱GLM使用不同的API格式，这里返回一个适配器对象
  return {
    chat: {
      completions: {
        create: async (params) => {
          const axios = require('axios');
          const response = await axios.post(
            `${config.baseURL}/chat/completions`,
            {
              model: config.model,
              messages: params.messages,
              temperature: params.temperature || 0.7,
              max_tokens: params.max_tokens || 2000
            },
            {
              headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          // 转换为OpenAI格式
          return {
            choices: [{
              message: {
                content: response.data.choices[0].message.content
              }
            }]
          };
        }
      }
    }
  };
}

// 调用AI服务
async function callAI(messages, options = {}) {
  const config = getAIConfig();
  
  // 验证API Key
  if (!config.apiKey) {
    const errorMsg = `未配置 ${config.provider} API Key。请在 .env 文件中设置：\n` +
      `- ${config.provider === 'deepseek' ? 'DEEPSEEK_API_KEY' : 'OPENAI_API_KEY'}=你的API密钥`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // 验证API Key格式（基本检查）
  if (config.provider === 'deepseek' && !config.apiKey.startsWith('sk-')) {
    console.warn('警告：DeepSeek API Key 通常以 "sk-" 开头，请确认API Key是否正确');
  }

  console.log(`使用AI服务: ${config.provider}, 模型: ${config.model}, BaseURL: ${config.baseURL}`);
  
  const client = createAIClient();

  try {
    const completion = await client.chat.completions.create({
      model: config.model,
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 2000
    });

    return completion.choices[0].message.content;
  } catch (error) {
    // 更详细的错误信息
    let errorMessage = '';
    let userFriendlyMessage = '';
    
    // OpenAI SDK错误对象的status属性
    const statusCode = error.status || (error.response && error.response.status);
    const errorData = error.error || error.response?.data || {};
    const errorMsg = errorData.message || error.message || '未知错误';
    
    // 检查是否是402余额不足错误
    if (statusCode === 402 || errorMsg.includes('Insufficient Balance')) {
      userFriendlyMessage = '账户余额不足';
      errorMessage = `您的 ${config.provider === 'deepseek' ? 'DeepSeek' : config.provider} 账户余额不足，无法使用AI服务。\n\n解决方案：\n1. 访问 ${config.provider === 'deepseek' ? 'https://platform.deepseek.com' : 'https://platform.openai.com'} 充值账户\n2. 或切换到其他AI服务提供商\n3. 查看"国内AI服务配置指南.md"了解如何配置其他服务`;
    } 
    // 检查是否是401认证错误
    else if (statusCode === 401 || errorMsg.includes('Unauthorized') || errorMsg.includes('Invalid API Key')) {
      userFriendlyMessage = 'API密钥无效';
      errorMessage = `API密钥无效或已过期。请检查 .env 文件中的 ${config.provider === 'deepseek' ? 'DEEPSEEK_API_KEY' : 'OPENAI_API_KEY'} 是否正确。`;
    }
    // 检查是否是429速率限制错误
    else if (statusCode === 429 || errorMsg.includes('rate limit')) {
      userFriendlyMessage = '请求过于频繁';
      errorMessage = `请求频率过高，请稍后再试。`;
    }
    // 其他API错误
    else if (statusCode) {
      userFriendlyMessage = `API错误 (${statusCode})`;
      errorMessage = `AI服务调用失败 (${config.provider})\n状态码: ${statusCode}\n错误: ${errorMsg}`;
    } 
    // 网络连接错误
    else if (error.request || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      userFriendlyMessage = '网络连接失败';
      errorMessage = `无法连接到 ${config.baseURL}\n\n请检查：\n1. 网络连接是否正常\n2. API地址是否正确\n3. 是否需要配置代理（国内访问某些服务需要）\n4. 防火墙是否阻止了连接`;
    } 
    // 其他错误
    else {
      userFriendlyMessage = '未知错误';
      errorMessage = `AI服务调用失败: ${errorMsg}`;
    }
    
    console.error(`AI服务调用失败 (${config.provider}):`, errorMessage);
    console.error('完整错误详情:', error);
    
    // 创建一个包含用户友好消息和详细信息的错误对象
    const customError = new Error(userFriendlyMessage);
    customError.details = errorMessage;
    customError.status = statusCode || 500;
    customError.provider = config.provider;
    throw customError;
  }
}

module.exports = {
  callAI,
  getAIConfig
};

