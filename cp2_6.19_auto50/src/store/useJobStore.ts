import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Job, Referral, LeaderboardEntry } from '../types';

interface JobState {
  jobs: Job[];
  referrals: Referral[];
  addJob: (job: Omit<Job, 'id' | 'createdAt' | 'referrerCount'>) => void;
  addReferral: (referral: Omit<Referral, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => void;
  updateReferralStatus: (id: string, status: Referral['status']) => void;
  getJobById: (id: string) => Job | undefined;
  getReferralsByJobId: (jobId: string) => Referral[];
  getReferralsByReferrer: (referrerName: string) => Referral[];
  getLeaderboard: (jobId: string) => LeaderboardEntry[];
  getTotalBonus: () => number;
  getMonthlyBonus: () => { month: string; amount: number }[];
}

const mockJobs: Job[] = [
  {
    id: uuidv4(),
    title: '高级前端工程师',
    department: '技术部',
    location: '北京',
    salaryRange: '30k-50k',
    description: '负责公司核心产品的前端开发工作，参与技术架构设计和性能优化。',
    requirements: '3年以上React开发经验，熟悉TypeScript，有大型项目经验者优先。',
    bonus: 20000,
    createdAt: new Date().toISOString(),
    referrerCount: 5,
  },
  {
    id: uuidv4(),
    title: '产品经理',
    department: '产品部',
    location: '上海',
    salaryRange: '25k-40k',
    description: '负责产品规划、需求分析和产品迭代，协调研发、设计、运营团队。',
    requirements: '3年以上互联网产品经验，有B端产品经验者优先。',
    bonus: 15000,
    createdAt: new Date().toISOString(),
    referrerCount: 3,
  },
  {
    id: uuidv4(),
    title: '后端开发工程师',
    department: '技术部',
    location: '深圳',
    salaryRange: '28k-48k',
    description: '负责后端服务的设计与开发，保障系统的高可用和高性能。',
    requirements: '3年以上Java/Go开发经验，熟悉微服务架构。',
    bonus: 18000,
    createdAt: new Date().toISOString(),
    referrerCount: 4,
  },
  {
    id: uuidv4(),
    title: 'UI/UX设计师',
    department: '设计部',
    location: '杭州',
    salaryRange: '20k-35k',
    description: '负责产品界面设计和用户体验优化，参与设计规范制定。',
    requirements: '2年以上UI设计经验，熟练使用Figma/Sketch。',
    bonus: 12000,
    createdAt: new Date().toISOString(),
    referrerCount: 2,
  },
  {
    id: uuidv4(),
    title: '数据分析师',
    department: '数据部',
    location: '北京',
    salaryRange: '22k-38k',
    description: '负责业务数据分析，提供数据驱动的决策支持。',
    requirements: '2年以上数据分析经验，熟悉SQL和Python。',
    bonus: 15000,
    createdAt: new Date().toISOString(),
    referrerCount: 1,
  },
  {
    id: uuidv4(),
    title: '运维工程师',
    department: '技术部',
    location: '广州',
    salaryRange: '20k-35k',
    description: '负责生产环境的运维工作，保障系统稳定运行。',
    requirements: '2年以上Linux运维经验，熟悉K8s和Docker。',
    bonus: 13000,
    createdAt: new Date().toISOString(),
    referrerCount: 0,
  },
];

export const useJobStore = create<JobState>()(
  persist(
    (set, get) => ({
      jobs: mockJobs,
      referrals: [],

      addJob: (jobData) =>
        set((state) => ({
          jobs: [
            ...state.jobs,
            {
              ...jobData,
              id: uuidv4(),
              createdAt: new Date().toISOString(),
              referrerCount: 0,
            },
          ],
        })),

      addReferral: (referralData) =>
        set((state) => {
          const newReferral: Referral = {
            ...referralData,
            id: uuidv4(),
            status: '已投递',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return {
            referrals: [...state.referrals, newReferral],
            jobs: state.jobs.map((job) =>
              job.id === referralData.jobId
                ? { ...job, referrerCount: job.referrerCount + 1 }
                : job
            ),
          };
        }),

      updateReferralStatus: (id, status) =>
        set((state) => ({
          referrals: state.referrals.map((ref) =>
            ref.id === id
              ? { ...ref, status, updatedAt: new Date().toISOString() }
              : ref
          ),
        })),

      getJobById: (id) => get().jobs.find((job) => job.id === id),

      getReferralsByJobId: (jobId) =>
        get().referrals.filter((ref) => ref.jobId === jobId),

      getReferralsByReferrer: (referrerName) =>
        get().referrals.filter((ref) => ref.referrerName === referrerName),

      getLeaderboard: (jobId) => {
        const referrals = get().referrals.filter(
          (ref) => ref.jobId === jobId && ref.status === '已入职'
        );
        const countMap = new Map<string, number>();
        referrals.forEach((ref) => {
          countMap.set(
            ref.referrerName,
            (countMap.get(ref.referrerName) || 0) + 1
          );
        });
        return Array.from(countMap.entries())
          .map(([referrerName, successCount]) => ({
            referrerName,
            successCount,
          }))
          .sort((a, b) => b.successCount - a.successCount);
      },

      getTotalBonus: () => {
        const { jobs, referrals } = get();
        return referrals
          .filter((ref) => ref.status === '已入职')
          .reduce((total, ref) => {
            const job = jobs.find((j) => j.id === ref.jobId);
            return total + (job?.bonus || 0);
          }, 0);
      },

      getMonthlyBonus: () => {
        const { jobs, referrals } = get();
        const hiredReferrals = referrals.filter((ref) => ref.status === '已入职');
        const monthlyData = new Map<string, number>();

        for (let i = 11; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyData.set(monthKey, 0);
        }

        hiredReferrals.forEach((ref) => {
          const date = new Date(ref.updatedAt);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const job = jobs.find((j) => j.id === ref.jobId);
          if (job && monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + job.bonus);
          }
        });

        return Array.from(monthlyData.entries()).map(([month, amount]) => ({
          month,
          amount,
        }));
      },
    }),
    {
      name: 'job-store',
    }
  )
);
