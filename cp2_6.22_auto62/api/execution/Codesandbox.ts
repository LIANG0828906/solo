import type { TestCaseResult, CodeDiff, EvaluationSummary, EvaluationResult } from '../../shared/types.js';
import { runTests } from './TestRunner.js';
import { TEST_CASES, REFERENCE_SOLUTION } from './data.js';

export async function executeEvaluation(
  evaluationId: string,
  userCode: string,
  language: string
): Promise<EvaluationResult> {
  const testCaseResults = await runTestsWithDelay(userCode, TEST_CASES);
  const diff = generateDiff(userCode, REFERENCE_SOLUTION);
  const summary = buildSummary(testCaseResults);

  return {
    evaluationId,
    status: "completed",
    testCases: testCaseResults,
    summary,
    diff,
  };
}

async function runTestsWithDelay(
  userCode: string,
  testCases: typeof TEST_CASES
): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = [];

  for (const tc of testCases) {
    const singleResult = await runTests(userCode, [tc]);
    results.push(singleResult[0]);
    const delay = 50 + Math.random() * 150;
    await sleep(delay);
  }

  return results;
}

function buildSummary(testCases: TestCaseResult[]): EvaluationSummary {
  const passed = testCases.filter((tc) => tc.passed).length;
  const total = testCases.length;
  const executionTime = testCases.reduce((sum, tc) => sum + tc.executionTime, 0);
  const maxMemory = Math.floor(20 + Math.random() * 30);

  return {
    score: Math.round((passed / total) * 100),
    passed,
    total,
    executionTime: Math.round(executionTime * 100) / 100,
    maxMemory,
  };
}

function generateDiff(userCode: string, referenceCode: string): CodeDiff[] {
  const diffs: CodeDiff[] = [];
  const userLines = userCode.split("\n");
  const refLines = referenceCode.split("\n");
  const maxLen = Math.max(userLines.length, refLines.length);

  for (let i = 0; i < maxLen; i++) {
    const userLine = userLines[i];
    const refLine = refLines[i];

    if (userLine === undefined && refLine !== undefined) {
      diffs.push({
        lineNumber: i + 1,
        type: "removed",
        content: refLine,
        suggestion: "This line is missing from your solution",
      });
    } else if (userLine !== undefined && refLine === undefined) {
      diffs.push({
        lineNumber: i + 1,
        type: "added",
        content: userLine,
        suggestion: "This extra line is not in the reference solution",
      });
    } else if (userLine !== refLine) {
      diffs.push({
        lineNumber: i + 1,
        type: "modified",
        content: userLine,
        suggestion: getSuggestion(userLine, refLine),
      });
    }
  }

  return diffs;
}

function getSuggestion(userLine: string, refLine: string): string | undefined {
  const trimmedUser = userLine.trim();
  const trimmedRef = refLine.trim();

  if (trimmedUser.includes("while") && trimmedRef.includes("for")) {
    return "Consider using a for loop instead of a while loop for iteration";
  }
  if (trimmedUser.includes("==") && trimmedRef.includes("===")) {
    return "Use strict equality (===) instead of loose equality (==)";
  }
  if (trimmedUser.includes("var") && trimmedRef.includes("let")) {
    return "Use 'let' instead of 'var' for block scoping";
  }
  if (trimmedUser.includes("if") && !trimmedUser.includes("typeof") && trimmedRef.includes("typeof")) {
    return "Consider adding type checking with typeof";
  }
  return undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
