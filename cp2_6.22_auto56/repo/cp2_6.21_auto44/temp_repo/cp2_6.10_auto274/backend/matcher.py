from typing import List, Dict, Tuple, Optional
import math


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a * a for a in vec1))
    norm2 = math.sqrt(sum(b * b for b in vec2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot_product / (norm1 * norm2)


def calculate_edge_match(edge1: List[int], edge2: List[int]) -> float:
    reversed_edge2 = edge2[::-1]
    matches = sum(1 for a, b in zip(edge1, reversed_edge2) if a == b)
    return matches / len(edge1)


class FragmentMatcher:
    def find_matches(
        self,
        fragment: Dict,
        placed_fragments: List[Dict],
        threshold: float = 0.7
    ) -> List[Dict]:
        matches = []
        for placed in placed_fragments:
            match_scores = []
            
            if fragment["row"] == placed["row"] and fragment["col"] == placed["col"] - 1:
                score = calculate_edge_match(fragment["edges"]["right"], placed["edges"]["left"])
                if score >= threshold:
                    match_scores.append(("right", score))
            
            if fragment["row"] == placed["row"] and fragment["col"] == placed["col"] + 1:
                score = calculate_edge_match(fragment["edges"]["left"], placed["edges"]["right"])
                if score >= threshold:
                    match_scores.append(("left", score))
            
            if fragment["col"] == placed["col"] and fragment["row"] == placed["row"] - 1:
                score = calculate_edge_match(fragment["edges"]["bottom"], placed["edges"]["top"])
                if score >= threshold:
                    match_scores.append(("bottom", score))
            
            if fragment["col"] == placed["col"] and fragment["row"] == placed["row"] + 1:
                score = calculate_edge_match(fragment["edges"]["top"], placed["edges"]["bottom"])
                if score >= threshold:
                    match_scores.append(("top", score))
            
            if match_scores:
                max_score = max(s for _, s in match_scores)
                best_direction = [d for d, s in match_scores if s == max_score][0]
                matches.append({
                    "fragment_id": placed["id"],
                    "direction": best_direction,
                    "score": max_score
                })
        
        return matches

    def calculate_best_match(
        self,
        fragment: Dict,
        placed_fragments: List[Dict]
    ) -> Optional[Dict]:
        matches = self.find_matches(fragment, placed_fragments)
        if not matches:
            return None
        return max(matches, key=lambda x: x["score"])

    def calculate_accuracy_score(
        self,
        placed_fragments: List[Dict],
        correct_positions: List[Dict]
    ) -> float:
        if not placed_fragments:
            return 0.0
        
        correct_map = {(p["row"], p["col"]): p["id"] for p in correct_positions}
        correct_count = 0
        
        for frag in placed_fragments:
            key = (frag["row"], frag["col"])
            if key in correct_map and correct_map[key] == frag["id"]:
                correct_count += 1
        
        return correct_count / len(correct_positions) * 100

    def calculate_time_score(
        self,
        total_time: float,
        expected_time: float = 300
    ) -> float:
        if total_time <= 0:
            return 100.0
        ratio = expected_time / total_time
        return min(100.0, ratio * 100)

    def calculate_efficiency_score(
        self,
        total_moves: int,
        fragment_count: int
    ) -> float:
        if total_moves <= 0:
            return 100.0
        optimal_moves = fragment_count
        ratio = optimal_moves / total_moves
        return min(100.0, ratio * 100)

    def calculate_final_score(
        self,
        placed_fragments: List[Dict],
        total_time: float,
        total_moves: int,
        correct_positions: List[Dict]
    ) -> Dict:
        accuracy = self.calculate_accuracy_score(placed_fragments, correct_positions)
        time_score = self.calculate_time_score(total_time)
        efficiency_score = self.calculate_efficiency_score(total_moves, len(correct_positions))
        
        total_score = accuracy * 0.5 + time_score * 0.3 + efficiency_score * 0.2
        
        if total_score >= 90:
            grade = "S"
        elif total_score >= 80:
            grade = "A"
        elif total_score >= 70:
            grade = "B"
        elif total_score >= 60:
            grade = "C"
        else:
            grade = "D"
        
        return {
            "totalScore": round(total_score, 2),
            "accuracyScore": round(accuracy, 2),
            "timeScore": round(time_score, 2),
            "efficiencyScore": round(efficiency_score, 2),
            "grade": grade
        }
