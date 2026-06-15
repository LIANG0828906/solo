import { scoringRuleBank, calculateScore, highlightKeywords, matchKeywords } from './src/ScoringRule';

const longAnswer = `我认为人工智能在教育领域的应用具有巨大的潜力和深远的影响。首先，人工智能可以实现真正的个性化教学，根据每个学生的学习进度、兴趣特点和认知风格提供定制化的学习内容和路径。例如，智能辅导系统可以自动识别学生的薄弱环节，针对性地出题和讲解，让每个学生都能按照自己的节奏前进。其次，AI还能帮助教师批改作业、统计成绩、分析学情，大大减轻教师的工作负担，让老师有更多时间关注学生的全面发展。此外，人工智能还可以打破地域和时间的限制，让优质教育资源触达更广泛的学生群体。总之，人工智能将彻底改变传统教育模式，让学习变得更加高效、有趣和公平。未来的教育一定是人机协同的教育，技术是手段，育人是目的。`;

console.log('答案长度:', longAnswer.length, '字符');

console.time('calculateScore');
for (let i = 0; i < 1000; i++) {
  const points = scoringRuleBank.map((p) => ({ ...p, checked: i % 2 === 0 }));
  calculateScore(longAnswer, points.filter((p) => p.checked), points);
}
console.timeEnd('calculateScore');

console.time('matchKeywords');
for (let i = 0; i < 1000; i++) {
  matchKeywords(longAnswer, scoringRuleBank);
}
console.timeEnd('matchKeywords');

console.time('highlightKeywords');
const keywords = scoringRuleBank.map((p) => p.keyword);
for (let i = 0; i < 1000; i++) {
  highlightKeywords(longAnswer, keywords);
}
console.timeEnd('highlightKeywords');

console.log('\n单次估算（除以1000）:');
console.time('单次_calculateScore');
const points = scoringRuleBank.map((p) => ({ ...p, checked: true }));
calculateScore(longAnswer, points, points);
console.timeEnd('单次_calculateScore');

console.time('单次_matchKeywords');
matchKeywords(longAnswer, scoringRuleBank);
console.timeEnd('单次_matchKeywords');

console.time('单次_highlightKeywords');
highlightKeywords(longAnswer, keywords);
console.timeEnd('单次_highlightKeywords');
