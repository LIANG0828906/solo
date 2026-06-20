import { useEffect, useRef, useState } from 'react';
import { GameLoop, useGameStore } from './GameLoop';
import { useSkillStore, SkillType } from './SkillManager';
import './app.css';

const SKILL_ORDER: SkillType[] = ['dash', 'shield', 'doubleJump', 'slowTime'];

interface SkillUIState {
  cooldownPercent: number;
  isReady: boolean;
  icon: string;
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<GameLoop | null>(null);
  const animationRef = useRef<number | null>(null);
  const flashingRef = useRef<Set<SkillType>>(new Set());
  const [flashingSkills, setFlashingSkills] = useState<Set<SkillType>>(new Set());
  const [skillStates, setSkillStates] = useState<Record<SkillType, SkillUIState>>({
    dash: { cooldownPercent: 100, isReady: true, icon: '→' },
    shield: { cooldownPercent: 100, isReady: true, icon: '◈' },
    doubleJump: { cooldownPercent: 100, isReady: true, icon: '↑' },
    slowTime: { cooldownPercent: 100, isReady: true, icon: '◉' },
  });

  const fps = useGameStore((state) => state.fps);
  const isSlowMotion = useSkillStore((state) => state.skills.slowTime.isActive);
  const resetJustReady = useSkillStore((state) => state.resetJustReady);

  useEffect(() => {
    if (!canvasRef.current) return;

    const gameLoop = new GameLoop(canvasRef.current);
    gameLoopRef.current = gameLoop;
    gameLoop.start();

    const handleKeyDown = (e: KeyboardEvent) => {
      gameLoop.handleKeyDown(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      gameLoop.stop();
    };
  }, []);

  useEffect(() => {
    const updateUI = () => {
      const skills = useSkillStore.getState().skills;
      const newSkillStates: Record<SkillType, SkillUIState> = {} as Record<SkillType, SkillUIState>;

      SKILL_ORDER.forEach((skillId) => {
        const skill = skills[skillId];
        let percent: number;
        if (skill.isReady) {
          percent = 100;
        } else {
          percent = ((skill.cooldown - skill.currentCooldown) / skill.cooldown) * 100;
        }

        if (skill.justReady && !flashingRef.current.has(skillId)) {
          flashingRef.current.add(skillId);
          setFlashingSkills(new Set(flashingRef.current));
          setTimeout(() => {
            resetJustReady(skillId);
            flashingRef.current.delete(skillId);
            setFlashingSkills(new Set(flashingRef.current));
          }, 300);
        }

        newSkillStates[skillId] = {
          cooldownPercent: percent,
          isReady: skill.isReady,
          icon: skill.icon,
        };
      });

      setSkillStates(newSkillStates);
      animationRef.current = requestAnimationFrame(updateUI);
    };

    animationRef.current = requestAnimationFrame(updateUI);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="game-container">
      <div className={`fps-display ${isSlowMotion ? 'slow' : ''}`}>
        FPS: {fps}
      </div>

      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        className="game-canvas"
      />

      <div className="skills-container">
        {SKILL_ORDER.map((skillId) => {
          const state = skillStates[skillId];
          const isFlashing = flashingSkills.has(skillId);

          return (
            <div key={skillId} className="skill-slot">
              <div className="skill-icon">{state.icon}</div>
              <div className="cooldown-bar">
                <div
                  className={`cooldown-fill ${state.isReady ? 'ready' : ''} ${isFlashing ? 'flash' : ''}`}
                  style={{ width: `${state.cooldownPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
