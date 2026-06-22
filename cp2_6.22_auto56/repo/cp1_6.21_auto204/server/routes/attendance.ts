import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { AttendanceRecord } from '../types.js';

const router = Router();

let attendanceRecords: AttendanceRecord[] = [];

router.post('/checkin', (req, res) => {
  const { qrCode } = req.body;
  if (!qrCode) {
    return res.status(400).json({ error: '缺少二维码信息' });
  }

  const parts = qrCode.split('-');
  if (parts.length < 3) {
    return res.status(400).json({ error: '二维码格式无效' });
  }

  const activityId = parts.slice(1, -1).join('-');
  const registrationId = parts[parts.length - 1];

  const existing = attendanceRecords.find((r) => r.registrationId === registrationId);
  if (existing) {
    return res.status(400).json({ error: '已签到', record: existing });
  }

  const record: AttendanceRecord = {
    id: uuidv4(),
    registrationId,
    activityId,
    name: req.body.name || '参与者',
    checkInTime: new Date().toISOString(),
  };

  attendanceRecords.push(record);
  res.status(201).json(record);
});

router.get('/activity/:activityId', (req, res) => {
  const records = attendanceRecords.filter((r) => r.activityId === req.params.activityId);
  res.json(records);
});

router.get('/activity/:activityId/stats', (req, res) => {
  const records = attendanceRecords.filter((r) => r.activityId === req.params.activityId);
  const totalRegistrations = req.query.totalRegistrations
    ? parseInt(req.query.totalRegistrations as string, 10)
    : records.length;

  const timeDistribution: Record<string, number> = {};
  records.forEach((r) => {
    const hour = new Date(r.checkInTime).getHours();
    const key = `${hour.toString().padStart(2, '0')}:00`;
    timeDistribution[key] = (timeDistribution[key] || 0) + 1;
  });

  const sortedTimeDistribution = Object.entries(timeDistribution)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, count]) => ({ time, count }));

  res.json({
    totalCheckedIn: records.length,
    totalRegistrations,
    checkInRate: totalRegistrations > 0 ? records.length / totalRegistrations : 0,
    timeDistribution: sortedTimeDistribution,
    records,
  });
});

router.get('/activity/:activityId/export', (req, res) => {
  const records = attendanceRecords.filter((r) => r.activityId === req.params.activityId);

  const header = '序号,姓名,签到时间\n';
  const rows = records
    .map(
      (r, i) => `${i + 1},"${r.name.replace(/"/g, '""')}","${new Date(r.checkInTime).toLocaleString('zh-CN')}"`
    )
    .join('\n');

  const csv = '\uFEFF' + header + rows;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="attendance-${req.params.activityId}.csv"`);
  res.send(csv);
});

export default router;
