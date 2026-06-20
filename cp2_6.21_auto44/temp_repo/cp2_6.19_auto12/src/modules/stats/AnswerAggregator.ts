import { v4 as uuidv4 } from 'uuid';
import type { Question, AnswerRecord, QuestionStats } from '../../types';

export const calculateStats = (
  questions: Question[],
  answerRecords: AnswerRecord[]
): QuestionStats[] => {
  return questions.map((question) => {
    const recordsForQuestion = answerRecords.filter(
      (r) => r.questionId === question.id
    );
    const totalAnswers = recordsForQuestion.length;
    const correctAnswers = recordsForQuestion.filter((r) => r.isCorrect).length;
    const accuracyRate = totalAnswers > 0 ? correctAnswers / totalAnswers : 0;

    const optionCounts = new Array(question.options.length).fill(0);
    recordsForQuestion.forEach((record) => {
      if (record.selectedOptionIndex >= 0 && record.selectedOptionIndex < optionCounts.length) {
        optionCounts[record.selectedOptionIndex]++;
      }
    });

    return {
      questionId: question.id,
      totalAnswers,
      correctAnswers,
      accuracyRate,
      optionCounts,
    };
  });
};

export const generateMockAnswerRecords = (
  questions: Question[]
): AnswerRecord[] => {
  const records: AnswerRecord[] = [];

  questions.forEach((question) => {
    const numRecords = Math.floor(Math.random() * 11) + 10;

    for (let i = 0; i < numRecords; i++) {
      const selectedOptionIndex = Math.floor(Math.random() * question.options.length);
      const isCorrect = selectedOptionIndex === question.correctOptionIndex;

      records.push({
        id: uuidv4(),
        questionId: question.id,
        selectedOptionIndex,
        isCorrect,
      });
    }
  });

  return records;
};

export const getAccuracyColor = (accuracyRate: number): string => {
  if (accuracyRate > 0.8) return '#4caf50';
  if (accuracyRate >= 0.5) return '#ff9800';
  return '#e53935';
};
