import axios from 'axios';
import { Earthquake } from '../types/earthquake';

const API_BASE = '/api';

export const fetchEarthquakes = async (
  startTime?: string,
  endTime?: string
): Promise<Earthquake[]> => {
  const params: Record<string, string> = {};
  if (startTime) params.startTime = startTime;
  if (endTime) params.endTime = endTime;

  const response = await axios.get(`${API_BASE}/earthquakes`, { params });
  return response.data;
};
