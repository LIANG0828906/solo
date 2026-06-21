import type { TestCaseResult } from '../types';

export function mockJudgeLocal(
  code: string,
  testCases: { input: string; expectedOutput: string }[]
): Promise<TestCaseResult[]> {
  // 实际评测通过后端 API 进行
  return Promise.resolve([]);
}
