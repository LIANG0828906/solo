const express = require('express');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const SHIFTS = {
  MORNING: { id: 'morning', name: '早班', color: 'lightblue' },
  AFTERNOON: { id: 'afternoon', name: '中班', color: 'orange' },
  EVENING: { id: 'evening', name: '晚班', color: 'darkblue' }
};

let employees = [
  { id: 'e1', name: '张伟', order: 0 },
  { id: 'e2', name: '李娜', order: 1 },
  { id: 'e3', name: '王强', order: 2 },
  { id: 'e4', name: '刘芳', order: 3 },
  { id: 'e5', name: '陈明', order: 4 }
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

let schedules = {};
function initSchedules() {
  const today = new Date();
  const weekStart = new Date(today);
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setDate(today.getDate() + diff);
  const weekKey = weekStart.toISOString().split('T')[0];
  
  if (!schedules[weekKey]) {
    schedules[weekKey] = {};
    employees.forEach(emp => {
      schedules[weekKey][emp.id] = {};
      DAYS.forEach(d => {
        if (Math.random() > 0.4) {
          const shiftKeys = Object.keys(SHIFTS);
          const randomShift = shiftKeys[Math.floor(Math.random() * shiftKeys.length)];
          schedules[weekKey][emp.id][d] = randomShift.toLowerCase();
        }
      });
    });
  }
  return weekKey;
}

router.get('/employees', (req, res) => {
  const sorted = [...employees].sort((a, b) => a.order - b.order);
  res.json(sorted);
});

router.post('/employees', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: '请输入员工姓名' });
  }
  
  const newEmployee = {
    id: uuidv4(),
    name,
    order: employees.length
  };
  
  employees.push(newEmployee);
  res.status(201).json(newEmployee);
});

router.put('/employees/reorder', (req, res) => {
  const { orders } = req.body;
  if (!orders || !Array.isArray(orders)) {
    return res.status(400).json({ error: '无效的排序数据' });
  }
  
  orders.forEach(({ employeeId, order }) => {
    const emp = employees.find(e => e.id === employeeId);
    if (emp) {
      emp.order = order;
    }
  });
  
  const sorted = [...employees].sort((a, b) => a.order - b.order);
  res.json(sorted);
});

router.get('/week', (req, res) => {
  const weekKey = initSchedules();
  const sortedEmployees = [...employees].sort((a, b) => a.order - b.order);
  res.json({
    weekStart: weekKey,
    employees: sortedEmployees,
    schedules: schedules[weekKey] || {},
    days: DAYS,
    shifts: SHIFTS
  });
});

router.put('/:employeeId/:day', (req, res) => {
  const { shift } = req.body;
  const { employeeId, day } = req.params;
  
  if (!DAYS.includes(day)) {
    return res.status(400).json({ error: '无效的日期' });
  }
  
  const validShifts = ['morning', 'afternoon', 'evening', null];
  if (!validShifts.includes(shift)) {
    return res.status(400).json({ error: '无效的班次' });
  }
  
  const weekKey = initSchedules();
  if (!schedules[weekKey][employeeId]) {
    schedules[weekKey][employeeId] = {};
  }
  
  if (shift === null) {
    delete schedules[weekKey][employeeId][day];
  } else {
    schedules[weekKey][employeeId][day] = shift;
  }
  
  res.json({
    employeeId,
    day,
    shift: schedules[weekKey][employeeId][day] || null
  });
});

router.get('/shifts', (req, res) => {
  res.json(SHIFTS);
});

module.exports = router;
