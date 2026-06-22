export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
  avatar?: string;
}

export interface Player {
  userId: string;
  username: string;
  socketId: string;
  code: string;
  score: number;
  linesOfCode: number;
  testResults: TestResult[];
  lastCodeChange: number;
  lastEvaluated: number;
}

export interface Room {
  id: string;
  name: string;
  status: 'waiting' | 'playing' | 'finished';
  players: Player[];
  problem: Problem | null;
  startTime: number | null;
  endTime: number | null;
  maxTime: number;
  timerInterval: NodeJS.Timeout | null;
  evaluationInterval: NodeJS.Timeout | null;
}

export interface TestCase {
  input: any[];
  expected: any;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  functionName: string;
  testCases: TestCase[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface TestResult {
  passed: boolean;
  input: any[];
  expected: any;
  actual: any;
  executionTime: number;
  error?: string;
  errorLine?: number;
}

export interface FinalPlayerResult {
  userId: string;
  username: string;
  score: number;
  linesOfCode: number;
  testResults: TestResult[];
  rank: number;
}

export interface WebSocketMessage {
  type: 'join' | 'code_update' | 'score_update' | 'game_start' | 'game_end' | 'time_update' | 'player_joined' | 'player_left' | 'error' | 'joined';
  payload: any;
}

export const BUILT_IN_PROBLEMS: Problem[] = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.',
    functionName: 'twoSum',
    difficulty: 'easy',
    testCases: [
      {
        input: [[2, 7, 11, 15], 9],
        expected: [0, 1]
      },
      {
        input: [[3, 2, 4], 6],
        expected: [1, 2]
      },
      {
        input: [[3, 3], 6],
        expected: [0, 1]
      },
      {
        input: [[1, 2, 3, 4, 5], 9],
        expected: [3, 4]
      }
    ]
  },
  {
    id: 'reverse-string',
    title: 'Reverse String',
    description: 'Write a function that takes a string as input and returns the string reversed.',
    functionName: 'reverseString',
    difficulty: 'easy',
    testCases: [
      {
        input: ['hello'],
        expected: 'olleh'
      },
      {
        input: ['world'],
        expected: 'dlrow'
      },
      {
        input: ['a'],
        expected: 'a'
      },
      {
        input: [''],
        expected: ''
      }
    ]
  },
  {
    id: 'array-deduplication',
    title: 'Array Deduplication',
    description: 'Write a function that takes an array of numbers as input and returns a new array with all duplicate elements removed, preserving the original order.',
    functionName: 'deduplicate',
    difficulty: 'easy',
    testCases: [
      {
        input: [[1, 2, 2, 3, 3, 3]],
        expected: [1, 2, 3]
      },
      {
        input: [[1, 1, 1]],
        expected: [1]
      },
      {
        input: [[]],
        expected: []
      },
      {
        input: [[1, 2, 3]],
        expected: [1, 2, 3]
      }
    ]
  }
];
