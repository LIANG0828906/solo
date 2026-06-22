import type { TestCase } from '../../shared/types.js';

export const ASSIGNMENT_ID = "factorial-001";

export const REFERENCE_SOLUTION = `function factorial(n) {
  if (typeof n !== "number" || !Number.isInteger(n)) {
    throw new Error("Input must be an integer");
  }
  if (n < 0) {
    throw new Error("Input must be non-negative");
  }
  if (n === 0 || n === 1) {
    return 1;
  }
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}`;

export const TEST_CASES: TestCase[] = [
  {
    id: "tc-1",
    name: "Basic: factorial(5)",
    input: "5",
    expected: "120",
    category: "basic",
    code: "factorial(5)",
  },
  {
    id: "tc-2",
    name: "Zero: factorial(0)",
    input: "0",
    expected: "1",
    category: "edge",
    code: "factorial(0)",
  },
  {
    id: "tc-3",
    name: "One: factorial(1)",
    input: "1",
    expected: "1",
    category: "edge",
    code: "factorial(1)",
  },
  {
    id: "tc-4",
    name: "Large: factorial(10)",
    input: "10",
    expected: "3628800",
    category: "basic",
    code: "factorial(10)",
  },
  {
    id: "tc-5",
    name: "Negative: factorial(-1)",
    input: "-1",
    expected: "Error: Input must be non-negative",
    category: "error",
    code: "factorial(-1)",
  },
  {
    id: "tc-6",
    name: "String: factorial('abc')",
    input: '"abc"',
    expected: "Error: Input must be an integer",
    category: "error",
    code: 'factorial("abc")',
  },
  {
    id: "tc-7",
    name: "Float: factorial(5.5)",
    input: "5.5",
    expected: "Error: Input must be an integer",
    category: "error",
    code: "factorial(5.5)",
  },
];
