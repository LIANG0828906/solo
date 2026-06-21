import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import vm from 'vm';

interface RunResult {
  status: 'success' | 'error';
  output: string;
  error?: string;
  executionTime: number;
}

interface HistoryRecord {
  id: string;
  userId: string;
  timestamp: number;
  code: string;
  status: 'success' | 'error';
  output: string;
  error?: string;
}

const histories = new Map<string, HistoryRecord[]>();

const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/run', (req, res) => {
  const { code } = req.body as { code: string };

  const output: string[] = [];

  const customConsole = {
    log: (...args: unknown[]) => {
      output.push(args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' '));
    },
    error: (...args: unknown[]) => {
      output.push(args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' '));
    },
    warn: (...args: unknown[]) => {
      output.push(args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' '));
    }
  };

  const context = {
    console: customConsole,
    Array,
    Object,
    JSON,
    Math,
    Date,
    parseInt,
    parseFloat,
    isNaN,
    Infinity,
    NaN,
    undefined,
    Number,
    String,
    Boolean,
    Map,
    Set,
    Promise
  };

  vm.createContext(context);

  const startTime = Date.now();
  let result: RunResult;

  try {
    vm.runInContext(code, context, { timeout: 5000 });
    const executionTime = Date.now() - startTime;
    result = {
      status: 'success',
      output: output.join('\n'),
      executionTime
    };
  } catch (err) {
    const executionTime = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);
    result = {
      status: 'error',
      output: output.join('\n'),
      error: errorMessage,
      executionTime
    };
  }

  res.json(result);
});

app.post('/api/history', (req, res) => {
  const { userId, code, status, output, error } = req.body as {
    userId: string;
    code: string;
    status: 'success' | 'error';
    output: string;
    error?: string;
  };

  const id = uuidv4();
  const timestamp = Date.now();

  const record: HistoryRecord = {
    id,
    userId,
    timestamp,
    code,
    status,
    output,
    error
  };

  const userHistory = histories.get(userId) || [];
  userHistory.push(record);
  userHistory.sort((a, b) => b.timestamp - a.timestamp);
  histories.set(userId, userHistory);

  res.json({ id, timestamp });
});

app.get('/api/history/:userId', (req, res) => {
  const { userId } = req.params;
  const records = histories.get(userId) || [];
  res.json({ records });
});

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});
