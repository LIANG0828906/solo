import { QuizQuestion, WrongAnswer } from '../../types';

export interface QuizResult {
  score: number;
  totalQuestions: number;
  wrongAnswers: WrongAnswer[];
}

export interface AnswerSubmission {
  questionId: string;
  userAnswer: number;
  correctAnswer: number;
}

export function shuffleQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  const shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function selectQuestions(
  questions: QuizQuestion[],
  count: number = 10
): QuizQuestion[] {
  const shuffled = shuffleQuestions(questions);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function validateAnswer(
  userAnswer: number,
  correctIndex: number
): boolean {
  return userAnswer === correctIndex;
}

export function calculateResult(
  questions: QuizQuestion[],
  submissions: Map<string, number>
): QuizResult {
  let score = 0;
  const wrongAnswers: WrongAnswer[] = [];

  questions.forEach((question) => {
    const userAnswer = submissions.get(question.id);
    if (userAnswer === undefined) {
      wrongAnswers.push({
        questionId: question.id,
        question: question.question,
        userAnswer: -1,
        correctAnswer: question.correctIndex,
        options: question.options,
        hint: question.hint,
      });
      return;
    }

    if (validateAnswer(userAnswer, question.correctIndex)) {
      score++;
    } else {
      wrongAnswers.push({
        questionId: question.id,
        question: question.question,
        userAnswer,
        correctAnswer: question.correctIndex,
        options: question.options,
        hint: question.hint,
      });
    }
  });

  return {
    score,
    totalQuestions: questions.length,
    wrongAnswers,
  };
}

export function createReviewQuestions(
  wrongAnswers: WrongAnswer[]
): QuizQuestion[] {
  return wrongAnswers.map((wa) => ({
    id: `review-${wa.questionId}`,
    question: wa.question,
    options: wa.options,
    correctIndex: wa.correctAnswer,
    difficulty: 'medium' as const,
    hint: wa.hint,
  }));
}
