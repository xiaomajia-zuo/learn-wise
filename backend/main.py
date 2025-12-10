import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv()

# Use package-relative imports so this module can be run as
# `uvicorn backend.main:app` from the project root.
from .routes import upload as upload_router
from .routes import ai as ai_router
from .routes import chat as chat_router

app = FastAPI(title="LearnWise FastAPI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allow_headers=["*"],
)

app.include_router(upload_router.router, prefix="/api/upload")
app.include_router(ai_router.router, prefix="/api/ai")
app.include_router(chat_router.router, prefix="/api/chat")

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": __import__("datetime").datetime.utcnow().isoformat()}

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(status_code=500, content={"error": str(exc), "detail": getattr(exc, "details", None)})
