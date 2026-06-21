export interface Diary {
  id: string;
  date: string;
  mood: 'happy' | 'calm' | 'sad' | 'anxious' | 'creative';
  content: string;
  createdAt: number;
}

export interface MoodConfig {
  type: string;
  emoji: string;
  color: string;
  score: number;
  label: string;
}

export const MOOD_CONFIG: Record<string, MoodConfig> = {
  happy:    { type: 'happy',    emoji: '😊', color: '#22C55E', score: 5, label: '开心' },
  calm:     { type: 'calm',     emoji: '😌', color: '#3B82F6', score: 4, label: '平静' },
  creative: { type: 'creative', emoji: '✨', color: '#A855F7', score: 3, label: '创意' },
  anxious:  { type: 'anxious',  emoji: '😰', color: '#F59E0B', score: 2, label: '焦虑' },
  sad:      { type: 'sad',      emoji: '😢', color: '#EF4444', score: 1, label: '难过' },
};

export const STOP_WORDS = new Set([
  '的', '了', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
  '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看',
  '好', '自己', '这', '那', '他', '她', '它', '们', '这个', '那个', '什么',
  '怎么', '为什么', '哪', '哪里', '今天', '明天', '昨天', '天', '在', '与',
  '及', '等', '但', '但是', '而', '然而', '或', '或者', '因为', '所以',
  '如果', '虽然', '还是', '可以', '可能', '应该', '必须', '需要', '让',
  '被', '把', '给', '从', '向', '对', '以', '为', '于', '中', '里', '外',
  '上', '下', '左', '右', '前', '后', '之间', '之内', '之外', '时候', '时间',
  '啊', '呀', '哦', '嗯', '哈哈', '嘿嘿', '呢', '吧', '吗', '哦', '哈',
  'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
  'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
  'up', 'about', 'into', 'over', 'after', 'beneath', 'under', 'above', 'between',
  'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'we',
  'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'our', 'their',
  'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'all',
  'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
  'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'now'
]);
