from pydantic import BaseModel, Field
from typing import Optional


class TestCase(BaseModel):
    id: str
    name: str
    input: str
    expectedOutput: str


class Assignment(BaseModel):
    id: str
    title: str
    description: str
    deadline: str
    status: str = Field(pattern=r"^(not_started|in_progress|submitted)$")
    templateCode: str
    language: str = Field(pattern=r"^(python|javascript|java)$")
    testCases: list[TestCase]


class EvaluateRequest(BaseModel):
    code: str
    language: str
    assignmentId: str


class TestResult(BaseModel):
    testCaseId: str
    testCaseName: str
    passed: bool
    actualOutput: str
    expectedOutput: str
    error: Optional[str] = None


class LintIssue(BaseModel):
    line: int
    column: int
    severity: str = Field(pattern=r"^(warning|error)$")
    message: str
    rule: str


class EvaluationResult(BaseModel):
    id: str
    assignmentId: str
    score: float = Field(ge=0, le=100)
    totalTests: int
    passedTests: int
    testResults: list[TestResult]
    lintIssues: list[LintIssue]
    timestamp: str
