import json
import os
import uuid
import random
import string
from typing import Dict, List, Optional
from datetime import datetime

from models import (
    Story, SceneNode, SceneEdge, GameVariable, Position,
    StoryCreate, StoryUpdate
)

STORAGE_FILE = os.path.join(os.path.dirname(__file__), "stories_data.json")

_stories: Dict[str, Story] = {}
_short_url_map: Dict[str, str] = {}


def _load_from_file():
    global _stories, _short_url_map
    if os.path.exists(STORAGE_FILE):
        try:
            with open(STORAGE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                _stories = {}
                for sid, sdata in data.get("stories", {}).items():
                    _stories[sid] = Story(**sdata)
                _short_url_map = data.get("short_url_map", {})
        except Exception as e:
            print(f"加载存储文件失败: {e}")
            _stories = {}
            _short_url_map = {}
    else:
        _init_sample_data()


def _save_to_file():
    data = {
        "stories": {sid: s.model_dump() for sid, s in _stories.items()},
        "short_url_map": _short_url_map
    }
    with open(STORAGE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def generate_short_id() -> str:
    chars = string.ascii_letters + string.digits
    while True:
        short_id = ''.join(random.choices(chars, k=6))
        if short_id not in _short_url_map:
            return short_id


def generate_id() -> str:
    return str(uuid.uuid4())


def _create_sample_story_1() -> Story:
    story_id = generate_id()
    n1_id = generate_id()
    n2_id = generate_id()
    n3_id = generate_id()
    n4_id = generate_id()
    v1_id = generate_id()
    v2_id = generate_id()

    nodes = [
        SceneNode(
            id=n1_id,
            title="森林入口",
            description="你站在一片古老魔法森林的入口处。空气中弥漫着神秘的气息，树干上闪烁着微弱的荧光。两条小路在你面前分叉——左边通向幽深的密林，右边似乎有光亮。",
            backgroundImageUrl="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=500&fit=crop",
            backgroundMusicUrl="",
            variableRules=[],
            position=Position(x=100, y=200),
            isStart=True
        ),
        SceneNode(
            id=n2_id,
            title="精灵树屋",
            description="你沿着光亮的小路走去，发现了一座建在巨大橡树上的精灵树屋。一位友善的精灵向你招手，邀请你喝杯茶。她似乎有东西要送给你。",
            backgroundImageUrl="https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&h=500&fit=crop",
            backgroundMusicUrl="",
            variableRules=[
                {"variableId": v1_id, "operation": "add", "value": 50},
                {"variableId": v2_id, "operation": "set", "value": True}
            ],
            position=Position(x=400, y=80)
        ),
        SceneNode(
            id=n3_id,
            title="幽暗密林",
            description="你选择了左边的幽径。树木遮天蔽日，四周寂静得可怕。突然，一只巨大的暗影狼从灌木丛中跃出，挡住了你的去路！",
            backgroundImageUrl="https://images.unsplash.com/photo-1476231682828-37e571bc172f?w=800&h=500&fit=crop",
            backgroundMusicUrl="",
            variableRules=[
                {"variableId": v1_id, "operation": "subtract", "value": 20}
            ],
            position=Position(x=400, y=350)
        ),
        SceneNode(
            id=n4_id,
            title="森林之心",
            description="凭借精灵赠送的护身符和你的勇气，你终于抵达了森林中心。一棵散发着七彩光芒的古树矗立在此，这就是传说中的生命之树。你的冒险成功了！",
            backgroundImageUrl="https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&h=500&fit=crop",
            backgroundMusicUrl="",
            variableRules=[
                {"variableId": v1_id, "operation": "add", "value": 100}
            ],
            position=Position(x=750, y=200)
        )
    ]

    edges = [
        SceneEdge(
            id=generate_id(),
            source=n1_id,
            target=n2_id,
            label="走右边明亮的小路",
            conditions=[]
        ),
        SceneEdge(
            id=generate_id(),
            source=n1_id,
            target=n3_id,
            label="走左边幽暗的密林",
            conditions=[]
        ),
        SceneEdge(
            id=generate_id(),
            source=n2_id,
            target=n4_id,
            label="带着精灵的祝福继续前进",
            conditions=[]
        ),
        SceneEdge(
            id=generate_id(),
            source=n3_id,
            target=n4_id,
            label="勇敢地击退暗影狼",
            conditions=[{"variableId": v2_id, "operator": "==", "value": True}]
        )
    ]

    variables = [
        GameVariable(
            id=v1_id,
            name="生命值",
            type="number",
            initialValue=100,
            minValue=0,
            maxValue=200,
            color="#e94560"
        ),
        GameVariable(
            id=v2_id,
            name="拥有护身符",
            type="boolean",
            initialValue=False,
            color="#fbbf24"
        )
    ]

    return Story(
        id=story_id,
        title="魔法森林冒险",
        author="星辰写手",
        coverImageUrl="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop",
        playCount=128,
        averageRating=4.7,
        ratingCount=42,
        createdAt=datetime.now().isoformat(),
        published=True,
        shortUrl=None,
        nodes=nodes,
        edges=edges,
        variables=variables,
        startNodeId=n1_id
    )


def _create_sample_story_2() -> Story:
    story_id = generate_id()
    n1_id = generate_id()
    n2_id = generate_id()
    n3_id = generate_id()
    v1_id = generate_id()

    nodes = [
        SceneNode(
            id=n1_id,
            title="案发深夜",
            description="星际历2287年，你是星际警署的王牌侦探。在繁华的太空站「新希望」上，一位著名的星际商人被发现死在自己的豪华舱内。门锁完好无损，房间里没有打斗痕迹...",
            backgroundImageUrl="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=500&fit=crop",
            backgroundMusicUrl="",
            variableRules=[],
            position=Position(x=100, y=200),
            isStart=True
        ),
        SceneNode(
            id=n2_id,
            title="审问助手",
            description="你决定先审问死者的人工智能助手。它眼中闪过一丝犹豫...等等，它的记忆模块似乎被篡改过？你需要更多线索来拼凑真相。",
            backgroundImageUrl="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=500&fit=crop",
            backgroundMusicUrl="",
            variableRules=[
                {"variableId": v1_id, "operation": "add", "value": 1}
            ],
            position=Position(x=400, y=100)
        ),
        SceneNode(
            id=n3_id,
            title="真相大白",
            description="根据收集到的所有证据，你终于锁定了真凶——竟然是合伙人！他利用量子隧道隐形潜入，伪造不在场证明。案件告破，你又一次维护了星际正义！",
            backgroundImageUrl="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&h=500&fit=crop",
            backgroundMusicUrl="",
            variableRules=[
                {"variableId": v1_id, "operation": "add", "value": 2}
            ],
            position=Position(x=750, y=200)
        )
    ]

    edges = [
        SceneEdge(
            id=generate_id(),
            source=n1_id,
            target=n2_id,
            label="审问AI助手",
            conditions=[]
        ),
        SceneEdge(
            id=generate_id(),
            source=n2_id,
            target=n3_id,
            label="指出真凶",
            conditions=[{"variableId": v1_id, "operator": ">=", "value": 1}]
        )
    ]

    variables = [
        GameVariable(
            id=v1_id,
            name="线索数量",
            type="number",
            initialValue=0,
            minValue=0,
            maxValue=10,
            color="#0f3460"
        )
    ]

    return Story(
        id=story_id,
        title="星际侦探：量子谋杀案",
        author="银河推理社",
        coverImageUrl="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop",
        playCount=89,
        averageRating=4.5,
        ratingCount=31,
        createdAt=datetime.now().isoformat(),
        published=True,
        shortUrl=None,
        nodes=nodes,
        edges=edges,
        variables=variables,
        startNodeId=n1_id
    )


def _create_sample_story_3() -> Story:
    story_id = generate_id()
    n1_id = generate_id()
    n2_id = generate_id()
    v1_id = generate_id()

    nodes = [
        SceneNode(
            id=n1_id,
            title="废土黎明",
            description="核战百年后，你是废土上的幸存者。清晨的阳光穿过厚厚的辐射云，你必须在今天找到新的水源，否则整个营地都撑不过一周...",
            backgroundImageUrl="https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=800&h=500&fit=crop",
            backgroundMusicUrl="",
            variableRules=[],
            position=Position(x=100, y=200),
            isStart=True
        ),
        SceneNode(
            id=n2_id,
            title="绿洲希望",
            description="经历重重险阻，你在废墟深处发现了一座未被破坏的净水站！营地得救了，你成为了废土上的传奇英雄。",
            backgroundImageUrl="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=500&fit=crop",
            backgroundMusicUrl="",
            variableRules=[
                {"variableId": v1_id, "operation": "set", "value": True}
            ],
            position=Position(x=500, y=200)
        )
    ]

    edges = [
        SceneEdge(
            id=generate_id(),
            source=n1_id,
            target=n2_id,
            label="踏上寻水之旅",
            conditions=[]
        )
    ]

    variables = [
        GameVariable(
            id=v1_id,
            name="任务完成",
            type="boolean",
            initialValue=False,
            color="#10b981"
        )
    ]

    return Story(
        id=story_id,
        title="废土求生：绿洲传说",
        author="末日叙事者",
        coverImageUrl="https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=600&h=400&fit=crop",
        playCount=256,
        averageRating=4.8,
        ratingCount=78,
        createdAt=datetime.now().isoformat(),
        published=True,
        shortUrl=None,
        nodes=nodes,
        edges=edges,
        variables=variables,
        startNodeId=n1_id
    )


def _init_sample_data():
    global _stories, _short_url_map
    s1 = _create_sample_story_1()
    s2 = _create_sample_story_2()
    s3 = _create_sample_story_3()

    for s in [s1, s2, s3]:
        short_id = generate_short_id()
        s.shortUrl = f"https://game.example.com/{short_id}"
        _short_url_map[short_id] = s.id
        _stories[s.id] = s

    _save_to_file()


def create_story(data: StoryCreate) -> Story:
    story_id = generate_id()
    n1_id = generate_id()
    new_story = Story(
        id=story_id,
        title=data.title or "新故事",
        author=data.author or "匿名创作者",
        coverImageUrl="",
        nodes=[
            SceneNode(
                id=n1_id,
                title="起始场景",
                description="在这里写下你的故事开始...",
                position=Position(x=200, y=200),
                isStart=True
            )
        ],
        edges=[],
        variables=[],
        startNodeId=n1_id
    )
    _stories[story_id] = new_story
    _save_to_file()
    return new_story


def get_story(story_id: str) -> Optional[Story]:
    return _stories.get(story_id)


def update_story(story_id: str, data: StoryUpdate) -> Optional[Story]:
    story = _stories.get(story_id)
    if not story:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(story, key, value)
    _save_to_file()
    return story


def delete_story(story_id: str) -> bool:
    if story_id in _stories:
        del _stories[story_id]
        for short_id, sid in list(_short_url_map.items()):
            if sid == story_id:
                del _short_url_map[short_id]
        _save_to_file()
        return True
    return False


def list_stories(search: Optional[str] = None, published_only: bool = True) -> List[Story]:
    result = []
    for story in _stories.values():
        if published_only and not story.published:
            continue
        if search:
            search_lower = search.lower()
            if (search_lower not in story.title.lower() and
                search_lower not in story.author.lower() and
                search_lower not in (story.nodes[0].description.lower() if story.nodes else "")):
                continue
        result.append(story)
    result.sort(key=lambda s: s.createdAt, reverse=True)
    return result


def publish_story(story_id: str) -> Optional[dict]:
    story = _stories.get(story_id)
    if not story:
        return None
    story.published = True
    short_id = generate_short_id()
    story.shortUrl = f"https://game.example.com/{short_id}"
    _short_url_map[short_id] = story_id
    _save_to_file()
    return {"shortUrl": story.shortUrl, "shortId": short_id}


def increment_play(story_id: str) -> Optional[int]:
    story = _stories.get(story_id)
    if not story:
        return None
    story.playCount += 1
    _save_to_file()
    return story.playCount


def rate_story(story_id: str, rating: int) -> Optional[dict]:
    story = _stories.get(story_id)
    if not story:
        return None
    total = story.averageRating * story.ratingCount + rating
    story.ratingCount += 1
    story.averageRating = round(total / story.ratingCount, 2)
    _save_to_file()
    return {"averageRating": story.averageRating, "ratingCount": story.ratingCount}


def get_by_short_id(short_id: str) -> Optional[Story]:
    story_id = _short_url_map.get(short_id)
    if not story_id:
        return None
    return _stories.get(story_id)
