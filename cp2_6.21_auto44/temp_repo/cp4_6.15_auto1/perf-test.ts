import { scoreAnswer } from './src/utils/scoring';
import type { Question } from './src/types';

const question: Question = {
  id: 'test-1',
  text: '请简述机器学习的主要应用领域',
  referenceAnswer: `机器学习是人工智能的核心技术之一，具有广泛的应用场景和领域。

主要应用领域包括：
1. 自然语言处理：机器翻译、文本分类、情感分析、智能对话系统、语音识别与合成等。通过深度学习模型如Transformer、BERT、GPT等，计算机能够理解和生成人类语言。
2. 计算机视觉：图像识别、物体检测、人脸识别、医学影像分析、自动驾驶视觉系统等。卷积神经网络CNN在该领域取得了突破性进展。
3. 推荐系统：电商商品推荐、视频内容推荐、音乐推荐、社交媒体个性化推荐等。协同过滤、矩阵分解、深度推荐模型被广泛应用。
4. 金融科技：信用评估、风险控制、欺诈检测、算法交易、量化投资等。机器学习能够从海量金融数据中发现规律和异常。
5. 医疗健康：疾病诊断、药物研发、基因分析、健康监测、精准医疗等。在影像诊断、基因组学等领域取得显著成效。
6. 智能制造：质量检测、预测性维护、工业优化、供应链管理等。提升生产效率和产品质量。
7. 智能交通：路径优化、交通预测、自动驾驶、智能信号灯控制等。改善城市交通拥堵状况。

机器学习的核心价值在于从数据中自动学习规律，解决传统规则方法难以处理的复杂问题。随着算力提升和数据积累，其应用场景还在不断扩展。

未来发展趋势包括：更强大的预训练模型、多模态学习、联邦学习、可解释AI、自动化机器学习等方向。`,
  keywords: [
    { word: '自然语言处理', scorePoint: 2 },
    { word: '计算机视觉', scorePoint: 2 },
    { word: '推荐系统', scorePoint: 1.5 },
    { word: '深度学习', scorePoint: 2 },
    { word: '神经网络', scorePoint: 1.5 },
    { word: '人工智能', scorePoint: 1 },
    { word: '应用领域', scorePoint: 1 },
    { word: '数据', scorePoint: 0.5 },
    { word: '算法', scorePoint: 0.5 },
    { word: '模型', scorePoint: 0.5 },
  ],
  maxScore: 15,
  createdAt: new Date().toISOString(),
};

function generateLongText(baseText: string, targetLength: number): string {
  let result = '';
  while (result.length < targetLength) {
    result += baseText;
  }
  return result.slice(0, targetLength);
}

function runPerformanceTest() {
  console.log('='.repeat(60));
  console.log('评分算法性能测试');
  console.log('='.repeat(60));

  const testCases = [
    { label: '短答案 (100字符)', length: 100, iterations: 1000 },
    { label: '中答案 (1000字符)', length: 1000, iterations: 500 },
    { label: '长答案 (1万字符)', length: 10000, iterations: 100 },
    { label: '超长答案 (10万字符)', length: 100000, iterations: 10 },
  ];

  const results: Array<{ label: string; avg: number; min: number; max: number; iterations: number }> = [];

  for (const testCase of testCases) {
    const studentAnswer = generateLongText(question.referenceAnswer, testCase.length);
    const times: number[] = [];

    // 预热
    scoreAnswer(question, studentAnswer);
    scoreAnswer(question, studentAnswer);

    for (let i = 0; i < testCase.iterations; i++) {
      const start = performance.now();
      scoreAnswer(question, studentAnswer);
      const end = performance.now();
      times.push(end - start);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    results.push({ label: testCase.label, avg, min, max, iterations: testCase.iterations });

    console.log(`\n${testCase.label}:`);
    console.log(`  迭代次数: ${testCase.iterations}`);
    console.log(`  平均耗时: ${avg.toFixed(3)} ms`);
    console.log(`  最小耗时: ${min.toFixed(3)} ms`);
    console.log(`  最大耗时: ${max.toFixed(3)} ms`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('性能指标验证');
  console.log('='.repeat(60));

  const longest = results.find((r) => r.label.includes('10万字符'));
  if (longest) {
    const pass = longest.avg < 50;
    console.log(`\n10万字符平均响应时间: ${longest.avg.toFixed(3)} ms`);
    console.log(`性能指标 (≤50ms): ${pass ? '✅ 通过' : '❌ 未通过'}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('语义相似度算法测试');
  console.log('='.repeat(60));

  const testAnswers = [
    { label: '完全相同', answer: question.referenceAnswer },
    {
      label: '近似回答',
      answer: `机器学习的应用非常广泛。主要有自然语言处理方面，比如翻译和聊天机器人；还有计算机视觉，用在图像识别和自动驾驶上；推荐系统也是常见应用，比如电商推荐。深度学习和神经网络是核心技术，人工智能通过数据和算法不断发展。`,
    },
    {
      label: '部分相关',
      answer: '编程很重要，可以写很多软件。计算机可以处理很多事情，数据也很有用。',
    },
    { label: '完全不相关', answer: '今天天气真好，适合出去散步。花儿开了，鸟儿在唱歌，心情非常愉快。' },
  ];

  for (const test of testAnswers) {
    const result = scoreAnswer(question, test.answer);
    console.log(`\n${test.label}:`);
    console.log(`  总分: ${result.totalScore}/${question.maxScore}`);
    console.log(`  关键词: ${(result.keywordScore * 100).toFixed(1)}%`);
    console.log(`  长度比: ${(result.lengthScore * 100).toFixed(1)}%`);
    console.log(`  语义相似度: ${(result.semanticScore * 100).toFixed(1)}%`);
    console.log(`  评语: ${result.feedback}`);
  }

  console.log('\n' + '='.repeat(60));
}

runPerformanceTest();
