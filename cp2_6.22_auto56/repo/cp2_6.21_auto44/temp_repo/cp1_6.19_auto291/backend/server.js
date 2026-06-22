const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { cabinets } = require('./data/mockData');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

app.get('/api/cabinets', (req, res) => {
  setTimeout(() => {
    res.json(cabinets);
  }, Math.random() * 300 + 100);
});

app.post('/api/locker/claim', (req, res) => {
  const { cabinetId, compartmentId, recipientPhone, maxDuration, size } = req.body;
  const cabinet = cabinets.find((c) => c.id === cabinetId);
  if (!cabinet) {
    return res.status(404).json({ error: '柜子不存在' });
  }
  const compartment = cabinet.compartments.find((s) => s.id === compartmentId);
  if (!compartment) {
    return res.status(404).json({ error: '格口不存在' });
  }
  if (compartment.status !== 'available') {
    return res.status(400).json({ error: '格口不可用' });
  }

  const pickupCode = String(1000 + Math.floor(Math.random() * 9000));
  compartment.status = 'occupied';
  compartment.pickupCode = pickupCode;
  compartment.storedAt = new Date().toISOString();
  compartment.maxDuration = maxDuration || 60;
  compartment.recipientPhone = recipientPhone;
  compartment.depositorPhone = null;

  console.log(`[短信通知] 已向收件人 ${recipientPhone} 发送取件通知，取件码: ${pickupCode}`);

  res.json({
    success: true,
    pickupCode,
    compartmentId: compartment.id,
  });
});

app.post('/api/locker/open', (req, res) => {
  const { cabinetId, compartmentId, pickupCode } = req.body;
  const cabinet = cabinets.find((c) => c.id === cabinetId);
  if (!cabinet) {
    return res.status(404).json({ error: '柜子不存在' });
  }
  const compartment = cabinet.compartments.find((s) => s.id === compartmentId);
  if (!compartment) {
    return res.status(404).json({ error: '格口不存在' });
  }

  if (compartment.lockedUntil && new Date(compartment.lockedUntil) > new Date()) {
    return res.json({
      success: false,
      locked: true,
      message: '格口已锁定',
      lockedUntil: compartment.lockedUntil,
      failedAttempts: compartment.failedAttempts,
      remainingAttempts: 0,
    });
  }

  if (compartment.pickupCode === pickupCode) {
    compartment.status = 'available';
    compartment.pickupCode = null;
    compartment.storedAt = null;
    compartment.maxDuration = null;
    compartment.recipientPhone = null;
    compartment.depositorPhone = null;
    compartment.failedAttempts = 0;
    compartment.lockedUntil = null;

    console.log(`[取件记录] 格口 ${compartment.id} 于 ${new Date().toISOString()} 被取件`);

    res.json({
      success: true,
      message: '取件成功',
      pickedUpAt: new Date().toISOString(),
    });
  } else {
    compartment.failedAttempts += 1;
    const remainingAttempts = 3 - compartment.failedAttempts;

    if (compartment.failedAttempts >= 3) {
      const lockedUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      compartment.lockedUntil = lockedUntil;

      console.log(`[安全告警] 格口 ${compartment.id} 取件码连续错误3次，已锁定至 ${lockedUntil}，已通知寄存者`);

      res.json({
        success: false,
        locked: true,
        message: '取件码错误次数过多，格口已锁定5分钟',
        lockedUntil,
        failedAttempts: compartment.failedAttempts,
        remainingAttempts: 0,
      });
    } else {
      res.json({
        success: false,
        locked: false,
        message: `取件码错误，还剩${remainingAttempts}次机会`,
        failedAttempts: compartment.failedAttempts,
        remainingAttempts,
      });
    }
  }
});

app.post('/api/locker/overdue', (req, res) => {
  const now = Date.now();
  let overdueCount = 0;
  let extendedCount = 0;

  cabinets.forEach((cabinet) => {
    cabinet.compartments.forEach((comp) => {
      if (comp.status === 'occupied' && comp.storedAt) {
        const storedTime = new Date(comp.storedAt).getTime();
        const maxMs = comp.maxDuration * 60 * 1000;
        const elapsed = now - storedTime;

        if (elapsed > maxMs + 30 * 60 * 1000) {
          comp.status = 'overdue';
          overdueCount++;
          console.log(`[超时处理] 格口 ${comp.id} 已超时30分钟以上，标记为超时包裹，已通知管理员`);
        } else if (elapsed > maxMs + 15 * 60 * 1000) {
          comp.maxDuration += 15;
          extendedCount++;
          console.log(`[超时提醒] 格口 ${comp.id} 超时15分钟，已延长15分钟并再次通知收件人 ${comp.recipientPhone}`);
        } else if (elapsed > maxMs) {
          console.log(`[超时提醒] 格口 ${comp.id} 已超过最长寄存时间，已通知收件人 ${comp.recipientPhone}`);
        }
      }
    });
  });

  res.json({
    success: true,
    overdueCount,
    extendedCount,
    message: `处理完成：${overdueCount}个超时，${extendedCount}个已延长`,
  });
});

app.listen(PORT, () => {
  console.log(`储物柜后端服务运行在 http://localhost:${PORT}`);
});
