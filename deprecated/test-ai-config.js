/**
 * AI配置测试脚本
 * 用于诊断AI服务配置问题
 */

require('dotenv').config();
const { getAIConfig } = require('./services/aiService');

console.log('=== AI配置诊断 ===\n');

try {
  const config = getAIConfig();
  
  console.log('当前配置:');
  console.log(`- 提供商: ${config.provider}`);
  console.log(`- 模型: ${config.model}`);
  console.log(`- API地址: ${config.baseURL}`);
  console.log(`- API Key存在: ${!!config.apiKey ? '是' : '否'}`);
  
  if (config.apiKey) {
    console.log(`- API Key前缀: ${config.apiKey.substring(0, 10)}...`);
    console.log(`- API Key长度: ${config.apiKey.length} 字符`);
    
    // 检查API Key格式
    if (config.provider === 'deepseek' && !config.apiKey.startsWith('sk-')) {
      console.log('\n⚠️  警告: DeepSeek API Key 通常以 "sk-" 开头');
    }
  } else {
    console.log('\n❌ 错误: 未配置API Key');
    console.log(`请在 .env 文件中设置: ${config.provider === 'deepseek' ? 'DEEPSEEK_API_KEY' : 'OPENAI_API_KEY'}`);
  }
  
  console.log('\n环境变量检查:');
  console.log(`- AI_PROVIDER: ${process.env.AI_PROVIDER || '未设置 (将使用默认值: deepseek)'}`);
  console.log(`- DEEPSEEK_API_KEY: ${process.env.DEEPSEEK_API_KEY ? '已设置' : '未设置'}`);
  console.log(`- OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '已设置' : '未设置'}`);
  
} catch (error) {
  console.error('❌ 配置错误:', error.message);
  process.exit(1);
}

console.log('\n=== 诊断完成 ===');

