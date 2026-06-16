export interface PatternKeyframe {
  time: number
  jointAngles: number[]
  jointTorques: number[]
}

export interface NeuralPattern {
  id: string
  name: string
  description: string
  duration: number
  keyframes: PatternKeyframe[]
  waveformType: 'sine' | 'square' | 'mixed'
}

export const patterns: Record<string, NeuralPattern> = {
  grasp: {
    id: 'grasp',
    name: '抓握',
    description: '手指和指尖弯曲执行抓握动作',
    duration: 4.0,
    waveformType: 'mixed',
    keyframes: [
      { time: 0.0, jointAngles: [0, 0, 0, 0, 0], jointTorques: [0, 0, 0, 0, 0] },
      { time: 0.5, jointAngles: [10, 20, 15, 0, 0], jointTorques: [10, 25, 20, 0, 0] },
      { time: 1.0, jointAngles: [15, 45, 30, 45, 60], jointTorques: [15, 40, 35, 60, 80] },
      { time: 1.5, jointAngles: [20, 70, 45, 90, 120], jointTorques: [20, 55, 50, 85, 95] },
      { time: 2.0, jointAngles: [25, 90, 60, 135, 160], jointTorques: [25, 70, 65, 95, 100] },
      { time: 2.5, jointAngles: [25, 90, 60, 135, 160], jointTorques: [25, 70, 65, 95, 100] },
      { time: 3.2, jointAngles: [20, 60, 40, 80, 100], jointTorques: [20, 50, 45, 60, 70] },
      { time: 4.0, jointAngles: [0, 0, 0, 0, 0], jointTorques: [0, 0, 0, 0, 0] }
    ]
  },
  lift: {
    id: 'lift',
    name: '抬举',
    description: '肩部和肘部协调完成抬举动作',
    duration: 4.5,
    waveformType: 'sine',
    keyframes: [
      { time: 0.0, jointAngles: [0, 0, 0, 0, 0], jointTorques: [0, 0, 0, 0, 0] },
      { time: 0.8, jointAngles: [30, 15, 10, 0, 0], jointTorques: [35, 20, 15, 0, 0] },
      { time: 1.6, jointAngles: [60, 45, 20, 0, 0], jointTorques: [55, 45, 25, 0, 0] },
      { time: 2.4, jointAngles: [90, 80, 30, 0, 0], jointTorques: [75, 65, 35, 0, 0] },
      { time: 3.0, jointAngles: [110, 95, 40, 0, 0], jointTorques: [85, 75, 40, 0, 0] },
      { time: 3.6, jointAngles: [90, 70, 30, 0, 0], jointTorques: [70, 55, 30, 0, 0] },
      { time: 4.5, jointAngles: [0, 0, 0, 0, 0], jointTorques: [0, 0, 0, 0, 0] }
    ]
  },
  rotate: {
    id: 'rotate',
    name: '旋转',
    description: '腕部执行旋转动作',
    duration: 3.5,
    waveformType: 'square',
    keyframes: [
      { time: 0.0, jointAngles: [0, 90, 0, 0, 0], jointTorques: [0, 40, 0, 0, 0] },
      { time: 0.4, jointAngles: [0, 90, 45, 0, 0], jointTorques: [0, 40, 50, 0, 0] },
      { time: 0.8, jointAngles: [0, 90, 90, 0, 0], jointTorques: [0, 40, 70, 0, 0] },
      { time: 1.2, jointAngles: [0, 90, 135, 0, 0], jointTorques: [0, 40, 85, 0, 0] },
      { time: 1.6, jointAngles: [0, 90, 180, 0, 0], jointTorques: [0, 40, 100, 0, 0] },
      { time: 2.0, jointAngles: [0, 90, 135, 0, 0], jointTorques: [0, 40, 80, 0, 0] },
      { time: 2.4, jointAngles: [0, 90, 90, 0, 0], jointTorques: [0, 40, 60, 0, 0] },
      { time: 2.8, jointAngles: [0, 90, 45, 0, 0], jointTorques: [0, 40, 40, 0, 0] },
      { time: 3.5, jointAngles: [0, 0, 0, 0, 0], jointTorques: [0, 0, 0, 0, 0] }
    ]
  },
  tap: {
    id: 'tap',
    name: '点按',
    description: '指尖快速点按动作',
    duration: 3.0,
    waveformType: 'square',
    keyframes: [
      { time: 0.0, jointAngles: [45, 90, 0, 30, 0], jointTorques: [30, 50, 0, 20, 0] },
      { time: 0.3, jointAngles: [45, 90, 0, 30, 40], jointTorques: [30, 50, 0, 20, 50] },
      { time: 0.6, jointAngles: [45, 90, 0, 30, 0], jointTorques: [30, 50, 0, 20, 0] },
      { time: 0.9, jointAngles: [45, 90, 0, 30, 40], jointTorques: [30, 50, 0, 20, 50] },
      { time: 1.2, jointAngles: [45, 90, 0, 30, 0], jointTorques: [30, 50, 0, 20, 0] },
      { time: 1.5, jointAngles: [45, 90, 0, 30, 40], jointTorques: [30, 50, 0, 20, 50] },
      { time: 1.8, jointAngles: [45, 90, 0, 30, 0], jointTorques: [30, 50, 0, 20, 0] },
      { time: 2.1, jointAngles: [45, 90, 0, 30, 40], jointTorques: [30, 50, 0, 20, 50] },
      { time: 2.4, jointAngles: [45, 90, 0, 30, 0], jointTorques: [30, 50, 0, 20, 0] },
      { time: 3.0, jointAngles: [0, 0, 0, 0, 0], jointTorques: [0, 0, 0, 0, 0] }
    ]
  },
  pulse: {
    id: 'pulse',
    name: '脉冲发射',
    description: '全关节高强度脉冲信号',
    duration: 5.0,
    waveformType: 'mixed',
    keyframes: [
      { time: 0.0, jointAngles: [0, 0, 0, 0, 0], jointTorques: [0, 0, 0, 0, 0] },
      { time: 0.5, jointAngles: [30, 60, 90, 60, 30], jointTorques: [40, 60, 80, 60, 40] },
      { time: 0.8, jointAngles: [0, 0, 0, 0, 0], jointTorques: [0, 0, 0, 0, 0] },
      { time: 1.3, jointAngles: [45, 90, 120, 90, 45], jointTorques: [55, 75, 90, 75, 55] },
      { time: 1.6, jointAngles: [0, 0, 0, 0, 0], jointTorques: [0, 0, 0, 0, 0] },
      { time: 2.1, jointAngles: [60, 120, 150, 120, 60], jointTorques: [70, 90, 100, 90, 70] },
      { time: 2.4, jointAngles: [0, 0, 0, 0, 0], jointTorques: [0, 0, 0, 0, 0] },
      { time: 2.9, jointAngles: [75, 140, 170, 140, 75], jointTorques: [85, 95, 100, 95, 85] },
      { time: 3.2, jointAngles: [0, 0, 0, 0, 0], jointTorques: [0, 0, 0, 0, 0] },
      { time: 3.7, jointAngles: [90, 160, 180, 160, 90], jointTorques: [100, 100, 100, 100, 100] },
      { time: 4.0, jointAngles: [0, 0, 0, 0, 0], jointTorques: [0, 0, 0, 0, 0] },
      { time: 5.0, jointAngles: [0, 0, 0, 0, 0], jointTorques: [0, 0, 0, 0, 0] }
    ]
  }
}
