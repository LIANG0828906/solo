import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { CATEGORY_LABELS, type InstrumentCategory } from '@/types';
import ImageUploader from '@/components/ImageUploader';
import { cn } from '@/lib/utils';

const CATEGORY_OPTIONS: InstrumentCategory[] = [
  'guitar',
  'keyboard',
  'wind',
  'string',
  'percussion',
  'other',
];

function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export default function PublishPage() {
  const navigate = useNavigate();
  const { addInstrument } = useStore();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InstrumentCategory>('guitar');
  const [brand, setBrand] = useState('');
  const [purchaseYear, setPurchaseYear] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [deposit, setDeposit] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleImagesChange = (newImages: string[]) => {
    setImages(newImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !brand.trim() || !purchaseYear || !dailyRate || !deposit || !description.trim()) {
      setError('请填写所有必填字段');
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('category', category);
      formData.append('brand', brand.trim());
      formData.append('purchaseYear', purchaseYear);
      formData.append('dailyRate', dailyRate);
      formData.append('deposit', deposit);
      formData.append('description', description.trim());

      images.forEach((img, idx) => {
        const blob = dataURLtoBlob(img);
        const ext = blob.type.split('/')[1] || 'png';
        formData.append('images', blob, `image-${idx}.${ext}`);
      });

      await addInstrument(formData);
      navigate('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : '发布失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = cn(
    'w-full px-4 py-3 bg-white