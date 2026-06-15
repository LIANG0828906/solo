import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type {
  Pet,
  PetFormData,
  Record,
  RecordFormData,
  Measurement,
  MeasurementFormData,
  Medical,
  MedicalFormData,
  ApiResponse,
} from '../types';

const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<any>>) => {
    if (response.data.code !== 0) {
      return Promise.reject(new Error(response.data.message || '请求失败'));
    }
    return response.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const getPets = (): Promise<ApiResponse<Pet[]>> => {
  return request.get('/pets');
};

export const getPet = (id: string): Promise<ApiResponse<Pet>> => {
  return request.get(`/pets/${id}`);
};

export const createPet = (data: PetFormData): Promise<ApiResponse<Pet>> => {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('species', data.species);
  formData.append('breed', data.breed);
  formData.append('gender', data.gender);
  formData.append('birthday', data.birthday);
  formData.append('weight', String(data.weight));
  if (data.description) {
    formData.append('description', data.description);
  }
  if (data.avatar) {
    formData.append('avatar', data.avatar);
  }
  return request.post('/pets', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const updatePet = (id: string, data: Partial<PetFormData>): Promise<ApiResponse<Pet>> => {
  return request.put(`/pets/${id}`, data);
};

export const deletePet = (id: string): Promise<ApiResponse<null>> => {
  return request.delete(`/pets/${id}`);
};

export const getRecords = (petId: string): Promise<ApiResponse<Record[]>> => {
  return request.get(`/records?petId=${petId}`);
};

export const createRecord = (data: RecordFormData): Promise<ApiResponse<Record>> => {
  return request.post('/records', data);
};

export const updateRecord = (id: string, data: Partial<RecordFormData>): Promise<ApiResponse<Record>> => {
  return request.put(`/records/${id}`, data);
};

export const deleteRecord = (id: string): Promise<ApiResponse<null>> => {
  return request.delete(`/records/${id}`);
};

export const getMeasurements = (petId: string): Promise<ApiResponse<Measurement[]>> => {
  return request.get(`/records/measurements?petId=${petId}`);
};

export const createMeasurement = (data: MeasurementFormData): Promise<ApiResponse<Measurement>> => {
  return request.post('/records/measurements', data);
};

export const getMedical = (petId: string, type?: string): Promise<ApiResponse<Medical[]>> => {
  const url = type ? `/medical?petId=${petId}&type=${type}` : `/medical?petId=${petId}`;
  return request.get(url);
};

export const createMedical = (data: MedicalFormData): Promise<ApiResponse<Medical>> => {
  return request.post('/medical', data);
};

export const updateMedical = (id: string, data: Partial<MedicalFormData> & { completed?: boolean }): Promise<ApiResponse<Medical>> => {
  return request.put(`/medical/${id}`, data);
};

export const deleteMedical = (id: string): Promise<ApiResponse<null>> => {
  return request.delete(`/medical/${id}`);
};
