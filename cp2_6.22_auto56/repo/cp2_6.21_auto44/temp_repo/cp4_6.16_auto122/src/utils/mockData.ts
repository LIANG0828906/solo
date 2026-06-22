import { v4 as uuidv4 } from 'uuid';
import type { User, SocialPost, Workout, WorkoutExercise, Plan } from '../types';
import { getRandomInt, getRandomElement } from './helpers';

const PRESET_EXERCISES = [
  { id: 'squat', name: '深蹲', category: '腿部' },
  { id: 'bench', name: '卧推', category: '胸部' },
  { id: 'deadlift', name: '硬拉', category: '背部' },
  { id: 'shoulder', name: '肩推', category: '肩部' },
  { id: 'curl', name: '弯举', category: '手臂' },
  { id: 'row', name: '划船', category: '背部' },
  { id: 'pullup', name: '引体向上', category: '背部' },
  { id: 'legpress', name: '腿举', category: '腿部' },
];

const FRIEND_NAMES = ['张伟', '李明', '王芳', '刘洋', '陈静'];

export const PRESET_EXERCISE_LIST = PRESET_EXERCISES;

export function generateMockUsers(): User[] {
  return FRIEND_NAMES.map(name => ({
    id: uuidv4(),
    name,
    avatarInitial: name[0],
  }));
}

function generateRandomWorkout(planId: string, planName: string, daysAgo: number): Workout {
  const exerciseCount = getRandomInt(3, 6);
  const shuffled = [...PRESET_EXERCISES].sort(() => Math.random() - 0.5);
  const selectedExercises = shuffled.slice(0, exerciseCount);

  const exercises: WorkoutExercise[] = selectedExercises.map(ex => {
    const setCount = getRandomInt(3, 5);
    const baseWeight = getRandomInt(40, 120);

    return {
      exerciseId: ex.id,
      exerciseName: ex.name,
      sets: Array.from({ length: setCount }, (_, i) => ({
        setNumber: i + 1,
        weight: baseWeight + getRandomInt(-10, 10),
        reps: getRandomInt(5, 12),
        completed: Math.random() > 0.1,
      })),
    };
  });

  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(getRandomInt(6, 20), getRandomInt(0, 59), 0, 0);

  return {
    id: uuidv4(),
    planId,
    planName,
    date: date.getTime(),
    duration: getRandomInt(30, 90),
    exercises,
  };
}

function generatePlanName(): string {
  const prefixes = ['强力', '增肌', '减脂', '力量', '塑形'];
  const suffixes = ['计划', '训练', '方案', '日程'];
  return `${getRandomElement(prefixes)}${getRandomElement(suffixes)}`;
}

export function generateMockSocialPosts(count: number = 50): SocialPost[] {
  const users = generateMockUsers();
  const posts: SocialPost[] = [];

  for (let i = 0; i < count; i++) {
    const user = getRandomElement(users);
    const daysAgo = getRandomInt(0, 6);
    const planId = uuidv4();
    const planName = generatePlanName();
    const workout = generateRandomWorkout(planId, planName, daysAgo);

    posts.push({
      id: uuidv4(),
      userId: user.id,
      userName: user.name,
      workoutId: workout.id,
      date: workout.date,
      likes: getRandomInt(0, 50),
      liked: Math.random() > 0.7,
      comments: Array.from({ length: getRandomInt(0, 5) }, () => {
        const commentUser = getRandomElement(users.filter(u => u.id !== user.id));
        return {
          id: uuidv4(),
          userId: commentUser.id,
          userName: commentUser.name,
          content: getRandomElement([
            '厉害！',
            '加油！',
            '今天练得不错',
            '重量涨了啊',
            '一起加油',
            '恢复得怎么样',
          ]),
          date: Date.now() - getRandomInt(0, 3600000),
        };
      }),
      workout,
    });
  }

  return posts.sort((a, b) => b.date - a.date);
}

export function generateMockPlans(): Plan[] {
  const plans: Plan[] = [];

  const planConfigs = [
    { name: '全身力量计划', desc: '每周三次全身训练，快速提升基础力量', exerciseCount: 6 },
    { name: '上肢增肌计划', desc: '专注上肢肌肉发展，适合进阶训练者', exerciseCount: 5 },
  ];

  for (const config of planConfigs) {
    const shuffled = [...PRESET_EXERCISES].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, config.exerciseCount);

    plans.push({
      id: uuidv4(),
      name: config.name,
      description: config.desc,
      exercises: selected.map((ex, idx) => ({
        id: uuidv4(),
        name: ex.name,
        presetId: ex.id,
        order: idx,
      })),
      createdAt: Date.now() - getRandomInt(1, 30) * 86400000,
    });
  }

  return plans;
}

export function generateUserWorkoutHistory(planId: string, planName: string, days: number = 30): Workout[] {
  const workouts: Workout[] = [];
  const workoutDays = Math.floor(days / 3);

  for (let i = 0; i < workoutDays; i++) {
    const daysAgo = i * 3 + getRandomInt(0, 1);
    if (daysAgo < days) {
      workouts.push(generateRandomWorkout(planId, planName, daysAgo));
    }
  }

  return workouts.sort((a, b) => a.date - b.date);
}

export function getFriendWorkoutsForWeek(userId: string): Workout[] {
  const workouts: Workout[] = [];
  const numWorkouts = getRandomInt(2, 5);

  for (let i = 0; i < numWorkouts; i++) {
    const daysAgo = getRandomInt(0, 6);
    const planId = uuidv4();
    workouts.push(generateRandomWorkout(planId, generatePlanName(), daysAgo));
  }

  return workouts;
}

export function getExerciseProgress(exerciseName: string, days: number = 30): { date: number; weight: number }[] {
  const points: { date: number; weight: number }[] = [];
  const now = Date.now();
  const startWeight = getRandomInt(50, 80);

  for (let i = days; i >= 0; i -= 3) {
    const date = now - i * 86400000;
    const progress = ((days - i) / days) * getRandomInt(5, 20);
    const variation = getRandomInt(-3, 3);
    points.push({
      date,
      weight: Math.round((startWeight + progress + variation) * 10) / 10,
    });
  }

  return points;
}
