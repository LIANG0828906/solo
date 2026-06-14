const express = require('express');
const QRCode = require('qrcode');
const {
  createEvent,
  getEvent,
  getEvents,
  updateEvent,
  deleteEvent,
  registerEvent,
  getRegistrationsByEventId,
  signIn,
  getEventStats
} = require('../models/event');

const router = express.Router();

router.get('/', (req, res) => {
  const events = getEvents();
  res.json(events);
});

router.get('/:id', (req, res, next) => {
  try {
    const event = getEvent(req.params.id);
    if (!event) {
      return res.status(404).json({ error: '活动不存在' });
    }
    res.json(event);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, description, dateTime, location, maxParticipants } = req.body;
    
    if (!title || !dateTime || !location || !maxParticipants) {
      return res.status(400).json({ error: '缺少必填字段' });
    }
    
    const tempEvent = createEvent({
      title,
      description,
      dateTime,
      location,
      maxParticipants
    });
    
    const qrCodeData = `event:${tempEvent.id}`;
    const qrCode = await QRCode.toDataURL(qrCodeData);
    
    const event = updateEvent(tempEvent.id, { qrCode });
    
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const event = updateEvent(req.params.id, req.body);
    if (!event) {
      return res.status(404).json({ error: '活动不存在' });
    }
    res.json(event);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    const deleted = deleteEvent(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: '活动不存在' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post('/:id/register', async (req, res, next) => {
  try {
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: '姓名和邮箱为必填项' });
    }
    
    const tempReg = registerEvent(req.params.id, { name, email });
    
    const qrCodeData = `registration:${tempReg.id}`;
    const qrCode = await QRCode.toDataURL(qrCodeData);
    
    const registration = { ...tempReg, qrCode };
    
    const allRegs = getRegistrationsByEventId(req.params.id);
    const regIndex = allRegs.findIndex(r => r.id === tempReg.id);
    if (regIndex !== -1) {
      allRegs[regIndex] = registration;
    }
    
    res.status(201).json(registration);
  } catch (err) {
    if (err.message === '活动不存在') {
      return res.status(404).json({ error: err.message });
    }
    if (err.message === '活动名额已满' || err.message === '该邮箱已报名此活动') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

router.post('/:id/signin', (req, res, next) => {
  try {
    const { email, registrationId } = req.body;
    
    if (!email && !registrationId) {
      return res.status(400).json({ error: '请提供邮箱或报名ID' });
    }
    
    const result = signIn(req.params.id, { email, registrationId });
    res.json(result);
  } catch (err) {
    if (err.message === '活动不存在' || err.message === '未找到报名记录') {
      return res.status(404).json({ error: err.message });
    }
    if (err.message === '报名记录不属于此活动' || err.message === '已签到，请勿重复签到') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

router.get('/:id/registrations', (req, res, next) => {
  try {
    const event = getEvent(req.params.id);
    if (!event) {
      return res.status(404).json({ error: '活动不存在' });
    }
    const registrations = getRegistrationsByEventId(req.params.id);
    res.json(registrations);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/stats', (req, res, next) => {
  try {
    const stats = getEventStats(req.params.id);
    res.json(stats);
  } catch (err) {
    if (err.message === '活动不存在') {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
});

module.exports = router;
