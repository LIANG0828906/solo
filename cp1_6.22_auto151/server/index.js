import { v4 as uuidv4 } from 'uuid';
import express from 'express';
import cors from 'cors';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { runInSandbox, judgeSubmission } = require('./judge.js');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const problems = [
  {
    id: 'sum-of-two',
    title: '两数之和',
    difficulty: 'easy',
    passRate: 85.2,
    description: '给定一个整数数组 nums 和一个整数目标值 target，请你在该数组中找出和为 target 的那两个整数，并返回它们的数组下标。',
    examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' }],
    starterCode: 'function twoSum(nums, target) {\n  // TODO: 实现代码\n  return [];\n}\n',
    testCases: [
      { input: JSON.stringify({ nums: [2,7,11,15], target: 9 }), expectedOutput: '[0,1]' },
      { input: JSON.stringify({ nums: [3,2,4], target: 6 }), expectedOutput: '[1,2]' },
      { input: JSON.stringify({ nums: [3,3], target: 6 }), expectedOutput: '[0,1]' },
      { input: JSON.stringify({ nums: [1,5,3,7], target: 8 }), expectedOutput: '[1,2]' },
      { input: JSON.stringify({ nums: [10,20,30,40], target: 50 }), expectedOutput: '[0,3]' },
    ]
  },
  {
    id: 'reverse-string',
    title: '反转字符串',
    difficulty: 'easy',
    passRate: 92.5,
    description: '编写一个函数，其作用是将输入的字符串反转过来。',
    examples: [{ input: '"hello"', output: '"olleh"' }],
    starterCode: 'function reverseString(s) {\n  // TODO: 实现代码\n  return s;\n}\n',
    testCases: [
      { input: JSON.stringify({ s: 'hello' }), expectedOutput: 'olleh' },
      { input: JSON.stringify({ s: 'abcde' }), expectedOutput: 'edcba' },
      { input: JSON.stringify({ s: 'a' }), expectedOutput: 'a' },
      { input: JSON.stringify({ s: '' }), expectedOutput: '' },
      { input: JSON.stringify({ s: 'racecar' }), expectedOutput: 'racecar' },
    ]
  },
  {
    id: 'valid-parentheses',
    title: '有效的括号',
    difficulty: 'medium',
    passRate: 62.3,
    description: '给定一个只包括 \'(\', \')\', \'{\', \'}\', \'[\', \']\' 的字符串，判断字符串是否有效。',
    examples: [{ input: '"()[]{}"', output: 'true' }],
    starterCode: 'function isValid(s) {\n  // TODO: 实现代码\n  return true;\n}\n',
    testCases: [
      { input: JSON.stringify({ s: '()[]{}' }), expectedOutput: 'true' },
      { input: JSON.stringify({ s: '(]' }), expectedOutput: 'false' },
      { input: JSON.stringify({ s: '([)]' }), expectedOutput: 'false' },
      { input: JSON.stringify({ s: '{[]}' }), expectedOutput: 'true' },
      { input: JSON.stringify({ s: '' }), expectedOutput: 'true' },
    ]
  }
];

const submissions = new Map();

const problemToFunction = {
  'sum-of-two': 'twoSum',
  'reverse-string': 'reverseString',
  'valid-parentheses': 'isValid'
};

app.get('/api/problems', (req, res) => {
  try {
    const list = problems.map(p => ({
      id: p.id,
      title: p.title,
      difficulty: p.difficulty,
      passRate: p.passRate
    }));
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/problems/:id', (req, res) => {
  try {
    const problem = problems.find(p => p.id === req.params.id);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    res.json(problem);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/run', async (req, res) => {
  try {
    const { code, stdin } = req.body;
    const result = await runInSandbox(code, stdin);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/submit', async (req, res) => {
  try {
    const { problemId, code } = req.body;
    const problem = problems.find(p => p.id === problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const funcName = problemToFunction[problemId];
    const fullCode = code + `\nif (typeof ${funcName} === 'function') { const __args__ = typeof __input__ !== 'undefined' ? __input__ : null; }\n`;

    const results = [];
    for (const tc of problem.testCases) {
      const inputObj = JSON.parse(tc.input);
      let callCode = code + '\n';
      if (funcName === 'twoSum') {
        callCode += `console.log(JSON.stringify(${funcName}(${JSON.stringify(inputObj.nums)}, ${JSON.stringify(inputObj.target)})));`;
      } else if (funcName === 'reverseString' || funcName === 'isValid') {
        callCode += `console.log(JSON.stringify(${funcName}(${JSON.stringify(inputObj.s)})));`;
      }

      const runResult = await runInSandbox(callCode, undefined);
      const actualOutput = runResult.stdout.trim();
      const passed = actualOutput === tc.expectedOutput;
      results.push({
        passed,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput,
        stderr: runResult.stderr || undefined
      });
    }

    const total = results.length;
    const passedCount = results.filter(r => r.passed).length;
    const submissionId = uuidv4();
    const timestamp = Date.now();

    const record = {
      id: submissionId,
      problemId,
      code,
      passed: passedCount === total,
      passedCount,
      total,
      results,
      timestamp
    };

    if (!submissions.has(problemId)) {
      submissions.set(problemId, []);
    }
    submissions.get(problemId).unshift(record);

    res.json({
      total,
      passedCount,
      results,
      submissionId,
      timestamp
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/submissions/:problemId', (req, res) => {
  try {
    const list = submissions.get(req.params.problemId) || [];
    res.json([...list].sort((a, b) => b.timestamp - a.timestamp));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
