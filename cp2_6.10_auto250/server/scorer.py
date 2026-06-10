from typing import Optional


class Scorer:
    def __init__(self):
        self.base_atmosphere = 50
        self.max_atmosphere = 100
        self.min_atmosphere = 0

    def calculate_initial_atmosphere(self, theme: str, guest_count: int) -> int:
        atmosphere = self.base_atmosphere

        theme_bonus = {
            "赏月雅集": 5,
            "赏雪雅集": 3,
            "听雨雅集": 2,
            "论道雅集": 0,
            "观画雅集": 4,
            "听琴雅集": 5,
            "弈棋雅集": 3,
            "赏菊雅集": 3,
        }

        atmosphere += theme_bonus.get(theme, 0)
        atmosphere += min(guest_count * 2, 10)

        return max(self.min_atmosphere, min(self.max_atmosphere, atmosphere))

    def calculate_action_score(
        self,
        is_correct: bool,
        correct_count: int,
        consecutive_streak: int = 0
    ) -> int:
        if is_correct:
            base_score = correct_count * 3
            streak_bonus = min(consecutive_streak, 5)
            return base_score + streak_bonus
        else:
            penalty = (3 - correct_count) * 4
            return -penalty

    def calculate_event_score(
        self,
        choice_quality: str,
        current_atmosphere: Optional[int] = None
    ) -> int:
        quality_scores = {
            "excellent": 15,
            "good": 8,
            "neutral": 0,
            "poor": -8,
            "terrible": -15,
        }

        score = quality_scores.get(choice_quality, 0)

        if current_atmosphere is not None:
            if current_atmosphere >= 80 and score > 0:
                score = int(score * 1.2)
            elif current_atmosphere <= 20 and score < 0:
                score = int(score * 1.5)

        return score

    def calculate_final_score(
        self,
        atmosphere_history: list,
        event_results: list,
        achievements: list
    ) -> dict:
        if not atmosphere_history:
            avg_atmosphere = self.base_atmosphere
        else:
            avg_atmosphere = sum(atmosphere_history) / len(atmosphere_history)

        if event_results:
            event_success_rate = sum(1 for r in event_results if r >= 0) / len(event_results)
        else:
            event_success_rate = 0.0

        achievement_bonus = len(achievements) * 10

        final_score = (
            avg_atmosphere * 0.5 +
            event_success_rate * 100 * 0.3 +
            achievement_bonus * 0.2
        )

        grade = self._get_grade(final_score)

        return {
            "final_score": round(final_score, 2),
            "average_atmosphere": round(avg_atmosphere, 2),
            "event_success_rate": round(event_success_rate, 2),
            "achievement_count": len(achievements),
            "grade": grade
        }

    def _get_grade(self, score: float) -> str:
        if score >= 90:
            return "甲上"
        elif score >= 85:
            return "甲"
        elif score >= 80:
            return "甲下"
        elif score >= 75:
            return "乙上"
        elif score >= 70:
            return "乙"
        elif score >= 65:
            return "乙下"
        elif score >= 60:
            return "丙上"
        else:
            return "丁"

    def check_achievement(
        self,
        achievement_type: str,
        current_value: int,
        threshold: int
    ) -> bool:
        if achievement_type in ["consecutive_correct", "event_success", "total_yaji"]:
            return current_value >= threshold
        elif achievement_type == "average_atmosphere":
            return current_value >= threshold
        else:
            return False
