import { useState, useEffect } from 'react';
import TutorialStep, { StepData } from '../modules/tutorial/TutorialStep';
import TutorialReport from '../modules/tutorial/TutorialReport';
import tutorialSteps from '../data/tutorialSteps.json';
import { timingService } from '../services/TimingService';

interface TutorialPageProps {
  user: { username: string } | null;
}

export default function TutorialPage({ user }: TutorialPageProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const steps = tutorialSteps as StepData[];
  const totalSteps = steps.length;
  const estimatedTotal = steps.reduce((sum, s) => sum + (s.estimatedTime || 0), 0);

  useEffect(() => {
    timingService.loadFromStorage();
    const allTimings = timingService.getAllTimings();
    const completed = new Set<number>();
    allTimings.forEach((t) => {
      if (t.completed) completed.add(t.stepId);
    });
    setCompletedSteps(completed);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStepIndex, showReport]);

  const handleStepComplete = (stepId: number, _elapsedSeconds: number) => {
    setCompletedSteps((prev) => new Set(prev).add(stepId));
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      const currentStep = steps[currentStepIndex];
      const saved = timingService.getStepTiming(currentStep.id);
      if (!saved) {
        timingService.recordStep(currentStep.id, 0, true);
        timingService.saveToStorage();
      }
      setShowReport(true);
    }
  };

  const handleUploadComplete = () => {
    setCompletedSteps(new Set());
  };

  const isStepCompleted = (index: number) => {
    return completedSteps.has(steps[index].id);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🧵 手工钱包制作教程</h1>
        <p className="page-subtitle">跟随匠心工坊，一步步打造属于你的皮具作品</p>
      </div>

      {!showReport && (
        <div className="tutorial-progress">
          {steps.map((step, index) => {
            const isCurrent = index === currentStepIndex;
            const isCompleted = isStepCompleted(index);
            return (
              <div
                key={step.id}
                className={`progress-dot ${isCurrent ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                title={step.title}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  if (index < currentStepIndex || isCompleted) {
                    setCurrentStepIndex(index);
                  }
                }}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
            );
          })}
        </div>
      )}

      {!showReport ? (
        <TutorialStep
          step={steps[currentStepIndex]}
          stepNumber={currentStepIndex + 1}
          totalSteps={totalSteps}
          onStepComplete={handleStepComplete}
          onPrev={handlePrev}
          onNext={handleNext}
          canGoPrev={currentStepIndex > 0}
          canGoNext={true}
        />
      ) : (
        <TutorialReport
          totalSteps={totalSteps}
          estimatedTotalSeconds={estimatedTotal}
          user={user}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </div>
  );
}
