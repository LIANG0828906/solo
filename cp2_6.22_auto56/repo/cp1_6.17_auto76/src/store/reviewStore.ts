import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Submission, Review, UserRanking } from '@/types';

const CURRENT_USER_ID = 'user-current';
const CURRENT_USER_NAME = '我';

interface ReviewState {
  submissions: Submission[];
  reviews: Review[];
  currentSubmissionId: string | null;
  initMockData: () => void;
  addSubmission: (challengeId: string, code: string, userId?: string, userName?: string) => string;
  getSubmissionsByChallenge: (challengeId: string) => Submission[];
  addReview: (submissionId: string, rating: number, comment: string, reviewerId?: string, reviewerName?: string) => void;
  getReviewsBySubmission: (submissionId: string) => Review[];
  getAverageRating: (submissionId: string) => number;
  getUserRankings: () => UserRanking[];
  getCurrentUserRanking: () => UserRanking | undefined;
  setCurrentSubmissionId: (id: string | null) => void;
}

const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

const saveToStorage = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
};

const mockSubmissions: Submission[] = [
  {
    id: 'sub-1',
    challengeId: '1',
    userId: 'user-alice',
    userName: 'Alice',
    code: `function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}`,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'sub-2',
    challengeId: '1',
    userId: 'user-bob',
    userName: 'Bob',
    code: `function twoSum(nums, target) {\n  for (let i = 0; i < nums.length; i++) {\n    for (let j = i + 1; j < nums.length; j++) {\n      if (nums[i] + nums[j] === target) {\n        return [i, j];\n      }\n    }\n  }\n  return [];\n}`,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'sub-3',
    challengeId: '3',
    userId: 'user-charlie',
    userName: 'Charlie',
    code: `function longestPalindrome(s) {\n  let start = 0, end = 0;\n  for (let i = 0; i < s.length; i++) {\n    const len1 = expand(s, i, i);\n    const len2 = expand(s, i, i + 1);\n    const len = Math.max(len1, len2);\n    if (len > end - start) {\n      start = i - Math.floor((len - 1) / 2);\n      end = i + Math.floor(len / 2);\n    }\n  }\n  return s.substring(start, end + 1);\n}\n\nfunction expand(s, left, right) {\n  while (left >= 0 && right < s.length && s[left] === s[right]) {\n    left--;\n    right++;\n  }\n  return right - left - 1;\n}`,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

const mockReviews: Review[] = [
  {
    id: 'rev-1',
    submissionId: 'sub-1',
    reviewerId: 'user-bob',
    reviewerName: 'Bob',
    rating: 5,
    comment: '哈希表解法很优雅！时间复杂度O(n)，代码简洁清晰。',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'rev-2',
    submissionId: 'sub-1',
    reviewerId: 'user-charlie',
    reviewerName: 'Charlie',
    rating: 4,
    comment: '不错的解法，建议添加边界条件检查。',
    createdAt: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: 'rev-3',
    submissionId: 'sub-2',
    reviewerId: 'user-alice',
    reviewerName: 'Alice',
    rating: 3,
    comment: '暴力解法可以工作，但时间复杂度较高，建议优化。',
    createdAt: new Date(Date.now() - 21600000).toISOString(),
  },
  {
    id: 'rev-4',
    submissionId: 'sub-3',
    reviewerId: 'user-alice',
    reviewerName: 'Alice',
    rating: 5,
    comment: '中心扩展法实现得很好！逻辑清晰，代码可读性强。',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

export const useReviewStore = create<ReviewState>((set, get) => ({
  submissions: [],
  reviews: [],
  currentSubmissionId: null,

  initMockData: () => {
    const storedSubmissions = loadFromStorage<Submission[]>('cc_submissions', []);
    const storedReviews = loadFromStorage<Review[]>('cc_reviews', []);
    
    const submissions = storedSubmissions.length > 0 ? storedSubmissions : mockSubmissions;
    const reviews = storedReviews.length > 0 ? storedReviews : mockReviews;
    
    if (storedSubmissions.length === 0) {
      saveToStorage('cc_submissions', mockSubmissions);
    }
    if (storedReviews.length === 0) {
      saveToStorage('cc_reviews', mockReviews);
    }
    
    set({ submissions, reviews });
  },

  addSubmission: (challengeId, code, userId = CURRENT_USER_ID, userName = CURRENT_USER_NAME) => {
    const newSubmission: Submission = {
      id: uuidv4(),
      challengeId,
      userId,
      userName,
      code,
      createdAt: new Date().toISOString(),
    };
    const submissions = [...get().submissions, newSubmission];
    saveToStorage('cc_submissions', submissions);
    set({ submissions, currentSubmissionId: newSubmission.id });
    return newSubmission.id;
  },

  getSubmissionsByChallenge: (challengeId) => {
    return get().submissions.filter((s) => s.challengeId === challengeId);
  },

  addReview: (submissionId, rating, comment, reviewerId = CURRENT_USER_ID, reviewerName = CURRENT_USER_NAME) => {
    const newReview: Review = {
      id: uuidv4(),
      submissionId,
      reviewerId,
      reviewerName,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };
    const reviews = [...get().reviews, newReview];
    saveToStorage('cc_reviews', reviews);
    set({ reviews });
  },

  getReviewsBySubmission: (submissionId) => {
    return get().reviews
      .filter((r) => r.submissionId === submissionId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getAverageRating: (submissionId) => {
    const reviews = get().reviews.filter((r) => r.submissionId === submissionId);
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  },

  getUserRankings: () => {
    const { submissions, reviews } = get();
    const userScores = new Map<string, { total: number; count: number; name: string }>();

    submissions.forEach((sub) => {
      const subReviews = reviews.filter((r) => r.submissionId === sub.id);
      if (subReviews.length > 0) {
        const avg = subReviews.reduce((acc, r) => acc + r.rating, 0) / subReviews.length;
        const existing = userScores.get(sub.userId);
        if (existing) {
          existing.total += avg;
          existing.count += 1;
        } else {
          userScores.set(sub.userId, { total: avg, count: 1, name: sub.userName });
        }
      }
    });

    const rankings: UserRanking[] = Array.from(userScores.entries())
      .map(([userId, data]) => ({
        userId,
        userName: data.name,
        averageScore: Math.round((data.total / data.count) * 10) / 10,
        rank: 0,
      }))
      .sort((a, b) => b.averageScore - a.averageScore);

    rankings.forEach((r, i) => {
      r.rank = i + 1;
    });

    return rankings;
  },

  getCurrentUserRanking: () => {
    return get().getUserRankings().find((r) => r.userId === CURRENT_USER_ID);
  },

  setCurrentSubmissionId: (id) => set({ currentSubmissionId: id }),
}));
