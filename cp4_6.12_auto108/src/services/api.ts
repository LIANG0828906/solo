import axios from 'axios';
import type {
  Attraction,
  GenerateItineraryRequest,
  Itinerary,
  ExportPdfRequest,
  ExportPdfResponse,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

export async function fetchAttractions(city: string): Promise<Attraction[]> {
  const response = await api.get<{ data: Attraction[] }>('/attractions', {
    params: { city },
  });
  return response.data.data;
}

export async function generateItinerary(
  payload: GenerateItineraryRequest
): Promise<Itinerary> {
  const response = await api.post<{ data: Itinerary }>(
    '/generate-itinerary',
    payload
  );
  return response.data.data;
}

export async function recalculateDuration(
  itinerary: Itinerary
): Promise<Itinerary> {
  const response = await api.post<{ data: Itinerary }>(
    '/recalculate-duration',
    { itinerary }
  );
  return response.data.data;
}

export async function exportPdf(
  payload: ExportPdfRequest
): Promise<ExportPdfResponse> {
  const response = await api.post<ExportPdfResponse>('/export-pdf', payload);
  return response.data;
}

export default api;
