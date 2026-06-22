import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { Fragment, Artifact, Note } from './types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let fragments: Fragment[] = [];
let artifacts: Artifact[] = [];
let notes: Note[] = [];

app.get('/api/fragments', (_req: Request, res: Response) => {
  res.json({ fragments, artifacts });
});

app.post('/api/fragments', (req: Request, res: Response) => {
  const newFragments = req.body.fragments as Fragment[];
  fragments = newFragments;
  res.json({ success: true, fragments });
});

app.post('/api/artifacts', (req: Request, res: Response) => {
  const artifact = req.body.artifact as Artifact;
  artifacts.push(artifact);
  res.json({ success: true, artifact });
});

app.get('/api/artifacts', (_req: Request, res: Response) => {
  res.json({ artifacts });
});

app.get('/api/notes', (_req: Request, res: Response) => {
  res.json({ notes });
});

app.post('/api/notes', (req: Request, res: Response) => {
  const { title, content, tags, imageUrl } = req.body;
  const newNote: Note = {
    id: uuidv4(),
    title,
    content,
    timestamp: Date.now(),
    tags,
    imageUrl,
  };
  notes.push(newNote);
  res.json({ success: true, note: newNote });
});

app.post('/api/upload', (_req: Request, res: Response) => {
  res.json({ success: true, imageUrl: '/placeholder.png' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
