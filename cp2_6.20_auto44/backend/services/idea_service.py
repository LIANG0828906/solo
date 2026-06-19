from datetime import datetime
from typing import Dict, List, Optional
import uuid
import random


CARD_COLORS = [
    'rgba(249, 115, 22, 0.15)',
    'rgba(59, 130, 246, 0.15)',
    'rgba(34, 197, 94, 0.15)',
    'rgba(168, 85, 247, 0.15)',
    'rgba(236, 72, 153, 0.15)',
]


class User:
    def __init__(self, id: str, name: str, avatar: str, online: bool = True):
        self.id = id
        self.name = name
        self.avatar = avatar
        self.online = online

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'avatar': self.avatar,
            'online': self.online,
        }


class Idea:
    def __init__(
        self,
        id: str,
        room_id: str,
        title: str,
        description: str,
        author: User,
        tags: List[str],
        bg_color: str,
        created_at: Optional[str] = None,
    ):
        self.id = id
        self.room_id = room_id
        self.title = title
        self.description = description
        self.author = author
        self.tags = tags
        self.votes = {'agree': 0, 'disagree': 0, 'neutral': 0}
        self.created_at = created_at or datetime.utcnow().isoformat()
        self.bg_color = bg_color

    def to_dict(self):
        return {
            'id': self.id,
            'roomId': self.room_id,
            'title': self.title,
            'description': self.description,
            'author': self.author.to_dict(),
            'tags': self.tags,
            'votes': self.votes,
            'createdAt': self.created_at,
            'bgColor': self.bg_color,
        }


class IdeaService:
    def __init__(self):
        self.rooms: Dict[str, Dict] = {}

    def _ensure_room(self, room_id: str):
        if room_id not in self.rooms:
            self.rooms[room_id] = {
                'users': [],
                'ideas': [],
            }
            self._seed_demo_data(room_id)
        return self.rooms[room_id]

    def _seed_demo_data(self, room_id: str):
        demo_users = [
            User('u1', '张伟', f'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang'),
            User('u2', '李娜', f'https://api.dicebear.com/7.x/avataaars/svg?seed=li'),
            User('u3', '王磊', f'https://api.dicebear.com/7.x/avataaars/svg?seed=wang'),
            User('u4', '刘芳', f'https://api.dicebear.com/7.x/avataaars/svg?seed=liu', online=False),
        ]
        self.rooms[room_id]['users'] = demo_users

        titles = [
            '引入AI智能客服系统',
            '移动端App性能优化',
            '用户积分体系改版',
            '短视频营销计划',
            '会员订阅制方案',
            '社区功能升级',
            '数据可视化大屏',
            '国际化多语言支持',
        ]
        descs = [
            '通过大语言模型提升客服效率，降低人工成本',
            '针对启动速度和内存占用进行专项优化',
            '重构积分获取和消费路径，提升用户活跃度',
            '利用抖音、小红书等平台进行品牌推广',
            '探索订阅制收费模式，稳定收入来源',
            '增加UGC内容激励机制，建设用户社区',
            '为运营团队提供实时数据监控和分析平台',
            '支持英语、日语等多语言，拓展海外市场',
        ]
        preset_tags = ['产品', '技术', '设计', '运营', '创新']

        for i in range(8):
            author = demo_users[i % len(demo_users)]
            tags_count = random.randint(1, 3)
            shuffled = sorted(preset_tags, key=lambda _: random.random())
            idea = Idea(
                id=f'idea-{i + 1}',
                room_id=room_id,
                title=titles[i],
                description=descs[i],
                author=author,
                tags=shuffled[:tags_count],
                bg_color=random.choice(CARD_COLORS),
                created_at=datetime.utcfromtimestamp(
                    datetime.utcnow().timestamp() - random.randint(0, 3600)
                ).isoformat(),
            )
            idea.votes = {
                'agree': random.randint(0, 15),
                'disagree': random.randint(0, 5),
                'neutral': random.randint(0, 8),
            }
            self.rooms[room_id]['ideas'].append(idea)

    def join_room(self, room_id: str, user_name: str) -> User:
        room = self._ensure_room(room_id)
        user = User(
            id=f'user-{uuid.uuid4().hex[:8]}',
            name=user_name,
            avatar=f'https://api.dicebear.com/7.x/avataaars/svg?seed={user_name}',
            online=True,
        )
        room['users'].append(user)
        return user

    def get_users(self, room_id: str) -> List[User]:
        room = self._ensure_room(room_id)
        return room['users']

    def get_ideas(self, room_id: str) -> List[Idea]:
        room = self._ensure_room(room_id)
        return sorted(room['ideas'], key=lambda i: i.created_at, reverse=True)

    def create_idea(
        self,
        room_id: str,
        title: str,
        description: str,
        tags: List[str],
        author: User,
    ) -> Idea:
        room = self._ensure_room(room_id)
        idea = Idea(
            id=f'idea-{uuid.uuid4().hex[:8]}',
            room_id=room_id,
            title=title,
            description=description,
            author=author,
            tags=tags,
            bg_color=random.choice(CARD_COLORS),
        )
        room['ideas'].insert(0, idea)
        return idea

    def vote_idea(self, room_id: str, idea_id: str, vote_type: str) -> Optional[Idea]:
        room = self._ensure_room(room_id)
        for idea in room['ideas']:
            if idea.id == idea_id:
                if vote_type in idea.votes:
                    idea.votes[vote_type] += 1
                return idea
        return None


idea_service = IdeaService()
