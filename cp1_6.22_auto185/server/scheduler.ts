import cron from 'node-cron';
import type { Meeting, Team } from './types';
import { sendMeetingReminder } from './notification';

export interface SchedulerDeps {
  getTeams: () => Team[];
  getMeetings: () => Meeting[];
  updateMeeting: (id: string, updates: Partial<Meeting>) => void;
}

let schedulerTask: cron.ScheduledTask | null = null;

export function startScheduler(deps: SchedulerDeps) {
  if (schedulerTask) return;

  schedulerTask = cron.schedule('* * * * *', async () => {
    const now = Date.now();
    const meetings = deps.getMeetings();
    const teams = deps.getTeams();

    for (const meeting of meetings) {
      const team = teams.find(t => t.id === meeting.teamId);
      if (!team) continue;

      const meetingDate = new Date(`${meeting.date}T${meeting.startTimeUTC}Z`);
      const meetingTimestamp = meetingDate.getTime();

      const diffMinutes = Math.floor((meetingTimestamp - now) / 60000);

      if (diffMinutes <= 15 && diffMinutes > 14 && !meeting.notified15) {
        await sendMeetingReminder(meeting, team, 15);
        deps.updateMeeting(meeting.id, { notified15: true });
      }

      if (diffMinutes <= 5 && diffMinutes > 4 && !meeting.notified5) {
        await sendMeetingReminder(meeting, team, 5);
        deps.updateMeeting(meeting.id, { notified5: true });
      }
    }
  });

  console.log('[Scheduler] 会议提醒调度器已启动 (每分钟扫描)');
}

export function stopScheduler() {
  if (schedulerTask) {
    schedulerTask.stop();
    schedulerTask = null;
    console.log('[Scheduler] 调度器已停止');
  }
}
