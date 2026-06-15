import random
from typing import List, Optional, Dict
from models.schemas import EventType, GameEvent, ResolveEventResponse


class EventService:
    def __init__(self):
        self.event_counter = 0
        self.active_events: Dict[int, GameEvent] = {}
        self.event_templates = {
            EventType.SHORTAGE: {
                "title": "药草短缺",
                "descriptions": [
                    "连日阴雨，药铺晾晒的草药发霉大半，急需补充新鲜药材。",
                    "城中突发需求，某味草药被抢购一空，库存告急。",
                    "上山采药的药农迟迟未归，常用草药存量不足。"
                ],
                "options": [
                    "以高价从邻县药商处采购",
                    "用其他功效相近的草药替代",
                    "亲自上山采药，冒险寻药",
                    "告知患者暂无此药，请改日再来"
                ],
                "correct_option": 1,
                "penalty": 15.0,
                "bonus": 10.0
            },
            EventType.POISON: {
                "title": "药童中毒",
                "descriptions": [
                    "小药童尝药时不慎中毒，面色发青，急需救治。",
                    "新到的药材炮制不当，药童处理时吸入毒气。",
                    "配药时误将毒草混入，药童试药后出现中毒症状。"
                ],
                "options": [
                    "立即灌服甘草汤解毒",
                    "用人工呼吸急救",
                    "让药童大量饮水稀释毒性",
                    "针刺十宣穴放血排毒"
                ],
                "correct_option": 0,
                "penalty": 20.0,
                "bonus": 12.0
            },
            EventType.BOOKWORM: {
                "title": "药方被虫蛀",
                "descriptions": [
                    "珍藏的古药方被虫蛀，关键几味药材的用量模糊不清。",
                    "药铺收藏的《本草纲目》遭虫蛀，重要页面损毁。",
                    "世代相传的秘方卷轴被虫蛀，部分字迹难以辨认。"
                ],
                "options": [
                    "凭记忆补全残缺部分",
                    "查阅其他版本医书对照考证",
                    "根据药材配伍规律推测用量",
                    "放弃使用，另寻他方"
                ],
                "correct_option": 1,
                "penalty": 12.0,
                "bonus": 8.0
            },
            EventType.PLAGUE: {
                "title": "时疫爆发",
                "descriptions": [
                    "城中爆发时疫，患者络绎不绝，急需大量清热解毒之药。",
                    "邻县传来瘟疫，为防扩散需提前准备防疫药材。",
                    "连日高温，暑湿之疫蔓延，患者症状相似，需批量配药。"
                ],
                "options": [
                    "以金银花、连翘为主药，普济消毒饮",
                    "大量使用人参、黄芪等补药增强正气",
                    "用麻黄、桂枝等解表药发汗驱邪",
                    "关闭药铺，避免被传染"
                ],
                "correct_option": 0,
                "penalty": 25.0,
                "bonus": 20.0
            }
        }
        self.success_messages = {
            EventType.SHORTAGE: "用药巧妙，既解决了燃眉之急，又为药铺节省了开支。",
            EventType.POISON: "药童转危为安，众人皆称赞您医术高明。",
            EventType.BOOKWORM: "考证详实，还原了古方原貌，传承之功不可没。",
            EventType.PLAGUE: "用药精准，时疫得到控制，百姓感恩戴德。"
        }
        self.failure_messages = {
            EventType.SHORTAGE: "处理失当，不仅损失了银两，还得罪了不少病患。",
            EventType.POISON: "救治失策，药童伤势加重，药铺声誉受损。",
            EventType.BOOKWORM: "臆断古方，用药失准，险些酿成大祸。",
            EventType.PLAGUE: "误治时疫，疫情扩散，民怨沸腾。"
        }

    def _get_random_template(self, event_type: EventType) -> dict:
        template = self.event_templates[event_type]
        description = random.choice(template["descriptions"])
        return {
            "title": template["title"],
            "description": description,
            "options": template["options"],
            "correct_option": template["correct_option"],
            "penalty": template["penalty"],
            "bonus": template["bonus"]
        }

    def trigger_event(self, period: int, day: int, event_type: Optional[EventType] = None) -> Optional[GameEvent]:
        if event_type is None:
            event_type = random.choice(list(EventType))
        
        template = self._get_random_template(event_type)
        
        self.event_counter += 1
        event = GameEvent(
            id=self.event_counter,
            type=event_type,
            title=template["title"],
            description=template["description"],
            options=template["options"],
            correct_option=template["correct_option"],
            penalty=template["penalty"],
            bonus=template["bonus"]
        )
        
        self.active_events[event.id] = event
        return event

    def resolve_event(self, event_id: int, selected_option: int) -> Optional[ResolveEventResponse]:
        event = self.active_events.get(event_id)
        if event is None:
            return None
        
        is_correct = selected_option == event.correct_option
        
        if is_correct:
            score_change = event.bonus
            message = self.success_messages[event.type]
        else:
            score_change = -event.penalty
            message = self.failure_messages[event.type]
        
        del self.active_events[event_id]
        
        return ResolveEventResponse(
            success=is_correct,
            message=message,
            score_change=score_change,
            event_type=event.type
        )

    def get_active_event(self, event_id: int) -> Optional[GameEvent]:
        return self.active_events.get(event_id)

    def get_all_active_events(self) -> List[GameEvent]:
        return list(self.active_events.values())

    def random_event_trigger(self, probability: float = 0.3) -> bool:
        return random.random() < probability

    def reset(self):
        self.event_counter = 0
        self.active_events = {}
