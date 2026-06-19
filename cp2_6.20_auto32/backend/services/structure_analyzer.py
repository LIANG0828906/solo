from typing import List

from models.schemas import StructureAnalysis


def analyze_structure(content: str) -> StructureAnalysis:
    paragraphs = [p.strip() for p in content.split("\n") if p.strip()]
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

    intro_paragraph = paragraphs[0] if len(paragraphs) >= 1 else ""
    conclusion_paragraph = paragraphs[-1] if len(paragraphs) >= 2 else ""

    body_paragraphs = paragraphs[1:-1] if len(paragraphs) >= 3 else []
    body_text = "\n".join(body_paragraphs) if body_paragraphs else ""

    intro_len = len(intro_paragraph)
    conclusion_len = len(conclusion_paragraph)
    body_len = len(body_text)

    has_intro = len(intro_paragraph) > 20
    has_body = len(body_text) > 100
    has_conclusion = len(conclusion_paragraph) > 20 and len(paragraphs) >= 2

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
        suggestions.append("缺少引言部分，建议在开头明确点明主题和背景")
    elif intro_pct > 30:
        suggestions.append("引言部分过长，建议精简背景介绍，快速切入主题")
    elif intro_pct < 8 and para_count >= 3:
        suggestions.append("引言部分稍短，可适当增加背景铺垫")

    if not has_body:
        suggestions.append("缺少正文主体，建议展开论述，充实内容")
    elif body_pct < 40 and para_count >= 3:
        suggestions.append("正文内容偏少，建议增加论据和细节描写")

    if not has_conclusion:
        suggestions.append("缺少结论段，建议在结尾总结全文并升华主题")
    elif conclusion_pct > 25:
        suggestions.append("结论部分过长，建议简洁收尾")
    elif conclusion_pct < 5 and para_count >= 3:
        suggestions.append("结论部分稍短，可增加总结和感悟")

    if para_count < 3 and para_count > 0:
        suggestions.append(f"全文仅有 {para_count} 个段落，建议分段论述使结构更清晰")

    if not suggestions:
        suggestions.append("文章结构完整，各部分比例协调，继续保持！")

    return suggestions
