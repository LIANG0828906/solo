from datetime import datetime, date
import uuid


def generate_mock_data():
    classes = [
        {"id": "class-001", "name": "高三(1)班", "studentCount": 45, "lastGradedDate": "2024-01-15"},
        {"id": "class-002", "name": "高三(2)班", "studentCount": 42, "lastGradedDate": "2024-01-14"},
        {"id": "class-003", "name": "高三(3)班", "studentCount": 48, "lastGradedDate": "2024-01-13"},
        {"id": "class-004", "name": "高二(1)班", "studentCount": 40, "lastGradedDate": "2024-01-12"},
        {"id": "class-005", "name": "高二(2)班", "studentCount": 43, "lastGradedDate": "2024-01-11"},
    ]

    essay_paragraphs = [
        "在当今这个科技飞速发展的时代，人们的生活方式发生了翻天覆地的变化。智能手机、互联网、人工智能等新技术不断涌现，深刻地改变着我们与世界的互动方式。然而，在拥抱科技带来便利的同时，我们也不应忽视人文精神的价值与意义。",
        "科技的发展为人类带来了前所未有的便利。以通信技术为例，从书信到电话，再到如今的即时通讯软件，信息传递的速度和效率得到了质的飞跃。远方的亲友可以通过视频通话面对面交流，地理距离不再是沟通的障碍。医疗领域的科技进步更是挽救了无数生命，先进的诊断设备和治疗手段让许多曾经的绝症变得可治。",
        "然而，科技的过度发展也带来了一些不容忽视的问题。人们越来越依赖电子设备，面对面的交流逐渐减少，人际关系变得淡漠。碎片化的阅读习惯削弱了人们深度思考的能力，算法推荐的信息茧房让人们视野变得狭隘。部分年轻人沉迷于虚拟世界，忽略了现实生活中真实的情感体验和人际交往。",
        "人文精神是人类文明的灵魂，它教导我们如何思考、如何审美、如何与他人和自然和谐相处。文学、艺术、哲学这些人文学科虽然不能直接转化为生产力，但它们塑造着我们的价值观和世界观，让我们在纷繁复杂的世界中保持清醒的头脑和独立的人格。一个没有人文精神滋养的社会，即使物质再丰富，也难以称得上是真正文明的社会。",
        "科技与人文并非对立的两极，而是相辅相成、缺一不可的关系。科技是工具，是推动社会进步的引擎；人文是方向，是确保科技服务于人类福祉的指南针。只有将二者有机结合，我们才能在享受科技便利的同时，不迷失人性的本真。",
        "综上所述，我们应该以开放的心态拥抱科技进步，同时保持对人文精神的敬畏与坚守。让科技的光芒照亮前行的道路，让人文的温暖滋润我们的心灵，这样才能创造一个更加美好、更加人性化的未来世界。",
    ]

    essays = []
    for i in range(1, 6):
        class_id = f"class-00{i}"
        for j in range(1, 4):
            essays.append({
                "id": f"essay-{i}-{j}",
                "classId": class_id,
                "studentName": f"学生{i}{j}",
                "title": "论科技与人文的关系",
                "content": "\n\n".join(essay_paragraphs),
                "uploadTime": datetime.utcnow().isoformat(),
            })

    comments = [
        {
            "id": f"comment-{uuid.uuid4().hex[:8]}",
            "essayId": "essay-1-1",
            "paragraphIndex": 0,
            "content": "开篇点题，引出话题自然流畅",
            "type": "positive",
            "presetType": "论点清晰",
            "createdAt": datetime.utcnow().isoformat(),
        },
        {
            "id": f"comment-{uuid.uuid4().hex[:8]}",
            "essayId": "essay-1-1",
            "paragraphIndex": 2,
            "content": "此处逻辑可以更清晰，建议增加过渡句",
            "type": "improvement",
            "presetType": None,
            "createdAt": datetime.utcnow().isoformat(),
        },
    ]

    preset_comments = [
        {"id": "p1", "content": "论点清晰", "type": "positive", "createdAt": datetime.utcnow().isoformat()},
        {"id": "p2", "content": "语言流畅", "type": "positive", "createdAt": datetime.utcnow().isoformat()},
        {"id": "p3", "content": "结构完整", "type": "positive", "createdAt": datetime.utcnow().isoformat()},
        {"id": "p4", "content": "富有创意", "type": "positive", "createdAt": datetime.utcnow().isoformat()},
        {"id": "p5", "content": "论据不足", "type": "improvement", "createdAt": datetime.utcnow().isoformat()},
        {"id": "p6", "content": "语法有误", "type": "improvement", "createdAt": datetime.utcnow().isoformat()},
        {"id": "p7", "content": "逻辑混乱", "type": "improvement", "createdAt": datetime.utcnow().isoformat()},
        {"id": "p8", "content": "字数不够", "type": "improvement", "createdAt": datetime.utcnow().isoformat()},
    ]

    scores = []
    for i in range(1, 6):
        for j in range(1, 4):
            import random
            scores.append({
                "id": f"score-{i}-{j}",
                "essayId": f"essay-{i}-{j}",
                "content": random.randint(6, 10),
                "language": random.randint(6, 10),
                "structure": random.randint(6, 10),
                "creativity": random.randint(5, 9),
                "gradedAt": datetime.utcnow().isoformat(),
            })

    return {
        "classes": classes,
        "essays": essays,
        "comments": comments,
        "preset_comments": preset_comments,
        "scores": scores,
    }
