import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { SensorSimulator } from './SensorSimulator.js';
import { RuleEngine } from './RuleEngine.js';
import { DeviceManager } from './DeviceManager.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

app.use(express.json());

const simulator = new SensorSimulator();
const ruleEngine = new RuleEngine();
const deviceManager = new DeviceManager();

app.get('/api/sensors', (_req, res) => {
  const data = simulator.getAllCurrentData();
  const result: Record<string, unknown> = {};
  for (const [room, sensors] of data) {
    result[room] = sensors;
  }
  res.json(result);
});

app.get('/api/sensors/:roomId/history', (req, res) => {
  const history = simulator.getHistory(req.params.roomId);
  if (!history) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  res.json(history);
});

app.get('/api/rules', (_req, res) => {
  res.json(ruleEngine.getRules());
});

app.post('/api/rules', (req, res) => {
  const rule = ruleEngine.addRule(req.body);
  res.status(201).json(rule);
});

app.put('/api/rules/:id', (req, res) => {
  const updated = ruleEngine.updateRule(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Rule not found' });
    return;
  }
  res.json(updated);
});

app.delete('/api/rules/:id', (req, res) => {
  const deleted = ruleEngine.deleteRule(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Rule not found' });
    return;
  }
  res.status(204).end();
});

app.get('/api/devices', (_req, res) => {
  res.json(deviceManager.getDevices());
});

app.post('/api/devices/:id/toggle', (req, res) => {
  const device = deviceManager.toggleDevice(req.params.id);
  if (!device) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }
  io.emit('device-update', device);
  res.json(device);
});

app.post('/api/devices/:id/mode', (req, res) => {
  const { mode } = req.body;
  const device = deviceManager.setDeviceMode(req.params.id, mode);
  if (!device) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }
  io.emit('device-update', device);
  res.json(device);
});

app.post('/api/devices/:id/value', (req, res) => {
  const { key, value } = req.body;
  const device = deviceManager.setDeviceValue(req.params.id, key, value);
  if (!device) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }
  io.emit('device-update', device);
  res.json(device);
});

function checkSafetyAlerts(
  roomId: string,
  sensors: { temperature: number; humidity: number; light: number }
): void {
  if (sensors.temperature > 35 || sensors.temperature < 10) {
    io.emit('alert', {
      roomId,
      sensorType: 'temperature',
      value: sensors.temperature,
      message: `Temperature ${sensors.temperature}°C is outside safe range (10-35°C)`,
      timestamp: Date.now(),
    });
  }
}

simulator.start((update) => {
  io.emit('sensor-data', update);

  checkSafetyAlerts(update.roomId, update.sensors);

  const triggered = ruleEngine.evaluate(update.roomId, update.sensors);
  for (const result of triggered) {
    io.emit('rule-triggered', {
      rule: result.rule,
      actions: result.actions,
      roomId: update.roomId,
      timestamp: update.timestamp,
    });

    for (const action of result.actions) {
      if (action.action === 'on') {
        const device = deviceManager.getDevice(action.deviceId);
        if (device && !device.state.on) {
          deviceManager.toggleDevice(action.deviceId);
          io.emit('device-update', deviceManager.getDevice(action.deviceId));
        }
      } else if (action.action === 'off') {
        const device = deviceManager.getDevice(action.deviceId);
        if (device && device.state.on) {
          deviceManager.toggleDevice(action.deviceId);
          io.emit('device-update', deviceManager.getDevice(action.deviceId));
        }
      } else if (action.action === 'set' && action.value !== undefined) {
        const device = deviceManager.setDeviceValue(
          action.deviceId,
          'value',
          action.value
        );
        if (device) {
          io.emit('device-update', device);
        }
      }
    }
  }
});

simulator.startHistorySampling();

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Smart Home server running on port ${PORT}`);
});
