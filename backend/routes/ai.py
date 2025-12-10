from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..services.ai_service import call_ai, get_ai_config

router = APIRouter()

class SummaryRequest(BaseModel):
    content: str
    type: str = "text"

@router.post("/summary")
async def summary(req: SummaryRequest):
    if not req.content:
        raise HTTPException(status_code=400, detail="内容不能为空")
    prompt = ""
    if req.type == "code":
        prompt = f"""请为以下代码生成一个详细的摘要，包括：
1. 代码的主要功能
2. 使用的关键技术/库
3. 代码结构说明
4. 关键算法或逻辑
5. 可能的改进建议

代码：
{req.content}
请用中文回答："""
    elif req.type == "video":
        prompt = f"""请为以下视频字幕/文本内容生成摘要，包括：
1. 视频主题和主要内容
2. 关键知识点
3. 重要概念解释
4. 学习要点总结

视频内容：
{req.content}

请用中文回答："""
    else:
        prompt = f"""请为以下学习资料生成一个详细的摘要，包括：
1. 主要内容概述
2. 核心知识点
3. 重要概念
4. 学习要点

内容：
{req.content}

请用中文回答："""

    messages = [
        {"role": "system", "content": "你是一个专业的学习助手，擅长为各种学习资料生成清晰、结构化的摘要。"},
        {"role": "user", "content": prompt}
    ]

    try:
        summary_text = await call_ai(messages, {"temperature": 0.7, "max_tokens": 2000})
        return {"success": True, "summary": summary_text}
    except Exception as e:
        err = {"success": False, "error": str(e)}
        if hasattr(e, "details"):
            err["details"] = e.details
        if hasattr(e, "provider"):
            err["provider"] = e.provider
        status = getattr(e, "status", 500)
        raise HTTPException(status_code=status, detail=err)
        
@router.get("/config")
async def config():
    cfg = get_ai_config()
    return {"provider": cfg["provider"], "model": cfg.get("model"), "baseURL": cfg.get("baseURL"), "hasApiKey": bool(cfg.get("apiKey")), "apiKeyPrefix": (cfg.get("apiKey")[:7] + "...") if cfg.get("apiKey") else "未配置"}
