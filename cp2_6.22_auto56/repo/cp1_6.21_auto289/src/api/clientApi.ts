import axios from 'axios';
import type { Client } from '../../shared/types';

const API_BASE = '/api/clients';

export interface CreateClientData {
  name: string;
  email?: string;
  address?: string;
}

export interface UpdateClientData {
  name?: string;
  email?: string;
  address?: string;
}

export async function getClients(): Promise<Client[]> {
  const response = await axios.get(API_BASE);
  return response.data.data;
}

export async function getClient(id: string): Promise<Client> {
  const response = await axios.get(`${API_BASE}/${id}`);
  return response.data.data;
}

export async function createClient(data: CreateClientData): Promise<Client> {
  const response = await axios.post(API_BASE, data);
  return response.data.data;
}

export async function updateClient(id: string, data: UpdateClientData): Promise<Client> {
  const response = await axios.put(`${API_BASE}/${id}`, data);
  return response.data.data;
}

export async function deleteClient(id: string): Promise<void> {
  await axios.delete(`${API_BASE}/${id}`);
}
