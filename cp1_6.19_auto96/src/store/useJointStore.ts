import { create } from 'zustand';
import { JointKey, JOINTS, calculateRiskScore } from '../utils/anatomyData';

export interface AngleHistoryPoint {
  timestamp: number;
  angle: number;
}

export interface JointState {
  angles: Record<JointKey, number>;
  targetAngles: Record<JointKey, number>;
  selectedJoint: JointKey;
  riskScore: number;
  hasEvaluatedRisk: boolean;
  history: Record<JointKey, AngleHistoryPoint[]>;
  expandedJoints: Record<JointKey, boolean>;
  setAngle: (joint: JointKey, angle: number) => void;
  setTargetAngle: (joint: JointKey, angle: number) => void;
  setSelectedJoint: (joint: JointKey) => void;
  toggleJointExpanded: (joint: JointKey) => void;
  addHistoryPoint: (joint: JointKey, angle: number) => void;
  evaluateRisk: () => void;
  resetRiskScore: () => void;
}

const initialAngles: Record<JointKey, number> = JOINTS.reduce(
  (acc, joint) => {
    acc[joint.key] = joint.initialAngle;
    return acc;
  },
  {} as Record<JointKey, number>
);

const initialExpanded: Record<JointKey, boolean> = JOINTS.reduce(
  (acc, joint) => {
    acc[joint.key] = true;
    return acc;
  },
  {} as Record<JointKey, boolean>
);

const initialHistory: Record<JointKey, AngleHistoryPoint[]> = JOINTS.reduce(
  (acc, joint) => {
    acc[joint.key] = [];
    return acc;
  },
  {} as Record<JointKey, AngleHistoryPoint[]>
);

export const useJointStore = create<JointState>((set, get) => ({
  angles: { ...initialAngles },
  targetAngles: { ...initialAngles },
  selectedJoint: 'shoulder',
  riskScore: 0,
  hasEvaluatedRisk: false,
  history: { ...initialHistory },
  expandedJoints: { ...initialExpanded },

  setAngle: (joint, angle) =>
    set((state) => ({
      angles: { ...state.angles, [joint]: angle }
    })),

  setTargetAngle: (joint, angle) =>
    set((state) => ({
      targetAngles: { ...state.targetAngles, [joint]: angle }
    })),

  setSelectedJoint: (joint) => set({ selectedJoint: joint }),

  toggleJointExpanded: (joint) =>
    set((state) => ({
      expandedJoints: {
        ...state.expandedJoints,
        [joint]: !state.expandedJoints[joint]
      }
    })),

  addHistoryPoint: (joint, angle) =>
    set((state) => {
      const now = Date.now();
      const thirtySecondsAgo = now - 30000;
      const jointHistory = state.history[joint].filter(
        (p) => p.timestamp >= thirtySecondsAgo
      );
      jointHistory.push({ timestamp: now, angle });
      return {
        history: {
          ...state.history,
          [joint]: jointHistory
        }
      };
    }),

  evaluateRisk: () => {
    const { angles } = get();
    const score = calculateRiskScore(angles);
    set({ riskScore: score, hasEvaluatedRisk: true });
  },

  resetRiskScore: () => set({ riskScore: 0, hasEvaluatedRisk: false })
}));
