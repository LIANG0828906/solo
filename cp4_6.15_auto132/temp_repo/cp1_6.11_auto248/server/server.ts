import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';

interface Student {
  id: string;
  name: string;
  seatRow: number;
  seatCol: number;
  attendance: AttendanceStatus;
  attendanceHistory: { date: string; status: AttendanceStatus }[];
  scores: number[];
  totalScore: number;
  lateCount: number;
  absentStreak: number;
}

type AttendanceStatus = 'present' | 'late' | 'leave' | 'absent';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = 3001;
const COLS = 9;
const ROWS = 7;

const studentNames = [
  '王阳明', '朱熹', '程颢', '程颐', '张载', '周敦颐', '邵雍',
  '范仲淹', '欧阳修', '苏轼', '苏辙', '王安石', '司马光', '曾巩',
  '李白', '杜甫', '白居易', '王维', '孟浩然', '王昌龄', '岑参',
  '韩愈', '柳宗元', '刘禹锡', '李贺', '李商隐', '杜牧', '贾岛',
  '孔子', '孟子', '荀子', '庄子', '老子', '墨子', '韩非子',
  '孙武', '吴起', '孙膑', '尉缭', '白起', '王翦', '李牧',
  '屈原', '宋玉', '司马相如', '扬雄', '班固', '张衡', '蔡邕',
  '王羲之', '顾恺之', '吴道子', '阎立本', '颜真卿', '柳公权', '欧阳询',
  '祖冲之', '张衡', '郭守敬', '沈括', '毕昇', '蔡伦'
];

const students: Map<string, Student> = new Map();

function initStudents() {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const index = row * COLS + col;
      if (index >= studentNames.length) break;
      const id = String(index + 1).padStart(3, '0');
      students.set(id, {
        id,
        name: studentNames[index],
        seatRow: row,
        seatCol: col,
        attendance: 'present',
        attendanceHistory: [],
        scores: [],
        totalScore: Math.floor(Math.random() * 40) + 60,
        lateCount: Math.floor(Math.random() * 3),
        absentStreak: 0
      });
    }
  }
}

initStudents();

app.use(express.json());

app.get('/api/students', (req, res) => {
  res.json(Array.from(students.values()));
});

app.get('/api/rank', (req, res) => {
  const ranked = calculateRankings();
  res.json(ranked);
});

interface RankedStudent extends Student {
  attendanceRate: number;
  weightedScore: number;
  rank: number;
}

function calculateRankings(): RankedStudent[] {
  const studentList = Array.from(students.values());
  
  const maxTotalScore = Math.max(...studentList.map(s => Math.max(s.totalScore, 1)), 1);
  const maxLateCount = Math.max(...studentList.map(s => Math.max(s.lateCount, 1)), 1);
  
  const ranked: RankedStudent[] = studentList.map(student => {
    const attendanceRate = calculateAttendanceRate(student);
    const scoreNorm = student.totalScore / maxTotalScore;
    const lateNorm = 1 - (student.lateCount / maxLateCount);
    
    const weightedScore = 
      attendanceRate * 0.4 +
      scoreNorm * 0.4 +
      lateNorm * 0.2;
    
    return {
      ...student,
      attendanceRate,
      weightedScore,
      rank: 0
    };
  });
  
  ranked.sort((a, b) => b.weightedScore - a.weightedScore);
  ranked.forEach((s, i) => s.rank = i + 1);
  
  return ranked;
}

function calculateAttendanceRate(student: Student): number {
  if (student.attendanceHistory.length === 0) {
    return student.attendance === 'present' || student.attendance === 'leave' ? 1.0 :
           student.attendance === 'late' ? 0.8 : 0.5;
  }
  const goodDays = student.attendanceHistory.filter(
    h => h.status === 'present' || h.status === 'leave'
  ).length;
  const lateDays = student.attendanceHistory.filter(h => h.status === 'late').length;
  return (goodDays + lateDays * 0.8 + (student.attendanceHistory.length - goodDays - lateDays) * 0.5) 
         / Math.max(student.attendanceHistory.length, 1);
}

function checkAlerts(student: Student): string[] {
  const alerts: string[] = [];
  if (student.absentStreak >= 3) {
    alerts.push(`连续${student.absentStreak}日缺勤`);
  }
  if (student.totalScore < 60) {
    alerts.push(`总分过低(${student.totalScore}分)`);
  }
  return alerts;
}

io.on('connection', (socket: Socket) => {
  console.log('客户端已连接:', socket.id);
  
  socket.emit('initialData', {
    students: Array.from(students.values()),
    rankings: calculateRankings()
  });
  
  socket.on('markAttendance', (data: { studentId: string; status: AttendanceStatus }) => {
    const student = students.get(data.studentId);
    if (!student) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    if (student.attendance === 'absent' && data.status !== 'absent') {
      student.absentStreak = 0;
    } else if (data.status === 'absent') {
      student.absentStreak++;
    }
    
    if (data.status === 'late' && student.attendance !== 'late') {
      student.lateCount++;
    } else if (student.attendance === 'late' && data.status !== 'late') {
      student.lateCount = Math.max(0, student.lateCount - 1);
    }
    
    student.attendance = data.status;
    student.attendanceHistory.push({ date: today, status: data.status });
    
    const rankings = calculateRankings();
    const alerts = checkAlerts(student);
    
    io.emit('attendanceUpdate', {
      studentId: data.studentId,
      status: data.status,
      absentStreak: student.absentStreak
    });
    
    io.emit('rankUpdate', rankings);
    
    if (alerts.length > 0) {
      io.emit('alertTriggered', {
        studentId: student.id,
        studentName: student.name,
        alerts,
        totalScore: student.totalScore,
        absentStreak: student.absentStreak
      });
    }
  });
  
  socket.on('upgradeScore', (data: { studentId: string; score: number } | { batch: { studentId: string; score: number }[] }) => {
    if ('batch' in data) {
      data.batch.forEach(item => {
        const student = students.get(item.studentId);
        if (student && item.score >= 0 && item.score <= 100) {
          student.scores.push(item.score);
          const avg = student.scores.reduce((a, b) => a + b, 0) / student.scores.length;
          student.totalScore = Math.round(avg);
        }
      });
    } else {
      const student = students.get(data.studentId);
      if (student && data.score >= 0 && data.score <= 100) {
        student.scores.push(data.score);
        const avg = student.scores.reduce((a, b) => a + b, 0) / student.scores.length;
        student.totalScore = Math.round(avg);
      }
    }
    
    const rankings = calculateRankings();
    io.emit('rankUpdate', rankings);
    
    students.forEach(student => {
      const alerts = checkAlerts(student);
      if (alerts.length > 0) {
        io.emit('alertTriggered', {
          studentId: student.id,
          studentName: student.name,
          alerts,
          totalScore: student.totalScore,
          absentStreak: student.absentStreak
        });
      }
    });
  });
  
  socket.on('swapSeats', (data: { fromId: string; toId: string }) => {
    const s1 = students.get(data.fromId);
    const s2 = students.get(data.toId);
    if (!s1 || !s2) return;
    
    const tempRow = s1.seatRow;
    const tempCol = s1.seatCol;
    s1.seatRow = s2.seatRow;
    s1.seatCol = s2.seatCol;
    s2.seatRow = tempRow;
    s2.seatCol = tempCol;
    
    io.emit('seatSwap', {
      fromId: data.fromId,
      toId: data.toId,
      students: Array.from(students.values())
    });
  });
  
  socket.on('dismissAlert', (data: { studentId: string }) => {
    const student = students.get(data.studentId);
    if (!student) return;
    
    if (student.absentStreak >= 3) {
      student.absentStreak = 0;
    }
    if (student.totalScore < 60) {
      student.totalScore = 60;
      student.scores.push(60);
    }
    
    const rankings = calculateRankings();
    io.emit('rankUpdate', rankings);
    io.emit('alertDismissed', { studentId: data.studentId });
  });
  
  socket.on('disconnect', () => {
    console.log('客户端已断开:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`书院考勤服务运行在 http://localhost:${PORT}`);
});
