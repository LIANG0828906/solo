import express from 'express';
import http from 'http';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { voteManager } from './voteManager';
import { WSMessage, VoteSubmission, VoteType, VoteOption } from '../src/types';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const clients = new Map<string, WebSocket>();

function broadcast(message: WSMessage) {
  const data = JSON.stringify(message);
  for (const client of clients.values()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

function sendToClient(clientId: string, message: WSMessage) {
  const client = clients.get(clientId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  }
}

wss.on('connection', (ws) => {
  const clientId = uuidv4();
  clients.set(clientId, ws);

  sendToClient(clientId, {
    type: 'init',
    payload: { clientId, votes: voteManager.getAllVotes() }
  });

  ws.on('message', (data) => {
    try {
      const message: WSMessage = JSON.parse(data.toString());

      switch (message.type) {
        case 'start_vote': {
          const { type, question, options } = message.payload as {
            type: VoteType;
            question: string;
            options: VoteOption[];
          };
          const vote = voteManager.startVote(type, question, options);
          broadcast({ type: 'vote_update', payload: { vote, action: 'started' } });
          break;
        }

        case 'end_vote': {
          const { voteId } = message.payload;
          const vote = voteManager.endVote(voteId);
          if (vote) {
            broadcast({ type: 'vote_update', payload: { vote, action: 'ended' } });
          }
          break;
        }

        case 'submit_vote': {
          const submission = message.payload as VoteSubmission;
          const vote = voteManager.addVote(submission);
          if (vote) {
            broadcast({ type: 'vote_update', payload: { vote, action: 'updated' } });
          }
          break;
        }

        case 'vote_list': {
          sendToClient(clientId, {
            type: 'vote_list',
            payload: { votes: voteManager.getAllVotes() }
          });
          break;
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', clients: clients.size });
});

app.get('/api/votes/:id/export', (req, res) => {
  const vote = voteManager.getVote(req.params.id);
  if (!vote) {
    return res.status(404).json({ error: 'Vote not found' });
  }

  let csv = '';
  if (vote.type === 'rating') {
    csv = '评分,票数\n';
    vote.ratingResults?.forEach(r => {
      csv += `${r.rating},${r.count}\n`;
    });
  } else {
    csv = '选项,票数\n';
    vote.results.forEach(r => {
      const option = vote.options.find(o => o.id === r.optionId);
      csv += `"${option?.text || ''}",${r.count}\n`;
    });
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="vote-${vote.id}.csv"`);
  res.send('\uFEFF' + csv);
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}/ws`);
});
