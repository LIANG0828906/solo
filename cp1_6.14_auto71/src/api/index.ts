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