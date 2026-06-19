import io
import re
import time
import random
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

app = FastAPI(title="译云协作 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Paragraph(BaseModel):
    id: str
    text: str


class TranslateRequest(BaseModel):
    text: str
    target_lang: str = "zh"


class TranslateResponse(BaseModel):
    translated_text: str


class ExportRequest(BaseModel):
    paragraphs: List[dict]
    format: str = "markdown"
    bilingual: bool = True


def split_into_paragraphs(text: str) -> List[str]:
    lines = text.strip().splitlines()
    paragraphs = []
    current = []
    for line in lines:
        stripped = line.strip()
        if stripped:
            current.append(stripped)
        elif current:
            paragraphs.append(" ".join(current))
            current = []
    if current:
        paragraphs.append(" ".join(current))
    if not paragraphs and text.strip():
        paragraphs.append(text.strip())
    return paragraphs


def mock_translate(text: str, target_lang: str = "zh") -> str:
    time.sleep(random.uniform(0.3, 0.8))
    sample_map = {
        "hello": "你好",
        "world": "世界",
        "welcome": "欢迎",
        "translation": "翻译",
        "document": "文档",
        "language": "语言",
        "collaboration": "协作",
        "project": "项目",
        "team": "团队",
        "content": "内容",
        "file": "文件",
        "upload": "上传",
        "export": "导出",
        "comment": "评论",
        "paragraph": "段落",
        "quality": "质量",
        "review": "审核",
        "progress": "进度",
        "complete": "完成",
        "continue": "继续",
    }
    if target_lang.startswith("zh"):
        result = text
        for eng, chn in sample_map.items():
            result = re.sub(rf"\b{eng}\b", chn, result, flags=re.IGNORECASE)
        if result == text:
            result = "[译] " + text
        return result
    else:
        return "[EN] " + text


@app.post("/api/upload", response_model=List[Paragraph])
async def upload_document(file: UploadFile = File(...)):
    content = await file.read()
    filename = file.filename.lower() if file.filename else ""
    text = ""
    if filename.endswith(".txt"):
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            text = content.decode("gbk", errors="ignore")
    elif filename.endswith(".pdf"):
        text = f"[PDF文档内容解析占位] 文件名：{file.filename}\n\n"
        text += "这是第一段示例文本，用于演示文档翻译功能。Welcome to the translation platform!\n\n"
        text += "这是第二段示例文本，团队成员可以在此协作翻译和讨论。Our team focuses on high quality translation.\n\n"
        text += "Paragraph three: please add your comments on the right side of each translation block.\n\n"
        text += "第四段：导出功能支持双语对照或纯译文的 PDF 与 Markdown 格式。\n\n"
        text += "Fifth paragraph: the progress bar at the top shows overall translation progress smoothly.\n\n"
        text += "第六段：所有输入框和按钮都有悬停反馈效果，界面响应式适配移动端。\n\n"
        text += "Paragraph seven: real-time save uses debounce to ensure performance under 200ms.\n\n"
        text += "第八段：段落切换和文档加载响应时间不超过 500 毫秒。\n"
    else:
        raise HTTPException(status_code=400, detail="仅支持 .txt 和 .pdf 格式")

    raw_paragraphs = split_into_paragraphs(text)
    paragraphs = []
    for i, p in enumerate(raw_paragraphs):
        paragraphs.append(Paragraph(id=f"p_{int(time.time()*1000)}_{i}", text=p))
    return paragraphs


@app.post("/api/translate", response_model=TranslateResponse)
async def translate_text(req: TranslateRequest):
    translated = mock_translate(req.text, req.target_lang)
    return TranslateResponse(translated_text=translated)


@app.post("/api/export")
async def export_document(req: ExportRequest):
    paragraphs = req.paragraphs
    content_parts = []

    if req.format == "markdown":
        content_parts.append("# 翻译文档\n\n")
        for idx, para in enumerate(paragraphs, 1):
            original = para.get("text", "")
            translated = para.get("translation", "")
            if req.bilingual:
                content_parts.append(f"## 段落 {idx}\n\n")
                content_parts.append(f"**原文：**\n\n{original}\n\n")
                content_parts.append(f"**译文：**\n\n{translated or '（未翻译）'}\n\n")
                content_parts.append("---\n\n")
            else:
                content_parts.append(f"{translated or original}\n\n")
        body = "".join(content_parts).encode("utf-8")
        filename = "translation.md"
        media_type = "text/markdown"
    else:
        lines = []
        lines.append("翻译文档")
        lines.append("=" * 40)
        lines.append("")
        for idx, para in enumerate(paragraphs, 1):
            original = para.get("text", "")
            translated = para.get("translation", "")
            lines.append(f"段落 {idx}")
            lines.append("-" * 40)
            if req.bilingual:
                lines.append("【原文】")
                lines.append(original)
                lines.append("")
                lines.append("【译文】")
                lines.append(translated or "（未翻译）")
            else:
                lines.append(translated or original)
            lines.append("")
            lines.append("=" * 40)
            lines.append("")
        body = "\n".join(lines).encode("utf-8")
        filename = "translation.txt"
        media_type = "application/pdf"

    disposition = f'attachment; filename="{filename}"'
    return Response(
        content=body,
        media_type=media_type,
        headers={"Content-Disposition": disposition},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
