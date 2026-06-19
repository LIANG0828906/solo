import type { Question, Answer, GradingResult, ErrorType } from '../types';

function calculateKeywordMatch(studentAnswer: string, keywords: string[]): number {
  const answerLower = studentAnswer.toLowerCase();
  let matched = 0;
  keywords.forEach((keyword) => {
    if (answerLower.includes(keyword.toLowerCase())) {
      matched++;
    }
  });
  return keywords.length > 0 ? matched / keywords.length : 0;
}

function calculateLengthScore(studentAnswer: string, maxWords: number): number {
  const wordCount = studentAnswer.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount === 0) return 0;
  const ratio = wordCount / maxWords;
  if (ratio >= 0.8) return 1;
  if (ratio >= 0.5) return 0.7;
  if (ratio >= 0.2) return 0.4;
  return 0.2;
}

function calculateSemanticSimilarity(studentAnswer: string, standardAnswer: string): number {
  const studentWords = new Set(studentAnswer.toLowerCase().split(/\s+/).filter(Boolean));
  const standardWords = new Set(standardAnswer.toLowerCase().split(/\s+/).filter(Boolean));
  if (standardWords.size === 0) return 0;
  let intersection = 0;
  studentWords.forEach((word) => {
    if (standardWords.has(word)) {
      intersection++;
    }
  });
  return intersection / standardWords.size;
}

function determineErrorType(
  keywordMatch: number,
  lengthScore: number,
  semanticSimilarity: number
): ErrorType | undefined {
  if (keywordMatch < 0.4 && semanticSimilarity < 0.3) {
    return 'knowledge_gap';
  }
  if (lengthScore < 0.5 && keywordMatch >= 0.5) {
    return 'unclear_expression';
  }
  if (keywordMatch >= 0.3 && semanticSimilarity < 0.4) {
    return 'misunderstanding';
  }
  return undefined;
}

function generateFeedback(score: number, errorType?: ErrorType): string {
  if (score >= 90) return '回答完整，逻辑清晰，非常优秀！';
  if (score >= 80) return '回答较完整，关键点都有覆盖。';
  if (score >= 70) return '回答基本正确，但部分表述不够准确。';
  if (score >= 60) {
    switch (errorType) {
      case 'knowledge_gap':
        return '缺少部分关键知识点，建议复习相关内容。';
      case 'unclear_expression':
        return '思路正确但表述不够清晰，建议组织语言。';
      case 'misunderstanding':
        return '对题目理解有偏差，建议仔细审题。';
      default:
        return '回答基本及格，仍有提升空间。';
    }
  }
  switch (errorType) {
    case 'knowledge_gap':
      return '缺少关键点，需要加强基础知识学习。';
    case 'unclear_expression':
      return '表述不清，建议多练习书面表达。';
    case 'misunderstanding':
      return '理解偏差较大，需重新审题后作答。';
    default:
      return '得分较低，需要认真复习相关知识。';
  }
}

export function gradeAnswer(question: Question, answer: Answer): GradingResult {
  const studentAnswer = answer.content || '';
  const keywordMatch = calculateKeywordMatch(studentAnswer, question.keywords);
  const lengthScore = calculateLengthScore(studentAnswer, question.maxWords);
  const semanticSimilarity = calculateSemanticSimilarity(studentAnswer, question.standardAnswer);

  const score = Math.round(
    keywordMatch * 50 + lengthScore * 20 + semanticSimilarity * 30
  );

  const finalScore = Math.min(100, Math.max(0, score));
  const errorType = finalScore < 60 ? determineErrorType(keywordMatch, lengthScore, semanticSimilarity) : undefined;
  const feedback = generateFeedback(finalScore, errorType);

  return {
    questionId: question.id,
    score: finalScore,
    feedback,
    errorType,
  };
}

export function gradeAssignment(questions: Question[], answers: Answer[]): GradingResult[] {
  return questions.map((question) => {
    const answer = answers.find((a) => a.questionId === question.id) || {
      questionId: question.id,
      content: '',
    };
    return gradeAnswer(question, answer);
  });
}
