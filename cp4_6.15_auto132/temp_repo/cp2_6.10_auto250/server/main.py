from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uuid
import random
from datetime import datetime, timedelta

from event_generator import EventGenerator
from scorer import Scorer

app = FastAPI(title="雅集录 API", description="宋代雅集模拟后端服务")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

event_generator = EventGenerator()
scorer = Scorer()

themes = [
    {"theme": "赏雪雅集", "description": "瑞雪初降，围炉煮酒，赏雪论诗，不亦乐乎。"},
    {"theme": "听雨雅集", "description": "细雨蒙蒙，芭蕉声声，品茗抚琴，悠然自得。"},
    {"theme": "论道雅集", "description": "群贤毕至，少长咸集，畅谈玄理，辨析经义。"},
    {"theme": "赏月雅集", "description": "皓月当空，清风徐来，举杯邀月，对影成三。"},
    {"theme": "赏菊雅集", "description": "秋高气爽，菊花盛开，采菊东篱，悠然见山。"},
    {"theme": "观画雅集", "description": "名画荟萃，笔墨丹青，鉴赏品评，各抒己见。"},
    {"theme": "听琴雅集", "description": "高山流水，知音难觅，琴声悠悠，心旷神怡。"},
    {"theme": "弈棋雅集", "description": "黑白对弈，纵横捭阖，运筹帷幄，决胜千里。"},
]

guests = [
    {"name": "苏轼", "title": "翰林学士", "preference": "豪放洒脱"},
    {"name": "黄庭坚", "title": "江西诗派", "preference": "奇崛瘦硬"},
    {"name": "米芾", "title": "书画博士", "preference": "飘逸洒脱"},
    {"name": "蔡襄", "title": "端明殿学士", "preference": "端庄浑厚"},
    {"name": "欧阳修", "title": "文忠公", "preference": "平易流畅"},
    {"name": "王安石", "title": "荆国公", "preference": "刚健简洁"},
    {"name": "司马光", "title": "温国公", "preference": "严谨务实"},
    {"name": "范仲淹", "title": "文正公", "preference": "慷慨激昂"},
]

music_options = [
    {"id": "m1", "name": "广陵散", "description": "嵇康所作，声调绝伦，慷慨激昂"},
    {"id": "m2", "name": "高山流水", "description": "伯牙子期，知音佳话，意境深远"},
    {"id": "m3", "name": "平沙落雁", "description": "秋鸿高飞，逸兴遄飞，悠然自得"},
    {"id": "m4", "name": "梅花三弄", "description": "梅花傲雪，高洁清雅，沁人心脾"},
    {"id": "m5", "name": "阳春白雪", "description": "阳春三月，白雪皑皑，曲高和寡"},
]

chess_options = [
    {"id": "c1", "name": "当湖十局", "description": "范施对决，千古名局，精彩纷呈"},
    {"id": "c2", "name": "血泪篇", "description": "黄龙士对徐星友，让子名局，惊心动魄"},
    {"id": "c3", "name": "兼山堂弈谱", "description": "徐星友所著，棋理精深，变化万千"},
    {"id": "c4", "name": "弈理指归", "description": "施襄夏所著，条理分明，深入浅出"},
    {"id": "c5", "name": "桃花泉弈谱", "description": "范西屏所著，新颖别致，妙趣横生"},
]

painting_options = [
    {"id": "p1", "name": "山水清音图", "description": "层峦叠嶂，云雾缭绕，意境深远"},
    {"id": "p2", "name": "花鸟虫鱼图", "description": "工笔细腻，栩栩如生，生机盎然"},
    {"id": "p3", "name": "墨竹图", "description": "文同风格，胸有成竹，刚劲挺拔"},
    {"id": "p4", "name": "寒江独钓图", "description": "马远一角，意境空灵，余味无穷"},
    {"id": "p5", "name": "千里江山图", "description": "王希孟所作，青绿山水，气势恢宏"},
]

comments = [
    "雅集之盛，一时无两，群贤毕至，少长咸集。",
    "文采风流，冠绝一时，后人观之，不胜向往。",
    "琴棋书画，样样精通，主人之才，令人叹服。",
    "氛围融融，其乐陶陶，宾主尽欢，盛事难再。",
    "宋代风雅，于斯为盛，观此雅集，如见昔贤。",
    "吟咏之间，吐纳珠玉之声；眉睫之前，卷舒风云之色。",
    "不有雅集，何申雅怀？一时之盛，万古流芳。",
    "兰亭已矣，梓泽丘墟，然雅集之风，于斯为继。",
    "登高作赋，是所望于群公；敢竭鄙诚，恭疏短引。",
    "胜地不常，盛筵难再，兰亭已矣，梓泽丘墟。",
]

achievements = [
    {"id": "a1", "name": "妙手回春", "description": "连续5次正确安排雅集活动"},
    {"id": "a2", "name": "八面玲珑", "description": "事件处理成功率达到90%以上"},
    {"id": "a3", "name": "雅集宗师", "description": "本旬平均氛围值超过80"},
    {"id": "a4", "name": "宾至如归", "description": "所有宾客满意度达到最高"},
    {"id": "a5", "name": "风雅绝伦", "description": "完成10次雅集活动"},
]

game_state = {
    "day": 1,
    "total_yaji": 0,
    "atmosphere_history": [],
    "event_count": 0,
    "event_success": 0,
    "consecutive_correct": 0,
    "max_consecutive": 0,
    "period_start": (datetime.now() - timedelta(days=9)).strftime("%Y-%m-%d"),
    "period_end": datetime.now().strftime("%Y-%m-%d"),
}


class ActionRequest(BaseModel):
    sceneId: str
    musicId: str
    chessId: str
    paintingId: str


class EventRequest(BaseModel):
    eventId: str
    optionId: str
    sceneId: str


class Guest(BaseModel):
    id: str
    name: str
    title: str
    preference: str


class SceneResponse(BaseModel):
    id: str
    theme: str
    description: str
    guests: List[Guest]
    atmosphere: int
    maxAtmosphere: int
    day: int
    timeLimit: int


class ActionOption(BaseModel):
    id: str
    name: str
    description: str
    category: str
    isCorrect: Optional[bool] = None


class ActionResponse(BaseModel):
    music: List[ActionOption]
    chess: List[ActionOption]
    painting: List[ActionOption]


class ActionResultResponse(BaseModel):
    success: bool
    message: str
    atmosphereChange: int
    newAtmosphere: int
    triggerEvent: bool


class EventOption(BaseModel):
    id: str
    text: str
    result: str
    atmosphereChange: int


class EventResponse(BaseModel):
    id: str
    title: str
    description: str
    options: List[EventOption]


class Achievement(BaseModel):
    id: str
    name: str
    description: str


class ReportResponse(BaseModel):
    totalYaji: int
    averageAtmosphere: float
    eventSuccessRate: float
    achievements: List[Achievement]
    comment: str
    periodStart: str
    periodEnd: str


def generate_scene_id():
    return f"scene_{uuid.uuid4().hex[:8]}"


def select_correct_options(theme):
    theme_options = {
        "赏雪雅集": {"music": "m1", "chess": "c1", "painting": "p4"},
        "听雨雅集": {"music": "m3", "chess": "c3", "painting": "p3"},
        "论道雅集": {"music": "m2", "chess": "c2", "painting": "p1"},
        "赏月雅集": {"music": "m4", "chess": "c4", "painting": "p5"},
        "赏菊雅集": {"music": "m4", "chess": "c5", "painting": "p2"},
        "观画雅集": {"music": "m3", "chess": "c3", "painting": "p5"},
        "听琴雅集": {"music": "m1", "chess": "c1", "painting": "p1"},
        "弈棋雅集": {"music": "m2", "chess": "c2", "painting": "p4"},
    }
    return theme_options.get(theme, {"music": "m1", "chess": "c1", "painting": "p1"})


@app.get("/api/yaji/generate", response_model=SceneResponse)
async def api_generate_yaji():
    theme_data = random.choice(themes)
    selected_guests = random.sample(guests, k=random.randint(3, 5))

    initial_atmosphere = scorer.calculate_initial_atmosphere(
        theme_data["theme"], len(selected_guests)
    )

    scene = SceneResponse(
        id=generate_scene_id(),
        theme=theme_data["theme"],
        description=theme_data["description"],
        guests=[Guest(**g, id=f"guest_{i}") for i, g in enumerate(selected_guests)],
        atmosphere=initial_atmosphere,
        maxAtmosphere=100,
        day=game_state["day"],
        timeLimit=900,
    )

    game_state["current_scene"] = scene.dict()
    game_state["correct_options"] = select_correct_options(scene.theme)
    game_state["total_yaji"] += 1

    return scene


@app.get("/api/yaji/actions", response_model=ActionResponse)
async def api_get_actions(sceneId: str):
    correct = game_state.get("correct_options", {})

    def mark_correct(options, correct_id, category):
        result = []
        for opt in random.sample(options, k=3):
            opt_copy = opt.copy()
            opt_copy["category"] = category
            opt_copy["isCorrect"] = opt["id"] == correct_id
            result.append(ActionOption(**opt_copy))
        return result

    return ActionResponse(
        music=mark_correct(music_options, correct.get("music", "m1"), "music"),
        chess=mark_correct(chess_options, correct.get("chess", "c1"), "chess"),
        painting=mark_correct(painting_options, correct.get("painting", "p1"), "painting"),
    )


@app.post("/api/yaji/action", response_model=ActionResultResponse)
async def api_submit_action(request: ActionRequest):
    correct = game_state.get("correct_options", {})
    current_scene = game_state.get("current_scene", {})

    music_correct = request.musicId == correct.get("music")
    chess_correct = request.chessId == correct.get("chess")
    painting_correct = request.paintingId == correct.get("painting")

    all_correct = music_correct and chess_correct and painting_correct
    correct_count = sum([music_correct, chess_correct, painting_correct])

    if all_correct:
        game_state["consecutive_correct"] += 1
        if game_state["consecutive_correct"] > game_state["max_consecutive"]:
            game_state["max_consecutive"] = game_state["consecutive_correct"]
        success = True
        message = "妙哉！琴棋书画皆合宾客心意，雅集氛围更上一层楼！"
        atmosphere_change = scorer.calculate_action_score(True, 3)
    elif correct_count >= 2:
        game_state["consecutive_correct"] = 0
        success = True
        message = "尚佳！虽有小瑕，然宾客仍感主人用心。"
        atmosphere_change = scorer.calculate_action_score(True, correct_count)
    else:
        game_state["consecutive_correct"] = 0
        success = False
        message = "惜哉！所选不合宾客品味，氛围稍显尴尬。"
        atmosphere_change = scorer.calculate_action_score(False, correct_count)

    current_atmosphere = current_scene.get("atmosphere", 50)
    new_atmosphere = max(0, min(100, current_atmosphere + atmosphere_change))

    game_state["atmosphere_history"].append(new_atmosphere)
    if "current_scene" in game_state:
        game_state["current_scene"]["atmosphere"] = new_atmosphere

    game_state["day"] += 1
    trigger_event = random.random() < 0.3

    return ActionResultResponse(
        success=success,
        message=message,
        atmosphereChange=atmosphere_change,
        newAtmosphere=new_atmosphere,
        triggerEvent=trigger_event,
    )


@app.get("/api/yaji/event/random", response_model=EventResponse)
async def api_trigger_event(sceneId: str):
    current_scene = game_state.get("current_scene", {})
    theme = current_scene.get("theme", "雅集")
    guest_count = len(current_scene.get("guests", []))

    event = event_generator.generate_event(theme, guest_count)
    game_state["current_event"] = event

    return EventResponse(**event)


@app.post("/api/yaji/event", response_model=ActionResultResponse)
async def api_handle_event(request: EventRequest):
    event = game_state.get("current_event", {})
    current_scene = game_state.get("current_scene", {})

    selected_option = None
    for opt in event.get("options", []):
        if opt["id"] == request.optionId:
            selected_option = opt
            break

    if not selected_option:
        raise HTTPException(status_code=400, detail="无效的选项")

    game_state["event_count"] += 1

    atmosphere_change = selected_option["atmosphereChange"]
    success = atmosphere_change >= 0

    if success:
        game_state["event_success"] += 1
        message = selected_option["result"]
    else:
        message = selected_option["result"]

    current_atmosphere = current_scene.get("atmosphere", 50)
    new_atmosphere = max(0, min(100, current_atmosphere + atmosphere_change))

    if "current_scene" in game_state:
        game_state["current_scene"]["atmosphere"] = new_atmosphere

    return ActionResultResponse(
        success=success,
        message=message,
        atmosphereChange=atmosphere_change,
        newAtmosphere=new_atmosphere,
        triggerEvent=False,
    )


@app.get("/api/yaji/report", response_model=ReportResponse)
async def api_generate_report():
    total_yaji = game_state["total_yaji"]
    atmosphere_history = game_state["atmosphere_history"]
    average_atmosphere = sum(atmosphere_history) / len(atmosphere_history) if atmosphere_history else 50.0

    event_count = game_state["event_count"]
    event_success = game_state["event_success"]
    event_success_rate = event_success / event_count if event_count > 0 else 0.0

    earned_achievements = []

    if game_state["max_consecutive"] >= 5:
        earned_achievements.append(achievements[0])
    if event_success_rate >= 0.9 and event_count >= 5:
        earned_achievements.append(achievements[1])
    if average_atmosphere >= 80:
        earned_achievements.append(achievements[2])
    if average_atmosphere >= 70 and total_yaji >= 8:
        earned_achievements.append(achievements[3])
    if total_yaji >= 10:
        earned_achievements.append(achievements[4])

    comment = random.choice(comments)

    game_state["day"] = 1
    game_state["total_yaji"] = 0
    game_state["atmosphere_history"] = []
    game_state["event_count"] = 0
    game_state["event_success"] = 0
    game_state["consecutive_correct"] = 0
    game_state["max_consecutive"] = 0
    game_state["period_start"] = datetime.now().strftime("%Y-%m-%d")
    game_state["period_end"] = (datetime.now() + timedelta(days=9)).strftime("%Y-%m-%d")

    return ReportResponse(
        totalYaji=total_yaji,
        averageAtmosphere=average_atmosphere,
        eventSuccessRate=event_success_rate,
        achievements=[Achievement(**a) for a in earned_achievements],
        comment=comment,
        periodStart=game_state["period_start"],
        periodEnd=game_state["period_end"],
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
