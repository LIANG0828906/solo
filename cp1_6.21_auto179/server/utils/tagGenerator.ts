const STOPWORDS_EN = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','as','is','are','was','were','be','been','being',
  'have','has','had','do','does','did','will','would','could','should','may','might','can','this','that','these','those','it','its',
  'he','she','they','them','their','we','our','you','your','i','me','my','what','which','who','whom','how','why','when','where',
  'not','no','nor','so','if','then','than','too','very','just','also','about','up','out','all','any','both','each','few','more',
  'most','other','some','such','only','own','same','than','over','into','through','during','before','after','above','below',
  'between','under','again','further','once','here','there','using','use','used','way','new','make','like','time','get','one'
]);

const STOPWORDS_ZH = new Set([
  '的','了','在','是','我','有','和','就','不','人','都','一','一个','上','也','很','到','说','要','去','你','会','着','没有',
  '看','好','自己','这','他','她','它','们','那','被','把','让','从','与','及','或','而','但','并','于','因为','所以','如果',
  '虽然','但是','而且','然后','因此','以及','可以','能够','已经','正在','将','曾','还','只','就是','这样','那样','什么',
  '怎么','如何','为什么','哪里','哪个','一些','这些','那些','每个','各种','通过','进行','使用','利用','提供','支持',
  '实现','开发','基于','相关','应用','功能','系统','平台','技术','方法','内容','信息','用户','数据','项目','产品',
  '这个','那个','现在','时候','非常','比较','更','最','太','更','再','又','吧','啊','呢','吗','哦','嗯','哈哈','大家','我们','你们','他们'
]);

function isChinese(char: string): boolean {
  return /[\u4e00-\u9fa5]/.test(char);
}

function cleanWord(w: string): string {
  return w.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5-]/g, '');
}

function tokenize(text: string): string[] {
  const tokens: string[] = [];
  let enBuf = '';

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (/[a-zA-Z0-9-]/.test(ch)) {
      enBuf += ch;
    } else {
      if (enBuf) {
        const w = cleanWord(enBuf);
        if (w.length >= 3 && w.length <= 20) tokens.push(w);
        enBuf = '';
      }
      if (isChinese(ch)) {
        tokens.push(ch);
      }
    }
  }
  if (enBuf) {
    const w = cleanWord(enBuf);
    if (w.length >= 3 && w.length <= 20) tokens.push(w);
  }

  const zhBigrams: string[] = [];
  const zhChars: string[] = [];
  const others: string[] = [];
  for (const t of tokens) {
    if (isChinese(t) && t.length === 1) zhChars.push(t);
    else others.push(t);
  }
  for (let i = 0; i < zhChars.length - 1; i++) {
    zhBigrams.push(zhChars[i] + zhChars[i + 1]);
  }

  return [...others, ...zhBigrams];
}

export function generateTags(title: string, description: string, summary: string, maxTags = 5): string[] {
  const combined = [title, description, summary].filter(Boolean).join(' ');
  if (!combined.trim()) return ['未分类'];

  const tokens = tokenize(combined);
  const freq = new Map<string, number>();

  for (const raw of tokens) {
    const w = raw.toLowerCase();
    if (STOPWORDS_EN.has(w) || STOPWORDS_ZH.has(w)) continue;
    if (w.length < 2 || w.length > 15) continue;
    if (/^\d+$/.test(w)) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }

  const titleLower = title.toLowerCase();
  const titleBoosted = new Set<string>();
  for (const t of tokenize(title)) {
    const w = t.toLowerCase();
    if (freq.has(w)) titleBoosted.add(w);
  }

  const scored: Array<{ word: string; score: number }> = [];
  for (const [word, count] of freq.entries()) {
    let score = count;
    if (titleBoosted.has(word)) score *= 2.5;
    if (titleLower.includes(word)) score += 2;
    scored.push({ word, score });
  }

  scored.sort((a, b) => b.score - a.score);

  const result: string[] = [];
  const seenLower = new Set<string>();
  for (const s of scored) {
    if (result.length >= maxTags) break;
    const key = s.word.toLowerCase();
    let skip = false;
    for (const r of result) {
      if (r.toLowerCase().includes(key) || key.includes(r.toLowerCase())) {
        skip = true; break;
      }
    }
    if (seenLower.has(key) || skip) continue;
    seenLower.add(key);
    const displayWord = /[a-z]/.test(s.word)
      ? s.word.replace(/\b\w/g, c => c.toUpperCase()).replace(/-/g, ' ')
      : s.word;
    result.push(displayWord);
  }

  if (result.length === 0) result.push('未分类');
  return result;
}
