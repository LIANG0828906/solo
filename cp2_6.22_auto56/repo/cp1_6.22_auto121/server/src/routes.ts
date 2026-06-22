import { Router, Request, Response } from 'express';
import * as services from './services.js';

const router = Router();

router.get('/stations', async (req: Request, res: Response) => {
  try {
    const stations = services.getAllStations();
    res.json(stations);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/stations', async (req: Request, res: Response) => {
  try {
    const station = services.createStation(req.body);
    res.status(201).json(station);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/stations/:id', async (req: Request, res: Response) => {
  try {
    const station = services.getStationById(req.params.id);
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }
    res.json(station);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/books', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const stationId = req.query.stationId as string | undefined;
    const result = services.getAllBooks(page, pageSize, stationId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/books', async (req: Request, res: Response) => {
  try {
    const book = services.createBook(req.body);
    res.status(201).json(book);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/books/:id', async (req: Request, res: Response) => {
  try {
    const book = services.getBookById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(book);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/books/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, stationId, readingMinutes } = req.body;
    const book = services.updateBookStatus(req.params.id, status, stationId, readingMinutes);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(book);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/records', async (req: Request, res: Response) => {
  try {
    const bookId = req.query.bookId as string | undefined;
    const stationId = req.query.stationId as string | undefined;
    const records = services.getRecords(bookId, stationId);
    res.json(records);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/isbn/:isbn', async (req: Request, res: Response) => {
  try {
    const info = await services.lookupISBN(req.params.isbn);
    if (!info) {
      return res.status(404).json({ error: 'ISBN not found' });
    }
    res.json(info);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
