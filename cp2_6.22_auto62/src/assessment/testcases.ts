export interface FrontendTestCase {
  id: string
  name: string
  input: string
  expected: string
  category: string
}

export const ASSIGNMENT_ID = 'factorial-001'

export const TEST_CASES: FrontendTestCase[] = [
  {
    id: 'tc-1',
    name: 'Basic: factorial(5)',
    input: '5',
    expected: '120',
    category: 'basic',
  },
  {
    id: 'tc-2',
    name: 'Zero: factorial(0)',
    input: '0',
    expected: '1',
    category: 'edge',
  },
  {
    id: 'tc-3',
    name: 'One: factorial(1)',
    input: '1',
    expected: '1',
    category: 'edge',
  },
  {
    id: 'tc-4',
    name: 'Large: factorial(10)',
    input: '10',
    expected: '3628800',
    category: 'basic',
  },
  {
    id: 'tc-5',
    name: 'Negative: factorial(-1)',
    input: '-1',
    expected: 'Error: Input must be non-negative',
    category: 'error',
  },
  {
    id: 'tc-6',
    name: `String: factorial('abc')`,
    input: '"abc"',
    expected: 'Error: Input must be an integer',
    category: 'error',
  },
  {
    id: 'tc-7',
    name: 'Float: factorial(5.5)',
    input: '5.5',
    expected: 'Error: Input must be an integer',
    category: 'error',
  },
]
