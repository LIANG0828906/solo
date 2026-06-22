import os
import json
import sqlite3
import hashlib
from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas as pdfcanvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor, white, Color

app = FastAPI(title="ResuMix API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), "resume.db")
MEMORY_STORE: dict = {}


def hex_to_color(hex_str: str, default: Color = white) -> Color:
    try:
        if not hex_str or hex_str.lower() in ("transparent", "none", ""):
            return default
        return HexColor(hex_str)
    except Exception:
        return default


def get_db():
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    except Exception:
        return None


def init_db():
    conn = get_db()
    if conn is None:
        return
    try:
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
    except Exception:
        pass
    finally:
        conn.close()


init_db()

FONT_PATH = os.path.join(os.path.dirname(__file__), "NotoSansSC-Regular.ttf")
FONT_BOLD_PATH = os.path.join(os.path.dirname(__file__), "NotoSansSC-Bold.ttf")

FONT_REGISTERED = {"regular": False, "bold": False}

try:
    if os.path.exists(FONT_PATH):
        pdfmetrics.registerFont(TTFont('NotoSansSC', FONT_PATH))
        FONT_REGISTERED["regular"] = True
    if os.path.exists(FONT_BOLD_PATH):
        pdfmetrics.registerFont(TTFont('NotoSansSC-Bold', FONT_BOLD_PATH))
        FONT_REGISTERED["bold"] = True
except Exception:
    pass


def get_font_name(font_weight: str) -> str:
    if font_weight in ('700', 'bold') and FONT_REGISTERED["bold"]:
        return 'NotoSansSC-Bold'
    if FONT_REGISTERED["regular"]:
        return 'NotoSansSC'
    return 'Helvetica'


def generate_short_id(payload: str) -> str:
    raw = f"{payload}{datetime.now().isoformat()}{os.urandom(4).hex()}"
    return hashlib.md5(raw.encode("utf-8")).hexdigest()[:10]


def store_share(share_id: str, components_json: str, layout_json: str) -> bool:
    conn = get_db()
    if conn is None:
        MEMORY_STORE[share_id] = {
            "components_json": components_json,
            "layout_json": layout_json,
            "views": 0,
            "likes": 0,
        }
        return True
    try:
        conn.execute(
            "INSERT INTO shares (id, components_json, layout_json) VALUES (?, ?, ?)",
            (share_id, components_json, layout_json),
        )
        conn.commit()
        return True
    except Exception:
        MEMORY_STORE[share_id] = {
            "components_json": components_json,
            "layout_json": layout_json,
            "views": 0,
            "likes": 0,
        }
        return True
    finally:
        conn.close()


def get_share_row(share_id: str):
    conn = get_db()
    if conn is not None:
        try:
            row = conn.execute("SELECT * FROM shares WHERE id = ?", (share_id,)).fetchone()
            if row:
                return {
                    "components_json": row["components_json"],
                    "layout_json": row["layout_json"],
                    "views": row["views"],
                    "likes": row["likes"],
                }
        except Exception:
            pass
        finally:
            conn.close()
    if share_id in MEMORY_STORE:
        return dict(MEMORY_STORE[share_id])
    return None


def increment_counter(share_id: str, field: str) -> int | None:
    conn = get_db()
    if conn is not None:
        try:
            row = conn.execute("SELECT * FROM shares WHERE id = ?", (share_id,)).fetchone()
            if row:
                new_val = row[field] + 1
                conn.execute(f"UPDATE shares SET {field} = ? WHERE id = ?", (new_val, share_id))
                conn.commit()
                return new_val
        except Exception:
            pass
        finally:
            conn.close()
    if share_id in MEMORY_STORE:
        MEMORY_STORE[share_id][field] += 1
        return MEMORY_STORE[share_id][field]
    return None


@app.post("/api/export/pdf")
async def export_pdf(request: Request):
    body = await request.json()
    components = body.get("components", [])
    layout = body.get("layout", {"width": 595, "height": 842})

    width = layout.get("width", 595)
    height = layout.get("height", 842)

    from io import BytesIO
    buf = BytesIO()

    c = pdfcanvas.PdfCanvas(buf, pagesize=(width, height))
    c.setFillColor(white)
    c.rect(0, 0, width, height, fill=1, stroke=0)

    for comp in components:
        style = comp.get("style", {})
        x = float(comp.get("x", 0))
        comp_y = float(comp.get("y", 0))
        w = float(comp.get("width", 200))
        h = float(comp.get("height", 30))
        content = str(comp.get("content", ""))
        comp_type = str(comp.get("type", ""))

        bg_hex = style.get("backgroundColor", "transparent")
        if bg_hex and bg_hex.lower() not in ("transparent", "none", ""):
            bg_color = hex_to_color(bg_hex)
            c.setFillColor(bg_color)
            c.rect(x, height - comp_y - h, w, h, fill=1, stroke=0)

        font_size = float(style.get("fontSize", 14))
        color_hex = style.get("color", "#000000")
        font_weight = str(style.get("fontWeight", "400"))

        text_color = hex_to_color(color_hex)
        font_name = get_font_name(font_weight)

        lines = content.split("\n")
        line_height = font_size * 1.5
        top_y = height - comp_y

        for i, line in enumerate(lines):
            text_y = top_y - font_size - 4 - i * line_height
            if text_y < (height - comp_y - h):
                break

            if comp_type == "skill-bar":
                match_parts = line.strip().rsplit(" ", 1)
                if len(match_parts) == 2:
                    label, pct_str = match_parts
                    try:
                        pct = int(pct_str.replace("%", ""))
                    except ValueError:
                        pct = 75
                    c.setFillColor(text_color)
                    c.setFont(font_name, max(8, font_size * 0.85))
                    try:
                        c.drawString(x + 8, text_y, label)
                    except Exception:
                        pass
                    bar_y = text_y - 10
                    c.setFillColor(hex_to_color("#e2e8f0"))
                    c.roundRect(x + 8, bar_y, max(10, w - 16), 6, 3, fill=1, stroke=0)
                    bar_color = text_color if color_hex != "#334155" else hex_to_color("#6B7B8D")
                    c.setFillColor(bar_color)
                    c.roundRect(x + 8, bar_y, max(1, (w - 16) * pct / 100), 6, 3, fill=1, stroke=0)
                    c.setFillColor(text_color)
                    c.setFont(font_name, font_size)
                else:
                    c.setFillColor(text_color)
                    c.setFont(font_name, font_size)
                    try:
                        c.drawString(x + 8, text_y, line)
                    except Exception:
                        pass
            else:
                c.setFillColor(text_color)
                c.setFont(font_name, font_size)
                try:
                    c.drawString(x + 8, text_y, line)
                except Exception:
                    for ch in line:
                        try:
                            c.drawString(x + 8, text_y, ch)
                            x += c.stringWidth(ch, font_name, font_size)
                        except Exception:
                            pass

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
    components_json = json.dumps(body.get("components", []), ensure_ascii=False)
    layout_json = json.dumps(body.get("layout", {"width": 595, "height": 842}), ensure_ascii=False)

    share_id = generate_short_id(components_json + layout_json)

    if not store_share(share_id, components_json, layout_json):
        return JSONResponse({"error": "Failed to store share data"}, status_code=500)

    return JSONResponse({
        "share_id": share_id,
        "share_url": f"/share/{share_id}",
    })


@app.get("/api/share/{share_id}")
async def get_share(share_id: str):
    row = get_share_row(share_id)
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
    new_likes = increment_counter(share_id, "likes")
    if new_likes is None:
        return JSONResponse({"error": "Not found"}, status_code=404)
    return JSONResponse({"likes": new_likes})


@app.post("/api/share/{share_id}/view")
async def view_share(share_id: str):
    new_views = increment_counter(share_id, "views")
    if new_views is None:
        return JSONResponse({"error": "Not found"}, status_code=404)
    return JSONResponse({"views": new_views})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
