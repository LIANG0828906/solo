import { useGameStore } from '../store';
import WaitingRoom from './WaitingRoom';
import QuestionCard from './QuestionCard';
import ResultScreen from './ResultScreen';

export default function QuizRoom() {
  const phase = useGameStore((s) => s.phase);

  return (
    <div className="flex-1 flex items-center justify-center px-4 md:px-8 py-8">
      {phase === 'waiting' && <WaitingRoom />}
      {phase === 'playing' && <QuestionCard />}
      {phase === 'result' && <ResultScreen />}
    </div>
  );
}
