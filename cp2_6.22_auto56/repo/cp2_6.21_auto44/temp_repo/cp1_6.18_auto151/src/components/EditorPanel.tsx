import { useState, useEffect } from 'react';
import { Drink, TagType, useMenuStore } from '@/stores/menuStore';
import { Ingredient } from '@/data/ingredients';
import IngredientLibrary from '@/components/IngredientLibrary';
import AssemblyArea from '@/components/AssemblyArea';
import { Save, X, Plus } from 'lucide-react';
import { v4 as generateId } from 'uuid';

interface EditorPanelProps {
  drink: Drink | null;
  onClose: () => void;
  onSave: (drink: Drink) => void;
}

export default function EditorPanel({ drink, onClose, onSave }: EditorPanelProps) {
  const [base, setBase] = useState<Ingredient | null>(null);
  const [syrups, setSyrups] = useState<Ingredient[]>([]);
  const [foamLevel, setFoamLevel] = useState<number>(0);
  const [garnishes, setGarnishes] = useState<Ingredient[]>([]);
  const [name, setName] = useState<string>('');
  const [price, setPrice] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [steps, setSteps] = useState<string[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [newStep, setNewStep] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (drink) {
      setBase(drink.base);
      setSyrups(drink.syrups);
      setFoamLevel(drink.foamLevel);
      setGarnishes(drink.garnishes);
      setName(drink.name);
      setPrice(drink.price);
      setDescription(drink.description);
      setSteps(drink.steps);
      setTags(drink.tags);
    } else {
      setBase(null);
      setSyrups([]);
      setFoamLevel(0);
      setGarnishes([]);
      setName('');
      setPrice(0);
      setDescription('');
      setSteps([]);
      setTags([]);
    }
    setNewStep('');
    setValidationErrors({});
  }, [drink]);

  const handleAddIngredient = (ingredient: Ingredient) => {
    if (ingredient.category === 'base') {
      setBase(ingredient);
    } else if (ingredient.category === 'syrup') {
      setSyrups(prev => [...prev, ingredient]);
    } else if (ingredient.category === 'garnish') {
      setGarnishes(prev => [...prev, ingredient]);
    }
  };

  const handleRemoveSyrup = (index: number) => {
    setSyrups(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveGarnish = (index: number) => {
    setGarnishes(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setBase(null);
    setSyrups([]);
    setFoamLevel(0);
    setGarnishes([]);
  };

  const handleToggleTag = (tag: TagType) => {
    setTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddStep = () => {
    const trimmed = newStep.trim();
    if (trimmed) {
      setSteps(prev => [...prev, trimmed]);
      setNewStep('');
    }
  };

  const handleRemoveStep = (index: number) => {
    setSteps(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const errors: Record<string, boolean> = {};
    if (!name.trim()) errors.name = true;
    if (!base) errors.base = true;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    const savedDrink: Drink = {
      id: drink?.id ?? generateId(),
      name,
      price,
      description,
      base,
      syrups,
      foamLevel,
      garnishes,
      steps,
      tags,
    };

    onSave(savedDrink);
  };

  const tagConfig: { tag: TagType; label: string; activeClass: string }[] = [
    { tag: 'recommended', label: '店主推荐', activeClass: 'bg-tag-red text-white' },
    { tag: 'limited', label: '限量', activeClass: 'bg-tag-red text-white' },
    { tag: 'popular', label: '人气爆款', activeClass: 'bg-tag-green text-white' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
      <div className="max-w-5xl w-full mx-4 bg-cream rounded-2xl card-shadow">
        <div className="flex items-center justify-between p-6 border-b border-coffee-light/30">
          <h2 className="font-display text-xl font-bold text-coffee-dark">编辑饮品</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-coffee-light/20 transition-colors">
            <X className="w-5 h-5 text-coffee-dark" />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-80 shrink-0">
              <IngredientLibrary onAddIngredient={handleAddIngredient} />
            </div>

            <div className="flex-1 space-y-6">
              <AssemblyArea
                base={base}
                syrups={syrups}
                foamLevel={foamLevel}
                garnishes={garnishes}
                onSetBase={setBase}
                onAddSyrup={(s) => setSyrups(prev => [...prev, s])}
                onRemoveSyrup={handleRemoveSyrup}
                onSetFoamLevel={setFoamLevel}
                onAddGarnish={(g) => setGarnishes(prev => [...prev, g])}
                onRemoveGarnish={handleRemoveGarnish}
                onClearAll={handleClearAll}
              />

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-coffee-dark mb-1">
                    饮品名称 <span className="text-error-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => {
                      setName(e.target.value);
                      if (validationErrors.name) {
                        setValidationErrors(prev => ({ ...prev, name: false }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-coffee-light rounded-lg focus:outline-none focus:ring-2 focus:ring-btn-preview"
                    style={validationErrors.name ? { border: '2px solid #D32F2F' } : undefined}
                  />
                  {validationErrors.name && (
                    <p className="text-error-red text-xs animate-fade-in mt-1">请输入饮品名称</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-coffee-dark mb-1">
                    价格 (¥)
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={e => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-coffee-light rounded-lg focus:outline-none focus:ring-2 focus:ring-btn-preview"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-coffee-dark mb-1">
                    标签
                  </label>
                  <div className="flex gap-2">
                    {tagConfig.map(({ tag, label, activeClass }) => (
                      <button
                        key={tag}
                        onClick={() => handleToggleTag(tag)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          tags.includes(tag)
                            ? activeClass
                            : 'bg-coffee-light/20 text-coffee-dark hover:bg-coffee-light/40'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-coffee-dark mb-1">
                    描述
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-coffee-light rounded-lg focus:outline-none focus:ring-2 focus:ring-btn-preview resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-coffee-dark mb-1">
                    制作步骤
                  </label>
                  {steps.length > 0 && (
                    <ul className="space-y-2 mb-2">
                      {steps.map((step, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-coffee-dark">
                          <span className="shrink-0 w-5 h-5 rounded-full bg-btn-preview text-white text-xs flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="flex-1">{step}</span>
                          <button
                            onClick={() => handleRemoveStep(index)}
                            className="p-1 rounded hover:bg-coffee-light/20 text-coffee-mid transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newStep}
                      onChange={e => setNewStep(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddStep();
                        }
                      }}
                      placeholder="输入步骤..."
                      className="flex-1 px-3 py-2 border border-coffee-light rounded-lg focus:outline-none focus:ring-2 focus:ring-btn-preview text-sm"
                    />
                    <button
                      onClick={handleAddStep}
                      className="flex items-center gap-1 px-3 py-2 bg-coffee-light/30 text-coffee-dark rounded-lg text-sm hover:bg-coffee-light/50 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      添加步骤
                    </button>
                  </div>
                </div>

                {validationErrors.base && (
                  <p className="text-error-red text-xs animate-fade-in">请选择基底原料</p>
                )}

                <div className="pt-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-btn-preview text-white rounded-lg px-6 py-2 hover:bg-btn-preview-hover btn-hover-scale transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    保存
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
