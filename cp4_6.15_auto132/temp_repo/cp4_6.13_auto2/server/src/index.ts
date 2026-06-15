import express, { Request, Response, Express } from 'express';
import cors from 'cors';
import { getWordDetail, getSentenceExamples } from './nlpEngine';
import { wordStore } from './store';
import { sampleArticle } from './data/sampleArticle';
import type { LookupWordRequest, CollectionRequest, ReviewResultRequest } from './types';

const app: Express = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[Server] ${req.method} ${req.url}`);
  next();
});

app.get('/api/article', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: sampleArticle
  });
});

app.post('/api/word', (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { word, context, paragraph }: LookupWordRequest = req.body;
    
    if (!word || !context) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: word and context'
      });
    }
    
    const detail = getWordDetail(word, context, paragraph || context);
    
    if (!detail) {
      return res.json({
        success: false,
        error: `Word "${word}" not found in dictionary`
      });
    }
    
    const duration = Date.now() - startTime;
    console.log(`[API] /api/word processed in ${duration}ms`);
    
    res.json({
      success: true,
      data: detail,
      processingTime: duration
    });
  } catch (error) {
    console.error('[API] Error in /api/word:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.post('/api/sentence', (req: Request, res: Response) => {
  try {
    const { word } = req.body;
    
    if (!word) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: word'
      });
    }
    
    const examples = getSentenceExamples(word);
    
    res.json({
      success: true,
      data: examples
    });
  } catch (error) {
    console.error('[API] Error in /api/sentence:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.post('/api/collection', (req: Request, res: Response) => {
  try {
    const { word, lemma, contextSentence }: CollectionRequest = req.body;
    
    if (!word || !lemma) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }
    
    const collected = wordStore.addWord(word, lemma, contextSentence || '');
    
    res.json({
      success: true,
      data: collected
    });
  } catch (error) {
    console.error('[API] Error in /api/collection POST:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.get('/api/collection', (req: Request, res: Response) => {
  try {
    const collections = wordStore.getCollections();
    
    res.json({
      success: true,
      data: collections
    });
  } catch (error) {
    console.error('[API] Error in /api/collection GET:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.delete('/api/collection/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const removed = wordStore.removeWord(id);
    
    if (!removed) {
      return res.status(404).json({
        success: false,
        error: 'Collection item not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Word removed from collection'
    });
  } catch (error) {
    console.error('[API] Error in /api/collection DELETE:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.get('/api/stats', (req: Request, res: Response) => {
  try {
    const stats = wordStore.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[API] Error in /api/stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.get('/api/stats/review', (req: Request, res: Response) => {
  try {
    const dueWords = wordStore.getDueWords();
    
    res.json({
      success: true,
      data: dueWords
    });
  } catch (error) {
    console.error('[API] Error in /api/stats/review:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.post('/api/stats/review/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quality }: ReviewResultRequest = req.body;
    
    if (quality === undefined || quality < 0 || quality > 5) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quality value, must be between 0 and 5'
      });
    }
    
    const updated = wordStore.updateReviewResult(id, quality);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Word not found in collection'
      });
    }
    
    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('[API] Error in /api/stats/review/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.get('/api/collection/check/:lemma', (req: Request, res: Response) => {
  try {
    const { lemma } = req.params;
    const isCollected = wordStore.isWordCollected(lemma);
    
    res.json({
      success: true,
      data: { isCollected }
    });
  } catch (error) {
    console.error('[API] Error in /api/collection/check:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`[Server] WordFlow API server running on port ${PORT}`);
  console.log(`[Server] Endpoints: POST /api/word, POST /api/sentence, POST /api/collection, GET /api/stats`);
});

export default app;
