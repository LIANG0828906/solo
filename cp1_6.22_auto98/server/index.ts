import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { translate, sampleSentences } from './translateService';

type Language = 'zh' | 'en' | 'ja' | 'fr' | 'de';

interface Project {
  id: string;
  name: string;
  sourceLang: Language;
  targetLang: Language;
  createdAt: number;
}

interface TranslationMemory {
  id: string;
  projectId: string;
  sourceText: string;
  translatedText: string;
  createdAt: number;
}

interface Term {
  id: string;
  term: string;
  definition: string;
  language: Language;
  createdAt: number;
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const projects: Project[] = [];
const translations: TranslationMemory[] = [];
const terms: Term[] = [];
const projectSentences: Record<string, string[]> = {};

app.get('/api/projects', (_req, res) => {
  res.json(projects);
});

const validLanguages: Language[] = ['zh', 'en', 'ja', 'fr', 'de'];

app.post('/api/projects', (req, res) => {
  const { name, sourceLang, targetLang } = req.body;
  if (!name || !sourceLang || !targetLang) {
    return res.status(400).json({ error: '缺少必要字段' });
  }
  if (!validLanguages.includes(sourceLang) || !validLanguages.includes(targetLang)) {
    return res.status(400).json({ error: '无效的语言参数' });
  }
  const sl = sourceLang as Language;
  const tl = targetLang as Language;
  const project: Project = {
    id: uuidv4(),
    name,
    sourceLang: sl,
    targetLang: tl,
    createdAt: Date.now(),
  };
  projects.push(project);
  projectSentences[project.id] = sampleSentences[sl] || sampleSentences.en;
  res.status(201).json(project);
});

app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: '项目不存在' });
  }
  projects.splice(idx, 1);
  delete projectSentences[id];
  const toDelete = translations.filter((t) => t.projectId === id);
  toDelete.forEach((t) => {
    const ti = translations.indexOf(t);
    if (ti !== -1) translations.splice(ti, 1);
  });
  res.json({ success: true });
});

app.get('/api/projects/:id/sentences', (req, res) => {
  const { id } = req.params;
  const project = projects.find((p) => p.id === id);
  if (!project) {
    return res.status(404).json({ error: '项目不存在' });
  }
  const sentences = projectSentences[id] || [];
  const projTranslations = translations.filter((t) => t.projectId === id);
  res.json({ project, sentences, translations: projTranslations });
});

app.get('/api/projects/:id/translations', (req, res) => {
  const { id } = req.params;
  const projTranslations = translations.filter((t) => t.projectId === id);
  res.json(projTranslations);
});

app.post('/api/projects/:id/translations', (req, res) => {
  const { id } = req.params;
  const { sourceText, translatedText } = req.body;
  const project = projects.find((p) => p.id === id);
  if (!project) {
    return res.status(404).json({ error: '项目不存在' });
  }
  const existingIdx = translations.findIndex(
    (t) => t.projectId === id && t.sourceText === sourceText
  );
  if (existingIdx !== -1) {
    translations[existingIdx].translatedText = translatedText;
    return res.json(translations[existingIdx]);
  }
  const tm: TranslationMemory = {
    id: uuidv4(),
    projectId: id,
    sourceText,
    translatedText,
    createdAt: Date.now(),
  };
  translations.push(tm);
  res.status(201).json(tm);
});

app.get('/api/terms', (_req, res) => {
  res.json(terms);
});

app.post('/api/terms', (req, res) => {
  const { term, definition, language } = req.body;
  if (!term || !definition || !language) {
    return res.status(400).json({ error: '缺少必要字段' });
  }
  const t: Term = {
    id: uuidv4(),
    term,
    definition,
    language,
    createdAt: Date.now(),
  };
  terms.push(t);
  res.status(201).json(t);
});

app.put('/api/terms/:id', (req, res) => {
  const { id } = req.params;
  const idx = terms.findIndex((t) => t.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: '术语不存在' });
  }
  const { term, definition, language } = req.body;
  if (term !== undefined) terms[idx].term = term;
  if (definition !== undefined) terms[idx].definition = definition;
  if (language !== undefined) terms[idx].language = language;
  res.json(terms[idx]);
});

app.delete('/api/terms/:id', (req, res) => {
  const { id } = req.params;
  const idx = terms.findIndex((t) => t.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: '术语不存在' });
  }
  terms.splice(idx, 1);
  res.json({ success: true });
});

app.get('/api/translate', (req, res) => {
  const { text, sourceLang, targetLang } = req.query;
  if (!text || !sourceLang || !targetLang) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  const result = translate(
    text as string,
    sourceLang as Language,
    targetLang as Language
  );
  res.json({ translation: result });
});

app.get('/api/projects/:id/export', (req, res) => {
  const { id } = req.params;
  const project = projects.find((p) => p.id === id);
  if (!project) {
    return res.status(404).json({ error: '项目不存在' });
  }
  const projTranslations = translations.filter((t) => t.projectId === id);
  const projTerms = terms.filter(
    (t) => t.language === project.sourceLang || t.language === project.targetLang
  );
  const exportData = {
    project,
    translations: projTranslations.map((t) => ({
      sourceText: t.sourceText,
      translatedText: t.translatedText,
    })),
    terms: projTerms.map((t) => ({
      term: t.term,
      definition: t.definition,
      language: t.language,
    })),
  };
  res.json(exportData);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
