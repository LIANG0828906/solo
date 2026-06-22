import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { parseOpenAPI } from './parser.js';
import { generateMockData, generateAllMockData } from './mockGenerator.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const docsStore = new Map();

app.post('/api/upload', async (req, res) => {
  try {
    const { content, filename } = req.body;

    if (!content) {
      return res.status(400).json({ error: '文件内容不能为空' });
    }

    let specContent;
    if (typeof content === 'string') {
      try {
        specContent = JSON.parse(content);
      } catch {
        specContent = content;
      }
    } else {
      specContent = content;
    }

    const parsedDoc = await parseOpenAPI(specContent);
    const docId = uuidv4();

    docsStore.set(docId, {
      id: docId,
      filename: filename || 'api-spec.json',
      createdAt: new Date().toISOString(),
      spec: parsedDoc
    });

    res.json({
      id: docId,
      filename: filename || 'api-spec.json',
      info: parsedDoc.info,
      tags: parsedDoc.tags,
      paths: parsedDoc.paths
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/mock', (req, res) => {
  try {
    const { docId, path, method, params } = req.body;

    if (!docId || !docsStore.has(docId)) {
      return res.status(404).json({ error: '文档不存在，请重新上传' });
    }

    const docData = docsStore.get(docId);
    const mockResult = generateMockData(docData.spec, path, method, params || {});

    res.json(mockResult);
  } catch (error) {
    console.error('Mock error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/mock/all', (req, res) => {
  try {
    const { docId } = req.body;

    if (!docId || !docsStore.has(docId)) {
      return res.status(404).json({ error: '文档不存在，请重新上传' });
    }

    const docData = docsStore.get(docId);
    const allMockData = generateAllMockData(docData.spec);

    res.json(allMockData);
  } catch (error) {
    console.error('Mock all error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/docs/:docId', (req, res) => {
  try {
    const { docId } = req.params;

    if (!docsStore.has(docId)) {
      return res.status(404).json({ error: '文档不存在' });
    }

    const docData = docsStore.get(docId);
    res.json({
      id: docData.id,
      filename: docData.filename,
      info: docData.spec.info,
      tags: docData.spec.tags,
      paths: docData.spec.paths
    });
  } catch (error) {
    console.error('Get doc error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
