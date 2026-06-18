import {
  Survey,
  SurveyResponse,
  Question,
  QuestionType,
  QuestionOption,
  generateId,
} from './questionTypes';

const TITLES = [
  '用户满意度调查',
  '产品使用反馈问卷',
  '市场需求调研',
  '员工敬业度调查',
  '客户服务评价',
  '品牌认知度调研',
  '功能需求收集',
  '培训效果评估',
  '活动体验反馈',
  '消费习惯调查',
  '健康生活方式调研',
  '教育质量评估',
  '社区服务满意度',
  '电商购物体验',
  '出行方式调研',
];

const DESCRIPTIONS = [
  '感谢您抽出宝贵时间填写本问卷，您的反馈对我们至关重要。',
  '本问卷旨在收集用户意见，帮助我们改进产品和服务。',
  '您的回答将用于市场分析，所有数据严格保密。',
  '请根据您的真实体验填写，大概需要3-5分钟完成。',
  '我们重视每一位用户的声音，期待您的真诚反馈。',
];

const SINGLE_CHOICE_QUESTIONS: Array<{ title: string; options: string[] }> = [
  {
    title: '您的年龄段是？',
    options: ['18岁以下', '18-25岁', '26-35岁', '36-45岁', '46岁以上'],
  },
  {
    title: '您使用本产品的频率是？',
    options: ['每天', '每周数次', '每月数次', '偶尔使用', '首次使用'],
  },
  {
    title: '您对整体服务的满意度如何？',
    options: ['非常满意', '满意', '一般', '不满意', '非常不满意'],
  },
  {
    title: '您最常用的设备是？',
    options: ['手机', '电脑', '平板', '智能手表', '其他'],
  },
  {
    title: '您了解我们产品的渠道是？',
    options: ['搜索引擎', '朋友推荐', '社交媒体', '广告', '其他'],
  },
  {
    title: '您的职业是？',
    options: ['学生', '企业员工', '自由职业', '创业者', '其他'],
  },
];

const MULTIPLE_CHOICE_QUESTIONS: Array<{ title: string; options: string[] }> = [
  {
    title: '您使用过以下哪些功能？（可多选）',
    options: ['数据分析', '报表导出', '团队协作', '消息通知', '自定义设置', '移动端访问'],
  },
  {
    title: '您希望我们增加哪些功能？（可多选）',
    options: ['AI智能分析', '更多模板', 'API接口', '多语言支持', '数据备份', '移动端APP'],
  },
  {
    title: '您遇到过以下哪些问题？（可多选）',
    options: ['加载缓慢', '界面复杂', '功能缺失', '操作卡顿', '客服响应慢', '未遇到问题'],
  },
  {
    title: '您愿意将产品推荐给谁？（可多选）',
    options: ['同事', '朋友', '家人', '客户', '合作伙伴', '暂不推荐'],
  },
];

const TEXT_QUESTIONS = [
  '请描述您最喜欢产品的哪个方面？',
  '您认为我们最需要改进的地方是什么？',
  '请分享您的使用体验或建议。',
  '您对未来版本有什么期待？',
  '还有其他想告诉我们的吗？',
];

function createOptions(labels: string[]): QuestionOption[] {
  return labels.map((label) => ({ id: generateId(), label }));
}

function createQuestions(): Question[] {
  const questions: Question[] = [];
  const numQuestions = Math.floor(Math.random() * 6) + 3;

  for (let i = 0; i < numQuestions; i++) {
    const rand = Math.random();
    if (rand < 0.4) {
      const q = SINGLE_CHOICE_QUESTIONS[Math.floor(Math.random() * SINGLE_CHOICE_QUESTIONS.length)];
      questions.push({
        id: generateId(),
        type: QuestionType.SINGLE_CHOICE,
        title: q.title,
        required: Math.random() > 0.2,
        options: createOptions(q.options),
      });
    } else if (rand < 0.75) {
      const q = MULTIPLE_CHOICE_QUESTIONS[Math.floor(Math.random() * MULTIPLE_CHOICE_QUESTIONS.length)];
      questions.push({
        id: generateId(),
        type: QuestionType.MULTIPLE_CHOICE,
        title: q.title,
        required: Math.random() > 0.3,
        options: createOptions(q.options),
      });
    } else {
      questions.push({
        id: generateId(),
        type: QuestionType.TEXT,
        title: TEXT_QUESTIONS[Math.floor(Math.random() * TEXT_QUESTIONS.length)],
        required: Math.random() > 0.4,
      });
    }
  }

  return questions;
}

function createSurvey(index: number): Survey {
  const daysAgo = Math.floor(Math.random() * 60);
  const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

  return {
    id: generateId(),
    title: `${TITLES[index % TITLES.length]} ${index + 1}`,
    description: DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)],
    createdAt,
    questions: createQuestions(),
  };
}

function createResponses(surveys: Survey[]): SurveyResponse[] {
  const responses: SurveyResponse[] = [];
  const textSamples = [
    '整体体验非常好，功能很实用。',
    '希望能增加更多自定义选项。',
    '界面简洁美观，操作流畅。',
    '建议优化移动端的适配效果。',
    '客服响应及时，解决问题效率高。',
    '数据统计功能很强大，非常满意。',
    '期待更多新功能上线。',
    '使用过程中偶尔会有卡顿现象。',
    '朋友推荐的，确实不错。',
    '相比同类产品，性价比很高。',
  ];

  for (const survey of surveys) {
    const numResponses = Math.floor(Math.random() * 40) + 5;
    for (let r = 0; r < numResponses; r++) {
      const hoursAgo = Math.floor(Math.random() * 24 * 30);
      const submittedAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
      const answers = survey.questions.map((q) => {
        let value: string | string[];
        if (q.type === QuestionType.SINGLE_CHOICE && q.options) {
          value = q.options[Math.floor(Math.random() * q.options.length)].id;
        } else if (q.type === QuestionType.MULTIPLE_CHOICE && q.options) {
          const numPicks = Math.floor(Math.random() * Math.min(3, q.options.length)) + 1;
          const shuffled = [...q.options].sort(() => Math.random() - 0.5);
          value = shuffled.slice(0, numPicks).map((o) => o.id);
        } else {
          value = textSamples[Math.floor(Math.random() * textSamples.length)];
        }
        return { questionId: q.id, value };
      });

      responses.push({
        id: generateId(),
        surveyId: survey.id,
        submittedAt,
        answers,
      });
    }
  }

  return responses;
}

export function generateMockData(): {
  surveys: Survey[];
  responses: SurveyResponse[];
} {
  const surveys: Survey[] = [];
  for (let i = 0; i < 50; i++) {
    surveys.push(createSurvey(i));
  }
  const responses = createResponses(surveys);
  return { surveys, responses };
}
