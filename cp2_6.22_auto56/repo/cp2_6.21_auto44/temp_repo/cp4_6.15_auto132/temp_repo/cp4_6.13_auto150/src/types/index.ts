export interface User {
  id: string;
  nickname: string;
  roomId: string;
  role: 'teacher' | 'student';
}

export interface Room {
  id: string;
  code: string;
  createdAt: string;
  creatorId: string;
  status: 'waiting' | 'reviewing' | 'completed';
}

export interface Submission {
  id: string;
  title: string;
  abstract: string;
  roomId: string;
  authorId: string;
}

export interface Review {
  id: string;
  reviewerId: string;
  submissionId: string;
  roomId: string;
  score: number;
  comment: string;
  dimension: DimensionType;
  createdAt: string;
}

export type DimensionType = 'communication' | 'cooperation' | 'responsibility' | 'innovation' | 'knowledge';

export interface LoginRequest {
  nickname: string;
  roomCode: string;
}

export interface LoginResponse {
  user: User;
  room: Room;
  submissions: Submission[];
  assignedSubmissions: Submission[];
}

export interface ReviewRequest {
  reviewerId: string;
  submissionId: string;
  roomId: string;
  score: number;
  comment: string;
}

export interface RadarDataPoint {
  dimension: string;
  dimensionKey: DimensionType;
  score: number;
  reviews: { score: number; comment: string }[];
}

export interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  tags: string[];
  score: number;
}

export interface FeedbackResponse {
  radarData: RadarDataPoint[];
  comments: CommentItem[];
  totalReviews: number;
  completedReviews: number;
}

export interface WebSocketMessage {
  type: 'review_update' | 'phase_change' | 'notification';
  data: {
    roomId: string;
    reviewCount?: number;
    totalRequired?: number;
    phase?: 'reviewing' | 'completed';
    message?: string;
  };
}

export const DIMENSION_LABELS: Record<DimensionType, string> = {
  communication: '沟通',
  cooperation: '合作',
  responsibility: '责任',
  innovation: '创新',
  knowledge: '知识',
};

export const DIMENSION_KEYWORDS: Record<DimensionType, string[]> = {
  communication: ['沟通', '表达', '交流', '清晰', '解释', '阐述', '说明', '讲述', '传达', '表达清晰', '沟通好', '善于沟通'],
  cooperation: ['合作', '协作', '团队', '配合', '协同', '互助', '团队精神', '协作能力强', '善于合作', '团队合作'],
  responsibility: ['责任', '认真', '负责', '严谨', '细心', '用心', '尽责', '有责任心', '认真负责', '态度认真'],
  innovation: ['创新', '新颖', '创意', '独特', '原创', '突破', '创新性', '有创意', '思路新颖', '创新思维', '有创新'],
  knowledge: ['知识', '专业', '扎实', '深入', '全面', '理解', '知识面', '专业性强', '知识扎实', '理解深刻', '专业知识'],
};

export const SENTIMENT_KEYWORDS = {
  positive: ['优秀', '出色', '很好', '棒', '赞', '完美', '精彩', '极佳', '杰出', '卓越', '好', '不错', '满意', '推荐', '值得', '优秀', '很棒', '非常好'],
  negative: ['差', '糟糕', '不好', '失望', '问题', '不足', '欠缺', '需要改进', '有待提高', '不够', '不足之处', '缺陷', '错误', '差劲', '不好', '不满意'],
};