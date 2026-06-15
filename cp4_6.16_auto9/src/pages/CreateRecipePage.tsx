import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ImagePlus,
  ChefHat,
  Clock,
  Tag,
  Save,
  Eye,
  EyeOff,
  ListOrdered,
  Utensils,
  Upload,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useRecipeStore, uploadRecipeImage, resolveImage } from '@/modules/recipes/RecipeStore';
import type { Ingredient } from '@/types';

const PRESET_TAGS = [
  '川菜', '粤菜', '湘菜', '鲁菜', '家常菜', '快手菜', '下饭菜',
  '烘焙', '甜点', '下午茶', '早餐', '粥品', '主食', '汤品',
  '凉菜', '宴客菜', '养胃', '素食', '经典',
];

const SAMPLE_IMAGES = [
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=delicious%20homemade%20Chinese%20dish%20warm%20lighting%20food%20photography%20ceramic%20bowl&image_size=square',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy%20home%20cooked%20meal%20steam%20rising%20family%20style%20dinner%20warm%20colors&image_size=square',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=colorful%20vegetable%20stir%20fry%20wok%20Asian%20cuisine%20fresh%20ingredients&image_size=square',
];

const CreateRecipePage: React.FC = () => {
  const [sp] = useSearchParams();
  const editId = sp.get('edit');
  const navigate = useNavigate();
  const init = useRecipeStore((s) => s.init);
  const addRecipe = useRecipeStore((s) => s.addRecipe);
  const updateRecipe = useRecipeStore((s) => s.updateRecipe);
  const getRecipeById = useRecipeStore((s) => s.getRecipeById);

  const [title, setTitle] = useState('');
  const [image, setImage] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [imageUploadStatus, setImageUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [imageError, setImageError] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', amount: '' },
  ]);
  const [steps, setSteps] = useState<string[]>(['']);
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [cookTime, setCookTime] = useState(20);
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    let cancelled = false;
    if (!image) {
      setImagePreview('');
      return;
    }
    if (image.startsWith('http') || image.startsWith('data:')) {
      setImagePreview(image);
    } else if (image.startsWith('img_')) {
      setImageUploadStatus('uploading');
      resolveImage(image).then((url) => {
        if (cancelled) return;
        if (url) {
          setImagePreview(url);
          setImageUploadStatus('success');
        } else {
          setImageUploadStatus('error');
          setImageError('图片加载失败');
        }
      });
    }
    return () => { cancelled = true; };
  }, [image]);

  useEffect(() => {
    if (editId) {
      const r = getRecipeById(editId);
      if (r) {
        setTitle(r.title);
        setImage(r.image);
        setIngredients(
          r.ingredients.length ? r.ingredients : [{ name: '', amount: '' }],
        );
        setSteps(r.steps.length ? r.steps : ['']);
        setTags(r.tags);
        setCookTime(r.cookTime);
        setIsPublic(r.isPublic);
      }
    }
  }, [editId, getRecipeById]);

  const handleImageUpload = useCallback(async (file: File) => {
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
    const MAX_SIZE = 5 * 1024 * 1024;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setImageUploadStatus('error');
      setImageError(
        `不支持的图片格式：${file.type || '未知'}。请上传 JPEG 或 PNG 格式的图片。`,
      );
      setImagePreview('');
      return;
    }

    if (file.size > MAX_SIZE) {
      setImageUploadStatus('error');
      setImageError(
        `图片大小为 ${(file.size / 1024 / 1024).toFixed(2)}MB，超过了 5MB 限制。请压缩后再上传，或选择更小的图片。`,
      );
      setImagePreview('');
      return;
    }

    setImageUploadStatus('uploading');
    setImageError('');
    try {
      const previewReader = new FileReader();
      previewReader.onload = () => setImagePreview(previewReader.result as string);
      previewReader.readAsDataURL(file);

      const imgId = await uploadRecipeImage(file);
      setImage(imgId);
      setImageUploadStatus('success');
      console.info(`[CreateRecipe] 图片上传成功: ${imgId} (${(file.size / 1024).toFixed(0)}KB)`);
    } catch (err) {
      const msg = (err as Error).message || '上传失败';
      setImageError(msg);
      setImageUploadStatus('error');
      setImagePreview('');
    }
  }, []);

  const addIng = () => setIngredients((arr) => [...arr, { name: '', amount: '' }]);
  const removeIng = (i: number) =>
    setIngredients((arr) => (arr.length > 1 ? arr.filter((_, idx) => idx !== i) : arr));
  const updateIng = (i: number, key: keyof Ingredient, val: string) =>
    setIngredients((arr) => arr.map((it, idx) => (idx === i ? { ...it, [key]: val } : it)));

  const addStep = () => setSteps((arr) => [...arr, '']);
  const removeStep = (i: number) =>
    setSteps((arr) => (arr.length > 1 ? arr.filter((_, idx) => idx !== i) : arr));
  const updateStep = (i: number, val: string) =>
    setSteps((arr) => arr.map((s, idx) => (idx === i ? val : s)));

  const toggleTag = (t: string) => {
    setTags((arr) => (arr.includes(t) ? arr.filter((x) => x !== t) : [...arr, t]));
  };
  const addCustomTag = () => {
    const t = customTag.trim();
    if (t && !tags.includes(t)) {
      setTags((arr) => [...arr, t]);
      setCustomTag('');
    }
  };

  const valid =
    title.trim() &&
    ingredients.some((i) => i.name.trim()) &&
    steps.some((s) => s.trim());

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        image: image || SAMPLE_IMAGES[0],
        ingredients: ingredients.filter((i) => i.name.trim()),
        steps: steps.filter((s) => s.trim()),
        tags,
        cookTime,
        isPublic,
      };
      if (editId) {
        await updateRecipe(editId, data);
      } else {
        const r = await addRecipe(data);
        navigate(`/recipe/${r.id}`);
        return;
      }
      navigate(`/recipe/${editId}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container py-6 md:py-8 max-w-3xl pb-24">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost !px-2 !py-2 -ml-2">
          <ArrowLeft size={18} />
          <span>返回</span>
        </button>
        <button
          onClick={save}
          disabled={!valid || saving}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Save size={16} />
          {saving ? '保存中...' : editId ? '保存修改' : '创建菜谱'}
        </button>
      </div>

      <div
        className="space-y-6"
        style={{ animation: 'fadeInUp 300ms ease' }}
      >
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-cocoa-400 flex items-center gap-2">
          <ChefHat className="text-warm-400" size={28} />
          {editId ? '编辑私房菜谱' : '记录你的私房菜谱'}
        </h1>

        <section className="bg-white rounded-card shadow-card p-5 md:p-6 border border-cream-200 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-cocoa-400 flex items-center gap-1.5 mb-2">
              <ChefHat size={15} className="text-warm-400" />
              菜名 <span className="text-red-400">*</span>
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="比如：奶奶的红烧肉"
              className="input-base"
              maxLength={50}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-cocoa-400 flex items-center gap-1.5 mb-2">
              <ImagePlus size={15} className="text-warm-400" />
              成品照片
              <span className="text-[10px] text-cocoa-200 font-normal ml-1">
                （支持 JPEG/PNG 格式，最大 5MB，自动压缩后保存到 IndexedDB）
              </span>
            </span>
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-4 sm:col-span-2 space-y-2">
                <label className="block aspect-square rounded-xl border-2 border-dashed border-warm-200 bg-cream-50 hover:border-warm-400 hover:bg-warm-50 transition cursor-pointer overflow-hidden relative group">
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="预览" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white text-sm gap-1">
                        <div className="flex items-center gap-1">
                          <Upload size={16} />
                          点击更换
                        </div>
                        {image.startsWith('img_') && (
                          <span className="text-[10px] opacity-80 font-mono">{image.slice(0, 14)}...</span>
                        )}
                      </div>
                    </>
                  ) : imageUploadStatus === 'uploading' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-cream-100">
                      <div className="w-10 h-10 rounded-full border-2 border-warm-200 border-t-warm-400 animate-spin" />
                      <span className="text-xs text-cocoa-300">正在上传并压缩...</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-cocoa-200 gap-2 p-4 text-center">
                      <ImagePlus size={32} className="text-warm-300" />
                      <span className="text-xs font-medium">
                        点击上传私房菜实拍照片
                      </span>
                      <span className="text-[10px] opacity-70">
                        或选择右侧示例图
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageUpload(f);
                      e.target.value = '';
                    }}
                  />
                </label>

                {imageUploadStatus === 'success' && image.startsWith('img_') && (
                  <div
                    className="inline-flex items-center gap-1.5 text-[11px] text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full"
                    style={{ animation: 'fadeInUp 200ms ease' }}
                  >
                    <CheckCircle size={12} />
                    已保存到本地 IndexedDB，刷新不丢失
                  </div>
                )}
                {imageUploadStatus === 'error' && imageError && (
                  <div className="flex items-center gap-1.5 text-[11px] text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                    <AlertCircle size={12} />
                    {imageError}
                  </div>
                )}
              </div>
              <div className="col-span-4 sm:col-span-2 space-y-2">
                <p className="text-xs text-cocoa-200 mb-1">或选择示例图：</p>
                <div className="grid grid-cols-3 gap-2">
                  {SAMPLE_IMAGES.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setImageUploadStatus('idle');
                        setImageError('');
                        setImage(src);
                      }}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition relative ${
                        image === src
                          ? 'border-warm-400 shadow-card ring-2 ring-warm-200'
                          : 'border-transparent hover:border-warm-200'
                      }`}
                      title={`示例图 ${i + 1}`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-cocoa-200 pt-1 flex items-start gap-1">
                  <AlertCircle size={11} className="mt-0.5 flex-shrink-0" />
                  <span>
                    示例图为网络图片，上传本地照片可长期保存在你的浏览器中
                  </span>
                </div>
              </div>
            </div>
          </label>

          <div>
            <span className="text-sm font-medium text-cocoa-400 flex items-center gap-1.5 mb-2">
              <Clock size={15} className="text-warm-400" />
              烹饪时间：<span className="text-warm-500 font-bold">{cookTime} 分钟</span>
            </span>
            <input
              type="range"
              min={5}
              max={180}
              step={5}
              value={cookTime}
              onChange={(e) => setCookTime(Number(e.target.value))}
              className="w-full accent-warm-400"
            />
            <div className="flex justify-between text-[10px] text-cocoa-200 mt-1">
              <span>5分</span>
              <span>30分</span>
              <span>1小时</span>
              <span>3小时</span>
            </div>
          </div>

          <label className="flex items-center justify-between p-3 rounded-xl bg-cream-50 border border-cream-200 cursor-pointer group">
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Eye size={18} className="text-warm-400" />
              ) : (
                <EyeOff size={18} className="text-cocoa-200" />
              )}
              <div>
                <div className="text-sm font-medium text-cocoa-400">
                  {isPublic ? '公开到社区广场' : '仅自己可见'}
                </div>
                <div className="text-xs text-cocoa-200">
                  {isPublic ? '所有人都可以看到这道菜谱' : '只有你能查看和编辑'}
                </div>
              </div>
            </div>
            <div
              className={`w-11 h-6 rounded-full p-0.5 transition relative ${
                isPublic ? 'bg-gradient-to-r from-warm-400 to-warm-500' : 'bg-cocoa-100'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-all ${
                  isPublic ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </div>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="hidden"
            />
          </label>
        </section>

        <section className="bg-white rounded-card shadow-card p-5 md:p-6 border border-cream-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-cocoa-400 flex items-center gap-2">
              <Utensils size={18} className="text-warm-400" />
              原料清单 <span className="text-red-400">*</span>
            </h3>
            <button onClick={addIng} type="button" className="btn-ghost !text-xs">
              <Plus size={14} />
              添加原料
            </button>
          </div>
          <div className="space-y-2">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2 items-center group">
                <span className="w-6 text-center text-xs text-cocoa-200 font-medium">
                  {i + 1}.
                </span>
                <input
                  value={ing.name}
                  onChange={(e) => updateIng(i, 'name', e.target.value)}
                  placeholder="食材名称，如：鸡蛋"
                  className="input-base !py-2 flex-1"
                />
                <input
                  value={ing.amount}
                  onChange={(e) => updateIng(i, 'amount', e.target.value)}
                  placeholder="用量，如：3个"
                  className="input-base !py-2 w-28 sm:w-36"
                />
                <button
                  onClick={() => removeIng(i)}
                  disabled={ingredients.length === 1}
                  className="p-2 rounded-lg text-cocoa-200 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-cocoa-200"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-card shadow-card p-5 md:p-6 border border-cream-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-cocoa-400 flex items-center gap-2">
              <ListOrdered size={18} className="text-warm-400" />
              烹饪步骤 <span className="text-red-400">*</span>
            </h3>
            <button onClick={addStep} type="button" className="btn-ghost !text-xs">
              <Plus size={14} />
              添加步骤
            </button>
          </div>
          <div className="space-y-3">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-3 group">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-warm-300 to-warm-500 text-white font-bold text-sm flex items-center justify-center shadow-card">
                  {i + 1}
                </div>
                <div className="flex-1 flex gap-2">
                  <textarea
                    value={s}
                    onChange={(e) => updateStep(i, e.target.value)}
                    placeholder={`描述第 ${i + 1} 步的操作...`}
                    rows={2}
                    className="input-base resize-y"
                  />
                  <button
                    onClick={() => removeStep(i)}
                    disabled={steps.length === 1}
                    className="self-start p-2 rounded-lg text-cocoa-200 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-cocoa-200"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-card shadow-card p-5 md:p-6 border border-cream-200 space-y-4">
          <h3 className="font-serif text-lg font-bold text-cocoa-400 flex items-center gap-2">
            <Tag size={18} className="text-warm-400" />
            分类标签
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_TAGS.map((t) => (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                className={`tag-chip ${tags.includes(t) ? 'tag-chip-active' : ''}`}
              >
                #{t}
              </button>
            ))}
            {tags
              .filter((t) => !PRESET_TAGS.includes(t))
              .map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  className="tag-chip tag-chip-active"
                >
                  #{t}
                  <span className="ml-1 opacity-80">×</span>
                </button>
              ))}
          </div>
          <div className="flex gap-2">
            <input
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomTag();
                }
              }}
              placeholder="自定义标签，按回车添加"
              className="input-base !py-2 flex-1"
              maxLength={10}
            />
            <button
              onClick={addCustomTag}
              disabled={!customTag.trim()}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={14} />
              添加
            </button>
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-gradient-to-t from-cream-100 via-cream-100/90 to-transparent pt-6 pb-4 z-30 sm:hidden">
        <div className="container">
          <button
            onClick={save}
            disabled={!valid || saving}
            className="btn-primary w-full disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? '保存中...' : editId ? '保存修改' : '创建菜谱'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRecipePage;
