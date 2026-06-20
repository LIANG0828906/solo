import React, { useState, useRef, useEffect } from 'react';
import { useAppStore, DIMENSION_COLORS, FlavorDimension } from '@/stores/appStore';
import { cropImage } from '@/utils/cropImage';

const TastingForm: React.FC = () => {
  const { currentWheel, addNote, resetWheel } = useAppStore();
  const [dishName, setDishName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [errors, setErrors] = useState<{ dishName?: string }>({});
  const [touched, setTouched] = useState<{ dishName: boolean }>({ dishName: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxDescriptionLength = 200;

  const dominantFlavor = (() => {
    const dimensions: FlavorDimension[] = ['sweet', 'sour', 'bitter', 'spicy', 'salty', 'umami'];
    let maxDim: FlavorDimension = 'sweet';
    let maxVal = -1;
    for (const dim of dimensions) {
      if (currentWheel[dim] > maxVal) {
        maxVal = currentWheel[dim];
        maxDim = dim;
      }
    }
    return maxDim;
  })();

  const focusColor = DIMENSION_COLORS[dominantFlavor];

  const validateDishName = (value: string): string | undefined => {
    if (!value.trim()) {
      return '菜品名称不能为空';
    }
    return undefined;
  };

  useEffect(() => {
    if (touched.dishName) {
      const error = validateDishName(dishName);
      setErrors((prev) => ({ ...prev, dishName: error }));
    }
  }, [dishName, touched.dishName]);

  const handleDishNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDishName(value);
    if (!touched.dishName) {
      setTouched((prev) => ({ ...prev, dishName: true }));
    }
  };

  const handleDishNameBlur = () => {
    setTouched((prev) => ({ ...prev, dishName: true }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('请上传 JPG 或 PNG 格式的图片');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB');
      return;
    }

    try {
      const cropped = await cropImage(file, 200);
      setPhotoUrl(cropped);
    } catch (error) {
      alert('图片处理失败，请重试');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({ dishName: true });
    const dishNameError = validateDishName(dishName);
    if (dishNameError) {
      setErrors({ dishName: dishNameError });
      return;
    }

    addNote({
      dishName: dishName.trim(),
      date,
      description: description.trim(),
      photoUrl,
      wheelData: { ...currentWheel },
    });

    setDishName('');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setPhotoUrl('');
    setErrors({});
    setTouched({ dishName: false });
    resetWheel();
  };

  const isFormValid = dishName.trim() && !errors.dishName;

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: '#1A1A2E',
        borderRadius: '12px',
        border: '1px solid #4A4A6A',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>品鉴记录</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '14px', color: '#AAA', display: 'flex', alignItems: 'center', gap: '4px' }}>
          菜品名称
          <span style={{ color: '#FF4757' }}>*</span>
        </label>
        <input
          type="text"
          value={dishName}
          onChange={handleDishNameChange}
          onBlur={handleDishNameBlur}
          placeholder="请输入菜品名称"
          style={{
            width: '100%',
            height: '40px',
            background: '#2D2D44',
            border: `1px solid ${errors.dishName ? '#FF4757' : '#4A4A6A'}`,
            borderRadius: '8px',
            color: 'white',
            padding: '0 12px',
            fontSize: '14px',
            outline: 'none',
            transition: 'all 0.2s ease',
            animation: errors.dishName ? 'borderFlash 1s ease infinite' : 'none',
          }}
          onFocus={(e) => {
            if (!errors.dishName) {
              e.target.style.borderColor = focusColor;
              e.target.style.boxShadow = `0 0 0 2px ${focusColor}33`;
            }
          }}
          onBlurCapture={(e) => {
            if (!errors.dishName) {
              e.target.style.borderColor = '#4A4A6A';
              e.target.style.boxShadow = 'none';
            }
            handleDishNameBlur();
          }}
        />
        {errors.dishName && (
          <span style={{ fontSize: '12px', color: '#FF4757' }}>{errors.dishName}</span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '14px', color: '#AAA' }}>品鉴日期</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            width: '100%',
            height: '40px',
            background: '#2D2D44',
            border: '1px solid #4A4A6A',
            borderRadius: '8px',
            color: 'white',
            padding: '0 12px',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s ease',
            colorScheme: 'dark',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = focusColor;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#4A4A6A';
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '14px', color: '#AAA' }}>品鉴描述</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, maxDescriptionLength))}
          placeholder="记录这道菜的风味特点、品鉴感受..."
          maxLength={maxDescriptionLength}
          style={{
            width: '100%',
            height: '120px',
            background: '#2D2D44',
            border: '1px solid #4A4A6A',
            borderRadius: '8px',
            color: 'white',
            padding: '12px',
            fontSize: '14px',
            outline: 'none',
            resize: 'none',
            transition: 'border-color 0.2s ease',
            fontFamily: 'inherit',
            lineHeight: '1.5',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = focusColor;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#4A4A6A';
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            fontSize: '12px',
            color: description.length >= maxDescriptionLength ? '#FF4757' : '#6A6A8A',
          }}
        >
          {description.length}/{maxDescriptionLength}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '14px', color: '#AAA' }}>菜品照片</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            onChange={handlePhotoUpload}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              height: '40px',
              padding: '0 16px',
              background: '#2D2D44',
              border: '1px solid #4A4A6A',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = focusColor;
              e.currentTarget.style.background = '#3D3D54';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#4A4A6A';
              e.currentTarget.style.background = '#2D2D44';
            }}
          >
            📷 选择照片
          </button>
          {photoUrl && (
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #4A4A6A',
                animation: 'fadeIn 0.3s ease',
              }}
            >
              <img
                src={photoUrl}
                alt="缩略图"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={!isFormValid}
        style={{
          height: '44px',
          marginTop: '8px',
          background: isFormValid
            ? 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)'
            : '#3A3A5A',
          border: 'none',
          borderRadius: '8px',
          color: 'white',
          fontSize: '15px',
          fontWeight: 600,
          cursor: isFormValid ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s ease',
          boxShadow: isFormValid ? '0 4px 15px rgba(108, 92, 231, 0.4)' : 'none',
        }}
        onMouseEnter={(e) => {
          if (isFormValid) {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(108, 92, 231, 0.5)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = isFormValid ? '0 4px 15px rgba(108, 92, 231, 0.4)' : 'none';
        }}
        onMouseDown={(e) => {
          if (isFormValid) {
            e.currentTarget.style.transform = 'scale(0.98)';
          }
        }}
        onMouseUp={(e) => {
          if (isFormValid) {
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
      >
        💾 保存品鉴记录
      </button>
    </form>
  );
};

export default TastingForm;
