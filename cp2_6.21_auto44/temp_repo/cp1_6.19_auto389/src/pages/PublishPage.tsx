import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { useStore } from '../store';
import ImageUploader, { PLACEHOLDER_IMAGE } from '../components/ImageUploader';
import { BRAND_MODELS } from '../types';
import type { Brand, InstrumentType } from '../types';
import '../index.css';

const BRANDS: Brand[] = ['雅马哈', '芬达', '吉布森', '卡西欧', '罗兰', '马丁', '泰勒', '塞尔玛'];
const INSTRUMENT_TYPES: InstrumentType[] = ['吉他', '钢琴', '鼓', '小提琴', '萨克斯', '电子琴', '贝斯'];

interface FormErrors {
  brand?: string;
  model?: string;
  type?: string;
  purchaseYear?: string;
  yearsUsed?: string;
  condition?: string;
  description?: string;
  expectedPrice?: string;
}

export default function PublishPage() {
  const navigate = useNavigate();
  const { addInstrument, addNotification, setLoading } = useStore();

  const [brand, setBrand] = useState<Brand | ''>('');
  const [model, setModel] = useState('');
  const [type, setType] = useState<InstrumentType | ''>('');
  const [purchaseYear, setPurchaseYear] = useState('');
  const [yearsUsed, setYearsUsed] = useState('');
  const [condition, setCondition] = useState('7');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const availableModels = useMemo(() => {
    if (!brand) return [];
    return BRAND_MODELS[brand] || [];
  }, [brand]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const yearRegex = /^20\d{2}$/;
    const priceRegex = /^\d+$/;

    if (!brand) newErrors.brand = '请选择品牌';
    if (!model) newErrors.model = '请选择型号';
    if (!type) newErrors.type = '请选择乐器类型';

    if (!purchaseYear) {
      newErrors.purchaseYear = '请输入购买年份';
    } else if (!yearRegex.test(purchaseYear)) {
      newErrors.purchaseYear = '年份格式不正确 (2000-2026)';
    } else {
      const year = Number(purchaseYear);
      if (year < 1990 || year > 2026) {
        newErrors.purchaseYear = '年份范围应为 1990-2026';
      }
    }

    if (!yearsUsed) {
      newErrors.yearsUsed = '请输入使用年限';
    } else if (isNaN(Number(yearsUsed)) || Number(yearsUsed) < 0) {
      newErrors.yearsUsed = '请输入有效的使用年限';
    }

    if (!condition || isNaN(Number(condition))) {
      newErrors.condition = '请输入成色评分';
    } else {
      const c = Number(condition);
      if (c < 1 || c > 10) newErrors.condition = '成色范围应为 1-10';
    }

    if (!description.trim()) newErrors.description = '请填写商品描述';

    if (!expectedPrice) {
      newErrors.expectedPrice = '请输入期望售价';
    } else if (!priceRegex.test(expectedPrice)) {
      newErrors.expectedPrice = '请输入有效的金额（纯数字）';
    } else if (Number(expectedPrice) <= 0) {
      newErrors.expectedPrice = '售价必须大于0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    await new Promise((res) => setTimeout(res, 800));

    addInstrument({
      brand: brand as Brand,
      model,
      type: type as InstrumentType,
      purchaseYear: Number(purchaseYear),
      yearsUsed: Number(yearsUsed),
      condition: Number(condition),
      image: image || PLACEHOLDER_IMAGE,
      description: description.trim(),
      expectedPrice: Number(expectedPrice),
      estimatedPrice: Math.round(Number(expectedPrice) * 0.95),
    });

    setLoading(false);
    addNotification({ type: 'success', message: '乐器发布成功！' });
    navigate('/');
  };

  const inputClass = (hasError?: boolean) =>
    `w-full px-4 py-3 text-gray-800 border-2 rounded-lg focus:outline-none transition-colors ${
      hasError
        ? 'border-red-400 focus:border-red-500'
        : 'border-transparent focus:border-orange-400'
    }`;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
        <h1 className="text-2xl font-bold">发布二手乐器</h1>
      </div>

      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">品牌 *</label>
            <select
              value={brand}
              onChange={(e) => {
                setBrand(e.target.value as Brand);
                setModel('');
                setErrors((prev) => ({ ...prev, brand: undefined, model: undefined }));
              }}
              className={inputClass(!!errors.brand)}
              style={{ backgroundColor: '#FAFAFA', borderRadius: '6px' }}
            >
              <option value="">请选择品牌</option>
              {BRANDS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            {errors.brand && <p className="mt-1 text-sm text-red-500">{errors.brand}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">型号 *</label>
            <select
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                setErrors((prev) => ({ ...prev, model: undefined }));
              }}
              disabled={!brand}
              className={inputClass(!!errors.model)}
              style={{ backgroundColor: '#FAFAFA', borderRadius: '6px' }}
            >
              <option value="">{brand ? '请选择型号' : '请先选择品牌'}</option>
              {availableModels.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            {errors.model && <p className="mt-1 text-sm text-red-500">{errors.model}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">乐器类型 *</label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as InstrumentType);
                setErrors((prev) => ({ ...prev, type: undefined }));
              }}
              className={inputClass(!!errors.type)}
              style={{ backgroundColor: '#FAFAFA', borderRadius: '6px' }}
            >
              <option value="">请选择类型</option>
              {INSTRUMENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {errors.type && <p className="mt-1 text-sm text-red-500">{errors.type}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">购买年份 *</label>
            <input
              type="number"
              value={purchaseYear}
              onChange={(e) => {
                setPurchaseYear(e.target.value);
                setErrors((prev) => ({ ...prev, purchaseYear: undefined }));
              }}
              placeholder="例：2020"
              min={1990}
              max={2026}
              className={inputClass(!!errors.purchaseYear)}
              style={{ backgroundColor: '#FAFAFA', borderRadius: '6px' }}
            />
            {errors.purchaseYear && <p className="mt-1 text-sm text-red-500">{errors.purchaseYear}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">使用年限（年）*</label>
            <input
              type="number"
              value={yearsUsed}
              onChange={(e) => {
                setYearsUsed(e.target.value);
                setErrors((prev) => ({ ...prev, yearsUsed: undefined }));
              }}
              placeholder="例：3"
              min={0}
              className={inputClass(!!errors.yearsUsed)}
              style={{ backgroundColor: '#FAFAFA', borderRadius: '6px' }}
            />
            {errors.yearsUsed && <p className="mt-1 text-sm text-red-500">{errors.yearsUsed}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              成色评分（1-10分）*
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="range"
                value={condition}
                onChange={(e) => {
                  setCondition(e.target.value);
                  setErrors((prev) => ({ ...prev, condition: undefined }));
                }}
                min={1}
                max={10}
                step={1}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <input
                type="number"
                value={condition}
                onChange={(e) => {
                  setCondition(e.target.value);
                  setErrors((prev) => ({ ...prev, condition: undefined }));
                }}
                min={1}
                max={10}
                className={`w-20 px-3 py-2 text-center font-bold text-gray-800 border-2 rounded-lg focus:outline-none transition-colors ${
                  errors.condition ? 'border-red-400' : 'border-transparent focus:border-orange-400'
                }`}
                style={{ backgroundColor: '#FAFAFA', borderRadius: '6px' }}
              />
            </div>
            {errors.condition && <p className="mt-1 text-sm text-red-500">{errors.condition}</p>}
          </div>
        </div>

        <ImageUploader value={image} onChange={setImage} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">商品描述 *</label>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setErrors((prev) => ({ ...prev, description: undefined }));
            }}
            placeholder="请详细描述乐器的使用情况、配件、磨损等信息..."
            rows={5}
            className={inputClass(!!errors.description)}
            style={{ backgroundColor: '#FAFAFA', borderRadius: '6px', resize: 'vertical' }}
          />
          {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">期望售价（元）*</label>
          <input
            type="text"
            value={expectedPrice}
            onChange={(e) => {
              setExpectedPrice(e.target.value.replace(/[^\d]/g, ''));
              setErrors((prev) => ({ ...prev, expectedPrice: undefined }));
            }}
            placeholder="例：3000"
            className={inputClass(!!errors.expectedPrice)}
            style={{ backgroundColor: '#FAFAFA', borderRadius: '6px' }}
          />
          {errors.expectedPrice && <p className="mt-1 text-sm text-red-500">{errors.expectedPrice}</p>}
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-4 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-[1.01]"
          style={{ backgroundColor: '#FF9800' }}
        >
          <Send className="w-5 h-5" />
          发布乐器
        </button>
      </div>
    </div>
  );
}
