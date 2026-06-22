import axios from 'axios';
import type {
  Patient,
  Prescription,
  CreatePrescriptionRequest,
  UpdateStatusRequest,
  UpdateRemindersRequest,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export const patientApi = {
  search: (phone: string) =>
    api.get<Patient>(`/patients?phone=${encodeURIComponent(phone)}`).then((res) => res.data),

  create: (data: { phone: string; name: string }) =>
    api.post<Patient>('/patients', data).then((res) => res.data),
};

export const prescriptionApi = {
  getAll: (params?: { status?: string; patientPhone?: string; search?: string }) =>
    api.get<Prescription[]>('/prescriptions', { params }).then((res) => res.data),

  getById: (id: string) =>
    api.get<Prescription>(`/prescriptions/${id}`).then((res) => res.data),

  create: (data: CreatePrescriptionRequest) =>
    api.post<Prescription>('/prescriptions', data).then((res) => res.data),

  updateStatus: (id: string, data: UpdateStatusRequest) =>
    api.patch<Prescription>(`/prescriptions/${id}/status`, data).then((res) => res.data),

  updateReminders: (id: string, data: UpdateRemindersRequest) =>
    api.patch<Prescription>(`/prescriptions/${id}/reminders`, data).then((res) => res.data),
};
