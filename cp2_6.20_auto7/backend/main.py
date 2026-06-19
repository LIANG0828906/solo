import os
import json
import uuid
import sqlite3
from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas as pdfcanvas
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

app = FastAPI(title="ResuMix API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), "resume.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS shares (
            id TEXT PRIMARY KEY,
            components_json TEXT NOT NULL,
            layout_json TEXT NOT NULL,
            views INTEGER DEFAULT 0,
            likes INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


init_db()

FONT_PATH = os.path.join(os.path.dirname(__file__), "NotoSansSC-Regular.ttf")
FONT_BOLD_PATH = os.path.join(os.path.dirname(__file__), "NotoSansSC-Bold.ttf")

try:
    if os.path.exists(FONT_PATH):
        pdfmetrics.registerFont(TTFont('NotoSansSC', FONT_PATH))
    if os.path.exists(FONT_BOLD_PATH):
        pdfmetrics.registerFont(TTFont('NotoSansSC-Bold', FONT_BOLD_PATH))
except Exception:
    pass


def get_font_name(font_weight: str) -> str:
    if font_weight in ('700', 'bold') and os.path.exists(FONT_BOLD_PATH):
        return 'NotoSansSC-Bold'
    if os.path.exists(FONT_PATH):
        return 'NotoSansSC'
    return 'Helvetica'


@app.post("/api/export/pdf")
async def export_pdf(request: Request):
    body = await request.json()
    components = body.get("components", [])
    layout = body.get("layout", {"width": 595, "height": 842})

    width = layout.get("width", 595)
    height = layout.get("height", 842)

    buffer = bytearray()

    from io import BytesIO
    buf = BytesIO()

    c = pdfcanvas.PdfCanvas(buf, pagesize=(width, height))

    for comp in components:
        style = comp.get("style", {})
        x = comp.get("x", 0)
        y = height - comp.get("y", 0) - comp.get("height", 30)
        w = comp.get("width", 200)
        h = comp.get("height", 30)
        content = comp.get("content", "")

        bg = style.get("backgroundColor", "transparent")
        if bg and bg != "transparent":
            c.setFillColor(bg)
            c.rect(x, y, w, h, fill=1, stroke=0)

        font_size = style.get("fontSize", 14)
        color = style.get("color", "#000000")
        font_weight = style.get("fontWeight", "400")

        c.setFillColor(color)
        font_name = get_font_name(font_weight)
        c.setFont(font_name, font_size)

        lines = content.split("\n")
        line_height = font_size * 1.5
        for i, line in enumerate(lines):
            text_y = y + h - font_size - 4 - i * line_height
            if text_y < y:
                break
            comp_type = comp.get("type", "")
            if comp_type == "skill-bar":
                match_parts = line.strip().rsplit(" ", 1)
                if len(match_parts) == 2:
                    label, pct_str = match_parts
                    try:
                        pct = int(pct_str.replace("%", ""))
                    except ValueError:
                        pct = 75
                    c.setFont(font_name, font_size * 0.85)
                    c.drawString(x + 8, text_y, label)
                    bar_y = text_y - 8
                    c.setFillColor("#e2e8f0")
                    c.roundRect(x + 8, bar_y, w - 16, 6, 3, fill=1, stroke=0)
                    bar_color = color if color != "#334155" else "#6B7B8D"
                    c.setFillColor(bar_color)
                    c.roundRect(x + 8, bar_y, (w - 16) * pct / 100, 6, 3, fill=1, stroke=0)
                    c.setFillColor(color)
                    c.setFont(font_name, font_size)
                else:
                    c.drawString(x + 8, text_y, line)
            else:
                c.drawString(x + 8, text_y, line)

    c.save()
    buf.seek(0)
    pdf_bytes = buf.read()

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=resume.pdf"},
    )


@app.post("/api/share")
async def create_share(request: Request):
    body = await request.json()
    share_id = uuid.uuid4().hex[:10]
    components_json = json.dumps(body.get("components", []), ensure_ascii=False)
    layout_json = json.dumps(body.get("layout", {"width": 595, "height": 842}), ensure_ascii=False)

    conn = get_db()
    conn.execute(
        "INSERT INTO shares (id, components_json, layout_json) VALUES (?, ?, ?)",
        (share_id, components_json, layout_json),
    )
    conn.commit()
    conn.close()

    return JSONResponse({
        "share_id": share_id,
        "share_url": f"/share/{share_id}",
    })


@app.get("/api/share/{share_id}")
async def get_share(share_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM shares WHERE id = ?", (share_id,)).fetchone()
    conn.close()

    if not row:
        return JSONResponse({"error": "Not found"}, status_code=404)

    return JSONResponse({
        "components": json.loads(row["components_json"]),
        "layout": json.loads(row["layout_json"]),
        "views": row["views"],
        "likes": row["likes"],
    })


@app.post("/api/share/{share_id}/like")
async def like_share(share_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM shares WHERE id = ?", (share_id,)).fetchone()
    if not row:
        conn.close()
        return JSONResponse({"error": "Not found"}, status_code=404)

    new_likes = row["likes"] + 1
    conn.execute("UPDATE shares SET likes = ? WHERE id = ?", (new_likes, share_id))
    conn.commit()
    conn.close()

    return JSONResponse({"likes": new_likes})


@app.post("/api/share/{share_id}/view")
async def view_share(share_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM shares WHERE id = ?", (share_id,)).fetchone()
    if not row:
        conn.close()
        return JSONResponse({"error": "Not found"}, status_code=404)

    new_views = row["views"] + 1
    conn.execute("UPDATE shares SET views = ? WHERE id = ?", (new_views, share_id))
    conn.commit()
    conn.close()

    return JSONResponse({"views": new_views})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
