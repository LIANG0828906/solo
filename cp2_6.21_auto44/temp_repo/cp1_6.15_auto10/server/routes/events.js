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

const ok = (res, data, status = 200) => {
  res.status(status).json({ success: true, data });
};

const fail = (res, error, status = 400) => {
  res.status(status).json({ success: false, error });
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.get('/', (req, res) => {
  const events = getEvents();
  ok(res, events);
});

router.get('/:id', (req, res, next) => {
  try {
    const event = getEvent(req.params.id);
    if (!event) {
      return fail(res, '活动不存在', 404);
    }
    ok(res, event);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, description, dateTime, location, maxParticipants } = req.body;

    if (!title || !dateTime || !location || !maxParticipants) {
      return fail(res, '缺少必填字段', 400);
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

    ok(res, event, 201);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const event = updateEvent(req.params.id, req.body);
    if (!event) {
      return fail(res, '活动不存在', 404);
    }
    ok(res, event);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    const deleted = deleteEvent(req.params.id);
    if (!deleted) {
      return fail(res, '活动不存在', 404);
    }
    ok(res, null, 204);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/register', async (req, res, next) => {
  try {
    const { name, email } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return fail(res, '姓名不能为空', 400);
    }

    if (!email || typeof email !== 'string') {
      return fail(res, '邮箱不能为空', 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return fail(res, '邮箱格式不正确', 422);
    }

    const tempReg = registerEvent(req.params.id, { name: name.trim(), email: email.trim() });

    const qrCodeData = `registration:${tempReg.id}`;
    const qrCode = await QRCode.toDataURL(qrCodeData);

    const registration = { ...tempReg, qrCode };

    const allRegs = getRegistrationsByEventId(req.params.id);
    const regIndex = allRegs.findIndex(r => r.id === tempReg.id);
    if (regIndex !== -1) {
      allRegs[regIndex] = registration;
    }

    ok(res, { registration, qrCode }, 201);
  } catch (err) {
    if (err.message === '活动不存在') {
      return fail(res, err.message, 404);
    }
    if (err.message === '活动名额已满' || err.message === '该邮箱已报名此活动') {
      return fail(res, err.message, 400);
    }
    next(err);
  }
});

router.post('/:id/signin', (req, res, next) => {
  try {
    const { email, registrationId } = req.body;

    if (!email && !registrationId) {
      return fail(res, '请提供邮箱或报名ID', 400);
    }

    let identifier;
    if (email && registrationId) {
      identifier = { email };
    } else if (registrationId) {
      if (typeof registrationId !== 'string' || registrationId.length < 5) {
        return fail(res, '报名ID长度不合法', 422);
      }
      if (!UUID_REGEX.test(registrationId)) {
        return fail(res, '报名ID格式不合法', 422);
      }
      identifier = { registrationId };
    } else {
      if (typeof email !== 'string') {
        return fail(res, '邮箱格式不正确', 422);
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return fail(res, '邮箱格式不正确', 422);
      }
      identifier = { email };
    }

    const result = signIn(req.params.id, identifier);
    ok(res, { success: true, signedInAt: result.signedInAt });
  } catch (err) {
    if (err.message === '活动不存在' || err.message === '未找到报名记录') {
      return fail(res, err.message, 404);
    }
    if (err.message === '报名记录不属于此活动' || err.message === '已签到，请勿重复签到') {
      return fail(res, err.message, 400);
    }
    next(err);
  }
});

router.get('/:id/registrations', (req, res, next) => {
  try {
    const event = getEvent(req.params.id);
    if (!event) {
      return fail(res, '活动不存在', 404);
    }
    const registrations = getRegistrationsByEventId(req.params.id);
    ok(res, registrations);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/stats', (req, res, next) => {
  try {
    const stats = getEventStats(req.params.id);
    ok(res, stats);
  } catch (err) {
    if (err.message === '活动不存在') {
      return fail(res, err.message, 404);
    }
    next(err);
  }
});

module.exports = router;
