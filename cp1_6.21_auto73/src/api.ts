import { ConvertResult } from './types';

export const convertToVector = async (
  imageBase64: string,
  fineness: number
): Promise<ConvertResult> => {
  const response = await fetch('http://localhost:3001/api/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64, fineness }),
  });

  if (!response.ok) {
    throw new Error('转绘请求失败');
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || '转绘失败');
  }

  return result.data as ConvertResult;
};

export const exportDesign = async (
  layerIds: string[],
  format: 'svg' | 'png' | 'json'
): Promise<Response> => {
  const response = await fetch(
    `http://localhost:3001/api/export/${Date.now()}?format=${format}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error('导出请求失败');
  }

  return response;
};
