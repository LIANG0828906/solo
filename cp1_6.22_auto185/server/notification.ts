import { WebSocketServer, WebSocket } from 'ws';
import nodemailer from 'nodemailer';
import type { Meeting, Team, TeamMember } from './types';
import { utcHourToLocal } from './timezoneProcessor';

export interface NotificationPayload {
  type: 'meeting_reminder_15' | 'meeting_reminder_5' | 'meeting_created';
  meetingId: string;
  title: string;
  startTimeUTC: string;
  endTimeUTC: string;
  teamName: string;
  minutesUntil: number;
  timestamp: number;
}

let wss: WebSocketServer | null = null;
const connectedClients: Map<string, WebSocket> = new Map();

export function initWebSocketServer(server: any) {
  if (wss) return;
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    connectedClients.set(clientId, ws);

    ws.send(JSON.stringify({
      type: 'connected',
      clientId,
      timestamp: Date.now(),
    }));

    ws.on('close', () => {
      connectedClients.delete(clientId);
    });

    ws.on('error', () => {
      connectedClients.delete(clientId);
    });
  });
}

export function broadcastNotification(payload: NotificationPayload) {
  if (!wss) return;
  const message = JSON.stringify(payload);
  connectedClients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(message);
      } catch (e) {}
    }
  });
}

let mailTransporter: nodemailer.Transporter | null = null;

export function initMailer() {
  try {
    mailTransporter = nodemailer.createTransport({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: {
        user: 'no-reply@meeting-scheduler.local',
        pass: 'placeholder',
      },
    });
  } catch (e) {
    console.warn('邮件传输初始化失败，邮件通知功能将不可用');
  }
}

export async function sendEmailNotification(
  member: TeamMember,
  meeting: Meeting,
  team: Team,
  minutesUntil: number
) {
  if (!mailTransporter || !member.email) return;

  const localHour = utcHourToLocal(
    parseInt(meeting.startTimeUTC.split(':')[0], 10),
    member.timezone
  );
  const localTimeStr = `${localHour.toString().padStart(2, '0')}:${meeting.startTimeUTC.split(':')[1] || '00'}`;

  try {
    await mailTransporter.sendMail({
      from: '"会议排期助手" <no-reply@meeting-scheduler.local>',
      to: member.email,
      subject: `[提醒] ${minutesUntil}分钟后会议开始：${meeting.title}`,
      text: `
团队：${team.name}
会议：${meeting.title}
日期：${meeting.date}
您的当地时间：${localTimeStr} (${member.timezone})
时长：${meeting.durationMinutes}分钟
备注：${meeting.notes || '无'}
      `.trim(),
    });
  } catch (e) {
    console.error(`发送邮件失败 ${member.email}:`, e);
  }
}

export async function sendMeetingReminder(
  meeting: Meeting,
  team: Team,
  minutesUntil: number
) {
  const payload: NotificationPayload = {
    type: minutesUntil === 15 ? 'meeting_reminder_15' : 'meeting_reminder_5',
    meetingId: meeting.id,
    title: meeting.title,
    startTimeUTC: meeting.startTimeUTC,
    endTimeUTC: meeting.endTimeUTC,
    teamName: team.name,
    minutesUntil,
    timestamp: Date.now(),
  };

  broadcastNotification(payload);

  for (const memberId of meeting.participantIds) {
    const member = team.members.find(m => m.id === memberId);
    if (member && member.email) {
      await sendEmailNotification(member, meeting, team, minutesUntil);
    }
  }
}

export function notifyMeetingCreated(meeting: Meeting, team: Team) {
  const payload: NotificationPayload = {
    type: 'meeting_created',
    meetingId: meeting.id,
    title: meeting.title,
    startTimeUTC: meeting.startTimeUTC,
    endTimeUTC: meeting.endTimeUTC,
    teamName: team.name,
    minutesUntil: -1,
    timestamp: Date.now(),
  };
  broadcastNotification(payload);
}
