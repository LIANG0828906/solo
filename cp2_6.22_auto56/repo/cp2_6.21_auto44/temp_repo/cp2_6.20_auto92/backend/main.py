import random
import uuid
from datetime import datetime, timedelta
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import reports_db, reports_by_employee, employee_info
from backend.models import ReportData, BasicInfo, BloodMetrics, Lifestyle
from backend.analyzer import analyze_report
from backend.routers import reports, hr

app = FastAPI(title="员工体检健康分析系统")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reports.router)
app.include_router(hr.router)


DEPARTMENTS = ["技术研发部", "市场营销部", "人力资源部", "财务部", "运营部",
               "产品设计部", "销售部", "客户服务部", "行政部", "法务部"]

SURNAMES = ["张", "王", "李", "赵", "刘", "陈", "杨", "黄", "周", "吴",
            "徐", "孙", "胡", "朱", "高", "林", "何", "郭", "马", "罗",
            "梁", "宋", "郑", "谢", "韩", "唐", "冯", "于", "董", "萧"]
GIVEN_NAMES_M = ["伟", "强", "磊", "军", "洋", "勇", "杰", "涛", "明", "超",
                 "鹏", "华", "飞", "刚", "平", "辉", "威", "峰", "凯", "浩"]
GIVEN_NAMES_F = ["芳", "娜", "敏", "静", "丽", "艳", "娟", "莉", "玲", "萍",
                 "慧", "琳", "雪", "倩", "颖", "佳", "悦", "璐", "瑶", "婷"]


def generate_name(gender: str) -> str:
    surname = random.choice(SURNAMES)
    if gender == "男":
        given = random.choice(GIVEN_NAMES_M)
        if random.random() < 0.4:
            given += random.choice(GIVEN_NAMES_M)
    else:
        given = random.choice(GIVEN_NAMES_F)
        if random.random() < 0.4:
            given += random.choice(GIVEN_NAMES_F)
    return surname + given


def generate_blood_metrics(health_level: str) -> BloodMetrics:
    if health_level == "healthy":
        return BloodMetrics(
            fasting_glucose=round(random.uniform(4.5, 5.8), 1),
            total_cholesterol=round(random.uniform(3.8, 5.0), 1),
            triglycerides=round(random.uniform(0.8, 1.5), 1),
            hdl=round(random.uniform(1.3, 1.8), 1),
            ldl=round(random.uniform(2.0, 3.2), 1),
            systolic_bp=random.randint(110, 125),
            diastolic_bp=random.randint(70, 82)
        )
    elif health_level == "mild":
        choices = [
            {"fasting_glucose": round(random.uniform(6.2, 6.8), 1)},
            {"total_cholesterol": round(random.uniform(5.3, 6.0), 1)},
            {"triglycerides": round(random.uniform(1.8, 2.2), 1)},
            {"hdl": round(random.uniform(1.0, 1.15), 1)},
            {"ldl": round(random.uniform(3.5, 4.0), 1)},
            {"systolic_bp": random.randint(131, 138), "diastolic_bp": random.randint(86, 89)},
        ]
        picks = random.sample(choices, k=random.randint(1, 2))
        base = generate_blood_metrics("healthy").model_dump()
        for p in picks:
            base.update(p)
        return BloodMetrics(**base)
    else:
        fg = random.choice([round(random.uniform(7.2, 9.5), 1), round(random.uniform(4.5, 5.8), 1)])
        tc = random.choice([round(random.uniform(6.3, 8.0), 1), round(random.uniform(3.8, 5.0), 1)])
        tg = random.choice([round(random.uniform(2.4, 5.0), 1), round(random.uniform(0.8, 1.5), 1)])
        hdl_val = random.choice([round(random.uniform(0.7, 0.95), 1), round(random.uniform(1.3, 1.8), 1)])
        ldl_val = random.choice([round(random.uniform(4.2, 6.0), 1), round(random.uniform(2.0, 3.2), 1)])
        if random.random() < 0.6:
            sbp = random.randint(142, 170)
            dbp = random.randint(92, 105)
        else:
            sbp = random.randint(110, 125)
            dbp = random.randint(70, 82)
        return BloodMetrics(
            fasting_glucose=fg,
            total_cholesterol=tc,
            triglycerides=tg,
            hdl=hdl_val,
            ldl=ldl_val,
            systolic_bp=sbp,
            diastolic_bp=dbp
        )


def generate_lifestyle(health_level: str, age: int) -> Lifestyle:
    if health_level == "healthy":
        return Lifestyle(
            exercise_freq=random.randint(3, 7),
            sleep_hours=round(random.uniform(7.0, 8.5), 1),
            smoking=False,
            drinking=random.random() < 0.15
        )
    elif health_level == "mild":
        return Lifestyle(
            exercise_freq=random.randint(1, 3),
            sleep_hours=round(random.uniform(6.0, 7.2), 1),
            smoking=random.random() < 0.2,
            drinking=random.random() < 0.4
        )
    else:
        return Lifestyle(
            exercise_freq=random.randint(0, 2),
            sleep_hours=round(random.uniform(4.5, 6.5), 1),
            smoking=random.random() < 0.5,
            drinking=random.random() < 0.65
        )


def generate_basic_info(gender: str, health_level: str) -> BasicInfo:
    age = random.randint(22, 62)
    if gender == "男":
        height = round(random.uniform(165, 185), 1)
        if health_level == "healthy":
            weight = round(random.uniform(60, 78), 1)
        elif health_level == "mild":
            weight = round(random.uniform(72, 88), 1)
        else:
            weight = round(random.uniform(82, 105), 1)
    else:
        height = round(random.uniform(153, 172), 1)
        if health_level == "healthy":
            weight = round(random.uniform(48, 62), 1)
        elif health_level == "mild":
            weight = round(random.uniform(58, 72), 1)
        else:
            weight = round(random.uniform(65, 90), 1)
    return BasicInfo(age=age, gender=gender, height=height, weight=weight)


def generate_employee(emp_idx: int):
    gender = random.choice(["男", "女"])
    name = generate_name(gender)
    employee_id = f"EMP{str(emp_idx).zfill(4)}"
    department = random.choice(DEPARTMENTS)

    r = random.random()
    if r < 0.45:
        health_level = "healthy"
    elif r < 0.8:
        health_level = "mild"
    else:
        health_level = "severe"

    employee_info[employee_id] = {
        "name": name,
        "department": department,
        "gender": gender
    }

    basic = generate_basic_info(gender, health_level)
    num_reports = random.randint(2, 4)
    today = datetime.now()

    for i in range(num_reports):
        days_back = (num_reports - 1 - i) * 180 + random.randint(-15, 15)
        report_date = today - timedelta(days=days_back)

        variation = 1.0 - (num_reports - 1 - i) * 0.05 if i > 0 else 1.0

        bi = BasicInfo(
            age=basic.age - (num_reports - 1 - i),
            gender=basic.gender,
            height=basic.height,
            weight=round(basic.weight * variation + random.uniform(-2, 2), 1)
        )

        if i == num_reports - 1:
            level = health_level
        else:
            rr = random.random()
            if rr < 0.6:
                level = health_level
            elif rr < 0.85:
                level = "healthy" if health_level != "severe" else "mild"
            else:
                level = "mild" if health_level == "healthy" else "severe"

        bm = generate_blood_metrics(level)
        ls = generate_lifestyle(level, bi.age)

        rd = ReportData(
            employee_id=employee_id,
            employee_name=name,
            department=department,
            basic_info=bi,
            blood_metrics=bm,
            lifestyle=ls
        )

        result = analyze_report(rd)
        result.report_date = report_date.strftime("%Y-%m-%d")

        for key in result.trends:
            for idx, tp in enumerate(result.trends[key]):
                d = report_date - timedelta(days=(5 - idx) * 60)
                result.trends[key][idx] = tp.model_copy(update={"date": d.strftime("%Y-%m-%d")})
            result.trends[key][-1] = result.trends[key][-1].model_copy(update={"date": report_date.strftime("%Y-%m-%d")})

        report_id = f"RPT{uuid.uuid4().hex[:8].upper()}"
        result.report_id = report_id

        reports_db[report_id] = {
            "report_data": rd,
            "analysis": result
        }
        if employee_id not in reports_by_employee:
            reports_by_employee[employee_id] = []
        reports_by_employee[employee_id].append(report_id)


def generate_mock_data():
    random.seed(42)
    for i in range(1, 51):
        generate_employee(i)


generate_mock_data()


@app.get("/")
def root():
    return {"message": "员工体检健康分析系统 API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "ok", "total_employees": len(employee_info), "total_reports": len(reports_db)}
