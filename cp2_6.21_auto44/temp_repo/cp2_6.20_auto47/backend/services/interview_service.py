import json
import os
import random
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from services.resume_service import get_resume_by_id

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
INTERVIEWS_FILE = os.path.join(DATA_DIR, "interviews.json")

TIME_LIMITS = {"beginner": 180, "intermediate": 120, "advanced": 90}
QUESTIONS_COUNT = {"beginner": 5, "intermediate": 7, "advanced": 10}
CATEGORIES = ["technical_depth", "communication", "logical_thinking", "domain_knowledge"]


class QuestionFeedback(BaseModel):
    rating: int = 1
    keywordMatch: float = 0.0
    suggestions: list = []


class InterviewQuestion(BaseModel):
    id: str = ""
    question: str = ""
    category: str = ""
    keywords: list = []
    answer: Optional[str] = None
    score: Optional[int] = None
    timeSpent: Optional[float] = None
    feedback: Optional[QuestionFeedback] = None


class InterviewSession(BaseModel):
    id: str = ""
    resumeId: str = ""
    difficulty: str = "beginner"
    questions: list[InterviewQuestion] = []
    status: str = "in_progress"
    totalScore: int = 0
    createdAt: str = ""
    completedAt: Optional[str] = None


QUESTION_BANK = {
    "react": {
        "technical_depth": [
            {"question": "请解释React中虚拟DOM的工作原理以及它如何提升性能？", "keywords": ["虚拟DOM", "diff算法", "reconciliation", "性能", "真实DOM"]},
            {"question": "React Hooks有哪些使用限制？为什么不能在条件语句中使用Hooks？", "keywords": ["调用顺序", "链表", "fiber", "规则", "顶层"]},
            {"question": "请解释React Fiber架构的原理及其对调度的影响。", "keywords": ["fiber", "调度", "优先级", "时间切片", "可中断"]},
        ],
        "communication": [
            {"question": "你如何向产品经理解释为什么某个功能需要更长的开发时间？", "keywords": ["沟通", "技术方案", "风险", "优先级", "评估"]},
            {"question": "请描述一次你在团队中推动技术方案的经历。", "keywords": ["推动", "方案", "团队", "共识", "落地"]},
        ],
        "logical_thinking": [
            {"question": "如果React应用的首页加载时间超过5秒，你会如何系统性地排查和优化？", "keywords": ["性能分析", "懒加载", "代码分割", "缓存", "指标"]},
            {"question": "设计一个支持撤销/重做功能的React状态管理方案。", "keywords": ["命令模式", "历史栈", "状态快照", "不可变", "回退"]},
        ],
        "domain_knowledge": [
            {"question": "请比较React、Vue和Angular在大型项目中的适用场景。", "keywords": ["生态", "学习曲线", "类型支持", "社区", "场景"]},
            {"question": "SSR和CSR各自的优势是什么？什么场景下选择Next.js？", "keywords": ["SSR", "CSR", "SEO", "首屏", " hydration"]},
        ],
    },
    "python": {
        "technical_depth": [
            {"question": "请解释Python中的GIL是什么，它对多线程编程有什么影响？", "keywords": ["GIL", "全局解释器锁", "多线程", "并发", "CPU密集"]},
            {"question": "Python的装饰器是什么？请说明其原理和常见应用场景。", "keywords": ["装饰器", "闭包", "高阶函数", "语法糖", "AOP"]},
            {"question": "请解释Python中的生成器和迭代器的区别及其使用场景。", "keywords": ["生成器", "迭代器", "yield", "惰性求值", "内存"]},
        ],
        "communication": [
            {"question": "你如何向非技术背景的同事解释为什么Python适合数据科学项目？", "keywords": ["生态", "库", "易读", "原型", "社区"]},
            {"question": "描述一次你通过代码审查帮助同事提升代码质量的经历。", "keywords": ["代码审查", "建议", "规范", "提升", "协作"]},
        ],
        "logical_thinking": [
            {"question": "如何设计一个高性能的Python数据处理管道，处理百万级数据？", "keywords": ["生成器", "批处理", "并行", "内存优化", "分块"]},
            {"question": "如果一个Python服务出现内存泄漏，你会如何定位和解决？", "keywords": ["内存分析", "引用计数", "循环引用", "gc", "工具"]},
        ],
        "domain_knowledge": [
            {"question": "请比较Django和Flask框架的优缺点及适用场景。", "keywords": ["全栈", "轻量", "ORM", "灵活", "规模"]},
            {"question": "Python在微服务架构中有哪些最佳实践？", "keywords": ["FastAPI", "容器化", "API网关", "服务发现", "健康检查"]},
        ],
    },
    "javascript": {
        "technical_depth": [
            {"question": "请解释JavaScript事件循环机制，宏任务和微任务的区别是什么？", "keywords": ["事件循环", "宏任务", "微任务", "调用栈", "Promise"]},
            {"question": "JavaScript中的闭包是什么？请举例说明其应用场景和潜在问题。", "keywords": ["闭包", "作用域链", "变量持久化", "内存泄漏", "私有变量"]},
            {"question": "请解释ES6中Proxy和Reflect的用途及使用场景。", "keywords": ["Proxy", "Reflect", "代理", "元编程", "拦截"]},
        ],
        "communication": [
            {"question": "你如何向刚入行的开发者解释异步编程的重要性？", "keywords": ["非阻塞", "并发", "用户体验", "回调", "异步"]},
            {"question": "在代码评审中，你如何指出同事代码中的潜在问题而不伤害团队氛围？", "keywords": ["建设性", "具体", "尊重", "建议", "改进"]},
        ],
        "logical_thinking": [
            {"question": "如何实现一个支持并发限制的Promise调度器？", "keywords": ["并发", "队列", "调度", "Promise", "限制"]},
            {"question": "设计一个前端错误监控系统的架构方案。", "keywords": ["错误捕获", "上报", "聚合", "告警", "降级"]},
        ],
        "domain_knowledge": [
            {"question": "请比较CommonJS和ES Modules的区别，以及各自的适用场景。", "keywords": ["CommonJS", "ESM", "同步", "异步", "Tree-shaking"]},
            {"question": "TypeScript相比JavaScript有哪些核心优势？在什么情况下不推荐使用？", "keywords": ["类型安全", "重构", "学习成本", "小型项目", "编译"]},
        ],
    },
    "vue": {
        "technical_depth": [
            {"question": "请解释Vue 3的响应式系统原理，与Vue 2有什么区别？", "keywords": ["Proxy", "Object.defineProperty", "响应式", "依赖收集", "触发更新"]},
            {"question": "Vue的组合式API和选项式API各有什么优缺点？", "keywords": ["组合式", "选项式", "逻辑复用", "setup", "可维护性"]},
        ],
        "communication": [
            {"question": "你如何说服团队从Vue 2迁移到Vue 3？", "keywords": ["迁移", "优势", "兼容", "渐进", "评估"]},
            {"question": "描述一次你解决跨部门协作中技术分歧的经历。", "keywords": ["分歧", "沟通", "折中", "数据驱动", "结果"]},
        ],
        "logical_thinking": [
            {"question": "如何设计一个高可用的Vue组件库？", "keywords": ["设计系统", "文档", "测试", "版本", "主题"]},
            {"question": "Vue项目首屏白屏时间过长，请给出完整的优化方案。", "keywords": ["预渲染", "SSR", "路由懒加载", "CDN", "压缩"]},
        ],
        "domain_knowledge": [
            {"question": "请比较Vuex和Pinia的区别，为什么推荐使用Pinia？", "keywords": ["Pinia", "Vuex", "TypeScript", "模块", "简洁"]},
            {"question": "Nuxt.js提供了哪些核心能力？适合什么类型的项目？", "keywords": ["SSR", "SSG", "路由", "SEO", "全栈"]},
        ],
    },
    "typescript": {
        "technical_depth": [
            {"question": "请解释TypeScript中泛型的概念，并举例说明其高级用法。", "keywords": ["泛型", "类型参数", "约束", "条件类型", "映射类型"]},
            {"question": "TypeScript中的工具类型（Utility Types）有哪些常用？请举例说明。", "keywords": ["Partial", "Pick", "Omit", "Record", "ReturnType"]},
        ],
        "communication": [
            {"question": "你如何向团队成员推广TypeScript的使用？", "keywords": ["推广", "收益", "渐进", "培训", "规范"]},
        ],
        "logical_thinking": [
            {"question": "如何为一个大型的JavaScript项目逐步引入TypeScript？", "keywords": ["渐进", "allowJS", "严格模式", "声明文件", "迁移"]},
        ],
        "domain_knowledge": [
            {"question": "TypeScript的类型系统和运行时类型检查有什么区别？如何弥补这个鸿沟？", "keywords": ["编译时", "运行时", "类型守卫", "验证库", "schema"]},
        ],
    },
    "node.js": {
        "technical_depth": [
            {"question": "请解释Node.js的事件驱动架构及其优势。", "keywords": ["事件驱动", "非阻塞I/O", "单线程", "事件循环", "回调"]},
            {"question": "Node.js中的Stream是什么？有哪些类型和应用场景？", "keywords": ["Stream", "可读", "可写", "管道", "背压"]},
        ],
        "communication": [
            {"question": "你如何解释为什么Node.js适合I/O密集型而不是CPU密集型任务？", "keywords": ["I/O密集", "CPU密集", "事件循环", "worker", "场景"]},
        ],
        "logical_thinking": [
            {"question": "如何设计一个高并发的Node.js API网关？", "keywords": ["限流", "缓存", "负载均衡", "网关", "中间件"]},
        ],
        "domain_knowledge": [
            {"question": "请比较Express、Koa和Fastify框架的特点。", "keywords": ["Express", "Koa", "Fastify", "中间件", "性能"]},
        ],
    },
    "sql": {
        "technical_depth": [
            {"question": "请解释数据库索引的工作原理，什么时候应该创建索引？", "keywords": ["B+树", "索引", "查询优化", "覆盖索引", "执行计划"]},
            {"question": "什么是数据库事务的ACID特性？请结合实际场景说明。", "keywords": ["ACID", "原子性", "一致性", "隔离性", "持久性"]},
        ],
        "communication": [
            {"question": "你如何向业务方解释为什么某些复杂查询需要较长的执行时间？", "keywords": ["执行计划", "数据量", "索引", "优化", "沟通"]},
        ],
        "logical_thinking": [
            {"question": "如何优化一个执行时间超过10秒的慢查询？", "keywords": ["慢查询", "EXPLAIN", "索引", "分页", "优化"]},
        ],
        "domain_knowledge": [
            {"question": "请比较关系型数据库和NoSQL数据库的适用场景。", "keywords": ["关系型", "NoSQL", "结构化", "扩展", "一致性"]},
        ],
    },
    "docker": {
        "technical_depth": [
            {"question": "请解释Docker的镜像分层原理及其对构建优化的影响。", "keywords": ["分层", "镜像", "缓存", "Dockerfile", "多阶段构建"]},
            {"question": "Docker网络模式有哪些？各自适用什么场景？", "keywords": ["bridge", "host", "overlay", "网络", "容器通信"]},
        ],
        "communication": [
            {"question": "你如何向运维团队解释容器化部署的优势？", "keywords": ["一致性", "隔离", "快速部署", "资源利用", "环境"]},
        ],
        "logical_thinking": [
            {"question": "如何设计一个支持平滑发布的容器化部署方案？", "keywords": ["滚动更新", "健康检查", "蓝绿部署", "回滚", "灰度"]},
        ],
        "domain_knowledge": [
            {"question": "Docker和虚拟机的核心区别是什么？各自的优缺点？", "keywords": ["容器", "虚拟机", "隔离", "性能", "资源"]},
        ],
    },
    "git": {
        "technical_depth": [
            {"question": "请解释Git的分支策略，Rebase和Merge的区别是什么？", "keywords": ["rebase", "merge", "分支", "历史", "冲突"]},
        ],
        "communication": [
            {"question": "你如何在团队中推行统一的Git工作流？", "keywords": ["工作流", "规范", "Code Review", "分支策略", "协作"]},
        ],
        "logical_thinking": [
            {"question": "如果线上出现紧急Bug，你会如何使用Git进行热修复？", "keywords": ["hotfix", "cherry-pick", "分支", "紧急", "流程"]},
        ],
        "domain_knowledge": [
            {"question": "Git大型仓库管理有哪些最佳实践？", "keywords": ["子模块", "单体仓库", "浅克隆", "LFS", "拆分"]},
        ],
    },
}

GENERIC_QUESTIONS = {
    "technical_depth": [
        {"question": "请解释你最擅长的技术栈的核心原理。", "keywords": ["核心原理", "架构", "设计思想", "优势", "实现"]},
        {"question": "你在项目中遇到过最有挑战性的技术问题是什么？如何解决的？", "keywords": ["问题", "分析", "方案", "解决", "总结"]},
    ],
    "communication": [
        {"question": "请描述一次你需要协调多个团队成员完成任务的经历。", "keywords": ["协调", "沟通", "目标", "分工", "结果"]},
        {"question": "你如何处理与同事之间的技术分歧？", "keywords": ["分歧", "尊重", "数据", "折中", "沟通"]},
    ],
    "logical_thinking": [
        {"question": "如果一个系统突然变慢，你会按照什么步骤来排查？", "keywords": ["监控", "日志", "分析", "定位", "优化"]},
        {"question": "请描述你设计一个技术方案的思考过程。", "keywords": ["需求", "方案", "评估", "权衡", "落地"]},
    ],
    "domain_knowledge": [
        {"question": "你认为未来3年你所在技术领域最重要的趋势是什么？", "keywords": ["趋势", "发展", "新技术", "应用", "影响"]},
        {"question": "你如何保持技术竞争力的？有哪些学习方法？", "keywords": ["学习", "实践", "社区", "阅读", "总结"]},
    ],
}


def _ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)


def _read_sessions() -> list:
    _ensure_data_dir()
    if not os.path.exists(INTERVIEWS_FILE):
        return []
    with open(INTERVIEWS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _write_sessions(sessions: list):
    _ensure_data_dir()
    with open(INTERVIEWS_FILE, "w", encoding="utf-8") as f:
        json.dump(sessions, f, ensure_ascii=False, indent=2)


def _select_questions(pool: list, count: int) -> list:
    by_category = {c: [] for c in CATEGORIES}
    for q in pool:
        cat = q.get("category", "domain_knowledge")
        if cat in by_category:
            by_category[cat].append(q)

    selected = []
    for c in CATEGORIES:
        if by_category[c]:
            q = random.choice(by_category[c])
            selected.append(q)
            by_category[c].remove(q)

    remaining = [q for qs in by_category.values() for q in qs]
    random.shuffle(remaining)
    for q in remaining:
        if len(selected) >= count:
            break
        if q not in selected:
            selected.append(q)

    random.shuffle(selected)
    return selected[:count]


def _collect_questions(skills: list) -> list:
    pool = []
    for skill in skills:
        skill_lower = skill.lower()
        if skill_lower in QUESTION_BANK:
            for category, questions in QUESTION_BANK[skill_lower].items():
                for q in questions:
                    pool.append({**q, "category": category})

    if len(pool) < QUESTIONS_COUNT["advanced"]:
        for category, questions in GENERIC_QUESTIONS.items():
            for q in questions:
                entry = {**q, "category": category}
                if entry not in pool:
                    pool.append(entry)

    return pool


def generate_interview(resume_id: str, difficulty: str) -> InterviewSession:
    resume = get_resume_by_id(resume_id)
    if not resume:
        raise ValueError("简历未找到")

    skills = [s.name.lower() for s in resume.sections.skills]
    pool = _collect_questions(skills)
    count = QUESTIONS_COUNT.get(difficulty, 5)
    selected = _select_questions(pool, count)

    now = datetime.now().isoformat()
    questions = [
        InterviewQuestion(
            id=str(uuid.uuid4()),
            question=q["question"],
            category=q["category"],
            keywords=q["keywords"],
        )
        for q in selected
    ]

    session = InterviewSession(
        id=str(uuid.uuid4()),
        resumeId=resume_id,
        difficulty=difficulty,
        questions=questions,
        status="in_progress",
        totalScore=0,
        createdAt=now,
    )

    sessions = _read_sessions()
    sessions.append(session.model_dump())
    _write_sessions(sessions)
    return session


def _check_grammar(answer: str) -> bool:
    if len(answer) < 20:
        return False
    has_punctuation = any(p in answer for p in "。！？，；：、")
    has_proper_length = len(answer) > 50
    return has_punctuation and has_proper_length


def _score_answer(keywords: list, answer: str, time_spent: float, time_limit: float) -> QuestionFeedback:
    answer_lower = answer.lower()
    matched = [kw for kw in keywords if kw.lower() in answer_lower]
    keyword_match = len(matched) / len(keywords) if keywords else 0.0
    half_limit = time_limit / 2

    if keyword_match > 0.9 and _check_grammar(answer):
        rating = 5
    elif keyword_match > 0.8:
        rating = 4
    elif time_spent > half_limit and keyword_match > 0.6:
        rating = 3
    elif keyword_match > 0.3 or len(answer) > 100:
        rating = 2
    else:
        rating = 1

    suggestions = []
    if keyword_match < 0.5:
        suggestions.append("建议更深入地回答问题，涵盖更多关键知识点")
    if time_spent < time_limit * 0.2 and len(answer) < 50:
        suggestions.append("建议花更多时间思考和组织答案")
    missing = [kw for kw in keywords if kw.lower() not in answer_lower]
    if missing:
        suggestions.append(f"可以补充以下要点：{', '.join(missing[:3])}")
    if len(answer) < 30:
        suggestions.append("回答过于简短，建议详细展开说明")

    return QuestionFeedback(rating=rating, keywordMatch=round(keyword_match, 2), suggestions=suggestions)


def submit_answer(session_id: str, question_id: str, answer: str, time_spent: float) -> dict:
    sessions = _read_sessions()
    session_data = None
    for s in sessions:
        if s["id"] == session_id:
            session_data = s
            break

    if not session_data:
        raise ValueError("面试会话未找到")

    question_data = None
    for q in session_data["questions"]:
        if q["id"] == question_id:
            question_data = q
            break

    if not question_data:
        raise ValueError("问题未找到")

    time_limit = TIME_LIMITS.get(session_data["difficulty"], 120)
    feedback = _score_answer(question_data["keywords"], answer, time_spent, time_limit)

    question_data["answer"] = answer
    question_data["score"] = feedback.rating
    question_data["timeSpent"] = time_spent
    question_data["feedback"] = feedback.model_dump()

    all_answered = all(q.get("answer") is not None for q in session_data["questions"])
    if all_answered:
        session_data["status"] = "completed"
        session_data["totalScore"] = sum(q.get("score", 0) for q in session_data["questions"])
        session_data["completedAt"] = datetime.now().isoformat()

    _write_sessions(sessions)

    return {
        "score": feedback.rating,
        "keywordMatch": feedback.keywordMatch,
        "suggestions": feedback.suggestions,
        "feedback": feedback.model_dump(),
    }


def get_session_by_id(session_id: str) -> Optional[InterviewSession]:
    sessions = _read_sessions()
    for s in sessions:
        if s["id"] == session_id:
            return InterviewSession(**s)
    return None


def get_all_sessions() -> list[InterviewSession]:
    sessions = _read_sessions()
    return [InterviewSession(**s) for s in sessions]
