from typing import List
from app.models import StarRecord, StarWenRecord


def calculate_grade(accuracy: float, cultivation: int) -> str:
    if accuracy >= 0.9:
        return "S"
    elif accuracy >= 0.8:
        return "A"
    elif accuracy >= 0.7:
        return "B"
    elif accuracy >= 0.6:
        return "C"
    else:
        return "D"


def generate_comment(grade: str) -> str:
    comments: dict = {
        "S": "天人合一，星文同辉！汝之修为已臻化境，天道感应，当载入《星文录》首篇，百世流芳。",
        "A": "星官之才，卓尔不群！观测精准，应对得体，假以时日必能位列仙班。",
        "B": "勤勉可嘉，术业有专攻！虽有小失，然大节无亏，继续修行必有所成。",
        "C": "初窥星道，仍需努力！对星宿铭文的理解尚有不足，望勤学苦练，他日必有精进。",
        "D": "星途坎坷，道阻且长！天象万变，非一朝一夕可通，需从头温习星经，重新开始。"
    }
    return comments.get(grade, comments["D"])


def create_star_wen_record(
    xun: int,
    records: List[StarRecord],
    cultivation: int
) -> StarWenRecord:
    total_events: int = len(records)
    success_count: int = sum(1 for r in records if r.success)
    accuracy: float = success_count / total_events if total_events > 0 else 0.0

    grade: str = calculate_grade(accuracy, cultivation)
    comment: str = generate_comment(grade)

    start_day: int = (xun - 1) * 10 + 1
    end_day: int = xun * 10

    record: StarWenRecord = StarWenRecord(
        xun=xun,
        startDay=start_day,
        endDay=end_day,
        totalEvents=total_events,
        successCount=success_count,
        accuracy=round(accuracy, 4),
        finalCultivation=cultivation,
        grade=grade,
        comment=comment
    )

    return record
