from typing import Tuple, List
import re

class SentimentAnalyzer:
    def __init__(self):
        self.joy_keywords = [
            '快乐', '高兴', '喜悦', '开心', '幸福', '欢乐', '愉快', '欣喜',
            '欢悦', '欢欣', '畅快', '快活', '快乐', '欢乐', '高兴', '开心',
            'happy', 'joy', 'glad', 'delight', 'pleasure', 'cheerful',
            '爱', '热爱', '喜欢', '美好', '美妙', '美丽', '温暖', '温馨',
            '阳光', '春天', '希望', '梦想', '祝福', '恭喜', '祝贺', '成功'
        ]
        
        self.sadness_keywords = [
            '悲伤', '难过', '伤心', '痛苦', '忧伤', '悲哀', '哀伤', '悲戚',
            '凄凉', '凄苦', '凄惨', '沉痛', '心碎', '落泪', '哭泣', '流泪',
            'sad', 'sorrow', 'grief', 'mourn', 'cry', 'tear', 'unhappy',
            '离别', '分离', '告别', '死亡', '失去', '失落', '孤独', '寂寞',
            '绝望', '失望', '沮丧', '忧郁', '忧愁', '烦恼', '痛苦', '煎熬'
        ]
        
        self.anger_keywords = [
            '愤怒', '生气', '气愤', '震怒', '暴怒', '愤慨', '愤怒', '怒火',
            '恼怒', '愠怒', '愤懑', '愤然', '发怒', '发火', '气冲冲', '咬牙',
            'angry', 'rage', 'fury', 'wrath', 'indignation', 'resentment',
            '恨', '仇恨', '憎恨', '憎恶', '厌恶', '痛恨', '愤怒', '指责',
            '批判', '反抗', '斗争', '战斗', '激昂', '激烈', '猛烈', '激荡'
        ]
        
        self.excitement_keywords = [
            '激昂', '澎湃', '激昂', '慷慨', '激昂', '振奋', '昂扬', '高涨',
            '热烈', '热情', '激情', '壮烈', '豪迈', '雄心', '壮志', '凌云',
            'excited', 'passionate', 'fiery', 'ardent', 'zealous', 'enthusiastic',
            '战斗', '冲锋', '前进', '进攻', '胜利', '凯旋', '荣耀', '光荣',
            '伟大', '崇高', '神圣', '庄严', '史诗', '壮丽', '辉煌', '璀璨'
        ]
    
    def analyze(self, text: str) -> Tuple[str, float, List[str]]:
        text_lower = text.lower()
        text_clean = re.sub(r'[^\w\s]', '', text_lower)
        words = text_clean.split()
        
        scores = {
            'joy': 0,
            'sadness': 0,
            'anger': 0,
            'excitement': 0
        }
        
        matched_keywords = []
        
        for keyword in self.joy_keywords:
            if keyword.lower() in text_lower:
                scores['joy'] += 1
                matched_keywords.append(keyword)
        
        for keyword in self.sadness_keywords:
            if keyword.lower() in text_lower:
                scores['sadness'] += 1
                matched_keywords.append(keyword)
        
        for keyword in self.anger_keywords:
            if keyword.lower() in text_lower:
                scores['anger'] += 1
                matched_keywords.append(keyword)
        
        for keyword in self.excitement_keywords:
            if keyword.lower() in text_lower:
                scores['excitement'] += 1
                matched_keywords.append(keyword)
        
        if len(words) > 0:
            for emotion in scores:
                scores[emotion] = scores[emotion] / (len(text) / 10)
        
        total_score = sum(scores.values())
        if total_score == 0:
            return 'neutral', 0.5, []
        
        max_emotion = max(scores, key=scores.get)
        confidence = min(scores[max_emotion] / total_score, 1.0)
        
        if max_emotion == 'joy' and confidence > 0.3:
            return 'joy', confidence, matched_keywords
        elif max_emotion == 'sadness' and confidence > 0.3:
            return 'sadness', confidence, matched_keywords
        elif max_emotion == 'excitement' and confidence > 0.3:
            return 'excitement', confidence, matched_keywords
        elif max_emotion == 'anger' and confidence > 0.3:
            return 'anger', confidence, matched_keywords
        else:
            return 'neutral', 0.5, matched_keywords[:5]

analyzer = SentimentAnalyzer()

def analyze_sentiment(text: str) -> dict:
    emotion, confidence, keywords = analyzer.analyze(text)
    return {
        'emotion': emotion,
        'confidence': confidence,
        'keywords': keywords
    }
