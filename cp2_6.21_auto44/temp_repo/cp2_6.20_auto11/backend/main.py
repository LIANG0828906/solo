import json
import uuid
import random
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="智能练习题生成器 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

QUESTION_BANK: dict[str, dict] = {}

DIFFICULTY_LABELS = {1: "入门", 2: "基础", 3: "进阶", 4: "挑战", 5: "高难"}

TEMPLATE_QUESTIONS = {
    "choice": [
        {
            "stem_templates": [
                "以下关于{tag}的{diff_label}级别描述，哪个选项是正确的？",
                "在{tag}领域中，{diff_label}难度的核心概念是？",
                "关于{tag}的{diff_label}知识点，下列哪项表述最准确？",
                "{tag}的{diff_label}应用中，以下哪个说法是正确的？",
                "在{tag}的{diff_label}层面，以下哪项最符合标准定义？",
            ],
            "option_sets": [
                ["这是第一个选项的描述", "这是第二个选项的描述", "这是第三个选项的描述", "这是第四个选项的描述"],
                ["符合理论基础的说法", "存在偏差的说法", "部分正确的说法", "完全错误的说法"],
                ["经过验证的正确描述", "混淆概念的错误描述", "片面理解的不完整描述", "逻辑矛盾的描述"],
                ["标准定义下的正确项", "对概念泛化的错误项", "因果倒置的错误项", "无关联的干扰项"],
            ],
            "answers": ["A", "A", "A", "A"],
            "explanations": [
                "选项A经过理论验证，符合该知识点的标准定义。",
                "选项A基于基础原理推导得出，其他选项存在偏差。",
                "选项A完整准确地表述了该概念的核心内涵。",
                "选项A严格遵循标准定义，是最为准确的选择。",
            ],
        }
    ],
    "multi_choice": [
        {
            "stem_templates": [
                "以下关于{tag}的{diff_label}级别描述，哪些选项是正确的？（多选）",
                "在{tag}领域中，{diff_label}难度的核心要点包括哪些？（多选）",
                "关于{tag}的{diff_label}知识点，下列哪些表述是准确的？（多选）",
            ],
            "option_sets": [
                ["符合理论的第一项", "符合理论的第二项", "不符合的第三项", "符合理论的第四项"],
                ["正确的基本原理", "正确的扩展应用", "错误的衍生说法", "正确的关键特征"],
            ],
            "answers": [["A", "B", "D"], ["A", "B", "D"]],
            "explanations": [
                "选项A、B、D均符合该知识点的标准定义，选项C存在偏差。",
                "选项A、B、D均经过理论验证，选项C是常见误区的表现。",
            ],
        }
    ],
    "fill_blank": [
        {
            "stem_templates": [
                "{tag}的{diff_label}级别中，核心概念称为____。",
                "在{tag}的{diff_label}应用中，关键步骤是____。",
                "{tag}领域中，{diff_label}难度的基本原理可概括为____。",
            ],
            "answers": ["核心概念", "关键步骤", "基本原理"],
            "explanations": [
                "这是该知识点的基础概念定义，是后续学习的基石。",
                "这是该应用流程中的核心步骤，决定了整体效果。",
                "这是该领域的基本原理概括，是理解更深层次内容的关键。",
            ],
        }
    ],
    "true_false": [
        {
            "stem_templates": [
                "命题：{tag}的{diff_label}级别理论是成立的。",
                "判断：所有{tag}的{diff_label}应用都遵循同一规则。",
                "命题：{tag}领域中{diff_label}难度的结论具有普遍适用性。",
            ],
            "answers": ["正确", "错误", "错误"],
            "explanations": [
                "该命题经理论验证成立，符合标准定义。",
                "并非所有应用都遵循同一规则，存在特例和边界条件。",
                "该结论并非普遍适用，需要结合具体情境分析。",
            ],
        }
    ],
}


class GenerateRequest(BaseModel):
    question_type: str
    difficulty: int
    count: int
    knowledge_tags: list[str] = []


class QuestionUpdate(BaseModel):
    stem: Optional[str] = None
    options: Optional[list[str]] = None
    answer: Optional[str] = None
    explanation: Optional[str] = None


def generate_single_question(q_type: str, difficulty: int, tags: list[str]) -> dict:
    tag = tags[0] if tags else "通用"
    diff_label = DIFFICULTY_LABELS.get(difficulty, "基础")
    template = TEMPLATE_QUESTIONS.get(q_type, TEMPLATE_QUESTIONS["choice"])[0]

    stem_idx = random.randint(0, len(template["stem_templates"]) - 1)
    opt_idx = random.randint(0, len(template.get("option_sets", [[""]])).__len__() - 1) if "option_sets" in template else 0

    stem = template["stem_templates"][stem_idx].format(tag=tag, diff_label=diff_label)

    result: dict = {
        "id": str(uuid.uuid4()),
        "type": q_type,
        "difficulty": difficulty,
        "knowledge_tag": tag,
        "stem": stem,
        "answer": template["answers"][min(stem_idx, len(template["answers"]) - 1)],
        "explanation": template["explanations"][min(stem_idx, len(template["explanations"]) - 1)],
        "created_at": datetime.now().isoformat(),
    }

    if q_type in ("choice", "multi_choice") and "option_sets" in template:
        options = template["option_sets"][opt_idx]
        shuffled = options.copy()
        random.shuffle(shuffled)
        result["options"] = shuffled

    return result


@app.post("/generate")
async def generate_questions(req: GenerateRequest):
    if req.question_type not in TEMPLATE_QUESTIONS:
        raise HTTPException(status_code=400, detail=f"不支持的题型: {req.question_type}")
    if req.difficulty < 1 or req.difficulty > 5:
        raise HTTPException(status_code=400, detail="难度必须在1-5之间")
    if req.count < 1 or req.count > 10:
        raise HTTPException(status_code=400, detail="题目数量必须在1-10之间")

    questions = [
        generate_single_question(req.question_type, req.difficulty, req.knowledge_tags)
        for _ in range(req.count)
    ]
    return {"questions": questions}


@app.get("/quiz")
async def get_quiz_records():
    return list(QUESTION_BANK.values())


@app.post("/quiz")
async def add_quiz_record(record: dict):
    record_id = record.get("id", str(uuid.uuid4()))
    QUESTION_BANK[record_id] = record
    return {"success": True}


@app.put("/quiz/{record_id}")
async def update_quiz_record(record_id: str, update: QuestionUpdate):
    if record_id not in QUESTION_BANK:
        raise HTTPException(status_code=404, detail="记录不存在")
    existing = QUESTION_BANK[record_id]
    if existing.get("question") is None:
        existing["question"] = {}
    update_data = update.model_dump(exclude_none=True)
    existing["question"].update(update_data)
    QUESTION_BANK[record_id] = existing
    return {"success": True}


@app.delete("/quiz/{record_id}")
async def delete_quiz_record(record_id: str):
    if record_id in QUESTION_BANK:
        del QUESTION_BANK[record_id]
    return {"success": True}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
