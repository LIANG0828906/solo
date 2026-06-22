import urllib.request
import json

base = "http://localhost:8001"

def api_get(path):
    r = urllib.request.urlopen(f"{base}{path}")
    return json.loads(r.read())

def api_post(path, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(f"{base}{path}", data=body, headers={"Content-Type": "application/json"})
    r = urllib.request.urlopen(req)
    return json.loads(r.read())

def api_put(path, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(f"{base}{path}", data=body, headers={"Content-Type": "application/json"}, method="PUT")
    r = urllib.request.urlopen(req)
    return json.loads(r.read())

def api_delete(path):
    req = urllib.request.Request(f"{base}{path}", method="DELETE")
    r = urllib.request.urlopen(req)
    return json.loads(r.read())

resumes = api_get("/api/resumes")
print(f"1. GET /api/resumes: {len(resumes)} resumes")
rid = resumes[0]["id"]
print(f"   Demo resume id: {rid}")

resume = api_get(f"/api/resumes/{rid}")
print(f"2. GET /api/resumes/{{id}}: {resume['title']}")

new_resume = api_post("/api/resumes", {"title": "测试简历", "template": "creative", "sections": {"personal": {"name": "李四"}}})
print(f"3. POST /api/resumes: {new_resume['title']}")

updated = api_put(f"/api/resumes/{new_resume['id']}", {"title": "更新后的简历"})
print(f"4. PUT /api/resumes/{{id}}: {updated['title']}")

session = api_post("/api/interview/generate", {"resumeId": rid, "difficulty": "beginner"})
print(f"5. POST /api/interview/generate: {len(session['questions'])} questions, difficulty={session['difficulty']}")

q = session["questions"][0]
sample_answer = "关于这个问题，我认为" + "，".join(q["keywords"][:3]) + "等要点非常重要，需要综合考虑各方面因素来给出完整的回答。"
result = api_post("/api/interview/answer", {
    "sessionId": session["id"],
    "questionId": q["id"],
    "answer": sample_answer,
    "timeSpent": 45.0
})
print(f"6. POST /api/interview/answer: score={result['score']}, keywordMatch={result['keywordMatch']}")

for q in session["questions"][1:]:
    answer = "关于这个问题，" + "，".join(q["keywords"][:2]) + "是关键要点，需要深入理解和实践。"
    api_post("/api/interview/answer", {
        "sessionId": session["id"],
        "questionId": q["id"],
        "answer": answer,
        "timeSpent": 30.0
    })

session_data = api_get(f"/api/interview/{session['id']}")
print(f"7. GET /api/interview/{{id}}: {len(session_data['questions'])} questions")

history = api_get("/api/interview/history")
print(f"8. GET /api/interview/history: {len(history)} sessions")

analysis = api_get(f"/api/analysis/{session['id']}")
print(f"9. GET /api/analysis/{{id}}: overallScore={analysis['overallScore']}, dimensions={list(analysis['dimensions'].keys())}")

del_result = api_delete(f"/api/resumes/{new_resume['id']}")
print(f"10. DELETE /api/resumes/{{id}}: {del_result['message']}")

print("\nAll API tests passed!")
