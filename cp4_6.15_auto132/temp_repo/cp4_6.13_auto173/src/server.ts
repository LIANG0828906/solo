import express from 'express';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '..', 'data');
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(join(DATA_DIR, 'diaries.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS diaries (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    language TEXT NOT NULL,
    level TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    diary_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (diary_id) REFERENCES diaries(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS like_records (
    id TEXT PRIMARY KEY,
    diary_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    liked INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(diary_id, user_id)
  );

  CREATE INDEX IF NOT EXISTS idx_diaries_language ON diaries(language);
  CREATE INDEX IF NOT EXISTS idx_diaries_level ON diaries(level);
  CREATE INDEX IF NOT EXISTS idx_diaries_created_at ON diaries(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_comments_diary_id ON comments(diary_id);
  CREATE INDEX IF NOT EXISTS idx_like_records_user_id ON like_records(user_id);
`);

const seedDiaries = [
  {
    title: 'My First Week Learning English',
    content: 'I just started learning English this week! The alphabet was easy, but pronunciation is harder than I expected. I practiced saying "th" sounds for an hour today. My teacher says it gets easier with time. I also learned basic greetings like "Hello, how are you?" and "I am fine, thank you." Tomorrow I will learn about present tense verbs. I am really excited about this journey!',
    language: 'english',
    level: 'beginner',
  },
  {
    title: 'Understanding French Subjunctive',
    content: 'The subjunctive mood in French is one of the most challenging concepts I have encountered. It is used to express doubt, desire, necessity, or emotion. For example, "Il faut que je parle" uses the subjunctive form "parle" after "il faut que." I have been practicing with exercises that trigger the subjunctive, and I am slowly getting the hang of it. The key triggers include verbs of wishing, fearing, doubting, and impersonal expressions.',
    language: 'french',
    level: 'advanced',
  },
  {
    title: '日常の日本語練習',
    content: '今日は日本語の勉強を始めて一ヶ月記念です。ひらがなとカタカナを全部覚えました。今は漢字の勉強をしています。毎日新しい漢字を5つずつ練習しています。日本のドラマを見ながらリスニングの練習もしています。少しずつ聞き取れる言葉が増えてきました。来月はJLPT N5の試験を受けたいと思っています。',
    language: 'japanese',
    level: 'beginner',
  },
  {
    title: 'German Cases Demystified',
    content: 'After three months of studying German, I finally understand the four cases: Nominativ, Akkusativ, Dativ, and Genitiv. The key is knowing which verbs take which case. For example, "haben" takes Akkusativ (Ich habe einen Hund), while "helfen" takes Dativ (Ich helfe dem Mann). The articles change based on case and gender, which makes it tricky. I made flashcards for all the article changes and review them daily.',
    language: 'german',
    level: 'intermediate',
  },
  {
    title: 'Ser vs Estar: A Daily Struggle',
    content: 'One of the hardest things in Spanish is knowing when to use "ser" versus "estar." My rule of thumb now is: use "ser" for permanent characteristics (Soy estudiante) and "estar" for temporary states or locations (Estoy cansado, Estoy en Madrid). But there are exceptions! "Está muerto" uses estar even though being dead is permanent. Language is full of surprises. I practice with sentence completion exercises every day.',
    language: 'spanish',
    level: 'intermediate',
  },
  {
    title: 'English Phrasal Verbs Journey',
    content: 'Phrasal verbs are the bane of my existence in English learning. "Give up," "give in," "give out," and "give away" all mean completely different things! I have started keeping a dedicated notebook just for phrasal verbs. Each day I write down five new ones with example sentences. My current favorites are "look forward to" and "put up with." The context matters so much, and there is no shortcut but practice and exposure.',
    language: 'english',
    level: 'intermediate',
  },
  {
    title: 'Les Accords en Français',
    content: 'Aujourd\'hui j\'ai étudié les accords du participe passé avec l\'auxiliaire être. La règle est simple: avec être, le participe s\'accorde en genre et en nombre avec le sujet. Par exemple, "Elle est allée" prend un "e" parce que le sujet est féminin. Mais avec avoir, c\'est différent — on n\'accorde que si le complément d\'objet direct précède le verbe. C\'est compliqué mais je commence à comprendre!',
    language: 'french',
    level: 'intermediate',
  },
  {
    title: '敬語の練習',
    content: '日本語の敬語は本当に難しいですが、とても大事だと思います。謙譲語、尊敬語、丁寧語の3種類があります。仕事の場面では正しい敬語を使わないと失礼になります。先週、会社で「申し訳ございません」と「すみません」の使い分けについて勉強しました。日常会話では丁寧語で十分ですが、ビジネスではもっと丁寧な表現が必要です。',
    language: 'japanese',
    level: 'advanced',
  },
  {
    title: 'German Word Order Adventures',
    content: 'German word order continues to surprise me. In subordinate clauses, the verb goes to the end: "Ich weiß, dass er nach Hause geht." With modal verbs, the main verb also goes to the end: "Ich muss heute Deutsch lernen." And in questions without a question word, the verb comes first: "Lernst du Deutsch?" The V2 rule means the verb is always in second position in main clauses, no matter what comes first. It feels like a puzzle every time I construct a sentence!',
    language: 'german',
    level: 'intermediate',
  },
  {
    title: 'Spanish Past Tenses: Preterite vs Imperfect',
    content: 'Learning the difference between the preterite and imperfect tenses in Spanish has been a major milestone. The preterite is for completed actions: "Ayer comí paella." The imperfect is for ongoing or habitual past actions: "Cuando era niño, comía paella todos los domingos." The acronym SIMBA vs CHEATE helps: SIMBA triggers preterite (Single action, Interrupting, Main event, Beginning, Arrival), while CHEATE triggers imperfect (Characteristics, Habitual, Emotion, Age, Time, Endowment).',
    language: 'spanish',
    level: 'advanced',
  },
  {
    title: 'Building English Vocabulary Through Reading',
    content: 'I have discovered that reading English novels is the best way to build vocabulary naturally. I started with graded readers at the A2 level and now I am working through B1 level books. Every time I encounter an unknown word, I write it down with its context sentence. I review my word list before bed each night. This method has helped me learn over 500 new words in the past two months. Reading makes the words stick because I see them in context.',
    language: 'english',
    level: 'intermediate',
  },
  {
    title: 'French Pronunciation Challenges',
    content: 'French pronunciation is full of silent letters and nasal sounds that do not exist in my native language. The "r" sound took me weeks to master — it comes from the back of the throat. Then there are the nasal vowels: "un," "in," "on," and "an" all sound different to French speakers but similar to my ears. I practice by listening to French podcasts and repeating what I hear. Recording myself has been incredibly helpful for identifying my mistakes.',
    language: 'french',
    level: 'beginner',
  },
  {
    title: '漢字検定に向けて',
    content: '漢字検定の準備を始めました。N2レベルの漢字は約1000文字あって、毎日10文字ずつ勉強しています。音読みと訓読みの両方を覚える必要があります。特に難しいのは同じ漢字でも文脈によって読み方が変わることです。例えば、「今日」は「きょう」ですが、「日」単独だと「ひ」と読みます。過去問題を解きながら実力をつけていきたいです。',
    language: 'japanese',
    level: 'intermediate',
  },
  {
    title: 'German Compound Nouns Are Amazing',
    content: 'German compound nouns are both terrifying and wonderful. You can combine any nouns to create a new word! "Handschuh" literally means "hand shoe" (glove). "Kühlschrank" means "cool cabinet" (refrigerator). My all-time favorite is "Schadenfreude" — taking pleasure in someone else\'s misfortune. Learning to break down compounds into their parts has made reading German much easier. I no longer panic when I see a 30-letter word!',
    language: 'german',
    level: 'beginner',
  },
  {
    title: 'Spanish Subjunctive for Wishes and Doubts',
    content: 'The Spanish subjunctive is finally starting to click for me. I use it after expressions of wish: "Espero que vengas a la fiesta." After doubt: "Dudo que tenga razón." And after emotion: "Me alegra que estés aquí." The trick is recognizing the trigger phrases. I made a color-coded chart: blue for wish triggers, red for doubt triggers, green for emotion triggers. Reviewing this chart daily has made a huge difference in my accuracy.',
    language: 'spanish',
    level: 'advanced',
  },
];

const countRow = db.prepare('SELECT COUNT(*) as count FROM diaries').get() as { count: number };
if (countRow.count === 0) {
  const insertDiary = db.prepare(`
    INSERT INTO diaries (id, title, content, language, level, likes, comment_count, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-? days'), datetime('now', '-? days'))
  `);
  const insertComment = db.prepare(`
    INSERT INTO comments (id, diary_id, user_id, username, content, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now', '-? days'))
  `);

  const seedComments: Array<{ diaryIndex: number; userId: string; username: string; content: string; daysAgo: number }> = [
    { diaryIndex: 0, userId: 'user-2', username: 'LangLover', content: 'Keep going! The "th" sound is tricky for everyone at first.', daysAgo: 6 },
    { diaryIndex: 1, userId: 'user-3', username: 'Francophile', content: 'The subjunctive is tough but you explained it really well!', daysAgo: 5 },
    { diaryIndex: 2, userId: 'user-4', username: 'NihonFan', content: 'おめでとう！一ヶ月でひらがなとカタカナを覚えるのはすごいです。', daysAgo: 4 },
    { diaryIndex: 3, userId: 'user-5', username: 'DeutschLerner', content: 'Flashcards are a great strategy! I did the same thing.', daysAgo: 3 },
    { diaryIndex: 4, userId: 'user-6', username: 'HablaEsp', content: 'The "estar muerto" exception is classic! Great observation.', daysAgo: 2 },
    { diaryIndex: 5, userId: 'user-7', username: 'WordNerd', content: 'A dedicated notebook is such a smart idea. I might try that too!', daysAgo: 1 },
    { diaryIndex: 6, userId: 'user-8', username: 'Parisienne', content: 'Très bien! Les accords sont difficiles mais tu as compris le principe.', daysAgo: 1 },
  ];

  const insertAll = db.transaction(() => {
    seedDiaries.forEach((d, i) => {
      const id = uuidv4();
      const likes = Math.floor(Math.random() * 20);
      insertDiary.run(id, d.title, d.content, d.language, d.level, likes, 0, i, i);
    });

    const diaries = db.prepare('SELECT id FROM diaries').all() as Array<{ id: string }>;

    seedComments.forEach((c) => {
      insertComment.run(uuidv4(), diaries[c.diaryIndex].id, c.userId, c.username, c.content, c.daysAgo);
    });

    const updateCounts = db.prepare('UPDATE diaries SET comment_count = (SELECT COUNT(*) FROM comments WHERE diary_id = diaries.id)');
    updateCounts.run();
  });

  insertAll();
}

const app = express();
app.use(express.json());

app.get('/api/diaries', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.max(1, parseInt(req.query.pageSize as string) || 10);
  const language = req.query.language as string || '';
  const level = req.query.level as string || '';

  let where = 'WHERE 1=1';
  const params: unknown[] = [];

  if (language) {
    where += ' AND language = ?';
    params.push(language);
  }
  if (level) {
    where += ' AND level = ?';
    params.push(level);
  }

  const countSql = `SELECT COUNT(*) as total FROM diaries ${where}`;
  const total = (db.prepare(countSql).get(...params) as { total: number }).total;

  const offset = (page - 1) * pageSize;
  const dataSql = `SELECT id, title, SUBSTR(content, 1, 120) as excerpt, language, level, likes, comment_count, created_at FROM diaries ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  const data = db.prepare(dataSql).all(...params, pageSize, offset);

  res.json({ data, total, page, pageSize });
});

app.get('/api/diaries/:id', (req, res) => {
  const diary = db.prepare('SELECT * FROM diaries WHERE id = ?').get(req.params.id);
  if (!diary) {
    res.status(404).json({ error: 'Diary not found' });
    return;
  }
  res.json(diary);
});

app.post('/api/diaries', (req, res) => {
  const { title, content, language, level } = req.body;
  if (!title || !content || !language || !level) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  const id = uuidv4();
  db.prepare('INSERT INTO diaries (id, title, content, language, level) VALUES (?, ?, ?, ?, ?)').run(id, title, content, language, level);
  const diary = db.prepare('SELECT * FROM diaries WHERE id = ?').get(id);
  res.status(201).json(diary);
});

app.get('/api/diaries/:id/comments', (req, res) => {
  const comments = db.prepare('SELECT * FROM comments WHERE diary_id = ? ORDER BY created_at ASC').all(req.params.id);
  res.json(comments);
});

app.post('/api/diaries/:id/comments', (req, res) => {
  const { userId, username, content } = req.body;
  if (!userId || !username || !content) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  const diary = db.prepare('SELECT id FROM diaries WHERE id = ?').get(req.params.id);
  if (!diary) {
    res.status(404).json({ error: 'Diary not found' });
    return;
  }
  const id = uuidv4();
  const insertComment = db.transaction(() => {
    db.prepare('INSERT INTO comments (id, diary_id, user_id, username, content) VALUES (?, ?, ?, ?, ?)').run(id, req.params.id, userId, username, content);
    db.prepare('UPDATE diaries SET comment_count = comment_count + 1 WHERE id = ?').run(req.params.id);
  });
  insertComment();
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
  res.status(201).json(comment);
});

app.get('/api/diaries/:id/like', (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    res.status(400).json({ error: 'Missing userId' });
    return;
  }
  const record = db.prepare('SELECT liked FROM like_records WHERE diary_id = ? AND user_id = ?').get(req.params.id, userId) as { liked: number } | undefined;
  const diary = db.prepare('SELECT likes FROM diaries WHERE id = ?').get(req.params.id) as { likes: number } | undefined;
  if (!diary) {
    res.status(404).json({ error: 'Diary not found' });
    return;
  }
  res.json({ liked: record ? record.liked === 1 : false, likes: diary.likes });
});

app.post('/api/diaries/:id/like', (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'Missing userId' });
    return;
  }
  const diary = db.prepare('SELECT id, likes FROM diaries WHERE id = ?').get(req.params.id) as { id: string; likes: number } | undefined;
  if (!diary) {
    res.status(404).json({ error: 'Diary not found' });
    return;
  }

  const existing = db.prepare('SELECT id, liked FROM like_records WHERE diary_id = ? AND user_id = ?').get(req.params.id, userId) as { id: string; liked: number } | undefined;

  const toggleLike = db.transaction(() => {
    if (existing && existing.liked === 1) {
      db.prepare('INSERT OR REPLACE INTO like_records (id, diary_id, user_id, liked, created_at) VALUES (?, ?, ?, 0, datetime(\'now\'))').run(existing.id, req.params.id, userId);
      db.prepare('UPDATE diaries SET likes = likes - 1 WHERE id = ?').run(req.params.id);
    } else {
      const recordId = existing ? existing.id : uuidv4();
      db.prepare('INSERT OR REPLACE INTO like_records (id, diary_id, user_id, liked, created_at) VALUES (?, ?, ?, 1, datetime(\'now\'))').run(recordId, req.params.id, userId);
      db.prepare('UPDATE diaries SET likes = likes + 1 WHERE id = ?').run(req.params.id);
    }
  });

  toggleLike();

  const updatedDiary = db.prepare('SELECT likes FROM diaries WHERE id = ?').get(req.params.id) as { likes: number };
  res.json({ liked: !existing || existing.liked !== 1, likes: updatedDiary.likes });
});

interface GrammarRule {
  pattern: RegExp;
  suggestion: string;
  explanation: string;
  type: 'grammar' | 'vocabulary' | 'spelling';
}

const englishRules: GrammarRule[] = [
  { pattern: /\bI am go\b/, suggestion: 'I am going', explanation: '"I am" 后面应接现在分词构成现在进行时，表示正在进行的动作。', type: 'grammar' },
  { pattern: /\bhe don't\b/, suggestion: "he doesn't", explanation: '第三人称单数主语应使用 "doesn\'t" 而非 "don\'t"。', type: 'grammar' },
  { pattern: /\btheir is\b/, suggestion: 'there is', explanation: '"their" 是物主代词，表示"存在"应使用 "there"。', type: 'grammar' },
  { pattern: /\bits a\b/, suggestion: "it's a", explanation: '"its" 是物主代词，表示"它是"应使用缩写 "it\'s"。', type: 'grammar' },
  { pattern: /\bteh\b/, suggestion: 'the', explanation: '常见的拼写错误，"teh" 应为 "the"。', type: 'spelling' },
  { pattern: /\brecieve\b/, suggestion: 'receive', explanation: '拼写规则："i before e, except after c"，所以是 "receive" 而非 "recieve"。', type: 'spelling' },
  { pattern: /\bseperate\b/, suggestion: 'separate', explanation: '"separate" 的中间是 "par"，不是 "per"。', type: 'spelling' },
  { pattern: /\boccured\b/, suggestion: 'occurred', explanation: '以双辅音字母结尾的动词变过去式时需双写辅音字母，应为 "occurred"。', type: 'spelling' },
  { pattern: /\bdefinately\b/, suggestion: 'definitely', explanation: '"definitely" 包含 "finite"，不是 "finately"。', type: 'spelling' },
  { pattern: /\bi\s/, suggestion: 'I ', explanation: '英语中第一人称代词 "I" 必须大写。', type: 'grammar' },
];

const japaneseRules: GrammarRule[] = [
  { pattern: /はは/, suggestion: 'お母さん', explanation: '在正式场合或与他人交谈时，应使用敬语形式 "お母さん" 代替 "母"。', type: 'vocabulary' },
  { pattern: /ちちは/, suggestion: 'お父さんは', explanation: '在正式场合，应使用敬语形式 "お父さん" 代替 "父"。', type: 'vocabulary' },
  { pattern: /ですます/, suggestion: 'です・ます', explanation: '应使用中点 "・" 分隔并列的助动词。', type: 'grammar' },
  { pattern: /たくさん人/, suggestion: 'たくさんの人', suggestion: '数量词修饰名词时需要加 "の"。', type: 'grammar' },
];

japaneseRules[3] = { pattern: /たくさん人/, suggestion: 'たくさんの人', explanation: '数量词修饰名词时需要加 "の" 连接。', type: 'grammar' };

const frenchRules: GrammarRule[] = [
  { pattern: /\bje suis parle\b/, suggestion: 'je parle', explanation: '"parler" 是行为动词，不需要加 "je suis"。只有动词 être 后面才接表语。', type: 'grammar' },
  { pattern: /\bje suis mange\b/, suggestion: 'je mange', explanation: '"manger" 是行为动词，不需要 "je suis"。现在时直接变位即可。', type: 'grammar' },
  { pattern: /\ble femme\b/, suggestion: 'la femme', explanation: '"femme" 是阴性名词，前面的冠词应为 "la" 而非 "le"。', type: 'grammar' },
  { pattern: /\bla homme\b/, suggestion: "l'homme", explanation: '"homme" 以元音开头，应用省音形式 "l\'homme" 而非 "la homme"。', type: 'grammar' },
  { pattern: /\buniversite\b/, suggestion: 'université', explanation: '法语中 "université" 需要加重音符号。', type: 'spelling' },
  { pattern: /\bmerci beacoup\b/, suggestion: 'merci beaucoup', explanation: '"beaucoup" 的拼写是 eau，不是 eao。', type: 'spelling' },
];

const germanRules: GrammarRule[] = [
  { pattern: /\bich gehe zu Hause\b/, suggestion: 'ich gehe nach Hause', explanation: '表示"回家"应使用 "nach Hause"，"zu Hause" 表示"在家"。', type: 'grammar' },
  { pattern: /\bder Frau\b(?!en)/, suggestion: 'die Frau', explanation: '"Frau" 是阴性名词，主格和宾格冠词应为 "die" 而非 "der"。', type: 'grammar' },
  { pattern: /\bdas Mann\b/, suggestion: 'der Mann', explanation: '"Mann" 是阳性名词，冠词应为 "der" 而非 "das"。', type: 'grammar' },
  { pattern: /\bich habe gehen\b/, suggestion: 'ich bin gegangen', explanation: '表示移动的动词完成时应使用 "sein" 作为助动词，而非 "haben"。', type: 'grammar' },
];

const spanishRules: GrammarRule[] = [
  { pattern: /\byo es\b/, suggestion: 'yo soy', explanation: '第一人称单数的 ser 变位是 "soy"，不是 "es"。', type: 'grammar' },
  { pattern: /\btu es\b/, suggestion: 'tú eres', explanation: '第二人称单数的 ser 变位是 "eres"，不是 "es"。且需加重音符号。', type: 'grammar' },
  { pattern: /\bella estas\b/, suggestion: 'ella está', explanation: '第三人称的 estar 变位是 "está"，不是 "estas"。注意重音符号。', type: 'grammar' },
  { pattern: /\bcorazon\b/, suggestion: 'corazón', explanation: '西班牙语中 "corazón" 需要加重音符号。', type: 'spelling' },
  { pattern: /\bcomunicacion\b/, suggestion: 'comunicación', explanation: '西班牙语中 "comunicación" 需要加重音符号。', type: 'spelling' },
  { pattern: /\bidioma es\b/, suggestion: 'el idioma es', explanation: '"idioma" 虽然以 -a 结尾但是阳性名词，需要冠词 "el"。', type: 'grammar' },
];

const ruleSets: Record<string, GrammarRule[]> = {
  english: englishRules,
  japanese: japaneseRules,
  french: frenchRules,
  german: germanRules,
  spanish: spanishRules,
};

app.post('/api/grammar-check', (req, res) => {
  const { content, language, level } = req.body;
  if (!content || !language) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const rules = ruleSets[language] || [];
  const suggestions: Array<{ id: string; original: string; suggestion: string; explanation: string; type: string }> = [];

  for (const rule of rules) {
    const matches = content.matchAll(new RegExp(rule.pattern.source, rule.pattern.flags + 'g'));
    for (const match of matches) {
      suggestions.push({
        id: uuidv4(),
        original: match[0],
        suggestion: rule.suggestion,
        explanation: rule.explanation,
        type: rule.type,
      });
    }
  }

  res.json(suggestions);
});

app.listen(3001, () => {
  console.log('Server running on port 3001');
});
