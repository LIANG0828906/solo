import random
from typing import Dict, List, Any


class EventGenerator:
    def __init__(self):
        self.events = {
            "poetry_contest": {
                "title": "宾客斗诗",
                "description": "席间有宾客提议斗诗助兴，众人纷纷附和，气氛顿时热烈起来。",
                "options": [
                    {
                        "id": "po1",
                        "text": "亲自主持，以雅集主题为题，限时赋诗",
                        "result": "你才情出众，一挥而就，众人皆服，雅集氛围推向高潮！",
                        "atmosphereChange": 10
                    },
                    {
                        "id": "po2",
                        "text": "推举苏轼为首，让宾客自由发挥",
                        "result": "苏轼才思敏捷，出口成章，众宾客纷纷叫好，气氛融洽。",
                        "atmosphereChange": 5
                    },
                    {
                        "id": "po3",
                        "text": "婉拒提议，担心有人因此不快",
                        "result": "宾客们略感失望，气氛稍显沉闷。",
                        "atmosphereChange": -5
                    }
                ]
            },
            "maid_mistake": {
                "title": "侍女失手",
                "description": "一位侍奉茶水的侍女不慎将茶盏打翻，溅湿了一位宾客的衣衫，场面略显尴尬。",
                "options": [
                    {
                        "id": "mm1",
                        "text": "立即起身解围，宽宥侍女之过",
                        "result": "你展现了主人的风度，宾客们纷纷称赞你的雅量，气氛更加融洽。",
                        "atmosphereChange": 8
                    },
                    {
                        "id": "mm2",
                        "text": "让侍女退下，换一件新衣给宾客",
                        "result": "宾客表示无妨，事件很快平息。",
                        "atmosphereChange": 3
                    },
                    {
                        "id": "mm3",
                        "text": "严厉斥责侍女，以儆效尤",
                        "result": "场面变得尴尬，宾客们面露不悦，氛围大减。",
                        "atmosphereChange": -10
                    }
                ]
            },
            "scholar_debate": {
                "title": "才子比拼",
                "description": "两位才子对一幅古画的真伪产生了分歧，各执己见，争论不休。",
                "options": [
                    {
                        "id": "sd1",
                        "text": "邀请米芾来鉴赏，众人共同探讨",
                        "result": "米芾不愧是书画博士，分析精辟入理，众人受益匪浅，气氛热烈。",
                        "atmosphereChange": 10
                    },
                    {
                        "id": "sd2",
                        "text": "让两人各抒己见，不做评判",
                        "result": "两人争论愈发激烈，众人围观，气氛紧张。",
                        "atmosphereChange": -3
                    },
                    {
                        "id": "sd3",
                        "text": "岔开话题，引向其他藏品",
                        "result": "你巧妙地转移了话题，避免了争执，宾客们继续欣赏其他藏品。",
                        "atmosphereChange": 5
                    }
                ]
            },
            "sudden_rain": {
                "title": "骤雨突降",
                "description": "原本晴朗的天气突然下起雨来，雨水飘进亭中，宾客们纷纷起身避雨。",
                "options": [
                    {
                        "id": "sr1",
                        "text": "邀众人至内室，听雨品茗，别有一番情趣",
                        "result": "雨天留客，更添雅兴，众人围坐听琴，气氛温馨而惬意。",
                        "atmosphereChange": 12
                    },
                    {
                        "id": "sr2",
                        "text": "安排仆人关闭门窗，继续雅集",
                        "result": "虽有小扰，但雅集得以继续。",
                        "atmosphereChange": 0
                    },
                    {
                        "id": "sr3",
                        "text": "提议提前结束，来日再聚",
                        "result": "宾客们虽有不舍，但也只能作罢，雅集匆匆结束。",
                        "atmosphereChange": -8
                    }
                ]
            },
            "guest_arrival": {
                "title": "不速之客",
                "description": "一位自称仰慕雅集之名的士人不请自来，仆人不知如何是好。",
                "options": [
                    {
                        "id": "ga1",
                        "text": "欣然相迎，请其入座，以礼相待",
                        "result": "来人果然才学出众，与众宾客相谈甚欢，众人皆赞你好客之名。",
                        "atmosphereChange": 8
                    },
                    {
                        "id": "ga2",
                        "text": "婉言谢绝，说明雅集已有安排",
                        "result": "来人面露失望之色，悻悻离去，众人略感惋惜。",
                        "atmosphereChange": -3
                    },
                    {
                        "id": "ga3",
                        "text": "请其稍候，待雅集结束后单独相见",
                        "result": "你既维护了雅集秩序，又不失待客之道，宾主尽欢。",
                        "atmosphereChange": 3
                    }
                ]
            },
            "instrument_broken": {
                "title": "琴弦忽断",
                "description": "抚琴的宾客正弹到高潮处，琴弦突然崩断，琴声戛然而止，众人愕然。",
                "options": [
                    {
                        "id": "ib1",
                        "text": "大笑曰：'弦断有知音！'并亲自换弦",
                        "result": "你机智的话语化解了尴尬，众人大笑，气氛更加轻松愉快。",
                        "atmosphereChange": 10
                    },
                    {
                        "id": "ib2",
                        "text": "让仆人换一把琴，继续演奏",
                        "result": "虽然略有停顿，但琴声很快再次响起，雅集继续。",
                        "atmosphereChange": 2
                    },
                    {
                        "id": "ib3",
                        "text": "认为不祥之兆，提议停止抚琴",
                        "result": "众人心中蒙上阴影，气氛变得压抑。",
                        "atmosphereChange": -12
                    }
                ]
            }
        }

    def generate_event(self, theme: str, guest_count: int) -> Dict[str, Any]:
        event_keys = list(self.events.keys())
        selected_key = random.choice(event_keys)
        event = self.events[selected_key]

        event_options = event["options"].copy()
        random.shuffle(event_options)

        for i, opt in enumerate(event_options):
            opt["id"] = f"{selected_key}_opt_{i+1}"

        return {
            "id": f"event_{random.randint(1000, 9999)}",
            "title": event["title"],
            "description": self._adapt_description(event["description"], theme, guest_count),
            "options": event_options
        }

    def _adapt_description(self, description: str, theme: str, guest_count: int) -> str:
        adaptations = {
            "赏雪雅集": description.replace("席间", "雪亭之中"),
            "听雨雅集": description.replace("席间", "听雨轩中"),
            "赏月雅集": description.replace("席间", "月下楼台"),
            "论道雅集": description.replace("席间", "论道堂中"),
        }
        return adaptations.get(theme, description)

    def get_all_events(self) -> Dict[str, Dict[str, Any]]:
        return self.events
