from fastapi import APIRouter, UploadFile, File, HTTPException, Request, Response
from fastapi.responses import StreamingResponse, JSONResponse
import os
import aiofiles
import uuid
from dotenv import load_dotenv
import mimetypes

# ...existing code...
load_dotenv()
router = APIRouter()
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE") or 200 * 1024 * 1024)
os.makedirs(UPLOAD_DIR, exist_ok=True)

def unique_filename(orig: str):
    ext = os.path.splitext(orig)[1]
    return f"{uuid.uuid4().hex}{ext}"

@router.post("/")
async def upload_file(file: UploadFile = File(...)):
    # 简短文件大小检查（注意： UploadFile 缺少直接 size，需要在客户端或读取时检查）
    filename = unique_filename(file.filename)
    path = os.path.join(UPLOAD_DIR, filename)
    try:
        async with aiofiles.open(path, "wb") as out_file:
            content = await file.read()
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(status_code=413, detail="文件过大")
            await out_file.write(content)
    finally:
        await file.close()

    file_info = {
        "id": filename,
        "filename": file.filename,
        "storedName": filename,
        "path": path,
        "size": os.path.getsize(path),
        "mimetype": file.content_type,
        "uploadTime": __import__("datetime").datetime.utcnow().isoformat()
    }
    return {"success": True, "file": file_info}

@router.get("/{file_id}/content")
async def get_content(file_id: str, request: Request):
    file_path = os.path.join(UPLOAD_DIR, file_id)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="文件不存在")

    ext = os.path.splitext(file_path)[1].lower()
    is_video = ext in [".mp4", ".webm", ".ogg", ".mov"]
    is_pdf = ext == ".pdf"
    is_epub = ext == ".epub"
    text_types = [".txt", ".md", ".js", ".py", ".java", ".cpp", ".c", ".html", ".css", ".json", ".xml"]

    if is_video or is_pdf or is_epub:
        # 支持 Range 请求（简化实现）
        headers = {}
        range_header = request.headers.get("range")
        file_size = os.path.getsize(file_path)
        if range_header:
            # 简单解析 bytes=start-end
            _, range_val = range_header.split("=")
            start_str, end_str = range_val.split("-")
            start = int(start_str)
            end = int(end_str) if end_str else file_size - 1
            if end >= file_size:
                end = file_size - 1
            chunk_size = end - start + 1

            async def iterate_file():
                async with aiofiles.open(file_path, "rb") as f:
                    await f.seek(start)
                    remaining = chunk_size
                    while remaining > 0:
                        read_size = min(1024 * 1024, remaining)
                        chunk = await f.read(read_size)
                        if not chunk:
                            break
                        remaining -= len(chunk)
                        yield chunk

            content_type = mimetypes.guess_type(file_path)[0] or "application/octet-stream"
            headers.update({
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(chunk_size),
                "Content-Type": content_type,
            })
            return StreamingResponse(iterate_file(), status_code=206, headers=headers)
        else:
            # 全量返回
            def iterfile():
                with open(file_path, "rb") as f:
                    while True:
                        chunk = f.read(1024 * 1024)
                        if not chunk:
                            break
                        yield chunk
            return StreamingResponse(iterfile(), media_type=mimetypes.guess_type(file_path)[0] or "application/octet-stream")
    else:
        # 文本文件返回 JSON
        async with aiofiles.open(file_path, mode="r", encoding="utf-8", errors="ignore") as f:
            content = await f.read()
        return JSONResponse({"content": content})