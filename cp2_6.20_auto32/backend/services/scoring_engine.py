import math
from typing import List

from models.schemas import ScoreBreakdown, GrammarError, StructureAnalysis


def calculate_grammar_score(errors: List[GrammarError], content_length: int) -> int:
    if content_length == 0:
        return 1

    error_density = len(errors) / content_length

    if error_density == 0:
        return 5
    elif error_density < 0.005:
        return 4
    elif error_density < 0.015:
        return 3
    elif error_density < 0.03:
        return 2
    else:
        return 1


def calculate_structure_score(structure: StructureAnalysis) -> int:
    score = 0

    if structure.hasIntro:
        score += 1.5
    if structure.hasBody:
        score += 2
    if structure.hasConclusion:
        score += 1.5

    if 10 <= structure.introPercent <= 25:
        score += 0.5
    if 50 <= structure.bodyPercent <= 75:
        score += 0.5
    if 8 <= structure.conclusionPercent <= 20:
        score += 0.5

    final_score = int(min(math.floor(score), 5))
    return max(1, final_score)


def calculate_vocabulary_score(content: str) -> int:
    if not content:
        return 1

    chars = set(content)
    unique_ratio = len(chars) / len(content) if len(content) > 0 else 0

    keywords = ["因此", "然而", "此外", "不仅", "而且", "虽然", "但是",
                "综上所述", "由此可见", "换言之", "与此同时", "值得注意的是"]
    keyword_count = sum(1 for kw in keywords if kw in content)

    score = 2

    if unique_ratio > 0.3:
        score += 1
    if keyword_count >= 3:
        score += 1
    if len(content) > 500:
        score += 1

    return min(score, 5)


def calculate_relevance_score(content: str, title: str) -> int:
    if not content or not title:
        return 2

    title_chars = set(title.replace("的", "").replace("之", "").replace("与", ""))
    content_chars = set(content)

    overlap = len(title_chars & content_chars)
    coverage = overlap / len(title_chars) if title_chars else 0

    if coverage >= 0.8:
        return 5
    elif coverage >= 0.6:
        return 4
    elif coverage >= 0.4:
        return 3
    elif coverage >= 0.2:
        return 2
    else:
        return 1


def calculate_total_score(
    grammar: int, structure: int, vocabulary: int, relevance: int
) -> int:
    weights = {
        "grammar": 0.3,
        "structure": 0.25,
        "vocabulary": 0.2,
        "relevance": 0.25,
    }

    weighted_sum = (
        grammar * weights["grammar"] +
        structure * weights["structure"] +
        vocabulary * weights["vocabulary"] +
        relevance * weights["relevance"]
    )

    total = int(round((weighted_sum / 5) * 100))
    return max(0, min(100, total))


def calculate_scores(
    errors: List[GrammarError],
    structure: StructureAnalysis,
    content: str,
    title: str,
) -> ScoreBreakdown:
    grammar = calculate_grammar_score(errors, len(content))
    structure_score = calculate_structure_score(structure)
    vocabulary = calculate_vocabulary_score(content)
    relevance = calculate_relevance_score(content, title)
    total = calculate_total_score(grammar, structure_score, vocabulary, relevance)

    return ScoreBreakdown(
        grammar=grammar,
        structure=structure_score,
        vocabulary=vocabulary,
        relevance=relevance,
        total=total,
    )
