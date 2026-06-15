import { v4 as uuidv4 } from 'uuid';
import type {
  Survey,
  Question,
  Submission,
  Answer,
  SurveyResults,
  QuestionStats,
  SurveyCreateInput,
  SurveyUpdateInput,
  SubmissionCreateInput,
  ExportData,
  CsvRow,
} from '../shared/types';

const surveys = new Map<string, Survey>();
const submissions = new Map<string, Submission>();
const submissionsBySurvey = new Map<string, Submission[]>();

export function getSurveys(): Survey[] {
  return Array.from(surveys.values());
}

export function getSurvey(id: string): Survey | undefined {
  return surveys.get(id);
}

export function createSurvey(input: SurveyCreateInput): Survey {
  const survey: Survey = {
    id: uuidv4(),
    ...input,
    createdAt: new Date(),
    published: false,
  };
  surveys.set(survey.id, survey);
  return survey;
}

export function updateSurvey(id: string, input: SurveyUpdateInput): Survey | undefined {
  const existing = surveys.get(id);
  if (!existing) return undefined;

  const updated: Survey = {
    ...existing,
    ...input,
    id: existing.id,
    createdAt: existing.createdAt,
  };
  surveys.set(id, updated);
  return updated;
}

export function deleteSurvey(id: string): boolean {
  const exists = surveys.has(id);
  if (!exists) return false;

  surveys.delete(id);
  const surveySubmissions = submissionsBySurvey.get(id) || [];
  for (const submission of surveySubmissions) {
    submissions.delete(submission.id);
  }
  submissionsBySurvey.delete(id);
  return true;
}

export function publishSurvey(id: string): Survey | undefined {
  return updateSurvey(id, { published: true });
}

export function createSubmission(input: SubmissionCreateInput): Submission | undefined {
  const survey = surveys.get(input.surveyId);
  if (!survey) return undefined;

  const now = new Date();
  const answers: Answer[] = input.answers.map((a) => ({
    id: uuidv4(),
    surveyId: input.surveyId,
    questionId: a.questionId,
    value: a.value,
    submittedAt: now,
  }));

  const submission: Submission = {
    id: uuidv4(),
    surveyId: input.surveyId,
    answers,
    submittedAt: now,
  };

  submissions.set(submission.id, submission);

  if (!submissionsBySurvey.has(input.surveyId)) {
    submissionsBySurvey.set(input.surveyId, []);
  }
  submissionsBySurvey.get(input.surveyId)!.push(submission);

  return submission;
}

export function getSurveyResults(
  surveyId: string,
  startTime?: Date,
  endTime?: Date
): SurveyResults | undefined {
  const survey = surveys.get(surveyId);
  if (!survey) return undefined;

  const allSubmissions = submissionsBySurvey.get(surveyId) || [];

  const filteredSubmissions = startTime || endTime
    ? allSubmissions.filter((s) => {
        const t = s.submittedAt.getTime();
        const afterStart = !startTime || t >= startTime.getTime();
        const beforeEnd = !endTime || t <= endTime.getTime();
        return afterStart && beforeEnd;
      })
    : allSubmissions;

  const questionStatsMap = new Map<string, QuestionStats>();

  for (const question of survey.questions) {
    questionStatsMap.set(question.id, {
      questionId: question.id,
      questionTitle: question.title,
      questionType: question.type,
      totalResponses: 0,
      skippedCount: 0,
      optionCounts: question.options ? Object.fromEntries(question.options.map((o) => [o, 0])) : undefined,
      averageRating: question.type === 'rating' ? 0 : undefined,
      textResponses: question.type === 'text' ? [] : undefined,
    });
  }

  let totalRatingValues = 0;
  let totalRatingCount = 0;

  for (const submission of filteredSubmissions) {
    for (const question of survey.questions) {
      const answer = submission.answers.find((a) => a.questionId === question.id);
      const stats = questionStatsMap.get(question.id)!;

      if (!answer) {
        stats.skippedCount++;
        continue;
      }

      stats.totalResponses++;

      if (question.type === 'single' && typeof answer.value === 'string') {
        if (stats.optionCounts && answer.value in stats.optionCounts) {
          stats.optionCounts[answer.value]++;
        }
      } else if (question.type === 'multiple' && Array.isArray(answer.value)) {
        for (const option of answer.value) {
          if (stats.optionCounts && option in stats.optionCounts) {
            stats.optionCounts[option]++;
          }
        }
      } else if (question.type === 'rating' && typeof answer.value === 'number') {
        totalRatingValues += answer.value;
        totalRatingCount++;
      } else if (question.type === 'text' && typeof answer.value === 'string') {
        if (stats.textResponses) {
          stats.textResponses.push(answer.value);
        }
      }
    }
  }

  const questionStats = survey.questions.map((q) => {
    const stats = questionStatsMap.get(q.id)!;
    if (q.type === 'rating' && totalRatingCount > 0) {
      stats.averageRating = Math.round((totalRatingValues / totalRatingCount) * 100) / 100;
    }
    return stats;
  });

  return {
    surveyId,
    surveyTitle: survey.title,
    totalSubmissions: filteredSubmissions.length,
    startTime,
    endTime,
    questionStats,
  };
}

export function getExportData(): ExportData {
  return {
    surveys: Array.from(surveys.values()),
    submissions: Array.from(submissions.values()),
    exportedAt: new Date(),
  };
}

export function getCsvExportData(
  surveyId: string,
  startTime?: Date,
  endTime?: Date
): CsvRow[] | undefined {
  const survey = surveys.get(surveyId);
  if (!survey) return undefined;

  const allSubmissions = submissionsBySurvey.get(surveyId) || [];

  const filteredSubmissions = startTime || endTime
    ? allSubmissions.filter((s) => {
        const t = s.submittedAt.getTime();
        const afterStart = !startTime || t >= startTime.getTime();
        const beforeEnd = !endTime || t <= endTime.getTime();
        return afterStart && beforeEnd;
      })
    : allSubmissions;

  const rows: CsvRow[] = [];

  for (const submission of filteredSubmissions) {
    for (const question of survey.questions) {
      const answer = submission.answers.find((a) => a.questionId === question.id);
      let answerValue = '';

      if (answer) {
        if (Array.isArray(answer.value)) {
          answerValue = answer.value.join('; ');
        } else if (typeof answer.value === 'number') {
          answerValue = String(answer.value);
        } else {
          answerValue = answer.value;
        }
      }

      rows.push({
        submissionId: submission.id,
        submittedAt: submission.submittedAt.toISOString(),
        questionId: question.id,
        questionTitle: question.title,
        questionType: question.type,
        answer: answerValue,
      });
    }
  }

  return rows;
}

function generateSampleSubmissions(survey: Survey, count: number): void {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < count; i++) {
    const randomTime = new Date(thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo));
    const answers: Answer[] = [];

    for (const question of survey.questions) {
      if (!question.required && Math.random() < 0.1) {
        continue;
      }

      let value: string | string[] | number;

      if (question.type === 'single' && question.options) {
        value = question.options[Math.floor(Math.random() * question.options.length)];
      } else if (question.type === 'multiple' && question.options) {
        const numSelected = Math.floor(Math.random() * Math.min(3, question.options.length)) + 1;
        const shuffled = [...question.options].sort(() => Math.random() - 0.5);
        value = shuffled.slice(0, numSelected);
      } else if (question.type === 'rating') {
        const maxRating = question.maxRating || 5;
        value = Math.floor(Math.random() * maxRating) + 1;
      } else {
        const sampleTexts = [
          '非常满意，体验很好',
          '整体不错，希望继续改进',
          '服务态度很好',
          '产品质量不错',
          '期待更多功能',
          '推荐给朋友',
          '性价比很高',
          '使用便捷',
          '回答中包含,逗号的测试',
          '回答中包含"引号"的测试',
          '回答中包含\n换行符的测试',
        ];
        value = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
      }

      answers.push({
        id: uuidv4(),
        surveyId: survey.id,
        questionId: question.id,
        value,
        submittedAt: randomTime,
      });
    }

    const submission: Submission = {
      id: uuidv4(),
      surveyId: survey.id,
      answers,
      submittedAt: randomTime,
    };

    submissions.set(submission.id, submission);

    if (!submissionsBySurvey.has(survey.id)) {
      submissionsBySurvey.set(survey.id, []);
    }
    submissionsBySurvey.get(survey.id)!.push(submission);
  }
}

function initializeSampleData(): void {
  const sampleQuestions: Question[] = [
    {
      id: uuidv4(),
      type: 'single',
      title: '您的年龄段是？',
      required: true,
      options: ['18岁以下', '18-25岁', '26-35岁', '36-45岁', '46岁以上'],
    },
    {
      id: uuidv4(),
      type: 'multiple',
      title: '您是通过哪些渠道了解我们的？',
      required: true,
      options: ['搜索引擎', '社交媒体', '朋友推荐', '线下广告', '其他'],
    },
    {
      id: uuidv4(),
      type: 'rating',
      title: '请为我们的服务打分',
      required: true,
      maxRating: 5,
    },
    {
      id: uuidv4(),
      type: 'single',
      title: '您是否会再次使用我们的产品？',
      required: true,
      options: ['一定会', '可能会', '不确定', '可能不会', '一定不会'],
    },
    {
      id: uuidv4(),
      type: 'text',
      title: '您有什么建议或意见？',
      required: false,
    },
  ];

  const sampleSurvey: Survey = {
    id: uuidv4(),
    title: '用户满意度调查问卷',
    description: '感谢您抽出宝贵时间参与本次调查，您的反馈对我们非常重要！',
    questions: sampleQuestions,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    published: true,
  };

  surveys.set(sampleSurvey.id, sampleSurvey);
  generateSampleSubmissions(sampleSurvey, 1000);
}

initializeSampleData();
