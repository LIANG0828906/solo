import type { Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { executeEvaluation } from './Codesandbox.js';
import { ASSIGNMENT_ID, TEST_CASES } from './data.js';
import type { WsMessage, EvaluationResult } from '../../shared/types.js';

interface EvaluationState {
  evaluationId: string;
  status: EvaluationResult['status'];
  result: EvaluationResult | null;
}

const evaluations = new Map<string, EvaluationState>();

export function setupExecutionRoutes(
  app: import('express').Application,
  wss: WebSocketServer
): void {
  app.post('/api/submit', (req: Request, res: Response) => {
    const { code, language, assignmentId } = req.body as {
      code: string;
      language: string;
      assignmentId: string;
    };

    if (!code) {
      res.status(400).json({ success: false, error: 'Code is required' });
      return;
    }

    const evaluationId = uuidv4();

    evaluations.set(evaluationId, {
      evaluationId,
      status: 'queued',
      result: null,
    });

    runEvaluation(evaluationId, code, language || 'javascript', wss);

    res.status(200).json({ evaluationId, status: 'queued' });
  });

  app.get('/api/testcases', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      assignmentId: ASSIGNMENT_ID,
      testCases: TEST_CASES.map((tc) => ({
        id: tc.id,
        name: tc.name,
        category: tc.category,
        input: tc.input,
      })),
    });
  });
}

async function runEvaluation(
  evaluationId: string,
  userCode: string,
  language: string,
  wss: WebSocketServer
): Promise<void> {
  broadcast(wss, {
    type: 'status',
    evaluationId,
    status: 'queued',
  });

  await sleep(500);

  const state = evaluations.get(evaluationId);
  if (!state) return;

  state.status = 'running';
  broadcast(wss, {
    type: 'status',
    evaluationId,
    status: 'running',
  });

  const result = await executeEvaluation(evaluationId, userCode, language);

  for (let i = 0; i < result.testCases.length; i++) {
    broadcast(wss, {
      type: 'testResult',
      evaluationId,
      testCase: result.testCases[i],
      index: i,
    });
  }

  if (result.summary) {
    broadcast(wss, {
      type: 'summary',
      evaluationId,
      summary: result.summary,
      diff: result.diff,
    });
  }

  state.status = 'completed';
  state.result = result;

  broadcast(wss, {
    type: 'status',
    evaluationId,
    status: 'completed',
  });
}

function broadcast(wss: WebSocketServer, message: WsMessage): void {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
