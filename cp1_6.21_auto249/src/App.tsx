import { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import Scene3D from './pages/Scene3D';
import ControlPanel from './pages/ControlPanel';
import { DEFAULT_POSE } from './types';
import type { RobotPose, LegPose } from './types';
import { interpolatePose } from './robot/RobotController';

function deepClonePose(pose: RobotPose): RobotPose {
  return {
    legs: pose.legs.map((leg) => ({ ...leg })),
  };
}

export default function App() {
  const [pose, setPose] = useState<RobotPose>(() => deepClonePose(DEFAULT_POSE));
  const [selectedLeg, setSelectedLeg] = useState<number | null>(null);
  const animRef = useRef<number | null>(null);

  const handleJointChange = useCallback(
    (legIndex: number, joint: keyof LegPose, value: number) => {
      setPose((prev) => {
        const next = deepClonePose(prev);
        next.legs[legIndex][joint] = value;
        return next;
      });
    },
    []
  );

  const handleResetPose = useCallback(() => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }

    const fromPose = deepClonePose(pose);
    const toPose = deepClonePose(DEFAULT_POSE);
    const duration = 500;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const interpolated = interpolatePose(fromPose, toPose, t);
      setPose(interpolated);
      if (t < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        animRef.current = null;
      }
    };
    animRef.current = requestAnimationFrame(tick);
  }, [pose]);

  const handleSavePose = useCallback(async (): Promise<string | null> => {
    try {
      const res = await axios.post('/api/pose', { pose });
      return res.data.id as string;
    } catch (err) {
      console.error('Failed to save pose:', err);
      return null;
    }
  }, [pose]);

  useEffect(() => {
    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        background: '#0F172A',
        overflow: 'hidden',
      }}
    >
      <ControlPanel
        pose={pose}
        selectedLeg={selectedLeg}
        onSelectLeg={setSelectedLeg}
        onJointChange={handleJointChange}
        onResetPose={handleResetPose}
        onSavePose={handleSavePose}
      />
      <div style={{ flex: 1, position: 'relative' }}>
        <Scene3D pose={pose} selectedLeg={selectedLeg} />
      </div>
    </div>
  );
}
