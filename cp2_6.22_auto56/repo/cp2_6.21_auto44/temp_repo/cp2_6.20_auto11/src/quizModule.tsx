import { useState } from 'react';
import { useQuizStore } from '@/hooks/useQuizStore';
import QuizTable from '@/components/QuizTable';
import PracticePanel from '@/components/PracticePanel';
import type { Question } from '@/utils/api';
import { useRipple } from '@/hooks/useRipple';
import { Dumbbell, List } from 'lucide-react';

type ViewMode = 'table' | 'practice';

export default function QuizModule() {
  const quizBank = useQuizStore((s) => s.quizBank);
  const [view, setView] = useState<ViewMode>('table');
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);

  const tableRipple = useRipple('quiz-table-btn');
  const practiceRipple = useRipple('practice-btn');

  const startPractice = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (quizBank.length === 0) return;
    practiceRipple.onClick(e);
    const shuffled = [...quizBank].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(10, shuffled.length)).map((r) => r.question);
    setPracticeQuestions(selected);
    setView('practice');
  };

  const handleTableClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    tableRipple.onClick(e);
    setView('table');
  };

  const finishPractice = () => {
    setPracticeQuestions([]);
    setView('table');
  };

  return (
    <div className="quiz-module">
      <div className="quiz-module-header">
        <div className="quiz-module-nav">
          <button
            className={`nav-tab ripple-container ${view === 'table' ? 'nav-tab-active' : ''}`}
            onClick={handleTableClick}
          >
            <List size={16} />
            题库管理
            {tableRipple.rippleElements}
          </button>
          <button
            className={`nav-tab ripple-container ${view === 'practice' ? 'nav-tab-active' : ''}`}
            onClick={startPractice}
            disabled={quizBank.length === 0}
          >
            <Dumbbell size={16} />
            开始练习
            {practiceRipple.rippleElements}
          </button>
        </div>
        <div className="quiz-count">
          共 {quizBank.length} 道题目
        </div>
      </div>

      {view === 'table' && <QuizTable />}
      {view === 'practice' && practiceQuestions.length > 0 && (
        <PracticePanel questions={practiceQuestions} onFinish={finishPractice} />
      )}
    </div>
  );
}
