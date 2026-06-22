import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { addDays } from 'date-fns';
import type { Patient, Prescription, Medication } from '../src/types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const patients = new Map<string, Patient>();
const prescriptions = new Map<string, Prescription>();

const generatePrescriptionNo = (): string => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000).toString();
  return `RX${timestamp}${random}`;
};

const isExpired = (prescription: Prescription): boolean => {
  return new Date() > new Date(prescription.expiresAt);
};

app.get('/api/patients', (req, res) => {
  const { phone } = req.query;
  if (!phone || typeof phone !== 'string') {
    return res.status(400).json({ error: '手机号不能为空' });
  }

  const patient = Array.from(patients.values()).find((p) => p.phone === phone);
  if (patient) {
    return res.json(patient);
  }
  return res.status(404).json({ error: '患者不存在' });
});

app.post('/api/patients', (req, res) => {
  const { phone, name } = req.body;
  if (!phone || !name) {
    return res.status(400).json({ error: '手机号和姓名不能为空' });
  }

  const existing = Array.from(patients.values()).find((p) => p.phone === phone);
  if (existing) {
    return res.json(existing);
  }

  const patient: Patient = {
    id: uuidv4(),
    phone,
    name,
    createdAt: new Date().toISOString(),
  };
  patients.set(patient.id, patient);
  res.status(201).json(patient);
});

app.get('/api/prescriptions', (req, res) => {
  const { status, patientPhone, search } = req.query;
  let result = Array.from(prescriptions.values());

  if (status && typeof status === 'string') {
    result = result.filter((p) => p.status === status);
  }

  if (patientPhone && typeof patientPhone === 'string') {
    result = result.filter((p) => p.patientPhone === patientPhone);
  }

  if (search && typeof search === 'string') {
    const searchLower = search.toLowerCase();
    result = result.filter(
      (p) =>
        p.prescriptionNo.toLowerCase().includes(searchLower) ||
        p.patientPhone.includes(search)
    );
  }

  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(result);
});

app.get('/api/prescriptions/:id', (req, res) => {
  const prescription = prescriptions.get(req.params.id);
  if (!prescription) {
    return res.status(404).json({ error: '处方不存在' });
  }
  res.json(prescription);
});

app.post('/api/prescriptions', (req, res) => {
  const { patientPhone, patientName, doctorName, medications } = req.body;

  if (!patientPhone || !patientName || !doctorName || !medications || !Array.isArray(medications)) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  let patient = Array.from(patients.values()).find((p) => p.phone === patientPhone);
  if (!patient) {
    patient = {
      id: uuidv4(),
      phone: patientPhone,
      name: patientName,
      createdAt: new Date().toISOString(),
    };
    patients.set(patient.id, patient);
  }

  const meds: Medication[] = medications.map((med) => ({
    id: uuidv4(),
    name: med.name,
    dosage: med.dosage,
    usage: med.usage,
    days: med.days,
    dispensed: false,
  }));

  const now = new Date();
  const prescription: Prescription = {
    id: uuidv4(),
    prescriptionNo: generatePrescriptionNo(),
    patientId: patient.id,
    patientName,
    patientPhone,
    doctorName,
    medications: meds,
    status: 'pending',
    createdAt: now.toISOString(),
    expiresAt: addDays(now, 7).toISOString(),
    reminders: [],
  };

  prescriptions.set(prescription.id, prescription);
  res.status(201).json(prescription);
});

app.patch('/api/prescriptions/:id/status', (req, res) => {
  const prescription = prescriptions.get(req.params.id);
  if (!prescription) {
    return res.status(404).json({ error: '处方不存在' });
  }

  const { status, dispensedMedications } = req.body;
  if (status !== 'dispensed') {
    return res.status(400).json({ error: '无效的状态' });
  }

  if (!dispensedMedications || !Array.isArray(dispensedMedications)) {
    return res.status(400).json({ error: '请选择已配药品' });
  }

  const allMedicationIds = prescription.medications.map((m) => m.id);
  const allDispensed = allMedicationIds.every((id) => dispensedMedications.includes(id));

  if (!allDispensed) {
    return res.status(400).json({ error: '请确认所有药品已配药' });
  }

  prescription.medications = prescription.medications.map((med) => ({
    ...med,
    dispensed: dispensedMedications.includes(med.id),
  }));
  prescription.status = 'dispensed';

  prescriptions.set(prescription.id, prescription);
  res.json(prescription);
});

app.patch('/api/prescriptions/:id/reminders', (req, res) => {
  const prescription = prescriptions.get(req.params.id);
  if (!prescription) {
    return res.status(404).json({ error: '处方不存在' });
  }

  if (isExpired(prescription)) {
    return res.status(400).json({ error: '处方已过期，无法设置提醒' });
  }

  const { reminders } = req.body;
  if (!Array.isArray(reminders)) {
    return res.status(400).json({ error: '提醒时间格式错误' });
  }

  prescription.reminders = reminders;
  prescriptions.set(prescription.id, prescription);
  res.json(prescription);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  GET    /api/patients?phone=`);
  console.log(`  POST   /api/patients`);
  console.log(`  GET    /api/prescriptions`);
  console.log(`  POST   /api/prescriptions`);
  console.log(`  GET    /api/prescriptions/:id`);
  console.log(`  PATCH  /api/prescriptions/:id/status`);
  console.log(`  PATCH  /api/prescriptions/:id/reminders`);
});
