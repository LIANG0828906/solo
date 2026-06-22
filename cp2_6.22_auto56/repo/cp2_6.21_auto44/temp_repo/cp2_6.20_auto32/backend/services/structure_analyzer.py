import re
from typing import List, Tuple

from models.schemas import StructureAnalysis


INTRO_KEYWORDS = [
    "随着", "在当今", "如今", "近年来", "众所周知", "随着科技",
    "随着社会", "随着经济", "在信息时代", "自古以来", "所谓",
]

BODY_KEYWORDS = [
    "首先", "其次", "再次", "此外", "另外", "同时", "与此同时",
    "另一方面", "不仅如此", "更重要的是", "例如", "比如", "具体来说",
]

CONCLUSION_KEYWORDS = [
    "总之", "综上所述", "由此可见", "总而言之", "概括来说",
    "归根结底", "因此", "所以", "让我们", "我们应该",
]


def _detect_paragraph_role(paragraph: str) -> str:
    for kw in CONCLUSION_KEYWORDS:
        if kw in paragraph:
            return "conclusion"
    for kw in INTRO_KEYWORDS:
        if kw in paragraph:
            return "intro"
    for kw in BODY_KEYWORDS:
        if kw in paragraph:
            return "body"
    return "unknown"


def _split_into_sections(paragraphs: List[str]) -> Tuple[List[str], List[str], List[str]]:
    if not paragraphs:
        return [], [], []

    if len(paragraphs) == 1:
        role = _detect_paragraph_role(paragraphs[0])
        if role == "conclusion":
            return [], [], paragraphs
        return paragraphs, [], []

    intro_end = 1
    for i in range(min(len(paragraphs), 3)):
        if any(kw in paragraphs[i] for kw in INTRO_KEYWORDS):
            intro_end = max(intro_end, i + 1)

    conclusion_start = len(paragraphs) - 1
    for i in range(len(paragraphs) - 1, max(intro_end - 1, len(paragraphs) - 4), -1):
        if i < 0:
            break
        if any(kw in paragraphs[i] for kw in CONCLUSION_KEYWORDS):
            conclusion_start = min(conclusion_start, i)

    if conclusion_start <= intro_end and len(paragraphs) >= 3:
        conclusion_start = len(paragraphs) - 1

    intro_paras = paragraphs[:intro_end]
    body_paras = paragraphs[intro_end:conclusion_start]
    conclusion_paras = paragraphs[conclusion_start:]

    return intro_paras, body_paras, conclusion_paras


def analyze_structure(content: str) -> StructureAnalysis:
    paragraphs = [p.strip() for p in re.split(r'\n\s*\n|\n', content) if p.strip()]
    total_length = len(content)

    if not paragraphs:
        return StructureAnalysis(
            hasIntro=False,
            hasBody=False,
            hasConclusion=False,
            introPercent=0,
            bodyPercent=0,
            conclusionPercent=0,
            suggestions=["请输入作文内容"],
        )

    intro_paras, body_paras, conclusion_paras = _split_into_sections(paragraphs)

    intro_len = len("".join(intro_paras))
    body_len = len("".join(body_paras))
    conclusion_len = len("".join(conclusion_paras))

    has_intro = intro_len > 20 and any(
        any(kw in p for kw in INTRO_KEYWORDS) or len(p) > 20
        for p in intro_paras
    )
    has_body = body_len > 50 and any(
        any(kw in p for kw in BODY_KEYWORDS) or len(p) > 50
        for p in body_paras
    )
    has_conclusion = conclusion_len > 15 and any(
        any(kw in p for kw in CONCLUSION_KEYWORDS) or len(p) > 15
        for p in conclusion_paras
    )

    intro_percent = (intro_len / total_length * 100) if total_length > 0 else 0
    body_percent = (body_len / total_length * 100) if total_length > 0 else 0
    conclusion_percent = (conclusion_len / total_length * 100) if total_length > 0 else 0

    suggestions = generate_suggestions(
        has_intro, has_body, has_conclusion,
        intro_percent, body_percent, conclusion_percent,
        len(paragraphs)
    )

    return StructureAnalysis(
        hasIntro=has_intro,
        hasBody=has_body,
        hasConclusion=has_conclusion,
        introPercent=round(intro_percent, 1),
        bodyPercent=round(body_percent, 1),
        conclusionPercent=round(conclusion_percent, 1),
        suggestions=suggestions,
    )


def generate_suggestions(
    has_intro: bool, has_body: bool, has_conclusion: bool,
    intro_pct: float, body_pct: float, conclusion_pct: float,
    para_count: int
) -> List[str]:
    suggestions = []

    if not has_intro:
        suggestions.append("缺少引言部分，建议在开头使用"随着""近年来"等词引出主题和背景")
    elif intro_pct > 30:
        suggestions.append("引言部分过长，建议精简背景介绍，快速切入主题")
    elif intro_pct < 8 and para_count >= 3:
        suggestions.append("引言部分稍短，可适当增加背景铺垫")

    if not has_body:
        suggestions.append("缺少正文主体，建议使用"首先""其次""此外"等词展开论述，充实内容")
    elif body_pct < 40 and para_count >= 3:
        suggestions.append("正文内容偏少，建议增加论据和细节描写")

    if not has_conclusion:
        suggestions.append("缺少结论段，建议使用"总之""综上所述"等词总结全文并升华主题")
    elif conclusion_pct > 25:
        suggestions.append("结论部分过长，建议简洁收尾")
    elif conclusion_pct < 5 and para_count >= 3:
        suggestions.append("结论部分稍短，可增加总结和感悟")

    if para_count < 3 and para_count > 0:
        suggestions.append(f"全文仅有 {para_count} 个段落，建议分段论述使结构更清晰")

    if not suggestions:
        suggestions.append("文章结构完整，各部分比例协调，继续保持！")

    return suggestions
