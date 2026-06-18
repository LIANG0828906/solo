interface UploadResult {
  id: string;
  url: string;
  width: number;
  height: number;
}

export async function uploadImage(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('roomPhoto', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }

  const data: UploadResult = await response.json();
  return data;
}
