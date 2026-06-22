import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const projects = new Map();
const translators = new Map();

const translatorList = [
  { id: 't1', name: '李明', avatar: '👨‍💻', weeklyTranslatedChars: 12580, weeklyReviewedSentences: 45, weeklyRejectionRate: 0.08 },
  { id: 't2', name: '王芳', avatar: '👩‍💻', weeklyTranslatedChars: 9820, weeklyReviewedSentences: 32, weeklyRejectionRate: 0.12 },
  { id: 't3', name: '张伟', avatar: '🧑‍💼', weeklyTranslatedChars: 15340, weeklyReviewedSentences: 68, weeklyRejectionRate: 0.05 },
  { id: 't4', name: '陈静', avatar: '👩‍🎨', weeklyTranslatedChars: 8760, weeklyReviewedSentences: 21, weeklyRejectionRate: 0.15 },
  { id: 't5', name: '刘强', avatar: '👨‍🔬', weeklyTranslatedChars: 11200, weeklyReviewedSentences: 55, weeklyRejectionRate: 0.09 }
];

translatorList.forEach(t => translators.set(t.id, t));

const createSentence = (original, translation = '', status = 'draft', notes = [], annotations = []) => ({
  id: uuidv4(),
  original,
  translation,
  status,
  notes,
  annotations
});

const sampleTexts = {
  ch1: [
    'The quick brown fox jumps over the lazy dog near the riverbank.',
    'Translation is the communication of the meaning of a source-language text by means of an equivalent target-language text.',
    'The English language draws a terminological distinction between translating and interpreting.',
    'A translator always risks inadvertently introducing source-language words, grammar, or syntax into the target-language rendering.',
    'On the other hand, such "spill-overs" have sometimes imported useful source-language calques and loanwords that have enriched target languages.',
    'Translators, including early translators of sacred texts, have helped shape the very languages into which they have translated.',
    'Because of the laboriousness of the translation process, since the 1940s efforts have been made, with varying degrees of success, to automate translation.',
    'The internet has helped expand translation markets and has facilitated language localization.',
    'A competent translator is not only bilingual but bicultural.',
    'A language is not merely a collection of words and of rules of grammar and syntax for generating sentences, but also a vast interconnecting system of connotations and cultural references.'
  ],
  ch2: [
    'Machine translation (MT) is a sub-field of computational linguistics.',
    'It investigates the use of software to translate text or speech from one language to another.',
    'On a basic level, MT performs mechanical substitution of symbolic symbols in one natural language for symbols in another natural language.',
    'Use of knowledge-based techniques was predominant for many years.',
    'More recently, statistical machine translation has gained ground.',
    'With the advent of the digital computer and artificial intelligence, more technologically advanced approaches to language translation have emerged.',
    'Internet-based translation tools are now often freely available to the general public.',
    'The first machine translation system was demonstrated at Georgetown University in 1954.',
    'In the early 2000s, a number of companies began offering free on-line statistical translation services.',
    'Neural machine translation has recently become the dominant approach in the field.'
  ],
  ch3: [
    'The concept of fidelity in translation has been debated for centuries.',
    'Fidelity denotes the extent to which a translation accurately renders the meaning of the source text.',
    'Transparency, the extent to which a translation appears to a native speaker of the target language to have originally been produced in that language.',
    'Schleiermacher distinguished between two different translation methods: either the translator leaves the author in peace, as much as possible, and moves the reader toward him.',
    'Or he leaves the reader in peace, as much as possible, and moves the author toward him.',
    'A translation that meets the first criterion is said to be a "domesticating translation".',
    'A translation meeting the second criterion is said to be a "foreignizing translation".',
    'The distinction between "domestication" and "foreignization" was developed by Venuti.',
    'Venuti considers foreignization to be the ethical choice for translation.',
    'However, this view is not universally accepted among translation scholars.'
  ],
  ch4: [
    'Localization refers to the adaptation of a product, application or document content to meet the language, cultural and other requirements of a specific target market.',
    'Localization is sometimes written in English as l10n, where 10 is the number of letters in the English word between l and n.',
    'It is popularly assumed that localization only deals with text.',
    'However, it also addresses cultural sensitivities, design, layout, and technology.',
    'A locale is a combination of language and region.',
    'For example, French spoken in France and French spoken in Canada are two different locales.',
    'Localization is most commonly applied to products such as computer software, video games, and websites.',
    'The process of localization typically involves translation, adaptation, and testing.',
    'Localization can increase market share and customer satisfaction.',
    'Proper localization requires deep cultural knowledge and linguistic expertise.'
  ],
  ch5: [
    'Computer-assisted translation (CAT) tools are a type of software that assists human translators in the translation process.',
    'CAT tools typically include translation memory, terminology management, and alignment tools.',
    'Translation memory (TM) is a database that stores previously translated segments.',
    'When a translator encounters a segment that has been translated before, the TM automatically suggests the previous translation.',
    'This increases efficiency and consistency in translation projects.',
    'Terminology management systems help ensure consistent use of terms throughout a project.',
    'Alignment tools are used to create translation memories from existing parallel texts.',
    'Many CAT tools also include quality assurance features.',
    'Quality assurance checks can identify common translation errors such as inconsistencies and missing numbers.',
    'Popular CAT tools include Trados Studio, memoQ, and OmegaT.'
  ]
};

const chapters = [
  {
    id: 'ch1',
    title: '第一章：翻译基础',
    status: 'completed' as const,
    translatorId: 't1',
    sentences: sampleTexts.ch1.map((text, i) =>
      createSentence(
        text,
        i < 8 ? '这是已完成的译文示例句子，展示翻译结果。' : '',
        i < 8 ? 'approved' : 'draft',
        i === 2 ? [{ id: 'n1', content: '注意术语一致性', createdAt: Date.now() - 86400000 }] : [],
        i === 3 ? [{ id: 'a1', reviewerId: 't3', reviewerName: '张伟', content: '术语翻译准确，表达流畅', decision: 'approved', createdAt: Date.now() - 43200000 }] : []
      )
    )
  },
  {
    id: 'ch2',
    title: '第二章：机器翻译',
    status: 'reviewing' as const,
    translatorId: 't2',
    sentences: sampleTexts.ch2.map((text, i) =>
      createSentence(
        text,
        i < 10 ? '这是待审校的译文，等待审校者审核。' : '',
        i < 4 ? 'approved' : i < 7 ? 'rejected' : 'submitted',
        i === 1 ? [{ id: 'n2', content: '此处需查证专业术语', createdAt: Date.now() - 172800000 }] : [],
        i === 5 ? [{ id: 'a2', reviewerId: 't3', reviewerName: '张伟', content: '建议调整语序使其更自然', decision: 'rejected', createdAt: Date.now() - 7200000 }] : []
      )
    )
  },
  {
    id: 'ch3',
    title: '第三章：翻译理论',
    status: 'translating' as const,
    translatorId: 't3',
    sentences: sampleTexts.ch3.map((text, i) =>
      createSentence(
        text,
        i < 6 ? '这是正在翻译中的草稿译文。' : '',
        i < 6 ? 'draft' : 'draft',
        [],
        []
      )
    ),
    children: [
      {
        id: 'ch3-1',
        title: '3.1 忠实与通顺',
        status: 'translating' as const,
        translatorId: 't3',
        sentences: sampleTexts.ch3.slice(0, 5).map(text => createSentence(text, '', 'draft', [], []))
      },
      {
        id: 'ch3-2',
        title: '3.2 归化与异化',
        status: 'unassigned' as const,
        sentences: sampleTexts.ch3.slice(5, 10).map(text => createSentence(text, '', 'draft', [], []))
      }
    ]
  },
  {
    id: 'ch4',
    title: '第四章：本地化',
    status: 'translating' as const,
    translatorId: 't4',
    sentences: sampleTexts.ch4.map((text, i) =>
      createSentence(
        text,
        i < 4 ? '翻译进行中，草稿保存中...' : '',
        i < 4 ? 'draft' : 'draft',
        i === 2 ? [{ id: 'n3', content: '需确认目标市场的文化习惯', createdAt: Date.now() - 3600000 }] : [],
        []
      )
    )
  },
  {
    id: 'ch5',
    title: '第五章：翻译工具',
    status: 'unassigned' as const,
    sentences: sampleTexts.ch5.map(text => createSentence(text, '', 'draft', [], []))
  }
];

const demoProject = {
  id: 'proj1',
  name: '《翻译学导论》中译项目',
  sourceLanguage: 'English',
  targetLanguage: '中文',
  chapters,
  createdAt: Date.now() - 604800000
};

projects.set(demoProject.id, demoProject);

const cloneDeep = (obj: any) => JSON.parse(JSON.stringify(obj));

app.get('/api/projects', (_req, res) => {
  const result = Array.from(projects.values()).map(p => ({
    id: p.id,
    name: p.name,
    sourceLanguage: p.sourceLanguage,
    targetLanguage: p.targetLanguage,
    createdAt: p.createdAt,
    chapterCount: p.chapters.length
  }));
  res.json(result);
});

app.get('/api/projects/:id', (req, res) => {
  const project = projects.get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(cloneDeep(project));
});

app.post('/api/projects', (req, res) => {
  const { name, sourceLanguage, targetLanguage, content } = req.body;
  const sentences = content.split(/[。.!?！？]/).filter((s: string) => s.trim()).map((text: string) => createSentence(text.trim()));
  const newProject = {
    id: uuidv4(),
    name,
    sourceLanguage,
    targetLanguage,
    chapters: [{
      id: uuidv4(),
      title: '第一章',
      status: 'unassigned' as const,
      sentences
    }],
    createdAt: Date.now()
  };
  projects.set(newProject.id, newProject);
  res.status(201).json(newProject);
});

app.get('/api/projects/:id/progress', (req, res) => {
  const project = projects.get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const countByStatus = { unassigned: 0, translating: 0, reviewing: 0, completed: 0 };
  const countChapters = (chapters: any[]) => {
    chapters.forEach(ch => {
      countByStatus[ch.status]++;
      if (ch.children) countChapters(ch.children);
    });
  };
  countChapters(project.chapters);
  res.json(countByStatus);
});

app.get('/api/chapters/:id', (req, res) => {
  let found = null;
  projects.forEach(project => {
    const findChapter = (chapters: any[]): any => {
      for (const ch of chapters) {
        if (ch.id === req.params.id) return ch;
        if (ch.children) {
          const child = findChapter(ch.children);
          if (child) return child;
        }
      }
      return null;
    };
    found = found || findChapter(project.chapters);
  });
  if (!found) return res.status(404).json({ error: 'Chapter not found' });
  res.json(cloneDeep(found));
});

app.put('/api/chapters/:id/sentences/:sentenceId', (req, res) => {
  const { translation } = req.body;
  let found = null;
  projects.forEach(project => {
    const findChapter = (chapters: any[]): any => {
      for (const ch of chapters) {
        if (ch.id === req.params.id) return ch;
        if (ch.children) {
          const child = findChapter(ch.children);
          if (child) return child;
        }
      }
      return null;
    };
    found = found || findChapter(project.chapters);
  });
  if (!found) return res.status(404).json({ error: 'Chapter not found' });
  const sentence = found.sentences.find((s: any) => s.id === req.params.sentenceId);
  if (!sentence) return res.status(404).json({ error: 'Sentence not found' });
  sentence.translation = translation;
  sentence.status = 'draft';
  res.json(sentence);
});

app.put('/api/chapters/:id/sentences/:sentenceId/status', (req, res) => {
  const { status } = req.body;
  let found = null;
  projects.forEach(project => {
    const findChapter = (chapters: any[]): any => {
      for (const ch of chapters) {
        if (ch.id === req.params.id) return ch;
        if (ch.children) {
          const child = findChapter(ch.children);
          if (child) return child;
        }
      }
      return null;
    };
    found = found || findChapter(project.chapters);
  });
  if (!found) return res.status(404).json({ error: 'Chapter not found' });
  const sentence = found.sentences.find((s: any) => s.id === req.params.sentenceId);
  if (!sentence) return res.status(404).json({ error: 'Sentence not found' });
  sentence.status = status;
  res.json(sentence);
});

app.post('/api/chapters/:id/sentences/:sentenceId/notes', (req, res) => {
  const { content } = req.body;
  let found = null;
  projects.forEach(project => {
    const findChapter = (chapters: any[]): any => {
      for (const ch of chapters) {
        if (ch.id === req.params.id) return ch;
        if (ch.children) {
          const child = findChapter(ch.children);
          if (child) return child;
        }
      }
      return null;
    };
    found = found || findChapter(project.chapters);
  });
  if (!found) return res.status(404).json({ error: 'Chapter not found' });
  const sentence = found.sentences.find((s: any) => s.id === req.params.sentenceId);
  if (!sentence) return res.status(404).json({ error: 'Sentence not found' });
  const newNote = { id: uuidv4(), content, createdAt: Date.now() };
  sentence.notes.push(newNote);
  res.status(201).json(newNote);
});

app.post('/api/chapters/:id/sentences/:sentenceId/annotations', (req, res) => {
  const { content, decision, reviewerId, reviewerName } = req.body;
  let found = null;
  projects.forEach(project => {
    const findChapter = (chapters: any[]): any => {
      for (const ch of chapters) {
        if (ch.id === req.params.id) return ch;
        if (ch.children) {
          const child = findChapter(ch.children);
          if (child) return child;
        }
      }
      return null;
    };
    found = found || findChapter(project.chapters);
  });
  if (!found) return res.status(404).json({ error: 'Chapter not found' });
  const sentence = found.sentences.find((s: any) => s.id === req.params.sentenceId);
  if (!sentence) return res.status(404).json({ error: 'Sentence not found' });
  const newAnnotation = { id: uuidv4(), reviewerId, reviewerName, content, decision, createdAt: Date.now() };
  sentence.annotations.push(newAnnotation);
  sentence.status = decision;
  res.status(201).json(newAnnotation);
});

app.get('/api/translators', (_req, res) => {
  res.json(Array.from(translators.values()));
});

app.listen(PORT, () => {
  console.log(`Translation API server running on port ${PORT}`);
});
