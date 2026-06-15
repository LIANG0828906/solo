import type { Assignment, Submission } from '../src/types.js';

export interface Store {
  assignments: Assignment[];
  submissions: Submission[];
}

const now = Date.now();

export const store: Store = {
  assignments: [
    {
      id: 'a1',
      title: '两数之和',
      description:
        '给定一个整数数组 nums 和一个整数目标值 target，请你在该数组中找出和为目标值 target 的那两个整数，并返回它们的数组下标。\n\n你可以假设每种输入只会对应一个答案，并且不能使用同一个元素两次。',
      sampleInput: 'nums = [2,7,11,15], target = 9',
      sampleOutput: '[0,1]',
      testCases: [
        { id: 't1', input: 'nums = [2,7,11,15], target = 9', expected: '[0,1]', hidden: false },
        { id: 't2', input: 'nums = [3,2,4], target = 6', expected: '[1,2]', hidden: false },
        { id: 't3', input: 'nums = [3,3], target = 6', expected: '[0,1]', hidden: false },
        { id: 't4', input: 'nums = [1], target = 1', expected: '[]', hidden: true },
        { id: 't5', input: 'nums = [-1,-2,-3,-4,-5], target = -8', expected: '[2,4]', hidden: true },
        { id: 't6', input: 'nums = [0,4,3,0], target = 0', expected: '[0,3]', hidden: true },
      ],
      createdAt: now - 86400000,
    },
  ],
  submissions: [
    {
      id: 's1',
      assignmentId: 'a1',
      studentId: 'stu1',
      studentName: '张三',
      language: 'python',
      code: `def two_sum(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []`,
      score: 100,
      results: [
        { caseId: 't1', passed: true, actual: '[0,1]', expected: '[0,1]', hidden: false },
        { caseId: 't2', passed: true, actual: '[1,2]', expected: '[1,2]', hidden: false },
        { caseId: 't3', passed: true, actual: '[0,1]', expected: '[0,1]', hidden: false },
        { caseId: 't4', passed: true, actual: '[]', expected: '[]', hidden: true },
        { caseId: 't5', passed: true, actual: '[2,4]', expected: '[2,4]', hidden: true },
        { caseId: 't6', passed: true, actual: '[0,3]', expected: '[0,3]', hidden: true },
      ],
      comments: [{ id: 'c1', author: 'teacher', content: '暴力解法正确，但时间复杂度O(n²)，建议使用哈希表优化到O(n)', createdAt: now - 3600000 }],
      submittedAt: now - 7200000,
    },
    {
      id: 's2',
      assignmentId: 'a1',
      studentId: 'stu2',
      studentName: '李四',
      language: 'python',
      code: `def two_sum(nums, target):
    lookup = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in lookup:
            return [lookup[complement], i]
        lookup[num] = i
    return []`,
      score: 83,
      results: [
        { caseId: 't1', passed: true, actual: '[0,1]', expected: '[0,1]', hidden: false },
        { caseId: 't2', passed: true, actual: '[1,2]', expected: '[1,2]', hidden: false },
        { caseId: 't3', passed: true, actual: '[0,1]', expected: '[0,1]', hidden: false },
        { caseId: 't4', passed: true, actual: '[]', expected: '[]', hidden: true },
        { caseId: 't5', passed: true, actual: '[2,4]', expected: '[2,4]', hidden: true },
        { caseId: 't6', passed: false, actual: '[0,3]\n', expected: '[0,3]', hidden: true },
      ],
      comments: [],
      submittedAt: now - 5400000,
    },
    {
      id: 's3',
      assignmentId: 'a1',
      studentId: 'stu3',
      studentName: '王五',
      language: 'javascript',
      code: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
      score: 67,
      results: [
        { caseId: 't1', passed: true, actual: '[0,1]', expected: '[0,1]', hidden: false },
        { caseId: 't2', passed: true, actual: '[1,2]', expected: '[1,2]', hidden: false },
        { caseId: 't3', passed: false, actual: '[0,1]', expected: '[0,1]', hidden: false },
        { caseId: 't4', passed: true, actual: '[]', expected: '[]', hidden: true },
        { caseId: 't5', passed: true, actual: '[2,4]', expected: '[2,4]', hidden: true },
        { caseId: 't6', passed: false, actual: '[0,3]', expected: '[0,3]', hidden: true },
      ],
      comments: [{ id: 'c2', author: 'teacher', content: 'JS版本基本逻辑正确，但t3和t6用例失败，注意检查输出格式', createdAt: now - 1800000 }],
      submittedAt: now - 3600000,
    },
    {
      id: 's4',
      assignmentId: 'a1',
      studentId: 'stu4',
      studentName: '赵六',
      language: 'python',
      code: `def two_sum(nums, target):
    return []`,
      score: 17,
      results: [
        { caseId: 't1', passed: false, actual: '[]', expected: '[0,1]', hidden: false },
        { caseId: 't2', passed: false, actual: '[]', expected: '[1,2]', hidden: false },
        { caseId: 't3', passed: false, actual: '[]', expected: '[0,1]', hidden: false },
        { caseId: 't4', passed: true, actual: '[]', expected: '[]', hidden: true },
        { caseId: 't5', passed: false, actual: '[]', expected: '[2,4]', hidden: true },
        { caseId: 't6', passed: false, actual: '[]', expected: '[0,3]', hidden: true },
      ],
      comments: [],
      submittedAt: now - 1800000,
    },
    {
      id: 's5',
      assignmentId: 'a1',
      studentId: 'stu5',
      studentName: '孙七',
      language: 'python',
      code: `def two_sum(nums, target):
    lookup = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in lookup:
            return [lookup[complement], i]
        lookup[num] = i
    return []`,
      score: 100,
      results: [
        { caseId: 't1', passed: true, actual: '[0,1]', expected: '[0,1]', hidden: false },
        { caseId: 't2', passed: true, actual: '[1,2]', expected: '[1,2]', hidden: false },
        { caseId: 't3', passed: true, actual: '[0,1]', expected: '[0,1]', hidden: false },
        { caseId: 't4', passed: true, actual: '[]', expected: '[]', hidden: true },
        { caseId: 't5', passed: true, actual: '[2,4]', expected: '[2,4]', hidden: true },
        { caseId: 't6', passed: true, actual: '[0,3]', expected: '[0,3]', hidden: true },
      ],
      comments: [],
      submittedAt: now - 900000,
    },
    {
      id: 's6',
      assignmentId: 'a1',
      studentId: 'stu6',
      studentName: '周八',
      language: 'javascript',
      code: `function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) return [i, j];
    }
  }
  return [];
}`,
      score: 83,
      results: [
        { caseId: 't1', passed: true, actual: '[0,1]', expected: '[0,1]', hidden: false },
        { caseId: 't2', passed: true, actual: '[1,2]', expected: '[1,2]', hidden: false },
        { caseId: 't3', passed: true, actual: '[0,1]', expected: '[0,1]', hidden: false },
        { caseId: 't4', passed: true, actual: '[]', expected: '[]', hidden: true },
        { caseId: 't5', passed: true, actual: '[2,4]', expected: '[2,4]', hidden: true },
        { caseId: 't6', passed: false, actual: '0,3', expected: '[0,3]', hidden: true },
      ],
      comments: [],
      submittedAt: now - 600000,
    },
    {
      id: 's7',
      assignmentId: 'a1',
      studentId: 'stu7',
      studentName: '吴九',
      language: 'python',
      code: `def two_sum(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []`,
      score: 100,
      results: [
        { caseId: 't1', passed: true, actual: '[0,1]', expected: '[0,1]', hidden: false },
        { caseId: 't2', passed: true, actual: '[1,2]', expected: '[1,2]', hidden: false },
        { caseId: 't3', passed: true, actual: '[0,1]', expected: '[0,1]', hidden: false },
        { caseId: 't4', passed: true, actual: '[]', expected: '[]', hidden: true },
        { caseId: 't5', passed: true, actual: '[2,4]', expected: '[2,4]', hidden: true },
        { caseId: 't6', passed: true, actual: '[0,3]', expected: '[0,3]', hidden: true },
      ],
      comments: [],
      submittedAt: now - 300000,
    },
    {
      id: 's8',
      assignmentId: 'a1',
      studentId: 'stu8',
      studentName: '郑十',
      language: 'python',
      code: `def two_sum(nums, target):
    for i in range(len(nums)):
        for j in range(i+1, len(nums)):
            if nums[i]+nums[j]==target:
                return [i,j]
    return []`,
      score: 50,
      results: [
        { caseId: 't1', passed: true, actual: '[0,1]', expected: '[0,1]', hidden: false },
        { caseId: 't2', passed: true, actual: '[1,2]', expected: '[1,2]', hidden: false },
        { caseId: 't3', passed: true, actual: '[0,1]', expected: '[0,1]', hidden: false },
        { caseId: 't4', passed: false, actual: '[]', expected: '[]', hidden: true },
        { caseId: 't5', passed: false, actual: '[2,4]', expected: '[2,4]', hidden: true },
        { caseId: 't6', passed: false, actual: '[0,3]', expected: '[0,3]', hidden: true },
      ],
      comments: [],
      submittedAt: now - 120000,
    },
    {
      id: 's9',
      assignmentId: 'a1',
      studentId: 'stu9',
      studentName: '陈一一',
      language: 'python',
      code: `def two_sum(nums, target):
    d = {}
    for i, n in enumerate(nums):
        if target - n in d:
            return [d[target-n], i]
        d[n] = i
    return []`,
      score: 100,
      results: [
        { caseId: 't1', passed: true, actual: '[0,1]', expected: '[0,1]', hidden: false },
        { caseId: 't2', passed: true, actual: '[1,2]', expected: '[1,2]', hidden: false },
        { caseId: 't3', passed: true, actual: '[0,1]', expected: '[0,1]', hidden: false },
        { caseId: 't4', passed: true, actual: '[]', expected: '[]', hidden: true },
        { caseId: 't5', passed: true, actual: '[2,4]', expected: '[2,4]', hidden: true },
        { caseId: 't6', passed: true, actual: '[0,3]', expected: '[0,3]', hidden: true },
      ],
      comments: [],
      submittedAt: now - 60000,
    },
    {
      id: 's10',
      assignmentId: 'a1',
      studentId: 'stu10',
      studentName: '林二二',
      language: 'javascript',
      code: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const comp = target - nums[i];
    if (map.has(comp)) return [map.get(comp), i];
    map.set(nums[i], i);
  }
  return [];
}`,
      score: 83,
      results: [
        { caseId: 't1', passed: true, actual: '[0,1]', expected: '[0,1]', hidden: false },
        { caseId: 't2', passed: true, actual: '[1,2]', expected: '[1,2]', hidden: false },
        { caseId: 't3', passed: true, actual: '[0,1]', expected: '[0,1]', hidden: false },
        { caseId: 't4', passed: true, actual: '[]', expected: '[]', hidden: true },
        { caseId: 't5', passed: true, actual: '[2,4]', expected: '[2,4]', hidden: true },
        { caseId: 't6', passed: false, actual: '[0,3]\n', expected: '[0,3]', hidden: true },
      ],
      comments: [],
      submittedAt: now - 30000,
    },
    {
      id: 's11',
      assignmentId: 'a1',
      studentId: 'stu11',
      studentName: '黄三三',
      language: 'python',
      code: `def two_sum(nums, target):
    return [0, 1]`,
      score: 33,
      results: [
        { caseId: 't1', passed: true, actual: '[0,1]', expected: '[0,1]', hidden: false },
        { caseId: 't2', passed: false, actual: '[0,1]', expected: '[1,2]', hidden: false },
        { caseId: 't3', passed: false, actual: '[0,1]', expected: '[0,1]', hidden: false },
        { caseId: 't4', passed: false, actual: '[0,1]', expected: '[]', hidden: true },
        { caseId: 't5', passed: false, actual: '[0,1]', expected: '[2,4]', hidden: true },
        { caseId: 't6', passed: false, actual: '[0,1]', expected: '[0,3]', hidden: true },
      ],
      comments: [],
      submittedAt: now - 10000,
    },
  ],
};

let nextId = 100;
export function genId(prefix: string): string {
  return `${prefix}${++nextId}`;
}
