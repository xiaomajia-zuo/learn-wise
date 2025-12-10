from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from ..services.ai_service import call_ai

router = APIRouter()
conversations = {}

class ChatRequest(BaseModel):
    message: str
    conversationId: Optional[str] = None
    context: Optional[str] = None

@router.post("/")
async def chat(req: ChatRequest):
    if not req.message:
        raise HTTPException(status_code=400, detail="消息不能为空")

    conv_id = req.conversationId or str(__import__("time").time())
    history = conversations.setdefault(conv_id, [])
    history.append({"role": "user", "content": req.message})
    system_prompt = "你是一个专业的学习助手，能够帮助学生理解学习资料、解答问题、提供学习建议。"
    if req.context:
        system_prompt += f"\\n\\n当前学习资料的上下文信息：\\n{req.context}"

    messages = [{"role": "system", "content": system_prompt}] + history[-10:]
    try:
        ai_resp = await call_ai(messages, {"temperature": 0.7, "max_tokens": 2000})
        history.append({"role": "assistant", "content": ai_resp})
        return {"success": True, "conversationId": conv_id, "response": ai_resp}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{conversationId}")
async def get_history(conversationId: str):
    return {"history": conversations.get(conversationId, [])}

@router.delete("/{conversationId}")
async def delete_history(conversationId: str):
    conversations.pop(conversationId, None)
    return {"success": True}
