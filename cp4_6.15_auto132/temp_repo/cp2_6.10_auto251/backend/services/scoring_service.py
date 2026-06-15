from typing import Dict, Optional, List, Tuple
from models.schemas import ScoreGrade, ScoreResponse, Task


class ScoringService:
    def __init__(self):
        self.scores: Dict[int, float] = {}
        self.correct_counts: Dict[int, int] = {}
        self.total_counts: Dict[int, int] = {}
        self.task_records: Dict[int, Dict] = {}
        self.current_period = 1
        self.current_day = 1
        self.DAYS_PER_PERIOD = 10
        self.BASE_SCORE_PER_CORRECT = 10.0
        self.TIME_BONUS_MULTIPLIER = 0.5

    def _calculate_time_bonus(self, response_time: float, time_limit: int) -> float:
        if response_time <= 0:
            return 0.0
        remaining_ratio = max(0, (time_limit - response_time) / time_limit)
        return self.BASE_SCORE_PER_CORRECT * self.TIME_BONUS_MULTIPLIER * remaining_ratio

    def _get_grade(self, score: float) -> ScoreGrade:
        if score < 60:
            return ScoreGrade.XIA_GONG
        elif score < 80:
            return ScoreGrade.ZHONG_GONG
        elif score <= 95:
            return ScoreGrade.SHANG_GONG
        else:
            return ScoreGrade.SHEN_YI

    def submit_answer(self, task: Task, selected_herb_id: int, response_time: float) -> Tuple[bool, float, str]:
        task_id = task.id
        
        if task_id in self.task_records:
            return False, 0.0, "该任务已提交过答案"
        
        is_correct = selected_herb_id == task.correct_herb_id
        
        score_change = 0.0
        message = ""
        
        if is_correct:
            time_bonus = self._calculate_time_bonus(response_time, task.time_limit)
            score_change = self.BASE_SCORE_PER_CORRECT + time_bonus
            message = f"回答正确！基础分{self.BASE_SCORE_PER_CORRECT}分，时间奖励{time_bonus:.1f}分，共获得{score_change:.1f}分"
            self.correct_counts[self.current_period] = self.correct_counts.get(self.current_period, 0) + 1
        else:
            score_change = 0.0
            correct_herb = next((opt for opt in task.options if opt.herb_id == task.correct_herb_id), None)
            correct_name = correct_herb.herb_name if correct_herb else "未知"
            message = f"回答错误。正确答案是：{correct_name}"
        
        period_score = self.scores.get(self.current_period, 0.0)
        max_possible = self.total_counts.get(self.current_period, 0) * self.BASE_SCORE_PER_CORRECT * (1 + self.TIME_BONUS_MULTIPLIER)
        
        if max_possible > 0:
            normalized_score = min(100.0, (period_score + score_change) / max_possible * 100)
        else:
            normalized_score = 0.0
        
        self.scores[self.current_period] = period_score + score_change
        self.total_counts[self.current_period] = self.total_counts.get(self.current_period, 0) + 1
        
        self.task_records[task_id] = {
            "task": task,
            "selected_herb_id": selected_herb_id,
            "is_correct": is_correct,
            "score_change": score_change,
            "response_time": response_time
        }
        
        return is_correct, score_change, message

    def get_score(self, period: int = None, day: int = None) -> ScoreResponse:
        target_period = period if period is not None else self.current_period
        target_day = day if day is not None else self.current_day
        
        period_score = self.scores.get(target_period, 0.0)
        correct = self.correct_counts.get(target_period, 0)
        total = self.total_counts.get(target_period, 0)
        
        max_possible = total * self.BASE_SCORE_PER_CORRECT * (1 + self.TIME_BONUS_MULTIPLIER)
        if max_possible > 0:
            normalized_score = min(100.0, period_score / max_possible * 100)
        else:
            normalized_score = 0.0
        
        accuracy = (correct / total * 100) if total > 0 else 0.0
        
        return ScoreResponse(
            total_score=round(normalized_score, 1),
            correct_count=correct,
            total_count=total,
            accuracy=round(accuracy, 1),
            grade=self._get_grade(normalized_score),
            period=target_period,
            day=target_day
        )

    def update_day(self, period: int, day: int):
        self.current_period = period
        self.current_day = day
        if period not in self.scores:
            self.scores[period] = 0.0
            self.correct_counts[period] = 0
            self.total_counts[period] = 0

    def adjust_score(self, amount: float, period: int = None):
        target_period = period if period is not None else self.current_period
        self.scores[target_period] = max(0, self.scores.get(target_period, 0.0) + amount)

    def end_period(self, period: int) -> Tuple[float, ScoreGrade, str]:
        score_response = self.get_score(period=period, day=self.DAYS_PER_PERIOD)
        final_score = score_response.total_score
        grade = score_response.grade
        
        grade_messages = {
            ScoreGrade.XIA_GONG: "本旬诊治未能精进，尚需勤学苦练，熟读本草。",
            ScoreGrade.ZHONG_GONG: "本旬医术尚可，然仍有疏漏，需多加研习。",
            ScoreGrade.SHANG_GONG: "本旬诊治精准，用药得当，可谓良医。",
            ScoreGrade.SHEN_YI: "本旬医术通神，辨证如神，乃当代神医也！"
        }
        
        summary = (
            f"第{period}旬结束，共诊治{score_response.total_count}例，"
            f"正确{score_response.correct_count}例，正确率{score_response.accuracy}%。"
            f"综合评分{final_score:.1f}分，评定为「{grade}」。{grade_messages[grade]}"
        )
        
        return final_score, grade, summary

    def reset(self):
        self.scores = {}
        self.correct_counts = {}
        self.total_counts = {}
        self.task_records = {}
        self.current_period = 1
        self.current_day = 1

    def get_period_summary(self, period: int) -> Dict:
        period_tasks = [
            record for record in self.task_records.values()
            if record["task"].period == period
        ]
        return {
            "period": period,
            "total_tasks": len(period_tasks),
            "correct_tasks": sum(1 for r in period_tasks if r["is_correct"]),
            "total_score": sum(r["score_change"] for r in period_tasks),
            "average_response_time": (
                sum(r["response_time"] for r in period_tasks) / len(period_tasks)
                if period_tasks else 0.0
            )
        }
