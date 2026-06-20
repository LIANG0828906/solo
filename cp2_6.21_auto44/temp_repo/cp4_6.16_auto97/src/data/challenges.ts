import type { Challenge } from '@/types';

export const challenges: Challenge[] = [
  {
    id: 'two-sum',
    title: '两数之和',
    description: `## 两数之和

给定一个整数数组 \`nums\` 和一个整数目标值 \`target\`，请你在该数组中找出和为目标值 \`target\` 的那两个整数，并返回它们的数组下标。

你可以假设每种输入只会对应一个答案，并且不能使用同一个元素两次。

### 示例

**输入：** \`nums = [2,7,11,15], target = 9\`
**输出：** \`[0,1]\`
**解释：** 因为 nums[0] + nums[1] == 9 ，返回 [0, 1] 。`,
    difficulty: 'easy',
    tags: ['数组', '哈希表'],
    passRate: 0.78,
    functionName: 'twoSum',
    initialCodeJS: `function twoSum(nums, target) {
  // 在此编写你的代码
  // 返回两个数的下标数组
}`,
    initialCodePY: `def two_sum(nums, target):
    # 在此编写你的代码
    # 返回两个数的下标列表
    pass`,
    testCases: [
      { input: '[2,7,11,15], 9', expectedOutput: '[0,1]' },
      { input: '[3,2,4], 6', expectedOutput: '[1,2]' },
      { input: '[3,3], 6', expectedOutput: '[0,1]' },
      { input: '[1,5,3,7], 8', expectedOutput: '[1,2]' },
      { input: '[10,20,30,40], 50', expectedOutput: '[1,2]' },
      { input: '[-1,-2,-3,-4,-5], -8', expectedOutput: '[2,4]' },
      { input: '[0,4,3,0], 0', expectedOutput: '[0,3]' },
    ],
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: '因为 nums[0] + nums[1] == 9，返回 [0, 1]' },
    ],
  },
  {
    id: 'palindrome',
    title: '回文数判断',
    description: `## 回文数判断

给你一个整数 \`x\`，如果 \`x\` 是一个回文整数，返回 \`true\`；否则返回 \`false\`。

回文数是指正序和倒序读都一样的整数。

### 示例

**输入：** \`121\`
**输出：** \`true\`

**输入：** \`-121\`
**输出：** \`false\``,
    difficulty: 'easy',
    tags: ['数学', '字符串'],
    passRate: 0.85,
    functionName: 'isPalindrome',
    initialCodeJS: `function isPalindrome(x) {
  // 在此编写你的代码
  // 返回 boolean
}`,
    initialCodePY: `def is_palindrome(x):
    # 在此编写你的代码
    # 返回 bool
    pass`,
    testCases: [
      { input: '121', expectedOutput: 'true' },
      { input: '-121', expectedOutput: 'false' },
      { input: '10', expectedOutput: 'false' },
      { input: '0', expectedOutput: 'true' },
      { input: '12321', expectedOutput: 'true' },
      { input: '123421', expectedOutput: 'false' },
      { input: '11', expectedOutput: 'true' },
    ],
    examples: [
      { input: '121', output: 'true' },
      { input: '-121', output: 'false', explanation: '从左向右读为 -121，从右向左读为 121-' },
    ],
  },
  {
    id: 'fizzbuzz',
    title: 'FizzBuzz',
    description: `## FizzBuzz

写一个程序，输出从 1 到 \`n\` 的字符串表示。

1. 如果 \`n\` 是 3 的倍数，输出 "Fizz"
2. 如果 \`n\` 是 5 的倍数，输出 "Buzz"
3. 如果 \`n\` 同时是 3 和 5 的倍数，输出 "FizzBuzz"
4. 其他情况输出数字本身的字符串形式

### 示例

**输入：** \`5\`
**输出：** \`["1","2","Fizz","4","Buzz"]\``,
    difficulty: 'easy',
    tags: ['数学', '字符串', '模拟'],
    passRate: 0.92,
    functionName: 'fizzBuzz',
    initialCodeJS: `function fizzBuzz(n) {
  // 在此编写你的代码
  // 返回字符串数组
}`,
    initialCodePY: `def fizz_buzz(n):
    # 在此编写你的代码
    # 返回字符串列表
    pass`,
    testCases: [
      { input: '3', expectedOutput: '["1","2","Fizz"]' },
      { input: '5', expectedOutput: '["1","2","Fizz","4","Buzz"]' },
      { input: '15', expectedOutput: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]' },
      { input: '1', expectedOutput: '["1"]' },
      { input: '30', expectedOutput: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz","16","17","Fizz","19","Buzz","Fizz","22","23","Fizz","Buzz","26","Fizz","28","29","FizzBuzz"]' },
    ],
    examples: [
      { input: '5', output: '["1","2","Fizz","4","Buzz"]' },
    ],
  },
  {
    id: 'reverse-string',
    title: '反转字符串',
    description: `## 反转字符串

编写一个函数，其作用是将输入的字符串反转过来。输入字符串以字符数组 \`s\` 的形式给出。

你必须原地修改输入数组，并返回反转后的数组。

### 示例

**输入：** \`["h","e","l","l","o"]\`
**输出：** \`["o","l","l","e","h"]\``,
    difficulty: 'medium',
    tags: ['字符串', '双指针'],
    passRate: 0.88,
    functionName: 'reverseString',
    initialCodeJS: `function reverseString(s) {
  // 在此编写你的代码
  // 原地修改数组，并返回反转后的数组
}`,
    initialCodePY: `def reverse_string(s):
    # 在此编写你的代码
    # 原地修改列表，并返回反转后的列表
    pass`,
    testCases: [
      { input: '["h","e","l","l","o"]', expectedOutput: '["o","l","l","e","h"]' },
      { input: '["H","a","n","n","a","h"]', expectedOutput: '["h","a","n","n","a","H"]' },
      { input: '["a","b","c"]', expectedOutput: '["c","b","a"]' },
      { input: '["x"]', expectedOutput: '["x"]' },
      { input: '["1","2","3","4","5"]', expectedOutput: '["5","4","3","2","1"]' },
      { input: '["A","B"]', expectedOutput: '["B","A"]' },
      { input: '["!","@","#"]', expectedOutput: '["#","@","!"]' },
    ],
    examples: [
      { input: '["h","e","l","l","o"]', output: '["o","l","l","e","h"]' },
    ],
  },
  {
    id: 'fibonacci',
    title: '斐波那契数列',
    description: `## 斐波那契数列

斐波那契数列由 \`F(0) = 0, F(1) = 1\` 开始，之后的每一项都是前两项之和。

给你一个整数 \`n\`，请计算 \`F(n)\`。

### 示例

**输入：** \`4\`
**输出：** \`3\`
**解释：** F(4) = F(3) + F(2) = 2 + 1 = 3`,
    difficulty: 'medium',
    tags: ['数学', '动态规划', '递归'],
    passRate: 0.72,
    functionName: 'fib',
    initialCodeJS: `function fib(n) {
  // 在此编写你的代码
  // 返回第 n 个斐波那契数
}`,
    initialCodePY: `def fib(n):
    # 在此编写你的代码
    # 返回第 n 个斐波那契数
    pass`,
    testCases: [
      { input: '0', expectedOutput: '0' },
      { input: '1', expectedOutput: '1' },
      { input: '2', expectedOutput: '1' },
      { input: '4', expectedOutput: '3' },
      { input: '10', expectedOutput: '55' },
      { input: '20', expectedOutput: '6765' },
      { input: '30', expectedOutput: '832040' },
    ],
    examples: [
      { input: '4', output: '3', explanation: 'F(4) = F(3) + F(2) = 2 + 1 = 3' },
    ],
  },
  {
    id: 'valid-parentheses',
    title: '有效的括号',
    description: `## 有效的括号

给定一个只包括 \`(\`，\`)\`，\`{\`，\`}\`，\`[\`，\`]\` 的字符串 \`s\`，判断字符串是否有效。

有效字符串需满足：
1. 左括号必须用相同类型的右括号闭合
2. 左括号必须以正确的顺序闭合
3. 每个右括号都有一个对应的相同类型的左括号

### 示例

**输入：** \`"()"\`
**输出：** \`true\`

**输入：** \`"()[]{}"\`
**输出：** \`true\``,
    difficulty: 'medium',
    tags: ['栈', '字符串'],
    passRate: 0.65,
    functionName: 'isValid',
    initialCodeJS: `function isValid(s) {
  // 在此编写你的代码
  // 返回 boolean
}`,
    initialCodePY: `def is_valid(s):
    # 在此编写你的代码
    # 返回 bool
    pass`,
    testCases: [
      { input: '"()"', expectedOutput: 'true' },
      { input: '"()[]{}"', expectedOutput: 'true' },
      { input: '"(]"', expectedOutput: 'false' },
      { input: '"([)]"', expectedOutput: 'false' },
      { input: '"{[]}"', expectedOutput: 'true' },
      { input: '""', expectedOutput: 'true' },
      { input: '"([{}])"', expectedOutput: 'true' },
    ],
    examples: [
      { input: '"()"', output: 'true' },
      { input: '"(]"', output: 'false' },
    ],
  },
  {
    id: 'max-subarray',
    title: '最大子数组和',
    description: `## 最大子数组和

给你一个整数数组 \`nums\`，请你找出一个具有最大和的连续子数组（子数组最少包含一个元素），返回其最大和。

### 示例

**输入：** \`[-2,1,-3,4,-1,2,1,-5,4]\`
**输出：** \`6\`
**解释：** 连续子数组 [4,-1,2,1] 的和最大，为 6。`,
    difficulty: 'medium',
    tags: ['数组', '动态规划', '分治'],
    passRate: 0.55,
    functionName: 'maxSubArray',
    initialCodeJS: `function maxSubArray(nums) {
  // 在此编写你的代码
  // 返回最大子数组和
}`,
    initialCodePY: `def max_sub_array(nums):
    # 在此编写你的代码
    # 返回最大子数组和
    pass`,
    testCases: [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6' },
      { input: '[1]', expectedOutput: '1' },
      { input: '[5,4,-1,7,8]', expectedOutput: '23' },
      { input: '[-1]', expectedOutput: '-1' },
      { input: '[-2,-1]', expectedOutput: '-1' },
      { input: '[1,2,3,4,5]', expectedOutput: '15' },
      { input: '[-2,0,-1]', expectedOutput: '0' },
    ],
    examples: [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: '连续子数组 [4,-1,2,1] 的和最大，为 6' },
    ],
  },
  {
    id: 'merge-sorted',
    title: '合并两个有序数组',
    description: `## 合并两个有序数组

给你两个按非递减顺序排列的整数数组 \`nums1\` 和 \`nums2\`，请你合并这两个数组，返回一个按非递减顺序排列的新数组。

### 示例

**输入：** \`[1,2,3], [2,5,6]\`
**输出：** \`[1,2,2,3,5,6]\``,
    difficulty: 'medium',
    tags: ['数组', '双指针', '排序'],
    passRate: 0.70,
    functionName: 'mergeSorted',
    initialCodeJS: `function mergeSorted(nums1, nums2) {
  // 在此编写你的代码
  // 返回合并后的有序数组
}`,
    initialCodePY: `def merge_sorted(nums1, nums2):
    # 在此编写你的代码
    # 返回合并后的有序列表
    pass`,
    testCases: [
      { input: '[1,2,3], [2,5,6]', expectedOutput: '[1,2,2,3,5,6]' },
      { input: '[1], []', expectedOutput: '[1]' },
      { input: '[], [1]', expectedOutput: '[1]' },
      { input: '[0], [1]', expectedOutput: '[0,1]' },
      { input: '[1,3,5], [2,4,6]', expectedOutput: '[1,2,3,4,5,6]' },
      { input: '[-3,-1,0], [-2,1,2]', expectedOutput: '[-3,-2,-1,0,1,2]' },
      { input: '[1,1,1], [1,1,1]', expectedOutput: '[1,1,1,1,1,1]' },
    ],
    examples: [
      { input: '[1,2,3], [2,5,6]', output: '[1,2,2,3,5,6]' },
    ],
  },
  {
    id: 'longest-substring',
    title: '无重复字符的最长子串',
    description: `## 无重复字符的最长子串

给定一个字符串 \`s\`，请你找出其中不含有重复字符的最长子串的长度。

### 示例

**输入：** \`"abcabcbb"\`
**输出：** \`3\`
**解释：** 因为无重复字符的最长子串是 "abc"，所以其长度为 3。

**输入：** \`"bbbbb"\`
**输出：** \`1\``,
    difficulty: 'hard',
    tags: ['哈希表', '字符串', '滑动窗口'],
    passRate: 0.40,
    functionName: 'lengthOfLongestSubstring',
    initialCodeJS: `function lengthOfLongestSubstring(s) {
  // 在此编写你的代码
  // 返回最长无重复子串的长度
}`,
    initialCodePY: `def length_of_longest_substring(s):
    # 在此编写你的代码
    # 返回最长无重复子串的长度
    pass`,
    testCases: [
      { input: '"abcabcbb"', expectedOutput: '3' },
      { input: '"bbbbb"', expectedOutput: '1' },
      { input: '"pwwkew"', expectedOutput: '3' },
      { input: '""', expectedOutput: '0' },
      { input: '"abcdef"', expectedOutput: '6' },
      { input: '"aab"', expectedOutput: '2' },
      { input: '"dvdf"', expectedOutput: '3' },
    ],
    examples: [
      { input: '"abcabcbb"', output: '3', explanation: '无重复字符的最长子串是 "abc"，长度为 3' },
    ],
  },
  {
    id: 'trapping-rain',
    title: '接雨水',
    description: `## 接雨水

给定 \`n\` 个非负整数表示每个宽度为 1 的柱子的高度图，计算按此排列的柱子，下雨之后能接多少雨水。

### 示例

**输入：** \`[0,1,0,2,1,0,1,3,2,1,2,1]\`
**输出：** \`6\`
**解释：** 上面是由数组 [0,1,0,2,1,0,1,3,2,1,2,1] 表示的高度图，在这种情况下，可以接 6 个单位的雨水。

**输入：** \`[4,2,0,3,2,5]\`
**输出：** \`9\``,
    difficulty: 'hard',
    tags: ['栈', '双指针', '动态规划'],
    passRate: 0.30,
    functionName: 'trap',
    initialCodeJS: `function trap(height) {
  // 在此编写你的代码
  // 返回能接住的雨水量
}`,
    initialCodePY: `def trap(height):
    # 在此编写你的代码
    # 返回能接住的雨水量
    pass`,
    testCases: [
      { input: '[0,1,0,2,1,0,1,3,2,1,2,1]', expectedOutput: '6' },
      { input: '[4,2,0,3,2,5]', expectedOutput: '9' },
      { input: '[1,0,1]', expectedOutput: '1' },
      { input: '[3,0,3]', expectedOutput: '3' },
      { input: '[0,0,0]', expectedOutput: '0' },
      { input: '[5,4,1,2]', expectedOutput: '1' },
      { input: '[5,2,1,2,1,5]', expectedOutput: '14' },
    ],
    examples: [
      { input: '[0,1,0,2,1,0,1,3,2,1,2,1]', output: '6', explanation: '可以接 6 个单位的雨水' },
    ],
  },
];
