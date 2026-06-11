import { Joint, Frame, Pose, TRANSITION_FRAMES } from './types.js';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpJoint(jointA: Joint, jointB: Joint, t: number): Joint {
  return {
    id: jointA.id,
    name: jointA.name,
    x: lerp(jointA.x, jointB.x, t),
    y: lerp(jointA.y, jointB.y, t)
  };
}

export function interpolatePoses(poseA: Pose, poseB: Pose): Frame[] {
  const frames: Frame[] = [];

  if (poseA.joints.length === 0 || poseB.joints.length === 0) {
    return frames;
  }

  const jointCount = Math.min(poseA.joints.length, poseB.joints.length);

  for (let i = 1; i <= TRANSITION_FRAMES; i++) {
    const t = i / (TRANSITION_FRAMES + 1);
    const joints: Joint[] = [];

    for (let j = 0; j < jointCount; j++) {
      joints.push(lerpJoint(poseA.joints[j], poseB.joints[j], t));
    }

    frames.push({
      joints,
      isKeyFrame: false
    });
  }

  return frames;
}

export function buildAnimationFrames(poses: Pose[]): Frame[] {
  if (poses.length === 0) return [];
  if (poses.length === 1) {
    return [{
      joints: JSON.parse(JSON.stringify(poses[0].joints)),
      isKeyFrame: true,
      keyFrameIndex: 0
    }];
  }

  const allFrames: Frame[] = [];

  for (let i = 0; i < poses.length; i++) {
    const pose = poses[i];

    allFrames.push({
      joints: JSON.parse(JSON.stringify(pose.joints)),
      isKeyFrame: true,
      keyFrameIndex: i
    });

    if (i < poses.length - 1) {
      const transitions = interpolatePoses(pose, poses[i + 1]);
      allFrames.push(...transitions);
    }
  }

  return allFrames;
}
