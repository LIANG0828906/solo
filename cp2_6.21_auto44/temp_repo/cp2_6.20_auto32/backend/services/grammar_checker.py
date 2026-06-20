import json
import os
import re
import uuid
from typing import List

from models.schemas import GrammarError


ERROR_LIBRARY_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "data", "error_library.json"
)


def load_error_library() -> dict:
    with open(ERROR_LIBRARY_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def check_spelling(content: str) -> List[GrammarError]:
    library = load_error_library()
    errors = []
    spelling_rules = library.get("spelling", [])

    for rule in spelling_rules:
        wrong_word = rule["wrong"]
        start = 0
        while True:
            pos = content.find(wrong_word, start)
            if pos == -1:
                break
            errors.append(
                GrammarError(
                    id=f"spell-{uuid.uuid4().hex[:8]}",
                    type="spelling",
                    text=wrong_word,
                    offset=pos,
                    length=len(wrong_word),
                    suggestion=rule["correct"],
                    message=rule["message"],
                )
            )
            start = pos + len(wrong_word)

    return errors


def check_punctuation(content: str) -> List[GrammarError]:
    errors = []

    punctuation_patterns = [
        (r"。。", "。", "重复使用句号"),
        (r"，，", "，", "重复使用逗号"),
        (r"！！+", "！", "避免重复使用感叹号"),
        (r"？？+", "？", "避免重复使用问号"),
        (r",,", ",", "重复使用英文逗号"),
        (r"\.\.+", ".", "重复使用英文句号"),
        (r"！。", "！", "标点符号使用不当"),
        (r"？。", "？", "标点符号使用不当"),
    ]

    for pattern, replacement, message in punctuation_patterns:
        for match in re.finditer(pattern, content):
            errors.append(
                GrammarError(
                    id=f"punct-{uuid.uuid4().hex[:8]}",
                    type="punctuation",
                    text=match.group(),
                    offset=match.start(),
                    length=len(match.group()),
                    suggestion=replacement,
                    message=message,
                )
            )

    return errors


def check_grammar(content: str) -> List[GrammarError]:
    errors = []

    grammar_patterns = [
        (r"因为.*所以", "因果关系表达可以更简洁", "可考虑使用'因此'替代"),
        (r"虽然.*但是", "转折关系表达", "注意关联词搭配是否恰当"),
        (r"不仅.*而且", "递进关系表达正确", "递进关系使用得当"),
        (r"不但.*还", "递进关系表达", "递进关系使用正确"),
    ]

    for pattern, message, suggestion in grammar_patterns:
        for match in re.finditer(pattern, content):
            errors.append(
                GrammarError(
                    id=f"gram-{uuid.uuid4().hex[:8]}",
                    type="grammar",
                    text=match.group(),
                    offset=match.start(),
                    length=len(match.group()),
                    suggestion=suggestion,
                    message=message,
                )
            )

    return errors


def check_grammar_full(content: str) -> List[GrammarError]:
    errors = []
    errors.extend(check_spelling(content))
    errors.extend(check_punctuation(content))
    errors.extend(check_grammar(content))

    errors.sort(key=lambda e: e.offset)
    return errors


def precheck_spelling_punctuation(content: str) -> List[GrammarError]:
    errors = []
    errors.extend(check_spelling(content))
    errors.extend(check_punctuation(content))
    errors.sort(key=lambda e: e.offset)
    return errors
