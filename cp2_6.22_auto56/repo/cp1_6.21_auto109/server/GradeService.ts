import { Router, Request, Response } from 'express';
import type { Answer, GradeResult, GradeResultItem, Question } from '../src/types';
import { findQuestionById } from './QuestionService';

export const gradeRouter = Router();

function generateExplanation(question: Question, userAnswer: string): string {
  const kpText = question.knowledgePoints.join('、');
  const optionLabels = ['A', 'B', 'C', 'D'];

  if (question.type === 'choice') {
    const correctIdx = optionLabels.indexOf(question.correctAnswer);
    const correctText = question.options && correctIdx >= 0 ? question.options[correctIdx] : '';
    const userIdx = optionLabels.indexOf(userAnswer);
    const userText = question.options && userIdx >= 0 ? question.options[userIdx] : '未作答';
    return `本题考查知识点：${kpText}。正确答案为 ${question.correctAnswer}（${correctText}）。您选择了 ${userAnswer !== question.correctAnswer ? userAnswer + '（' + userText + '）' : '正确答案'}。建议回顾该知识点的核心概念，加深对相关理论的理解。`;
  } else {
    const correctText = question.correctAnswer === 'true' ? '正确' : '错误';
    const userText = userAnswer === 'true' ? '正确' : userAnswer === 'false' ? '错误' : '未作答';
    return `本题考查知识点：${kpText}。正确答案为「${correctText}」。您判断为「${userText}」。该知识点属于基础概念范畴，建议结合具体案例重新学习判断标准，避免混淆相似概念。`;
  }
}

gradeRouter.post('/', (req: Request<never, never, Answer[]>, res: Response<GradeResult>) => {
  const answers = req.body;

  if (!Array.isArray(answers)) {
    res.status(400).json({
      totalScore: 0,
      maxScore: 0,
      results: [],
      knowledgePointErrors: {},
    });
    return;
  }

  const results: GradeResultItem[] = [];
  const knowledgePointErrors: Record<string, number> = {};
  let totalScore = 0;
  const scorePerQuestion = 20;
  const maxScore = answers.length * scorePerQuestion;

  for (const ans of answers) {
    const question = findQuestionById(ans.questionId);
    if (!question) continue;

    const isCorrect = ans.answer === question.correctAnswer;
    const score = isCorrect ? scorePerQuestion : 0;
    totalScore += score;

    if (!isCorrect) {
      for (const kp of question.knowledgePoints) {
        knowledgePointErrors[kp] = (knowledgePointErrors[kp] || 0) + 1;
      }
    }

    results.push({
      questionId: question.id,
      isCorrect,
      score,
      knowledgePoints: question.knowledgePoints,
      explanation: isCorrect ? '回答正确！' : generateExplanation(question, ans.answer),
      correctAnswer: question.correctAnswer,
      userAnswer: ans.answer,
    });
  }

  res.json({
    totalScore,
    maxScore,
    results,
    knowledgePointErrors,
  });
});
