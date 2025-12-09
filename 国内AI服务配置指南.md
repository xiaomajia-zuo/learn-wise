# 国内AI服务配置指南

本应用支持多个AI服务提供商，方便国内用户使用。以下是各服务的配置方法：

## 推荐方案（按优先级）

### 1. DeepSeek（推荐）⭐

**优势**：
- 完全兼容OpenAI API，无需修改代码
- 价格便宜（约0.001元/1K tokens）
- 性能优秀，中文理解能力强
- 无需特殊网络环境

**获取API Key**：
1. 访问 https://platform.deepseek.com/
2. 注册账号并登录
3. 进入API Keys页面创建密钥
4. 新用户有免费额度

**配置方式**（在 `.env` 文件中）：
```env
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=你的DeepSeek_API密钥
DEEPSEEK_MODEL=deepseek-chat
```

### 2. 通义千问（阿里云）

**优势**：
- 阿里云官方服务，稳定可靠
- 支持OpenAI兼容API
- 适合企业用户

**获取API Key**：
1. 访问 https://dashscope.aliyun.com/
2. 注册/登录阿里云账号
3. 开通通义千问服务
4. 创建API Key

**配置方式**：
```env
AI_PROVIDER=qwen
QWEN_API_KEY=你的通义千问API密钥
QWEN_MODEL=qwen-turbo
# 或者使用完整URL
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

### 3. 智谱GLM（智谱AI）

**优势**：
- 清华大学背景，技术实力强
- 中文能力优秀
- 提供免费试用额度

**获取API Key**：
1. 访问 https://open.bigmodel.cn/
2. 注册账号
3. 创建API Key

**配置方式**：
```env
AI_PROVIDER=zhipu
ZHIPU_API_KEY=你的智谱API密钥
ZHIPU_MODEL=glm-4
```

### 4. Moonshot（月之暗面）

**优势**：
- 支持长上下文（128K）
- 中文理解能力强
- 价格合理

**获取API Key**：
1. 访问 https://platform.moonshot.cn/
2. 注册账号
3. 创建API Key

**配置方式**：
```env
AI_PROVIDER=moonshot
MOONSHOT_API_KEY=你的Moonshot_API密钥
MOONSHOT_MODEL=moonshot-v1-8k
```

### 5. OpenAI（需代理）

如果你有可用的代理或VPN，也可以继续使用OpenAI：

**配置方式**：
```env
AI_PROVIDER=openai
OPENAI_API_KEY=你的OpenAI_API密钥
OPENAI_MODEL=gpt-4o-mini
```

## 快速配置步骤

1. **选择AI服务提供商**（推荐DeepSeek）

2. **获取API Key**
   - DeepSeek: https://platform.deepseek.com/
   - 通义千问: https://dashscope.aliyun.com/
   - 智谱GLM: https://open.bigmodel.cn/
   - Moonshot: https://platform.moonshot.cn/

3. **配置 `.env` 文件**

   在项目根目录创建或编辑 `.env` 文件，添加相应配置：

   **DeepSeek示例**：
   ```env
   PORT=3001
   AI_PROVIDER=deepseek
   DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
   UPLOAD_DIR=uploads
   MAX_FILE_SIZE=104857600
   NODE_ENV=development
   ```

4. **重启服务器**
   ```bash
   npm start
   ```

## 价格对比（仅供参考）

| 服务商 | 价格（每1K tokens） | 免费额度 |
|--------|-------------------|---------|
| DeepSeek | ~0.001元 | 新用户有试用 |
| 通义千问 | 根据模型不同 | 有试用额度 |
| 智谱GLM | 根据模型不同 | 有试用额度 |
| Moonshot | 根据模型不同 | 有试用额度 |
| OpenAI | ~0.01元 | 需绑定信用卡 |

## 注意事项

1. **API Key安全**：不要将API Key提交到Git仓库
2. **费用控制**：注意API调用费用，建议设置使用限额
3. **模型选择**：不同模型的价格和性能不同，可根据需求选择
4. **网络要求**：DeepSeek、通义千问、智谱GLM等国内服务无需特殊网络

## 故障排查

如果遇到问题：

1. **检查API Key是否正确**
   ```bash
   echo $DEEPSEEK_API_KEY  # 确认环境变量已加载
   ```

2. **检查服务提供商状态**
   - 查看各服务商的官方状态页面
   - 确认账号是否正常，余额是否充足

3. **查看日志**
   ```bash
   # 开发模式下查看详细错误信息
   npm run dev
   ```

4. **测试API连接**
   ```bash
   # 可以在代码中添加测试接口
   ```

## 切换AI服务提供商

只需修改 `.env` 文件中的 `AI_PROVIDER` 和对应的API Key，无需修改代码：

```env
# 从DeepSeek切换到通义千问
AI_PROVIDER=qwen
QWEN_API_KEY=新的API密钥
```

重启服务器即可生效。

