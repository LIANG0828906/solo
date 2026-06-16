import { useState, useEffect, useRef } from 'react';
import type { Plan, Workout, WorkoutExercise, WorkoutSet } from '../types';
import { useAppStore } from '../store';
import './styles/WorkoutLogger.css';

interface WorkoutLoggerProps {
  plan: Plan;
  onComplete: (workout: Omit<Workout, 'id'>) => void;
  onCancel?: () => void;
}

const DEFAULT_SETS = 4;

export function WorkoutLogger({ plan, onComplete, onCancel }: WorkoutLoggerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [exerciseData, setExerciseData] = useState<WorkoutExercise[]>([]);
  const [lastMaxWeights, setLastMaxWeights] = useState<Record<string, WorkoutSet | null>>({});
  const [loadingHistory, setLoadingHistory] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const [animating, setAnimating] = useState(false);
  const getLastSetForExercise = useAppStore((state) => state.getLastSetForExercise);

  const sortedExercises = [...plan.exercises].sort((a, b) => a.order - b.order);

  useEffect(() => {
    const initialData: WorkoutExercise[] = sortedExercises.map((ex) => ({
      exerciseId: ex.id,
      exerciseName: ex.name,
      sets: Array.from({ length: DEFAULT_SETS }, (_, i) => ({
        setNumber: i + 1,
        weight: 0,
        reps: 0,
        completed: false,
      })),
    }));
    setExerciseData(initialData);
  }, [plan]);

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const results = await Promise.all(
          sortedExercises.map((ex) => getLastSetForExercise(plan.id, ex.id))
        );
        if (cancelled) return;
        const weightsMap: Record<string, WorkoutSet | null> = {};
        sortedExercises.forEach((ex, index) => {
          weightsMap[ex.id] = results[index];
        });
        setLastMaxWeights(weightsMap);
      } finally {
        if (!cancelled) {
          setLoadingHistory(false);
        }
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [plan.id, sortedExercises, getLastSetForExercise]);

  const handleSetChange = (
    exerciseIndex: number,
    setIndex: number,
    field: keyof WorkoutSet,
    value: number | boolean
  ) => {
    setExerciseData((prev) => {
      const newData = [...prev];
      const newSets = [...newData[exerciseIndex].sets];
      newSets[setIndex] = {
        ...newSets[setIndex],
        [field]: value,
      };
      newData[exerciseIndex] = {
        ...newData[exerciseIndex],
        sets: newSets,
      };
      return newData;
    });
  };

  const handleNext = () => {
    if (currentPage < sortedExercises.length - 1) {
      setAnimating(true);
      setTimeout(() => {
        setCurrentPage((prev) => prev + 1);
        setAnimating(false);
      }, 150);
    } else {
      const duration = Math.round((Date.now() - startTimeRef.current) / 60000);
      const workout: Omit<Workout, 'id'> = {
        planId: plan.id,
        planName: plan.name,
        date: Date.now(),
        duration: duration || 1,
        exercises: exerciseData,
      };
      onComplete(workout);
    }
  };

  const currentExercise = sortedExercises[currentPage];
  const currentSets = exerciseData[currentPage]?.sets || [];
  const lastSet = lastMaxWeights[currentExercise?.id || ''];

  return (
    <div className="workout-logger">
      <div className="workout-logger-header">
        <h2>{plan.name}</h2>
        {onCancel && (
          <button className="btn btn-ghost" onClick={onCancel}>
            取消
          </button>
        )}
      </div>

      <div className="workout-logger-body">
        {loadingHistory && (
          <div className="loading-hint">加载历史数据...</div>
        )}
        {currentExercise && exerciseData.length > 0 && !loadingHistory && (
          <div className={`exercise-page ${animating ? 'slide-out-left' : 'slide-in-right'}`}>
            <h3 className="exercise-name">{currentExercise.name}</h3>

            {lastSet && lastSet.weight > 0 && (
              <div className="last-weight-hint">
                上次最大重量：<span>{lastSet.weight}kg × {lastSet.reps}次</span>
              </div>
            )}

            <div className="sets-container">
              {currentSets.map((set, setIndex) => (
                <div key={setIndex} className="set-row">
                  <span className="set-number">{set.setNumber}</span>
                  <div className="set-input-group">
                    <input
                      type="number"
                      className="set-input"
                      placeholder="重量"
                      value={set.weight || ''}
                      onChange={(e) =>
                        handleSetChange(currentPage, setIndex, 'weight', Number(e.target.value))
                      }
                      min="0"
                      step="2.5"
                    />
                    <span className="set-unit">kg</span>
                  </div>
                  <div className="set-input-group">
                    <input
                      type="number"
                      className="set-input"
                      placeholder="次数"
                      value={set.reps || ''}
                      onChange={(e) =>
                        handleSetChange(currentPage, setIndex, 'reps', Number(e.target.value))
                      }
                      min="0"
                    />
                    <span className="set-unit">次</span>
                  </div>
                  <label className="set-checkbox">
                    <input
                      type="checkbox"
                      checked={set.completed}
                      onChange={(e) =>
                        handleSetChange(currentPage, setIndex, 'completed', e.target.checked)
                      }
                    />
                    <span className="checkbox-custom"></span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="workout-logger-footer">
        <div className="page-dots">
          {sortedExercises.map((_, index) => (
            <span
              key={index}
              className={`dot ${index === currentPage ? 'active' : ''}`}
            ></span>
          ))}
        </div>
        <button
          className="btn btn-primary"
          onClick={handleNext}
          disabled={exerciseData.length === 0 || loadingHistory}
        >
          {currentPage === sortedExercises.length - 1 ? '完成训练' : '完成本页'}
        </button>
      </div>
    </div>
  );
}
