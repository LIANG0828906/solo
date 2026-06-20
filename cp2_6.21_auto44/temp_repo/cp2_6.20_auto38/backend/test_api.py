import httpx
import json

base = "http://localhost:8000"

print("=== GET /api/assignments ===")
r = httpx.get(f"{base}/api/assignments")
print(f"Status: {r.status_code}, Count: {len(r.json())}")
for a in r.json():
    print(f"  - {a['id']}: {a['title']} ({a['language']}, {len(a['testCases'])} tests)")

print("\n=== GET /api/assignments/assign-005 ===")
r = httpx.get(f"{base}/api/assignments/assign-005")
d = r.json()
print(f"Status: {r.status_code}")
print(f"Title: {d['title']}")
print(f"Test cases: {len(d['testCases'])}")

print("\n=== POST /api/assignments/assign-001/evaluate ===")
code = """def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr

nums = list(map(int, input().split()))
print(bubble_sort(nums))
"""
r = httpx.post(f"{base}/api/assignments/assign-001/evaluate", json={
    "code": code, "language": "python", "assignmentId": "assign-001"
})
d = r.json()
print(f"Status: {r.status_code}")
print(f"Score: {d['score']}, Passed: {d['passedTests']}/{d['totalTests']}")
for t in d['testResults']:
    status = "PASS" if t['passed'] else "FAIL"
    print(f"  {t['testCaseName']}: {status} -> actual={t['actualOutput']!r} expected={t['expectedOutput']!r}")
print(f"Lint issues: {len(d['lintIssues'])}")
for li in d['lintIssues']:
    print(f"  L{li['line']}: [{li['severity']}] {li['message']} ({li['rule']})")

print("\n=== POST /api/assignments/assign-001/submit ===")
r = httpx.post(f"{base}/api/assignments/assign-001/submit", json={
    "code": code, "language": "python", "assignmentId": "assign-001"
})
print(f"Status: {r.status_code}")
print(json.dumps(r.json(), indent=2))
