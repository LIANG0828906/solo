import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Check, Loader2 } from 'lucide-react';
import { ImageCarousel } from '@/components/ImageCarousel';
import { RichEditor } from '@/components/RichEditor';
import { Toast } from '@/components/Toast';
import { useDiaryStore } from '@/data/DiaryStore';
import { MOOD_OPTIONS } from '@/types';
import type { Diary } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const EditorPage: React.FC = () => {
  const { diaryId } = useParams<{ diaryId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const getDiaryById = useDiaryStore((s) => s.getDiaryById);
  const addDiary = useDiaryStore((s) => s.addDiary);
  const updateDiary = useDiaryStore((s) => s.updateDiary);
  
  const existingDiary = diaryId && diaryId !== 'new' ? getDiaryById(diaryId) : undefined;
  const isNew = diaryId === 'new' || !diaryId;
  const prefillData = location.state as {
    locationId?: string;
    locationName?: string;
    lat?: number;
    lng?: number;
  } | null;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [mood, setMood] = useState('😊');
  const [locationName, setLocationName] = useState('');
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [locationId, setLocationId] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (existingDiary) {
      setTitle(existingDiary.title);
      setContent(existingDiary.content);
      setImages(existingDiary.images);
      setMood(existingDiary.mood);
      setLocationName(existingDiary.locationName);
      setLat(existingDiary.lat);
      setLng(existingDiary.lng);
      setLocationId(existingDiary.locationId);
    } else if (prefillData) {
      setLocationId(prefillData.locationId || uuidv4());
      setLocationName(prefillData.locationName || '');
      setLat(prefillData.lat || 0);
      setLng(prefillData.lng || 0);
    } else {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLat(position.coords.latitude);
            setLng(position.coords.longitude);
          },
          () => {
            setLat(39.9042);
            setLng(116.4074);
          }
        );
      }
      setLocationId(uuidv4());
    }
  }, [existingDiary, prefillData]);

  const handleAddImage = () => {
    const prompts = [
      'beautiful travel landscape photography warm golden hour',
      'scenic city view architecture historic buildings',
      'nature landscape mountains lake sunset',
      'local street food market culture',
      'cozy cafe interior travel aesthetic',
    ];
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    const imageUrl = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(randomPrompt)}&image_size=landscape_16_9`;
    setImages([...images, imageUrl]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setToast({ message: '请输入日记标题', type: 'error' });
      return;
    }
    
    if (!locationName.trim()) {
      setToast({ message: '请输入地点名称', type: 'error' });
      return;
    }

    setIsSaving(true);
    
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const diaryData = {
        title: title.trim(),
        content: content.trim(),
        images: images.length > 0 ? images : ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20travel%20scenery&image_size=landscape_16_9'],
        mood,
        locationId,
        locationName: locationName.trim(),
        lat,
        lng,
      };

      if (isNew || !existingDiary) {
        addDiary(diaryData);
        setToast({ message: '日记保存成功！', type: 'success' });
      } else {
        updateDiary(existingDiary.id, diaryData);
        setToast({ message: '日记更新成功！', type: 'success' });
      }

      setTimeout(() => {
        navigate(`/location/${locationId}`);
      }, 1000);
    } catch (error) {
      setToast({ message: '保存失败，请重试', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-sand-50 page-enter">
      <header className="sticky top-0 z-30 glass-card border-b border-sand-200/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 rounded-xl hover:bg-sand-200/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-sand-700" />
            </button>
            <div>
              <h1 className="font-display text-xl font-bold text-sand-800">
                {isNew ? '写新日记' : '编辑日记'}
              </h1>
              <p className="text-xs text-sand-500">
                记录你的旅行故事
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-28">
        <div className="space-y-6">
          <ImageCarousel
            images={images}
            editable={true}
            onAddImage={handleAddImage}
            onRemoveImage={handleRemoveImage}
          />

          <div className="glass-card rounded-2xl p-6 space-y-5">
            <div>
              <label className="text-sm font-medium text-sand-700 mb-2 block">
                日记标题
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="给这篇日记起个标题..."
                className="w-full px-4 py-3 rounded-xl border border-sand-200 bg-white/70 focus:outline-none focus:ring-2 focus:ring-sand-400 focus:border-transparent text-lg font-display"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-sand-700 mb-2 block">
                  地点名称
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="例如：巴黎，法国"
                  className="w-full px-4 py-3 rounded-xl border border