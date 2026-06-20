import axios, { AxiosInstance } from 'axios';
import type {
  Instrument,
  Offer,
  ValuationRequest,
  ValuationResponse,
  CreateInstrumentDto,
  FilterState,
} from '../types';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getInstruments = async (filter?: FilterState): Promise<Instrument[]> => {
  const params: Record<string, string> = {};
  if (filter) {
    if (filter.category !== 'all') params.category = filter.category;
    if (filter.priceRange !== 'all') params.priceRange = filter.priceRange;
    if (filter.conditionRange !== 'all') params.conditionRange = filter.conditionRange;
  }
  const res = await axiosInstance.get('/instruments', { params });
  return res.data;
};

export const getInstrument = async (id: string): Promise<Instrument> => {
  const res = await axiosInstance.get(`/instruments/${id}`);
  return res.data;
};

export const createInstrument = async (formData: FormData): Promise<Instrument> => {
  const res = await axiosInstance.post('/instruments', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const getOffers = async (instrumentId: string): Promise<Offer[]> => {
  const res = await axiosInstance.get(`/instruments/${instrumentId}/offers`);
  return res.data;
};

export const createOffer = async (
  instrumentId: string,
  payload: { buyerName: string; price: number }
): Promise<Offer> => {
  const res = await axiosInstance.post(`/instruments/${instrumentId}/offers`, payload);
  return res.data;
};

export const acceptOffer = async (offerId: string): Promise<Offer> => {
  const res = await axiosInstance.patch(`/offers/${offerId}/accept`);
  return res.data;
};

export const rejectOffer = async (offerId: string): Promise<Offer> => {
  const res = await axiosInstance.patch(`/offers/${offerId}/reject`);
  return res.data;
};

export const getValuation = async (payload: ValuationRequest): Promise<ValuationResponse> => {
  const res = await axiosInstance.post('/valuation', payload);
  return res.data;
};

export const buildCreateInstrumentFormData = (dto: CreateInstrumentDto): FormData => {
  const formData = new FormData();
  formData.append('brand', dto.brand);
  formData.append('model', dto.model);
  formData.append('category', dto.category);
  formData.append('purchaseYear', String(dto.purchaseYear));
  formData.append('usageYears', String(dto.usageYears));
  formData.append('condition', String(dto.condition));
  formData.append('description', dto.description);
  formData.append('expectedPrice', String(dto.expectedPrice));
  if (dto.image) {
    formData.append('image', dto.image);
  }
  return formData;
};

export default axiosInstance;
