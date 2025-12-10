import os
import httpx
from typing import List, Dict, Any
from dotenv import load_dotenv

# ...existing code...
load_dotenv()

def get_ai_config():
    provider = os.getenv("AI_PROVIDER", "deepseek")
    configs = {
        "openai": {
            "baseURL": os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
            "apiKey": os.getenv("OPENAI_API_KEY"),
            "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        },
        "deepseek": {
            "baseURL": os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1"),
            "apiKey": os.getenv("DEEPSEEK_API_KEY") or os.getenv("OPENAI_API_KEY"),
            "model": os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
        },
        "qwen": {
            "baseURL": os.getenv("QWEN_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1"),
            "apiKey": os.getenv("QWEN_API_KEY") or os.getenv("DASHSCOPE_API_KEY"),
            "model": os.getenv("QWEN_MODEL", "qwen-turbo")
        },
        "zhipu": {
            "baseURL": os.getenv("ZHIPU_BASE_URL", "https://open.bigmodel.cn/api/paas/v4"),
            "apiKey": os.getenv("ZHIPU_API_KEY"),
            "model": os.getenv("ZHIPU_MODEL", "glm-4"),
            "needsJWT": True
        },
        "moonshot": {
            "baseURL": os.getenv("MOONSHOT_BASE_URL", "https://api.moonshot.cn/v1"),
            "apiKey": os.getenv("MOONSHOT_API_KEY"),
            "model": os.getenv("MOONSHOT_MODEL", "moonshot-v1-8k")
        }
    }
    cfg = configs.get(provider)
    return {"provider": provider, **(cfg or {})}

async def call_ai(messages: List[Dict[str, str]], options: Dict[str, Any] = None) -> str:
    options = options or {}
    cfg = get_ai_config()
    if not cfg.get("apiKey"):
        raise Exception(f"未配置 {cfg['provider']} API Key，请在 .env 中设置相应变量")

    # 简化：使用 OpenAI 兼容的 /chat/completions 接口
    url = f"{cfg['baseURL'].rstrip('/')}/chat/completions"
    payload = {
        "model": cfg["model"],
        "messages": messages,
        "temperature": options.get("temperature", 0.7),
        "max_tokens": options.get("max_tokens", 2000)
    }

    headers = {
        "Authorization": f"Bearer {cfg['apiKey']}",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient(timeout=60) as client:
        try:
            r = await client.post(url, json=payload, headers=headers)
            r.raise_for_status()
            data = r.json()
            # 兼容 deepseek/other providers 返回格式
            choice = data.get("choices", [{}])[0]
            content = (choice.get("message") or {}).get("content") or choice.get("text") or ""
            return content
        except httpx.HTTPStatusError as e:
            status = e.response.status_code
            msg = e.response.text
            # 简单映射与 JS 版相同的友好错误
            if status == 402 or "Insufficient Balance" in msg:
                ex = Exception("账户余额不足")
                ex.details = f"您的 {cfg['provider']} 账户余额不足。{msg}"
                ex.provider = cfg['provider']
                ex.status = 402
                raise ex
            if status == 401:
                ex = Exception("API密钥无效")
                ex.details = msg
                ex.status = 401
                raise ex
            if status == 429:
                ex = Exception("请求过于频繁")
                ex.details = msg
                ex.status = 429
                raise ex
            raise
        except Exception as e:
            raise