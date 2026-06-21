const TASKS = [
  '完成第3章习题',
  '编写小组报告',
  '制作演示PPT',
  '完成实验报告',
  '设计调查问卷',
  '编写代码练习',
  '完成阅读笔记',
  '制作思维导图',
  '完成小组讨论记录',
  '完成单元测试'
];

function getRandomTask() {
  return TASKS[Math.floor(Math.random() * TASKS.length)];
}

module.exports = { TASKS, getRandomTask };
