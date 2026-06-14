const STOPWORDS_RAW = [
  '的', '了', '和', '是', '在', '我', '有', '就', '不', '人',
  '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去',
  '你', '会', '着', '没有', '看', '好', '自己', '这', '他', '她',
  '它', '那', '被', '从', '把', '让', '使', '对', '与', '及',
  '等', '但', '而', '或', '如', '其', '之', '所', '以', '于',
  '中', '为', '能', '能够', '可以', '可能', '应该', '必须', '需要',
  '将', '已', '已经', '曾', '正在', '正在进行', '才', '刚刚',
  '这里', '那里', '哪里', '什么', '怎么', '为什么', '哪', '哪个',
  '我们', '你们', '他们', '她们', '它们', '这个', '那个', '这些', '那些',
  '并且', '而且', '或者', '因为', '所以', '因此', '但是', '然而',
  '如果', '那么', '虽然', '尽管', '除非', '无论', '只要', '只有',
  '同时', '另外', '此外', '还有', '以及', '包括', '包含', '具有',
  '通过', '经过', '根据', '按照', '关于', '对于', '至于', '由于',
  '目前', '现在', '当时', '之前', '之后', '以后', '以前', '近来',
  '一些', '一点', '一下', '一起', '一样', '不同', '一样的',
  '这样', '那样', '如何', '是否', '是不是', '有没有', '能不能',
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'shall', 'must', 'need', 'dare',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
  'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
  'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all',
  'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
  'very', 'just', 'because', 'but', 'and', 'or', 'if', 'while',
  'this', 'that', 'these', 'those', 'it', 'its', 'i', 'me', 'my',
  'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her',
  'they', 'them', 'their', 'what', 'which', 'who', 'whom', 'whose',
];

export const STOPWORDS: Set<string> = new Set(
  STOPWORDS_RAW.map((w) => w.toLowerCase())
);

export function isStopword(word: string): boolean {
  return STOPWORDS.has(word.toLowerCase());
}
