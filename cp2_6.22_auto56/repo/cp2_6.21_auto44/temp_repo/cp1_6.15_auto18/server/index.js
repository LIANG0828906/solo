import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 3002

app.use(cors())
app.use(express.json())

const departments = [
  { id: 'dept-1', name: '技术研发部', riskLevel: 'high', riskCount: 5, trend: 'up' },
  { id: 'dept-2', name: '市场营销部', riskLevel: 'medium', riskCount: 3, trend: 'flat' },
  { id: 'dept-3', name: '人力资源部', riskLevel: 'low', riskCount: 1, trend: 'down' },
  { id: 'dept-4', name: '财务运营部', riskLevel: 'medium', riskCount: 2, trend: 'up' },
  { id: 'dept-5', name: '产品设计部', riskLevel: 'high', riskCount: 4, trend: 'up' },
  { id: 'dept-6', name: '客户服务部', riskLevel: 'low', riskCount: 1, trend: 'down' }
]

const generateSignals = (attendanceCount, delayRatio, overtimeChange) => {
  const signals = []
  
  if (attendanceCount > 0) {
    signals.push({
      type: 'attendance',
      title: '考勤异常',
      description: `近30天内出现 ${attendanceCount} 次迟到/早退/未打卡记录`,
      date: '2026-06-10',
      value: `${attendanceCount}次`
    })
  }
  
  if (delayRatio > 15) {
    signals.push({
      type: 'delay',
      title: '任务延误率上升',
      description: `最近一周任务延误比例较上周上升 ${delayRatio}%`,
      date: '2026-06-12',
      value: `${delayRatio}%`
    })
  }
  
  if (overtimeChange < -20) {
    signals.push({
      type: 'overtime',
      title: '加班时长骤减',
      description: `本月加班时长较上月减少 ${Math.abs(overtimeChange)}%`,
      date: '2026-06-08',
      value: `${overtimeChange}%`
    })
  }
  
  if (signals.length === 0) {
    signals.push({
      type: 'overtime',
      title: '工作状态稳定',
      description: '近期各项指标均在正常范围内',
      date: '2026-06-14',
      value: '正常'
    })
  }
  
  return signals
}

const generateTimeline = (signals) => {
  const timeline = []
  const dates = ['2026-06-14', '2026-06-12', '2026-06-10', '2026-06-08', '2026-06-05', '2026-06-03']
  
  signals.forEach((signal, idx) => {
    timeline.push({
      ...signal,
      date: dates[idx % dates.length]
    })
  })
  
  if (timeline.length < 4) {
    timeline.push({
      type: 'attendance',
      title: '考勤记录',
      description: '正常打卡上下班',
      date: '2026-06-01',
      value: '正常'
    })
  }
  
  return timeline
}

const generateSuggestion = (employee) => {
  const suggestions = []
  
  if (employee.attendanceAnomalies >= 3 && employee.taskDelayRatio >= 30) {
    suggestions.push(`该员工连续${employee.attendanceAnomalies}天考勤异常且任务延误增加${employee.taskDelayRatio}%，建议主动沟通了解情况`)
  } else if (employee.attendanceAnomalies >= 2) {
    suggestions.push(`近期考勤异常${employee.attendanceAnomalies}次，建议关注员工工作状态，了解是否有个人困难`)
  }
  
  if (employee.taskDelayRatio >= 40) {
    suggestions.push(`任务延误率达${employee.taskDelayRatio}%，建议检查工作负荷是否合理，是否需要资源支持`)
  } else if (employee.taskDelayRatio >= 20) {
    suggestions.push(`任务延误率${employee.taskDelayRatio}%，建议与员工确认任务优先级和时间安排`)
  }
  
  if (employee.overtimeChangeRate <= -40) {
    suggestions.push(`加班时长骤减${Math.abs(employee.overtimeChangeRate)}%，可能是工作积极性下降的信号，建议团队主管进行1对1沟通`)
  } else if (employee.overtimeChangeRate <= -20) {
    suggestions.push(`加班时长较上月减少${Math.abs(employee.overtimeChangeRate)}%，建议关注工作投入度变化`)
  }
  
  if (employee.riskScore >= 70) {
    suggestions.push('综合风险评分较高，建议部门主管本周内安排深度沟通，了解员工职业发展诉求')
  }
  
  if (suggestions.length === 0) {
    suggestions.push('目前各项指标正常，继续保持关注，定期进行团队沟通')
  }
  
  return suggestions.join('；')
}

const employees = {
  'dept-1': [
    { id: 'emp-101', name: '张伟', position: '高级前端工程师', riskScore: 85, attendanceAnomalies: 5, taskDelayRatio: 45, overtimeChangeRate: -55 },
    { id: 'emp-102', name: '李娜', position: '后端开发工程师', riskScore: 72, attendanceAnomalies: 3, taskDelayRatio: 35, overtimeChangeRate: -40 },
    { id: 'emp-103', name: '王强', position: '测试工程师', riskScore: 65, attendanceAnomalies: 2, taskDelayRatio: 28, overtimeChangeRate: -35 },
    { id: 'emp-104', name: '刘洋', position: '架构师', riskScore: 58, attendanceAnomalies: 1, taskDelayRatio: 20, overtimeChangeRate: -25 },
    { id: 'emp-105', name: '陈静', position: 'DevOps工程师', riskScore: 42, attendanceAnomalies: 1, taskDelayRatio: 15, overtimeChangeRate: -15 },
    { id: 'emp-106', name: '赵磊', position: '前端工程师', riskScore: 25, attendanceAnomalies: 0, taskDelayRatio: 8, overtimeChangeRate: 5 },
    { id: 'emp-107', name: '孙丽', position: '产品经理', riskScore: 18, attendanceAnomalies: 0, taskDelayRatio: 5, overtimeChangeRate: 10 }
  ],
  'dept-2': [
    { id: 'emp-201', name: '周杰', position: '市场经理', riskScore: 68, attendanceAnomalies: 3, taskDelayRatio: 30, overtimeChangeRate: -45 },
    { id: 'emp-202', name: '吴敏', position: '品牌专员', riskScore: 45, attendanceAnomalies: 1, taskDelayRatio: 22, overtimeChangeRate: -18 },
    { id: 'emp-203', name: '郑浩', position: '渠道运营', riskScore: 38, attendanceAnomalies: 1, taskDelayRatio: 18, overtimeChangeRate: -10 },
    { id: 'emp-204', name: '冯雪', position: '内容编辑', riskScore: 22, attendanceAnomalies: 0, taskDelayRatio: 10, overtimeChangeRate: 8 },
    { id: 'emp-205', name: '韩冰', position: 'SEO优化', riskScore: 15, attendanceAnomalies: 0, taskDelayRatio: 5, overtimeChangeRate: 3 }
  ],
  'dept-3': [
    { id: 'emp-301', name: '徐明', position: 'HR专员', riskScore: 35, attendanceAnomalies: 1, taskDelayRatio: 15, overtimeChangeRate: -8 },
    { id: 'emp-302', name: '朱琳', position: '招聘经理', riskScore: 18, attendanceAnomalies: 0, taskDelayRatio: 8, overtimeChangeRate: 5 },
    { id: 'emp-303', name: '胡军', position: '培训主管', riskScore: 12, attendanceAnomalies: 0, taskDelayRatio: 3, overtimeChangeRate: 12 }
  ],
  'dept-4': [
    { id: 'emp-401', name: '林芳', position: '财务主管', riskScore: 55, attendanceAnomalies: 2, taskDelayRatio: 25, overtimeChangeRate: -30 },
    { id: 'emp-402', name: '何涛', position: '会计', riskScore: 48, attendanceAnomalies: 2, taskDelayRatio: 20, overtimeChangeRate: -22 },
    { id: 'emp-403', name: '罗静', position: '出纳', riskScore: 20, attendanceAnomalies: 0, taskDelayRatio: 8, overtimeChangeRate: 0 },
    { id: 'emp-404', name: '高飞', position: '运营分析师', riskScore: 15, attendanceAnomalies: 0, taskDelayRatio: 5, overtimeChangeRate: 8 }
  ],
  'dept-5': [
    { id: 'emp-501', name: '梁雨', position: '高级产品设计师', riskScore: 78, attendanceAnomalies: 4, taskDelayRatio: 40, overtimeChangeRate: -50 },
    { id: 'emp-502', name: '宋佳', position: 'UI设计师', riskScore: 65, attendanceAnomalies: 2, taskDelayRatio: 32, overtimeChangeRate: -38 },
    { id: 'emp-503', name: '唐磊', position: '交互设计师', riskScore: 52, attendanceAnomalies: 2, taskDelayRatio: 25, overtimeChangeRate: -28 },
    { id: 'emp-504', name: '曹颖', position: '视觉设计师', riskScore: 42, attendanceAnomalies: 1, taskDelayRatio: 18, overtimeChangeRate: -15 },
    { id: 'emp-505', name: '彭博', position: '设计实习生', riskScore: 18, attendanceAnomalies: 0, taskDelayRatio: 6, overtimeChangeRate: 5 }
  ],
  'dept-6': [
    { id: 'emp-601', name: '董洁', position: '客服主管', riskScore: 28, attendanceAnomalies: 1, taskDelayRatio: 12, overtimeChangeRate: -5 },
    { id: 'emp-602', name: '袁鹏', position: '客服专员', riskScore: 15, attendanceAnomalies: 0, taskDelayRatio: 5, overtimeChangeRate: 10 },
    { id: 'emp-603', name: '潘婷', position: '客服专员', riskScore: 10, attendanceAnomalies: 0, taskDelayRatio: 3, overtimeChangeRate: 8 }
  ]
}

const riskTrends = {
  'dept-1': [
    { week: '第1周', score: 42 },
    { week: '第2周', score: 48 },
    { week: '第3周', score: 55 },
    { week: '第4周', score: 58 },
    { week: '第5周', score: 65 },
    { week: '第6周', score: 72 }
  ],
  'dept-2': [
    { week: '第1周', score: 38 },
    { week: '第2周', score: 40 },
    { week: '第3周', score: 42 },
    { week: '第4周', score: 40 },
    { week: '第5周', score: 43 },
    { week: '第6周', score: 41 }
  ],
  'dept-3': [
    { week: '第1周', score: 25 },
    { week: '第2周', score: 23 },
    { week: '第3周', score: 22 },
    { week: '第4周', score: 20 },
    { week: '第5周', score: 18 },
    { week: '第6周', score: 15 }
  ],
  'dept-4': [
    { week: '第1周', score: 32 },
    { week: '第2周', score: 35 },
    { week: '第3周', score: 38 },
    { week: '第4周', score: 42 },
    { week: '第5周', score: 45 },
    { week: '第6周', score: 48 }
  ],
  'dept-5': [
    { week: '第1周', score: 50 },
    { week: '第2周', score: 55 },
    { week: '第3周', score: 58 },
    { week: '第4周', score: 62 },
    { week: '第5周', score: 68 },
    { week: '第6周', score: 75 }
  ],
  'dept-6': [
    { week: '第1周', score: 20 },
    { week: '第2周', score: 18 },
    { week: '第3周', score: 16 },
    { week: '第4周', score: 15 },
    { week: '第5周', score: 13 },
    { week: '第6周', score: 12 }
  ]
}

app.get('/api/risk-summary', (req, res) => {
  res.json(departments)
})

app.get('/api/department/:id', (req, res) => {
  const deptId = req.params.id
  const dept = departments.find(d => d.id === deptId)
  
  if (!dept) {
    return res.status(404).json({ error: '部门不存在' })
  }
  
  const deptEmployees = (employees[deptId] || []).map(emp => ({
    ...emp,
    riskLevel: emp.riskScore >= 70 ? 'high' : emp.riskScore >= 40 ? 'medium' : 'low',
    signals: generateSignals(emp.attendanceAnomalies, emp.taskDelayRatio, emp.overtimeChangeRate)
  }))
  
  res.json({
    id: dept.id,
    name: dept.name,
    riskTrend: riskTrends[deptId] || [],
    employees: deptEmployees
  })
})

app.get('/api/employee/:id', (req, res) => {
  const empId = req.params.id
  let foundEmployee = null
  let foundDeptId = null
  
  for (const [deptId, empList] of Object.entries(employees)) {
    const emp = empList.find(e => e.id === empId)
    if (emp) {
      foundEmployee = emp
      foundDeptId = deptId
      break
    }
  }
  
  if (!foundEmployee) {
    return res.status(404).json({ error: '员工不存在' })
  }
  
  const signals = generateSignals(
    foundEmployee.attendanceAnomalies,
    foundEmployee.taskDelayRatio,
    foundEmployee.overtimeChangeRate
  )
  
  const timeline = generateTimeline(signals)
  const suggestion = generateSuggestion(foundEmployee)
  
  res.json({
    ...foundEmployee,
    riskLevel: foundEmployee.riskScore >= 70 ? 'high' : foundEmployee.riskScore >= 40 ? 'medium' : 'low',
    signals,
    timeline,
    suggestion
  })
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
  console.log(`API endpoints:`)
  console.log(`  GET /api/risk-summary`)
  console.log(`  GET /api/department/:id`)
  console.log(`  GET /api/employee/:id`)
})
