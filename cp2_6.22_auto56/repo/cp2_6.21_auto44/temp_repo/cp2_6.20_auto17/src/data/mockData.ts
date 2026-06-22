import type { User, Assignment, Submission, ErrorBookEntry, GradingResult, ErrorType } from '../types';

export const sampleUsers: User[] = [
  {
    id: 'student1',
    name: '张小明',
    avatar: '🧑‍🎓',
    role: 'student',
  },
  {
    id: 'student2',
    name: '李小红',
    avatar: '👩‍🎓',
    role: 'student',
  },
  {
    id: 'student3',
    name: '王小强',
    avatar: '👨‍🎓',
    role: 'student',
  },
];

function createQuestions(subject: string, count: number = 10) {
  const questionTemplates: Record<string, { q: string; a: string; k: string[] }[]> = {
    数学: [
      { q: '请解释什么是函数的定义域和值域，并举例说明。', a: '函数的定义域是自变量x的取值范围，值域是因变量y的取值范围。例如y=x²的定义域是全体实数，值域是非负实数。', k: ['定义域', '值域', '自变量', '因变量', '取值范围'] },
      { q: '什么是导数？它的几何意义和物理意义分别是什么？', a: '导数是函数在某一点的瞬时变化率。几何意义是曲线在该点的切线斜率，物理意义是运动物体的瞬时速度。', k: ['导数', '瞬时变化率', '切线斜率', '瞬时速度'] },
      { q: '请说明定积分的定义和基本性质。', a: '定积分是函数在区间上的积分和的极限，它表示曲线与坐标轴围成的面积。基本性质包括线性性、区间可加性等。', k: ['定积分', '积分和', '面积', '线性性', '区间可加性'] },
      { q: '什么是极限？请描述ε-δ定义。', a: '极限是描述函数在某点附近的变化趋势。ε-δ定义是：对于任意ε>0，存在δ>0，当0<|x-a|<δ时，|f(x)-L|<ε。', k: ['极限', 'ε-δ', '变化趋势', '邻域'] },
      { q: '请解释向量的点积和叉积的区别。', a: '点积是标量，结果是一个数，等于两个向量模长乘以夹角余弦。叉积是向量，方向垂直于两个向量所在平面，大小等于模长乘以夹角正弦。', k: ['点积', '叉积', '标量', '向量', '夹角'] },
      { q: '什么是矩阵的秩？如何计算？', a: '矩阵的秩是矩阵中线性无关的行或列的最大数目。可以通过行变换将矩阵化为阶梯形，非零行的个数就是秩。', k: ['秩', '线性无关', '行变换', '阶梯形'] },
      { q: '请说明概率论中的贝叶斯定理及其应用。', a: '贝叶斯定理描述了在已知某些条件下事件发生的概率。公式为P(A|B)=P(B|A)P(A)/P(B)，广泛应用于机器学习和统计推断。', k: ['贝叶斯定理', '条件概率', '机器学习', '统计推断'] },
      { q: '什么是微分方程？请举例说明一阶线性微分方程的解法。', a: '微分方程是含有未知函数导数的方程。一阶线性微分方程可以用积分因子法求解，先将方程标准化，再乘以积分因子后积分。', k: ['微分方程', '一阶线性', '积分因子', '标准化'] },
      { q: '请解释傅里叶级数的概念和意义。', a: '傅里叶级数将周期函数表示为正弦和余弦函数的无穷级数之和。它在信号处理、物理学等领域有广泛应用。', k: ['傅里叶级数', '周期函数', '正弦', '余弦', '信号处理'] },
      { q: '什么是拓扑空间？请描述其基本定义。', a: '拓扑空间是集合上定义了开集族的数学结构，满足空集和全集是开集，任意并和有限交仍是开集。它是研究连续性和收敛性的基础。', k: ['拓扑空间', '开集', '连续性', '收敛性'] },
    ],
    语文: [
      { q: '请分析《论语》中"仁"的思想内涵。', a: '仁是孔子思想的核心，包含爱人、克己复礼、孝悌等多重含义。仁是一种道德境界，也是处理人际关系的基本原则。', k: ['仁', '孔子', '爱人', '克己复礼', '道德'] },
      { q: '什么是唐诗的"意境"？请举例说明。', a: '意境是诗歌中情与景的交融，是诗人主观情感与客观景物的统一。如王维的"空山新雨后，天气晚来秋"营造了清幽宁静的意境。', k: ['意境', '情景交融', '王维', '清幽'] },
      { q: '请解释小说中的"第三人称有限视角"及其作用。', a: '第三人称有限视角是叙述者只讲述一个人物的所见所闻所思。它可以增加真实感，制造悬念，引导读者深入理解人物。', k: ['有限视角', '真实感', '悬念', '人物塑造'] },
      { q: '什么是"赋比兴"？请分别举例说明。', a: '赋比兴是《诗经》的三种表现手法。赋是直接陈述，比是比喻，兴是起兴，先言他物以引起所咏之词。', k: ['赋比兴', '诗经', '陈述', '比喻', '起兴'] },
      { q: '请分析鲁迅《狂人日记》的主题思想。', a: '《狂人日记》通过狂人的视角揭露了封建礼教"吃人"的本质，表达了对封建社会的批判和对人性解放的呼唤。', k: ['狂人日记', '鲁迅', '封建礼教', '吃人', '批判'] },
      { q: '什么是"古风"和"近体诗"？它们有什么区别？', a: '古风是唐代以前的诗歌，形式自由，不讲平仄对仗。近体诗是唐代形成的格律诗，包括律诗和绝句，有严格的格律要求。', k: ['古风', '近体诗', '格律诗', '平仄', '对仗'] },
      { q: '请解释"意象"在古诗词中的作用。', a: '意象是融入了诗人主观情感的客观物象。它是构成诗歌意境的基本单位，可以使抽象情感具体化，增强诗歌的感染力。', k: ['意象', '情感', '意境', '感染力'] },
      { q: '什么是"通感"？请举例说明这种修辞手法。', a: '通感是将不同感官的感觉相互沟通的修辞方法。如"歌声很甜"将听觉转化为味觉，"月色清凉"将视觉转化为触觉。', k: ['通感', '修辞', '感官', '转化'] },
      { q: '请分析《红楼梦》中林黛玉的人物形象。', a: '林黛玉是一个才华横溢、敏感多思的女性形象。她性格孤傲，追求真爱，却因环境所迫最终悲剧收场，是封建礼教的牺牲品。', k: ['林黛玉', '才华', '孤傲', '悲剧', '封建礼教'] },
      { q: '什么是"文言"和"白话"？新文化运动为什么提倡白话文？', a: '文言是古代的书面语，白话是口语化的书面语。新文化运动提倡白话文是为了普及教育，传播新思想，推动文化现代化。', k: ['文言', '白话', '新文化运动', '普及教育', '现代化'] },
    ],
    英语: [
      { q: '请解释英语中的现在完成时及其用法。', a: '现在完成时由have/has加过去分词构成，表示过去发生的动作对现在造成的影响或结果。常与already, yet, ever, never等连用。', k: ['现在完成时', 'have', '过去分词', '影响', 'already'] },
      { q: '什么是定语从句？请举例说明关系代词的用法。', a: '定语从句修饰名词或代词，由关系代词或关系副词引导。关系代词如who, whom, whose, which, that在从句中作主语、宾语或定语。', k: ['定语从句', '关系代词', 'who', 'which', 'that'] },
      { q: '请解释虚拟语气在条件句中的用法。', a: '虚拟语气表示假设或非真实的情况。与现在事实相反用过去时，与过去事实相反用过去完成时，与将来相反用should/would加动词原形。', k: ['虚拟语气', '条件句', '过去完成时', '假设'] },
      { q: '什么是非谓语动词？它有哪几种形式？', a: '非谓语动词是不作谓语的动词形式，包括动名词、不定式和分词（现在分词和过去分词）。它们可以作主语、宾语、定语、状语等。', k: ['非谓语动词', '动名词', '不定式', '分词'] },
      { q: '请说明英语中的主谓一致原则。', a: '主谓一致指主语和谓语在人称和数上保持一致。包括语法一致、意义一致和就近原则等。如each作主语谓语用单数，集合名词根据意义决定单复数。', k: ['主谓一致', '语法一致', '意义一致', '就近原则'] },
      { q: '什么是强调句？请举例说明it强调句的结构。', a: '强调句用于强调句子的某个成分。It强调句的结构是It is/was + 被强调部分 + that/who + 其他。可以强调主语、宾语、状语等。', k: ['强调句', 'it', 'that', '强调'] },
      { q: '请解释倒装句的类型和用法。', a: '倒装句分为全部倒装和部分倒装。全部倒装将谓语全部置于主语前，部分倒装只将助动词或情态动词置于主语前。常用于强调或某些固定句型。', k: ['倒装', '全部倒装', '部分倒装', '助动词'] },
      { q: '什么是名词性从句？它包括哪些类型？', a: '名词性从句在句子中起名词作用，包括主语从句、宾语从句、表语从句和同位语从句。常由that, whether, what, how等引导。', k: ['名词性从句', '主语从句', '宾语从句', '表语从句', '同位语从句'] },
      { q: '请说明英语中的时态呼应原则。', a: '时态呼应指从句时态要与主句时态保持一致。主句是过去时，从句一般用过去的某种时态；主句是现在时，从句可根据需要用各种时态。', k: ['时态呼应', '主句', '从句', '一致'] },
      { q: '什么是情态动词？请举例说明几个常用情态动词的用法。', a: '情态动词表示说话人的态度和推测，如can, may, must, should等。它们没有人称和数的变化，后面接动词原形。can表能力，may表许可，must表必须。', k: ['情态动词', 'can', 'may', 'must', 'should'] },
    ],
  };

  const templates = questionTemplates[subject] || questionTemplates['数学'];
  return templates.slice(0, count).map((t, i) => ({
    id: i + 1,
    content: t.q,
    standardAnswer: t.a,
    keywords: t.k,
    maxWords: 200,
  }));
}

export const sampleAssignments: Assignment[] = [
  {
    id: 'assign1',
    title: '数学期末复习作业一',
    subject: '数学',
    questions: createQuestions('数学', 10),
    deadline: '2026-06-30T23:59:59',
    createdAt: '2026-06-15T08:00:00',
    createdBy: 'teacher1',
  },
  {
    id: 'assign2',
    title: '语文阅读理解练习',
    subject: '语文',
    questions: createQuestions('语文', 10),
    deadline: '2026-07-05T23:59:59',
    createdAt: '2026-06-18T10:00:00',
    createdBy: 'teacher2',
  },
  {
    id: 'assign3',
    title: '英语语法综合练习',
    subject: '英语',
    questions: createQuestions('英语', 10),
    deadline: '2026-07-10T23:59:59',
    createdAt: '2026-06-20T09:00:00',
    createdBy: 'teacher3',
  },
];

function generatePartialAnswers(questions: { id: number; content: string }[], quality: 'good' | 'medium' | 'poor') {
  return questions.map((q) => {
    let content = '';
    if (quality === 'good') {
      content = q.content.substring(0, 10) + '...正确回答的详细内容，包含关键知识点和完整阐述。';
    } else if (quality === 'medium') {
      content = q.content.substring(0, 10) + '...部分正确的回答，有一些关键点但不够完整。';
    } else {
      content = q.content.substring(0, 5) + '...';
    }
    return { questionId: q.id, content };
  });
}

function generateGradingResults(count: number, quality: 'good' | 'medium' | 'poor'): GradingResult[] {
  const results: GradingResult[] = [];
  for (let i = 1; i <= count; i++) {
    let score: number;
    let feedback: string;
    let errorType: ErrorType | undefined;
    if (quality === 'good') {
      score = 75 + Math.floor(Math.random() * 25);
      feedback = score >= 90 ? '回答完整，非常优秀！' : '回答较好，继续保持。';
    } else if (quality === 'medium') {
      score = 55 + Math.floor(Math.random() * 20);
      feedback = '回答一般，还需努力。';
      if (score < 60) errorType = i % 2 === 0 ? 'knowledge_gap' : 'unclear_expression';
    } else {
      score = 30 + Math.floor(Math.random() * 25);
      feedback = '得分较低，需要加强学习。';
      errorType = i % 3 === 0 ? 'knowledge_gap' : i % 3 === 1 ? 'unclear_expression' : 'misunderstanding';
    }
    results.push({
      questionId: i,
      score,
      feedback,
      errorType,
    });
  }
  return results;
}

export const sampleSubmissions: Submission[] = [
  {
    id: 'sub1',
    assignmentId: 'assign1',
    userId: 'student1',
    answers: generatePartialAnswers(sampleAssignments[0].questions, 'good'),
    gradingResults: generateGradingResults(10, 'good'),
    submittedAt: '2026-06-17T14:30:00',
    status: 'graded',
  },
  {
    id: 'sub2',
    assignmentId: 'assign2',
    userId: 'student1',
    answers: generatePartialAnswers(sampleAssignments[1].questions, 'medium'),
    gradingResults: generateGradingResults(10, 'medium'),
    submittedAt: '2026-06-19T16:00:00',
    status: 'graded',
  },
  {
    id: 'sub3',
    assignmentId: 'assign1',
    userId: 'student2',
    answers: generatePartialAnswers(sampleAssignments[0].questions, 'medium'),
    gradingResults: generateGradingResults(10, 'medium'),
    submittedAt: '2026-06-16T10:00:00',
    status: 'graded',
  },
  {
    id: 'sub4',
    assignmentId: 'assign2',
    userId: 'student2',
    answers: generatePartialAnswers(sampleAssignments[1].questions, 'poor'),
    gradingResults: generateGradingResults(10, 'poor'),
    submittedAt: '2026-06-18T09:00:00',
    status: 'graded',
  },
  {
    id: 'sub5',
    assignmentId: 'assign1',
    userId: 'student3',
    answers: generatePartialAnswers(sampleAssignments[0].questions, 'poor'),
    gradingResults: generateGradingResults(10, 'poor'),
    submittedAt: '2026-06-17T20:00:00',
    status: 'graded',
  },
];

function generateErrorBook() {
  const entries: ErrorBookEntry[] = [];

  sampleSubmissions.forEach((sub) => {
    const assignment = sampleAssignments.find((a) => a.id === sub.assignmentId);
    if (!assignment) return;

    sub.gradingResults.forEach((result, idx) => {
      if (result.score < 60 && result.errorType) {
        const question = assignment.questions[idx];
        entries.push({
          id: `err_${sub.id}_${question.id}`,
          userId: sub.userId,
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          subject: assignment.subject,
          question,
          studentAnswer: sub.answers[idx]?.content || '',
          score: result.score,
          feedback: result.feedback,
          errorType: result.errorType as any,
          createdAt: sub.submittedAt,
        });
      }
    });
  });

  return entries;
}

export const sampleErrorBook: ErrorBookEntry[] = generateErrorBook();
