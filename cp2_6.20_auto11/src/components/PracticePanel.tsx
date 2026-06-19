import { useState, useEffect, useCallback, useRef } from 'react';
import type { Question } from '@/utils/api';
import { useQuizStore } from '@/hooks/useQuizStore';
import { ArrowRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import ChartReport from './ChartReport';

interface PracticePanelProps {
  questions: Question[];
  onFinish: () => void;
}

interface AnswerState {
  selected: string | string[];
  answered: boolean;
  correct: boolean;
}

export default function PracticePanel({ questions, onFinish }: PracticePanelProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState[]>(
    questions.map(() => ({ selected: '', answered: false, correct: false }))
  );
  const [multiSelected, setMultiSelected] = useState<string[]>([]);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const addPracticeResult = useQuizStore((s) => s.addPracticeResult);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTime]);

  const current = questions[currentIndex];
  const currentAnswer = answers[currentIndex];

  const checkAnswer = useCallback(
    (selected: string | string[]) => {
      let isCorrect = false;
      const correctAnswer = current.answer;

      if (current.type === 'multi_choice') {
        const sorted1 = (selected as string[]).slice().sort().join(',');
        const sorted2 = (correctAnswer as string[]).slice().sort().join(',');
        isCorrect = sorted1 === sorted2;
      } else if (current.type === 'true_false') {
        isCorrect = selected === correctAnswer;
      } else if (current.type === 'fill_blank') {
        isCorrect = String(selected).trim() === String(correctAnswer).trim();
      } else {
        isCorrect = selected === correctAnswer;
      }

      const newAnswers = [...answers];
      newAnswers[currentIndex] = { selected, answered: true, correct: isCorrect };
      setAnswers(newAnswers);
    },
    [current, currentIndex, answers]
  );

  const handleSelectOption = (option: string) => {
    if (currentAnswer.answered) return;

    if (current.type === 'multi_choice') {
      setMultiSelected((prev) =>
        prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
      );
    } else {
      checkAnswer(option);
    }
  };

  const handleMultiConfirm = () => {
    if (multiSelected.length === 0) return;
    checkAnswer(multiSelected);
    setMultiSelected([]);
  };

  const handleFillBlank = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.querySelector('input') as HTMLInputElement;
    if (input.value.trim()) {
      checkAnswer(input.value.trim());
    }
  };

  const handleTrueFalse = (value: string) => {
    if (currentAnswer.answered) return;
    checkAnswer(value);
  };

  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setMultiSelected([]);
    }
  };

  const handleFinish = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const totalCorrect = answers.filter((a) => a.correct).length;
    const byType: Record<string, { total: number; correct: number }> = {};
    questions.forEach((q, i) => {
      const t = q.type;
      if (!byType[t]) byType[t] = { total: 0, correct: 0 };
      byType[t].total++;
      if (answers[i].correct) byType[t].correct++;
    });
    addPracticeResult({
      total: questions.length,
      correct: totalCorrect,
      duration: elapsed,
      by_type: byType,
    });
    setFinished(true);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  if (finished) {
    return <ChartReport answers={answers} questions={questions} duration={elapsed} onBack={onFinish} />;
  }

  return (
    <div className="practice-panel">
      <div className="practice-header">
        <div className="practice-progress">
          <div className="progress-text">
            {currentIndex + 1} / {questions.length}
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="practice-timer">
          <Clock size={16} />
          {formatTime(elapsed)}
        </div>
        <div className="practice-score">
          <CheckCircle size={16} className="icon-correct" />
          {answers.filter((a) => a.correct).length}
          <XCircle size={16} className="icon-wrong" />
          {answers.filter((a) => a.answered && !a.correct).length}
        </div>
      </div>

      <div className="practice-question">
        <div className="practice-badges">
          <span className="badge badge-type">
            {current.type === 'choice' ? '单选' : current.type === 'multi_choice' ? '多选' : current.type === 'fill_blank' ? '填空' : '判断'}
          </span>
          <span className="badge badge-diff">难度 {current.difficulty}</span>
        </div>
        <h3 className="practice-stem">{current.stem}</h3>

        {current.type === 'fill_blank' ? (
          <form onSubmit={handleFillBlank} className="fill-form">
            <input
              type="text"
              className="fill-input"
              placeholder="请输入答案..."
              disabled={currentAnswer.answered}
            />
            {!currentAnswer.answered && (
              <button type="submit" className="fill-submit">提交</button>
            )}
          </form>
        ) : current.type === 'true_false' ? (
          <div className="tf-options">
            <button
              className={`tf-btn ${currentAnswer.answered && currentAnswer.selected === '正确' ? (currentAnswer.correct ? 'answer-correct' : 'answer-wrong') : ''}`}
              onClick={() => handleTrueFalse('正确')}
              disabled={currentAnswer.answered}
            >
              正确
            </button>
            <button
              className={`tf-btn ${currentAnswer.answered && currentAnswer.selected === '错误' ? (currentAnswer.correct ? 'answer-correct' : 'answer-wrong') : ''}`}
              onClick={() => handleTrueFalse('错误')}
              disabled={currentAnswer.answered}
            >
              错误
            </button>
          </div>
        ) : (
          <div className="practice-options">
            {current.options?.map((opt, i) => {
              const letter = String.fromCharCode(65 + i);
              const isSelected = current.type === 'multi_choice'
                ? multiSelected.includes(letter)
                : currentAnswer.selected === letter;
              const showResult = currentAnswer.answered;
              const isCorrectOption = Array.isArray(current.answer)
                ? current.answer.includes(letter)
                : current.answer === letter;

              let optionClass = 'practice-option';
              if (isSelected) optionClass += ' option-selected';
              if (showResult && isCorrectOption) optionClass += ' answer-correct';
              if (showResult && isSelected && !currentAnswer.correct && !isCorrectOption) optionClass += ' answer-wrong';

              return (
                <button
                  key={i}
                  className={optionClass}
                  onClick={() => handleSelectOption(letter)}
                  disabled={currentAnswer.answered}
                >
                  <span className="option-letter-circle">{letter}</span>
                  <span>{opt}</span>
                </button>
              );
            })}
            {current.type === 'multi_choice' && !currentAnswer.answered && (
              <button
                className="multi-confirm-btn"
                onClick={handleMultiConfirm}
                disabled={multiSelected.length === 0}
              >
                确认选择
              </button>
            )}
          </div>
        )}

        {currentAnswer.answered && (
          <div className={`feedback-box ${currentAnswer.correct ? 'feedback-correct' : 'feedback-wrong'}`}>
            <span className="feedback-icon">{currentAnswer.correct ? '✓' : '✗'}</span>
            <span>{currentAnswer.correct ? '回答正确！' : '回答错误'}</span>
            <div className="feedback-answer">
              正确答案：{Array.isArray(current.answer) ? current.answer.join(', ') : current.answer}
            </div>
            {current.explanation && (
              <p className="feedback-explanation">{current.explanation}</p>
            )}
          </div>
        )}
      </div>

      <div className="practice-footer">
        {currentAnswer.answered && currentIndex < questions.length - 1 && (
          <button className="next-btn" onClick={goNext}>
            下一题 <ArrowRight size={16} />
          </button>
        )}
        {(currentAnswer.answered || currentIndex === questions.length - 1) && (
          <button className="finish-btn" onClick={handleFinish}>
            结束练习
          </button>
        )}
      </div>
    </div>
  );
}
