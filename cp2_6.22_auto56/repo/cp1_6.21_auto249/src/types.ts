export interface LegPose {
  coxa: number;
  femur: number;
  tibia: number;
}

export interface RobotPose {
  legs: LegPose[];
}

export interface SavedPose {
  id: string;
  createdAt: number;
  pose: RobotPose;
}

export interface PoseSummary {
  id: string;
  createdAt: number;
}

export interface JointTransform {
  position: [number, number, number];
  rotation: [number, number, number, number];
}

export const DEFAULT_POSE: RobotPose = {
  legs: Array(6).fill(null).map(() => ({
    coxa: 90,
    femur: 90,
    tibia: 90,
  })),
};
