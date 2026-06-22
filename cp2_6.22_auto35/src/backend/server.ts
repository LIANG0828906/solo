import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import router from './routes/index.js';
import { Route, Activity } from './utils/healthModel.js';

interface Position {
  lat: number;
  lng: number;
  timestamp: number;
}

interface Teammate {
  id: string;
  name: string;
  position: Position | null;
  online: boolean;
  socketId: string;
}

interface LiveActivity {
  id: string;
  name: string;
  inviteCode: string;
  teammates: Map<string, Teammate>;
}

interface SocketData {
  activityId: string;
  teammateId: string;
}

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const routes = new Map<string, Route>();
const activities = new Map<string, Activity>();
const inviteCodeToActivityId = new Map<string, string>();
const liveActivities = new Map<string, LiveActivity>();

app.locals.routes = routes;
app.locals.activities = activities;
app.locals.inviteCodeToActivityId = inviteCodeToActivityId;

app.use('/api', router);

const socketToActivity = new Map<string, string>();

io.on('connection', (socket) => {
  socket.data = {} as SocketData;

  socket.on('activity:join', ({ inviteCode, teammateId, teammateName }: { inviteCode: string; teammateId: string; teammateName: string }) => {
    const activityId = inviteCodeToActivityId.get(inviteCode);
    if (!activityId) {
      socket.emit('error', { message: '活动不存在' });
      return;
    }

    let liveActivity = liveActivities.get(activityId);
    if (!liveActivity) {
      const activity = activities.get(activityId);
      if (!activity) {
        socket.emit('error', { message: '活动不存在' });
        return;
      }
      liveActivity = {
        id: activityId,
        name: activity.name,
        inviteCode: activity.inviteCode,
        teammates: new Map()
      };
      liveActivities.set(activityId, liveActivity);
    }

    const teammate: Teammate = {
      id: teammateId,
      name: teammateName,
      position: null,
      online: true,
      socketId: socket.id,
    };

    liveActivity.teammates.set(teammateId, teammate);
    socket.data.activityId = activityId;
    socket.data.teammateId = teammateId;
    socketToActivity.set(socket.id, activityId);

    socket.join(activityId);

    io.to(activityId).emit('teammate:joined', {
      teammateId,
      teammateName,
      activityId,
    });

    const teammatesList = Array.from(liveActivity.teammates.values()).map((t) => ({
      id: t.id,
      name: t.name,
      online: t.online,
      position: t.position,
    }));

    socket.emit('activity:joined', {
      activityId,
      activityName: liveActivity.name,
      teammates: teammatesList,
    });
  });

  socket.on('position:update', ({ lat, lng }: { lat: number; lng: number }) => {
    const { activityId, teammateId } = socket.data;
    if (!activityId || !teammateId) return;

    const liveActivity = liveActivities.get(activityId);
    if (!liveActivity) return;

    const teammate = liveActivity.teammates.get(teammateId);
    if (!teammate) return;

    const position: Position = {
      lat,
      lng,
      timestamp: Date.now(),
    };

    teammate.position = position;

    socket.to(activityId).emit('position:broadcast', {
      teammateId,
      position,
    });
  });

  socket.on('disconnect', () => {
    const { activityId, teammateId } = socket.data;
    if (!activityId || !teammateId) {
      socketToActivity.delete(socket.id);
      return;
    }

    const liveActivity = liveActivities.get(activityId);
    if (!liveActivity) {
      socketToActivity.delete(socket.id);
      return;
    }

    const teammate = liveActivity.teammates.get(teammateId);
    if (teammate) {
      teammate.online = false;
    }

    socketToActivity.delete(socket.id);

    io.to(activityId).emit('teammate:left', {
      teammateId,
      activityId,
    });
  });
});

server.listen(3001, () => {
  console.log('Server running on port 3001');
});
