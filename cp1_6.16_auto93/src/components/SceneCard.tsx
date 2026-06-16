import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Scene, useSceneStore } from '../store/sceneStore';

interface SceneCardProps {
  scene: Scene;
  sceneIndex: number;
  isActive: boolean;
}

const SceneCard: React.FC<SceneCardProps> = ({ scene, sceneIndex, isActive }) => {
  const selectChoice = useSceneStore((s) => s.selectChoice);
  const [flipped, setFlipped] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'A' | 'B' | null>(null);
  const [fadeVisible, setFadeVisible] = useState(false);

  useEffect(() => {
    if (isActive) {
      setFadeVisible(false);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setFadeVisible(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setFadeVisible(false);
      setFlipped(false);
      setFlipDirection(null);
    }
  }, [isActive]);

  const handleChoice = useCallback(
    (choice: 'A' | 'B') => {
      if (flipped) return;
      setFlipDirection(choice);
      setFlipped(true);
      setTimeout(() => {
        selectChoice(scene.id, choice);
        setFlipped(false);
        setFlipDirection(null);
      }, 600);
    },
    [flipped, selectChoice, scene.id]
  );

  return (
    <div
      className={`scene-card ${isActive ? 'scene-card--active' : ''} ${fadeVisible ? 'scene-card--visible' : ''}`}
      style={{
        perspective: '1200px',
      }}
    >
      <div
        className={`scene-card__inner ${flipped ? `scene-card__inner--flip-${flipDirection?.toLowerCase()}` : ''}`}
      >
        <div className="scene-card__face scene-card__front">
          <h2 className="scene-card__title">{scene.title}</h2>
          <p className="scene-card__description">{scene.description}</p>
          <div className="scene-card__choices">
            <button
              className="scene-card__choice scene-card__choice--a"
              onClick={() => handleChoice('A')}
            >
              {scene.choices[0].label}
            </button>
            <button
              className="scene-card__choice scene-card__choice--b"
              onClick={() => handleChoice('B')}
            >
              {scene.choices[1].label}
            </button>
          </div>
          <div className="scene-card__badge">场景 {sceneIndex + 1}</div>
        </div>
      </div>
    </div>
  );
};

interface SceneCardListProps {}

export const SceneCardList: React.FC<SceneCardListProps> = () => {
  const scenes = useSceneStore((s) => s.scenes);
  const currentSceneIndex = useSceneStore((s) => s.currentSceneIndex);
  const setCurrentSceneIndex = useSceneStore((s) => s.setCurrentSceneIndex);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const velocity = useRef(0);
  const animFrameId = useRef<number>(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - (scrollRef.current?.offsetLeft || 0);
    scrollLeft.current = scrollRef.current?.scrollLeft || 0;
    velocity.current = 0;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grabbing';
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX.current) * 1.2;
    const delta = walk - ((scrollRef.current?.scrollLeft || 0) - scrollLeft.current);
    velocity.current = delta;
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft.current - walk;
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
    }

    const damping = 0.92;
    const animate = () => {
      if (Math.abs(velocity.current) < 0.5) return;
      velocity.current *= damping;
      if (scrollRef.current) {
        scrollRef.current.scrollLeft -= velocity.current;
      }
      animFrameId.current = requestAnimationFrame(animate);
    };
    cancelAnimationFrame(animFrameId.current);
    animFrameId.current = requestAnimationFrame(animate);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isDragging.current) {
      handleMouseUp();
    }
  }, [handleMouseUp]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const cardWidth = container.querySelector('.scene-card')?.clientWidth || 400;
    const gap = 24;
    const targetScroll = currentSceneIndex * (cardWidth + gap);
    container.scrollTo({ left: targetScroll, behavior: 'smooth' });
  }, [currentSceneIndex]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameId.current);
    };
  }, []);

  return (
    <div
      className="scene-card-list"
      ref={scrollRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <div className="scene-card-list__track">
        {scenes.map((scene, index) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            sceneIndex={index}
            isActive={index === currentSceneIndex}
          />
        ))}
      </div>
    </div>
  );
};

export default SceneCard;
