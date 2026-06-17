import { executeCode, type StepSnapshot } from '@/modules/codeEngine';

export function runExecution(code: string): StepSnapshot[] {
  return executeCode(code);
}
