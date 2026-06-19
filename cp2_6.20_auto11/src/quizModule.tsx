import { useState } from 'react';
import { useQuizStore } from '@/hooks/useQuizStore';
import QuizTable from '@/components/QuizTable';
import PracticePanel from '@/components/PracticePanel';
import type { Question } from '@/utils/api';
import { Dumbbell, List } from 'lucide-react';

type ViewMode = 'table' | 'practice';

export default function QuizModule() {
  const quizBank = useQuizStore((s) => s.quizBank);
  const [view, setView] = useState<ViewMode>('table');
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);

  const startPractice = () => {
    if (quizBank.length === 0) return;
    const shuffled = [...quizBank].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(10, shuffled.length)).map((r) => r.question);
    setPracticeQuestions(selected);
    setView('practice');
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
            className={`nav-tab ${view === 'table' ? 'nav-tab-active' : ''}`}
            onClick={() => setView('table')}
          >
            <List size={16} />
            题库管理
          </button>
          <button
            className={`nav-tab ${view === 'practice' ? 'nav-tab-active' : ''}`}
            onClick={startPractice}
            disabled={quizBank.length === 0}
          >
            <Dumbbell size={16} />
            开始练习
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
