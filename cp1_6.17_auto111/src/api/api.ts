import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { Fragment, Cluster, Link, ColorPalette } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const dataPath = path.join(__dirname, '../../data/fragments.json');
const rawData = fs.readFileSync(dataPath, 'utf-8');
const initialData = JSON.parse(rawData);
let fragments: Fragment[] = [...initialData.fragments];

function hashKeyword(keyword: string): number {
  let hash = 0;
  for (let i = 0; i < keyword.length; i++) {
    const char = keyword.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function computeClustersAndLinks(fragments: Fragment[]): { clusters: Cluster[]; links: Link[] } {
  const keywordFrequency = new Map<string, number>();
  fragments.forEach(fragment => {
    fragment.keywords.forEach(keyword => {
      keywordFrequency.set(keyword, (keywordFrequency.get(keyword) || 0) + 1);
    });
  });

  const fragmentPrimaryKeyword = new Map<string, string>();
  fragments.forEach(fragment => {
    let maxFreq = -1;
    let primaryKeyword = fragment.keywords[0] || '';
    fragment.keywords.forEach(keyword => {
      const freq = keywordFrequency.get(keyword) || 0;
      if (freq > maxFreq) {
        maxFreq = freq;
        primaryKeyword = keyword;
      }
    });
    fragmentPrimaryKeyword.set(fragment.id, primaryKeyword);
  });

  const clustersMap = new Map<string, Cluster>();
  fragments.forEach(fragment => {
    const keyword = fragmentPrimaryKeyword.get(fragment.id) || '';
    if (!clustersMap.has(keyword)) {
      const colorIndex = hashKeyword(keyword) % ColorPalette.length;
      clustersMap.set(keyword, {
        id: `cluster-${hashKeyword(keyword)}`,
        name: keyword,
        keyword,
        color: ColorPalette[colorIndex],
        fragmentIds: []
      });
    }
    const cluster = clustersMap.get(keyword)!;
    cluster.fragmentIds.push(fragment.id);
    fragment.clusterId = cluster.id;
  });

  const clusters = Array.from(clustersMap.values());

  const links: Link[] = [];
  for (let i = 0; i < fragments.length; i++) {
    for (let j = i + 1; j < fragments.length; j++) {
      const sharedKeywords = fragments[i].keywords.filter(k => fragments[j].keywords.includes(k));
      if (sharedKeywords.length >= 2) {
        links.push({
          source: fragments[i].id,
          target: fragments[j].id,
          strength: sharedKeywords.length
        });
      }
    }
  }

  return { clusters, links };
}

app.get('/api/fragments', (_req, res) => {
  const sorted = [...fragments].sort((a, b) => b.createdAt - a.createdAt);
  res.json(sorted);
});

app.post('/api/fragments', (req, res) => {
  const { title, content, keywords } = req.body;
  const newFragment: Fragment = {
    id: uuidv4(),
    title,
    content,
    keywords,
    createdAt: Date.now()
  };

  const { clusters } = computeClustersAndLinks([...fragments, newFragment]);
  const fragmentKeywords = newFragment.keywords;
  const keywordFrequency = new Map<string, number>();
  [...fragments, newFragment].forEach(f => {
    f.keywords.forEach(k => {
      keywordFrequency.set(k, (keywordFrequency.get(k) || 0) + 1);
    });
  });

  let maxFreq = -1;
  let primaryKeyword = fragmentKeywords[0] || '';
  fragmentKeywords.forEach(k => {
    const freq = keywordFrequency.get(k) || 0;
    if (freq > maxFreq) {
      maxFreq = freq;
      primaryKeyword = k;
    }
  });

  const cluster = clusters.find(c => c.keyword === primaryKeyword);
  if (cluster) {
    newFragment.clusterId = cluster.id;
  }

  fragments.push(newFragment);
  res.status(201).json(newFragment);
});

app.put('/api/fragments/:id', (req, res) => {
  const { id } = req.params;
  const index = fragments.findIndex(f => f.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Fragment not found' });
  }
  fragments[index] = { ...fragments[index], ...req.body, id };
  res.json(fragments[index]);
});

app.delete('/api/fragments/:id', (req, res) => {
  const { id } = req.params;
  const index = fragments.findIndex(f => f.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Fragment not found' });
  }
  fragments.splice(index, 1);
  res.json({ success: true });
});

app.get('/api/clusters', (_req, res) => {
  const result = computeClustersAndLinks(fragments);
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
});

export default app;
