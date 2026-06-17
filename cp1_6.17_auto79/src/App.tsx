import { useState, useCallback } from 'react';
import InterviewSession from '@/modules/interview/InterviewSession';
import ScoringPanel from '@/modules/scoring/ScoringPanel';
import PlaybackPanel from '@/modules/playback/PlaybackPanel';
import { useScoringStore } from '@/modules/scoring/ScoringStore';

export default function App() {
  const [currentInterviewId, setCurrentInterviewId] = useState<string | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const { addInterview } = useScoringStore();

  const handleInterviewStart = useCallback(
    (interviewId: string, questionIds: string[]) => {
      setCurrentInterviewId(interviewId);
      addInterview({
        interviewId,
        date: new Date().toLocaleString('zh-CN'),
        questionIds,
      });
    },
    [addInterview]
  );

  const handleQuestionChange = useCallback((questionId: string) => {
    setCurrentQuestionId(questionId);
  }, []);

  const handleInterviewEnd = useCallback(() => {
    setCurrentInterviewId(null);
    setCurrentQuestionId(null);
  }, []);

  return (
    <div className="h-screen w-screen bg-[#F5F7FA] overflow-hidden">
      <div className="h-full flex flex-col md:flex-row">
        <aside
          className="hidden md:flex md:w-[400px] md:min-w-[400px] flex-col
            bg-white rounded-xl m-3 mr-0 p-4 shadow-[0_1px_3px_#00000010]"
        >
          <PlaybackPanel />
        </aside>

        <div className="flex-1 flex flex-col m-3 gap-3 min-h-0 overflow-hidden">
          <div
            className="md:hidden overflow-x-auto pb-2 flex gap-2
              bg-white rounded-xl p-3 shadow-[0_1px_3px_#00000010]"
          >
            <PlaybackPanel />
          </div>

          <div
            className="flex-[2] min-h-0 bg-white rounded-xl
              shadow-[0_1px_3px_#00000010] overflow-hidden"
          >
            <InterviewSession
              onInterviewStart={handleInterviewStart}
              onQuestionChange={handleQuestionChange}
              onInterviewEnd={handleInterviewEnd}
              currentQuestionId={currentQuestionId}
            />
          </div>

          <div
            className="flex-[1] min-h-0 bg-[#FAFAFA] rounded-xl
              shadow-[0_1px_2px_#00000008] overflow-hidden"
          >
            <ScoringPanel
              interviewId={currentInterviewId}
              questionId={currentQuestionId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
