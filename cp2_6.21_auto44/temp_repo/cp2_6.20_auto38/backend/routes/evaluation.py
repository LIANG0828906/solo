import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from models.schemas import EvaluateRequest, EvaluationResult
from services.sandbox import run_test_cases
from services.linter import lint_code
from routes.assignments import ASSIGNMENTS

router = APIRouter(prefix="/api", tags=["evaluation"])


@router.post("/assignments/{assignment_id}/evaluate", response_model=EvaluationResult)
def evaluate_assignment(assignment_id: str, req: EvaluateRequest):
    assignment = None
    for a in ASSIGNMENTS:
        if a.id == assignment_id:
            assignment = a
            break
    if not assignment:
        raise HTTPException(status_code=404, detail=f"Assignment '{assignment_id}' not found")

    test_results = run_test_cases(req.code, req.language, assignment.testCases)
    lint_issues = lint_code(req.code, req.language)

    passed = sum(1 for r in test_results if r.passed)
    total = len(test_results)
    score = round((passed / total) * 100, 1) if total > 0 else 0.0

    lint_deduction = len([i for i in lint_issues if i.severity == "error"]) * 2
    score = max(0.0, score - lint_deduction)

    return EvaluationResult(
        id=str(uuid.uuid4()),
        assignmentId=assignment_id,
        score=score,
        totalTests=total,
        passedTests=passed,
        testResults=test_results,
        lintIssues=lint_issues,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.post("/assignments/{assignment_id}/submit")
def submit_assignment(assignment_id: str, req: EvaluateRequest):
    assignment = None
    for a in ASSIGNMENTS:
        if a.id == assignment_id:
            assignment = a
            break
    if not assignment:
        raise HTTPException(status_code=404, detail=f"Assignment '{assignment_id}' not found")

    test_results = run_test_cases(req.code, req.language, assignment.testCases)
    passed = sum(1 for r in test_results if r.passed)
    total = len(test_results)
    score = round((passed / total) * 100, 1) if total > 0 else 0.0

    for a in ASSIGNMENTS:
        if a.id == assignment_id:
            a.status = "submitted"
            break

    return {
        "success": True,
        "message": f"Assignment submitted successfully. Score: {score}% ({passed}/{total} tests passed)",
        "assignmentId": assignment_id,
        "score": score,
        "submittedAt": datetime.now(timezone.utc).isoformat(),
    }
