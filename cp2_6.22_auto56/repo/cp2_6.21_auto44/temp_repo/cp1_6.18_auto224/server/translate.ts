const zhToEnDict: Record<string, string> = {
  '你好': 'Hello',
  '早上好': 'Good morning',
  '晚上好': 'Good evening',
  '谢谢': 'Thank you',
  '再见': 'Goodbye',
  '是的': 'Yes',
  '不是': 'No',
  '好的': 'Okay',
  '对不起': 'Sorry',
  '没关系': "It's okay",
  '请': 'Please',
  '我': 'I',
  '你': 'you',
  '他': 'he',
  '她': 'she',
  '我们': 'we',
  '他们': 'they',
  '喜欢': 'like',
  '爱': 'love',
  '想': 'want',
  '会': 'can',
  '能': 'able to',
  '今天': 'today',
  '明天': 'tomorrow',
  '昨天': 'yesterday',
  '天气': 'weather',
  '怎么样': 'how is',
  '好吗': 'how are you',
  '名字': 'name',
  '什么': 'what',
  '哪里': 'where',
  '什么时候': 'when',
  '为什么': 'why',
  '怎么': 'how',
  '学习': 'study / learn',
  '英语': 'English',
  '中文': 'Chinese',
  '练习': 'practice',
  '说': 'speak',
  '听': 'listen',
  '读': 'read',
  '写': 'write',
  '朋友': 'friend',
  '家人': 'family',
  '老师': 'teacher',
  '学生': 'student',
  '工作': 'work / job',
  '吃饭': 'eat',
  '喝水': 'drink water',
  '睡觉': 'sleep',
  '开心': 'happy',
  '难过': 'sad',
  '很棒': 'great',
  '加油': 'keep it up',
  '我想练习英语口语': 'I want to practice my English speaking',
  '今天天气怎么样': 'How is the weather today',
  '你叫什么名字': "What's your name",
  '我很高兴认识你': 'Nice to meet you',
}

const enToZhDict: Record<string, string> = {
  'hello': '你好',
  'hi': '你好',
  'good morning': '早上好',
  'good evening': '晚上好',
  'thank you': '谢谢',
  'thanks': '谢谢',
  'goodbye': '再见',
  'bye': '再见',
  'yes': '是的',
  'no': '不是',
  'okay': '好的',
  'ok': '好的',
  'sorry': '对不起',
  'please': '请',
  'i': '我',
  'you': '你',
  'he': '他',
  'she': '她',
  'we': '我们',
  'they': '他们',
  'like': '喜欢',
  'love': '爱',
  'want': '想要',
  'can': '能',
  'today': '今天',
  'tomorrow': '明天',
  'yesterday': '昨天',
  'weather': '天气',
  'name': '名字',
  'what': '什么',
  'where': '哪里',
  'when': '什么时候',
  'why': '为什么',
  'how': '怎么',
  'study': '学习',
  'learn': '学习',
  'english': '英语',
  'chinese': '中文',
  'practice': '练习',
  'speak': '说',
  'listen': '听',
  'read': '读',
  'write': '写',
  'friend': '朋友',
  'family': '家人',
  'teacher': '老师',
  'student': '学生',
  'work': '工作',
  'eat': '吃',
  'drink': '喝',
  'sleep': '睡觉',
  'happy': '开心',
  'sad': '难过',
  'great': '很棒',
  'good': '好',
  'how are you': '你好吗',
  'nice to meet you': '很高兴认识你',
  'i want to practice': '我想练习',
  'my name is': '我的名字是',
}

function translateWithDict(text: string, source: string, target: string): string {
  const dict = source === 'zh' ? zhToEnDict : enToZhDict
  const lower = text.toLowerCase().trim()

  for (const [key, value] of Object.entries(dict)) {
    if (lower === key.toLowerCase()) {
      return value
    }
  }

  for (const [key, value] of Object.entries(dict)) {
    if (lower.includes(key.toLowerCase())) {
      return `${value}...`
    }
  }

  if (source === 'zh') {
    return `[EN] ${text}`
  }
  return `[中文] ${text}`
}

export async function translateText(
  text: string,
  source: string,
  target: string
): Promise<string> {
  await new Promise((r) => setTimeout(r, 150 + Math.random() * 200))
  return translateWithDict(text, source, target)
}
