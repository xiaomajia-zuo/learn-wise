# LearnWise - 智能学习助手

一个支持多格式学习资料处理和AI对话的智能学习平台。

## 功能特性

- 📚 **多格式支持**：支持视频、文本、代码等多种学习资料
- 🤖 **AI摘要生成**：自动为学习资料生成结构化摘要
- 💬 **智能对话**：基于学习资料的上下文AI对话
- 🎨 **分屏展示**：同时查看资料、摘要和对话界面
- 💻 **代码高亮**：支持多种编程语言的语法高亮

## 项目结构
```
learnwise-backend/
├── backend/ # 后端FastAPI应用 
│   ├── main.py # 后端服务器入口 
│   ├── routes/ # API路由 
│   │   ├── upload.py # 文件上传接口 
│   │   ├── ai.py # AI处理接口  
│   │   └── chat.py # 对话接口  
│   ├── services/ # 业务逻辑服务  
│   │   └── ai_service.py # AI服务实现  
│   ├── uploads/ # 上传文件存储目录 
│   ├── .env # 后端环境变量配置  
│   └── requirements.txt # 后端依赖包 
└── frontend/ # 前端React应用 
    ├── src/ 
    │   ├── App.js # 主应用组件 
    │   ├── components/ # React组件 
    │   │   ├── FileUpload.js 
    │   │   ├── MaterialViewer.js 
    │   │   ├── SummaryPanel.js 
    │   │   └── ChatPanel.js 
    │   └── config.js # 配置文件 
    └── public/
```

## 快速开始

### 前置要求

- Node.js (v16+)
- npm 或 yarn
- AI API Key（推荐DeepSeek，国内用户无需代理）

### 后端设置
1. 进入后端目录创建虚拟环境（可选但推荐）：
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

2. 安装依赖：
```bash
pip install -r backend/requirements.txt
```

3. 配置backend/.env环境变量：
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
UPLOAD_DIR=backend/uploads
MAX_FILE_SIZE=209715200
```

**国内用户推荐使用DeepSeek**（无需代理，价格便宜）：
- 获取API Key：https://platform.deepseek.com/
- 详细配置说明请查看：`国内AI服务配置指南.md`

4. 启动后端服务器：
```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 3001
```

后端服务将在 `http://localhost:3001` 运行。

### 前端设置

1. 进入前端目录：
```bash
cd frontend
```

2. 安装依赖：
```bash
npm install
```

3. 配置API地址（如需要）：
创建 `.env` 文件：
```
REACT_APP_API_URL=http://localhost:3001/api
```

4. 启动前端应用：
```bash
npm start
```

前端应用将在 `http://localhost:3000` 运行。

## API 接口

### 文件上传
- `POST /api/upload` - 上传学习资料文件
- `GET /api/upload/:fileId/content` - 获取文件内容

### AI处理
- `POST /api/ai/summary` - 生成内容摘要
  ```json
  {
    "content": "要摘要的内容",
    "type": "text|code|video"
  }
  ```

### 对话
- `POST /api/chat` - 发送消息
  ```json
  {
    "message": "用户消息",
    "conversationId": "对话ID（可选）",
    "context": "上下文信息（可选）"
  }
  ```

## 支持的文件格式

- **视频**：MP4, WebM, OGG, MOV
- **文本**：TXT, Markdown, PDF, EPUB
- **代码**：JavaScript, Python, Java, C/C++, HTML, CSS, JSON, XML

## 技术栈

### 后端
- Express.js - Web框架
- Multer - 文件上传处理
- AI服务适配器 - 支持多个AI提供商（OpenAI、DeepSeek、通义千问、智谱GLM、Moonshot）
- Helmet - 安全中间件
- CORS - 跨域支持

### 前端
- React - UI框架
- Axios - HTTP客户端
- React Syntax Highlighter - 代码高亮
- React Markdown - Markdown渲染
- React Split - 分屏布局

## 开发说明

### 环境变量

后端 `.env` 文件：
```
PORT=3001
AI_PROVIDER=deepseek  # 可选：openai, deepseek, qwen, zhipu, moonshot
DEEPSEEK_API_KEY=your_api_key_here
UPLOAD_DIR=uploads
MAX_FILE_SIZE=209715200  # 200MB (支持视频和PDF等大文件)
```

**国内用户推荐配置**（使用DeepSeek，无需代理）：
```
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=你的DeepSeek_API密钥
```

详细配置说明请查看：`国内AI服务配置指南.md`

前端 `.env` 文件（可选）：
```
REACT_APP_API_URL=http://localhost:3001/api
```

## 支持的AI服务提供商

- **DeepSeek** ⭐（推荐国内用户）- https://platform.deepseek.com/
- **通义千问**（阿里云）- https://dashscope.aliyun.com/
- **智谱GLM** - https://open.bigmodel.cn/
- **Moonshot**（月之暗面）- https://platform.moonshot.cn/
- **OpenAI**（需要代理）- https://platform.openai.com/

详细配置说明请查看：`国内AI服务配置指南.md`

## 后续扩展建议

1. **数据库集成**：使用 MongoDB 或 PostgreSQL 存储文件信息和对话历史
2. **用户认证**：添加用户登录和权限管理
3. **视频处理**：集成视频转字幕功能
4. **多语言支持**：支持更多编程语言和自然语言
5. **移动端适配**：开发小程序或移动端应用
6. **性能优化**：文件分片上传、流式响应等

## 许可证

ISC

## 贡献

欢迎提交 Issue 和 Pull Request！
