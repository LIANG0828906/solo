objectives_db: dict[str, dict] = {}
milestones_db: dict[str, dict] = {}
users_db: dict[str, dict] = {}


def init_db():
    objectives_db["obj-1"] = {"id": "obj-1", "name": "实现年度营收增长30%", "level": "company", "parentId": None, "progress": 45, "keyResults": [
        {"id": "kr-1", "name": "Q1营收达到2500万", "targetValue": 25000000, "currentValue": 11000000, "weight": 40, "objectiveId": "obj-1"},
        {"id": "kr-2", "name": "新签客户数达到200家", "targetValue": 200, "currentValue": 85, "weight": 35, "objectiveId": "obj-1"},
        {"id": "kr-3", "name": "客户续约率达到90%", "targetValue": 90, "currentValue": 82, "weight": 25, "objectiveId": "obj-1"},
    ]}
    objectives_db["obj-2"] = {"id": "obj-2", "name": "提升产品用户体验评分至90分", "level": "company", "parentId": None, "progress": 60, "keyResults": [
        {"id": "kr-4", "name": "NPS评分提升至70", "targetValue": 70, "currentValue": 58, "weight": 50, "objectiveId": "obj-2"},
        {"id": "kr-5", "name": "用户满意度调查达90分", "targetValue": 90, "currentValue": 78, "weight": 50, "objectiveId": "obj-2"},
    ]}
    objectives_db["obj-3"] = {"id": "obj-3", "name": "打造行业领先的技术团队", "level": "company", "parentId": None, "progress": 35, "keyResults": [
        {"id": "kr-6", "name": "核心岗位到岗率达95%", "targetValue": 95, "currentValue": 78, "weight": 40, "objectiveId": "obj-3"},
        {"id": "kr-7", "name": "团队满意度达85分", "targetValue": 85, "currentValue": 72, "weight": 30, "objectiveId": "obj-3"},
        {"id": "kr-8", "name": "技术分享会每月4场", "targetValue": 4, "currentValue": 2, "weight": 30, "objectiveId": "obj-3"},
    ]}
    objectives_db["obj-4"] = {"id": "obj-4", "name": "技术指标达标", "level": "department", "parentId": "obj-3", "progress": 40, "keyResults": [
        {"id": "kr-9", "name": "系统可用性达99.9%", "targetValue": 99.9, "currentValue": 99.5, "weight": 50, "objectiveId": "obj-4"},
        {"id": "kr-10", "name": "API响应时间低于200ms", "targetValue": 200, "currentValue": 280, "weight": 50, "objectiveId": "obj-4"},
    ]}
    objectives_db["obj-5"] = {"id": "obj-5", "name": "市场推广目标达成", "level": "department", "parentId": "obj-1", "progress": 50, "keyResults": [
        {"id": "kr-11", "name": "品牌曝光量达500万次", "targetValue": 5000000, "currentValue": 3200000, "weight": 60, "objectiveId": "obj-5"},
        {"id": "kr-12", "name": "获客成本降低至150元", "targetValue": 150, "currentValue": 185, "weight": 40, "objectiveId": "obj-5"},
    ]}
    objectives_db["obj-6"] = {"id": "obj-6", "name": "产品设计优化", "level": "department", "parentId": "obj-2", "progress": 55, "keyResults": [
        {"id": "kr-13", "name": "完成3次用户调研", "targetValue": 3, "currentValue": 2, "weight": 40, "objectiveId": "obj-6"},
        {"id": "kr-14", "name": "核心流程转化率提升20%", "targetValue": 20, "currentValue": 12, "weight": 60, "objectiveId": "obj-6"},
    ]}
    objectives_db["obj-7"] = {"id": "obj-7", "name": "销售团队扩张与培训", "level": "department", "parentId": "obj-1", "progress": 30, "keyResults": [
        {"id": "kr-15", "name": "新增销售人员20人", "targetValue": 20, "currentValue": 8, "weight": 50, "objectiveId": "obj-7"},
        {"id": "kr-16", "name": "完成4轮销售技能培训", "targetValue": 4, "currentValue": 1, "weight": 50, "objectiveId": "obj-7"},
    ]}
    objectives_db["obj-8"] = {"id": "obj-8", "name": "提升代码覆盖率", "level": "individual", "parentId": "obj-4", "progress": 25, "keyResults": [
        {"id": "kr-17", "name": "单元测试覆盖率达到80%", "targetValue": 80, "currentValue": 45, "weight": 60, "objectiveId": "obj-8"},
        {"id": "kr-18", "name": "集成测试覆盖率达到70%", "targetValue": 70, "currentValue": 30, "weight": 40, "objectiveId": "obj-8"},
    ]}
    objectives_db["obj-9"] = {"id": "obj-9", "name": "前端性能优化", "level": "individual", "parentId": "obj-4", "progress": 60, "keyResults": [
        {"id": "kr-19", "name": "首屏加载时间低于2秒", "targetValue": 2, "currentValue": 2.8, "weight": 50, "objectiveId": "obj-9"},
        {"id": "kr-20", "name": "Lighthouse评分达到90", "targetValue": 90, "currentValue": 75, "weight": 50, "objectiveId": "obj-9"},
    ]}
    objectives_db["obj-10"] = {"id": "obj-10", "name": "社交媒体运营", "level": "individual", "parentId": "obj-5", "progress": 65, "keyResults": [
        {"id": "kr-21", "name": "公众号粉丝增长5万", "targetValue": 50000, "currentValue": 35000, "weight": 50, "objectiveId": "obj-10"},
        {"id": "kr-22", "name": "月均互动率达8%", "targetValue": 8, "currentValue": 6.5, "weight": 50, "objectiveId": "obj-10"},
    ]}
    objectives_db["obj-11"] = {"id": "obj-11", "name": "UI设计改版", "level": "individual", "parentId": "obj-6", "progress": 70, "keyResults": [
        {"id": "kr-23", "name": "完成5个核心页面改版", "targetValue": 5, "currentValue": 4, "weight": 60, "objectiveId": "obj-11"},
        {"id": "kr-24", "name": "设计系统组件库扩展至50个", "targetValue": 50, "currentValue": 38, "weight": 40, "objectiveId": "obj-11"},
    ]}
    objectives_db["obj-12"] = {"id": "obj-12", "name": "客户成功体系建设", "level": "individual", "parentId": "obj-1", "progress": 40, "keyResults": [
        {"id": "kr-25", "name": "建立客户健康度评分体系", "targetValue": 1, "currentValue": 1, "weight": 40, "objectiveId": "obj-12"},
        {"id": "kr-26", "name": "客户问题响应时间低于4小时", "targetValue": 4, "currentValue": 6, "weight": 60, "objectiveId": "obj-12"},
    ]}

    milestones_db["ms-1"] = {"id": "ms-1", "name": "Q1营收目标达成", "startMonth": 1, "endMonth": 3, "progress": 75}
    milestones_db["ms-2"] = {"id": "ms-2", "name": "产品V2.0发布", "startMonth": 2, "endMonth": 5, "progress": 60}
    milestones_db["ms-3"] = {"id": "ms-3", "name": "技术架构升级完成", "startMonth": 3, "endMonth": 6, "progress": 40}
    milestones_db["ms-4"] = {"id": "ms-4", "name": "市场推广第一阶段", "startMonth": 1, "endMonth": 4, "progress": 85}
    milestones_db["ms-5"] = {"id": "ms-5", "name": "团队扩张计划完成", "startMonth": 2, "endMonth": 7, "progress": 30}
    milestones_db["ms-6"] = {"id": "ms-6", "name": "Q2营收目标达成", "startMonth": 4, "endMonth": 6, "progress": 50}
    milestones_db["ms-7"] = {"id": "ms-7", "name": "用户体验优化上线", "startMonth": 5, "endMonth": 8, "progress": 20}
    milestones_db["ms-8"] = {"id": "ms-8", "name": "安全合规审计通过", "startMonth": 6, "endMonth": 9, "progress": 10}
    milestones_db["ms-9"] = {"id": "ms-9", "name": "Q3营收目标达成", "startMonth": 7, "endMonth": 9, "progress": 0}
    milestones_db["ms-10"] = {"id": "ms-10", "name": "年度产品路线图完成", "startMonth": 1, "endMonth": 12, "progress": 55}

    users_db["user-1"] = {"id": "user-1", "name": "张三"}
    users_db["user-2"] = {"id": "user-2", "name": "李四"}
    users_db["user-3"] = {"id": "user-3", "name": "王五"}
