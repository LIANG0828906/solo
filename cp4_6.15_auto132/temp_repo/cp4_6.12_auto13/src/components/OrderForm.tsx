import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import type { FabricType, DyeScheme } from '../types';
import { useOrderStore } from '../stores/orderStore';

const FABRIC_TYPES: FabricType[] = ['棉布', '亚麻', '真丝', '混纺'];

interface OrderFormProps {
  dyeSchemes: DyeScheme[];
}

interface FormData {
  fabricType: FabricType;
  dyeSchemeId: string;
  widthCm: number;
  lengthCm: number;
  referenceImage: string;
}

export default function OrderForm({ dyeSchemes }: OrderFormProps) {
  const createOrder = useOrderStore((state) => state.createOrder);
  const loading = useOrderStore((state) => state.loading);

  const [formData, setFormData] = useState<FormData>({
    fabricType: '棉布',
    dyeSchemeId: dyeSchemes[0]?.id || '',
    widthCm: 100,
    lengthCm: 150,
    referenceImage: '',
  });
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [successOrderNo, setSuccessOrderNo] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        referenceImage: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleReupload = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessOrderNo('');

    const orderNo = 'ORD' + Date.now().toString().slice(-8);

    await createOrder({
      ...formData,
      orderNo,
    });

    setSuccessOrderNo(orderNo);

    setFormData({
      fabricType: '棉布',
      dyeSchemeId: dyeSchemes[0]?.id || '',
      widthCm: 100,
      lengthCm: 150,
      referenceImage: '',
    });
    setPreviewUrl('');
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            display: 'block',
            fontWeight: 'bold',
            marginBottom: 8,
            color: '#4A3728',
          }}
        >
          布料选择
        </label>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {FABRIC_TYPES.map((fabric) => (
            <button
              key={fabric}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, fabricType: fabric }))}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                border: '2px solid',
                borderColor: formData.fabricType === fabric ? '#B22222' : '#E5E5E5',
                backgroundColor:
                  formData.fabricType === fabric ? 'rgba(178, 34, 34, 0.05)' : '#FFFFFF',
                cursor: 'pointer',
                transition: 'all 0.3s',
                flex: 1,
                minWidth: 100,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#B22222')}
              onBlur={(e) =>
                (e.currentTarget.style.borderColor =
                  formData.fabricType === fabric ? '#B22222' : '#E5E5E5')
              }
            >
              {fabric}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            display: 'block',
            fontWeight: 'bold',
            marginBottom: 8,
            color: '#4A3728',
          }}
        >
          染色方案
        </label>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {dyeSchemes.map((scheme) => (
            <button
              key={scheme.id}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, dyeSchemeId: scheme.id }))}
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                border: '2px solid',
                borderColor: formData.dyeSchemeId === scheme.id ? '#B22222' : '#E5E5E5',
                backgroundColor:
                  formData.dyeSchemeId === scheme.id ? 'rgba(178, 34, 34, 0.05)' : '#FFFFFF',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flex: 1,
                minWidth: 140,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#B22222')}
              onBlur={(e) =>
                (e.currentTarget.style.borderColor =
                  formData.dyeSchemeId === scheme.id ? '#B22222' : '#E5E5E5')
              }
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: scheme.colorHex,
                  border: '1px solid #E5E5E5',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 14 }}>{scheme.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            display: 'block',
            fontWeight: 'bold',
            marginBottom: 8,
            color: '#4A3728',
          }}
        >
          布料宽度
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <input
            type="range"
            min={30}
            max={200}
            value={formData.widthCm}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, widthCm: Number(e.target.value) }))
            }
            style={{ flex: 1, accentColor: '#B22222' }}
          />
          <span
            style={{
              minWidth: 60,
              textAlign: 'right',
              fontWeight: 500,
              color: '#4A3728',
            }}
          >
            {formData.widthCm} cm
          </span>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            display: 'block',
            fontWeight: 'bold',
            marginBottom: 8,
            color: '#4A3728',
          }}
        >
          布料长度
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <input
            type="range"
            min={30}
            max={300}
            value={formData.lengthCm}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, lengthCm: Number(e.target.value) }))
            }
            style={{ flex: 1, accentColor: '#B22222' }}
          />
          <span
            style={{
              minWidth: 60,
              textAlign: 'right',
              fontWeight: 500,
              color: '#4A3728',
            }}
          >
            {formData.lengthCm} cm
          </span>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            display: 'block',
            fontWeight: 'bold',
            marginBottom: 8,
            color: '#4A3728',
          }}
        >
          参考图片
        </label>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />
        {!previewUrl ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
              border: '2px dashed #D2B48C',
              borderRadius: 8,
              padding: 40,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.3s',
              color: '#4A3728',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#B22222')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#D2B48C')}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#B22222')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#D2B48C')}
          >
            <p style={{ margin: 0 }}>点击或拖拽图片到此处上传</p>
          </div>
        ) : (
          <div
            style={{
              border: '1px solid #E5E5E5',
              borderRadius: 8,
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <img
              src={previewUrl}
              alt="预览"
              style={{
                width: 80,
                height: 80,
                objectFit: 'cover',
                borderRadius: 4,
              }}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 14, color: '#4A3728' }}>{fileName}</span>
              <button
                type="button"
                onClick={handleReupload}
                style={{
                  padding: '6px 16px',
                  borderRadius: 4,
                  border: '1px solid #B22222',
                  backgroundColor: 'transparent',
                  color: '#B22222',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  alignSelf: 'flex-start',
                }}
              >
                重新上传
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          padding: '14px 24px',
          borderRadius: 8,
          border: 'none',
          backgroundColor: '#B22222',
          color: '#FFFFFF',
          fontSize: 16,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.opacity = '0.9';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = loading ? '0.6' : '1';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {loading ? '提交中...' : '提交订单'}
      </button>

      {successOrderNo && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            borderRadius: 8,
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#166534',
            textAlign: 'center',
          }}
        >
          订单提交成功！订单号：{successOrderNo}
        </div>
      )}
    </form>
  );
}
