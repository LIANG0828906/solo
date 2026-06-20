import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import useRecipeStore from '@/store/recipeStore';
import { recipeApi } from '@/services/api';
import RippleButton from '@/components/RippleButton';
import type { Ingredient, Step, Difficulty } from '@/types';

const emptyIngredient = (): Ingredient => ({
  id: `ing-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: '',
  amount: 0,
  unit: 'g',
  order: 0,
});

const emptyStep = (): Step => ({
  id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  title: '',
  content: '',
  images: [],
  timerSeconds: 0,
  order: 0,
});

const difficulties: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' },
];

export default function RecipeEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = id !== 'new';
  const { currentRecipe, setCurrentRecipe, setLoading } = useRecipeStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState(15);
  const [cookTime, setCookTime] = useState(30);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [ingredients, setIngredients] = useState<Ingredient[]>([emptyIngredient()]);
  const [steps, setSteps] = useState<Step[]>([emptyStep()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing && id) {
      const fetchRecipe = async () => {
        setLoading(true);
        try {
          const res = await recipeApi.get(id);
          const r = res.data;
          setCurrentRecipe(r);
          setTitle(r.title);
          setDescription(r.description);
          setPrepTime(r.prepTime);
          setCookTime(r.cookTime);
          setDifficulty(r.difficulty);
          setIngredients(r.ingredients.length > 0 ? r.ingredients : [emptyIngredient()]);
          setSteps(r.steps.length > 0 ? r.steps : [emptyStep()]);
        } catch {
          navigate('/');
        } finally {
          setLoading(false);
        }
      };
      fetchRecipe();
    }
  }, [id]);

  const addIngredient = () => setIngredients([...ingredients, emptyIngredient()]);

  const removeIngredient = (index: number) => {
    if (ingredients.length <= 1) return;
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const addStep = () => setSteps([...steps, emptyStep()]);

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof Step, value: string | number) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  const reorderList = <T,>(list: T[], startIndex: number, endIndex: number): T[] => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const { source, destination, type } = result;
    if (source.index === destination.index) return;

    if (type === 'ingredient') {
      setIngredients(reorderList(ingredients, source.index, destination.index));
    } else if (type === 'step') {
      setSteps(reorderList(steps, source.index, destination.index));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const data = {
      title,
      description,
      prepTime,
      cookTime,
      difficulty,
      ingredients: ingredients.map((ing, i) => ({ ...ing, order: i })),
      steps: steps.map((step, i) => ({ ...step, order: i })),
      thumbnail: '',
      images: [],
    };
    try {
      if (isEditing && id) {
        const res = await recipeApi.update(id, data);
        setCurrentRecipe(res.data);
        navigate(`/recipe/${id}`);
      } else {
        const res = await recipeApi.create(data);
        navigate(`/recipe/${res.data.id}`);
      }
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <nav className="sticky top-0 z-20 bg-warm-card/90 backdrop-blur-md border-b border-warm-border px-4 md:px-8 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="font-serif text-xl text-warm-brown">{isEditing ? '编辑食谱' : '新建食谱'}</h1>
          <div className="flex gap-3">
            <button onClick={() => navigate(-1)} className="px-4 py-2 text-sm text-warm-gray hover:text-warm-brown transition-colors">
              取消
            </button>
            <RippleButton onClick={handleSave} disabled={saving || !title.trim()}>
              {saving ? '保存中...' : '保存'}
            </RippleButton>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 space-y-6">
        <div className="bg-warm-card rounded-2xl p-6 shadow-sm border border-warm-border space-y-5">
          <div>
            <label className="block text-sm font-medium text-warm-brown mb-1.5">食谱名称</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：宫保鸡丁"
              className="w-full px-4 py-2.5 rounded-xl bg-cream border border-warm-border text-warm-brown placeholder-warm-gray focus:outline-none focus:border-warm-orange transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-warm-brown mb-1.5">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简单描述这道菜的特点..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-cream border border-warm-border text-warm-brown placeholder-warm-gray focus:outline-none focus:border-warm-orange transition-colors resize-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-warm-brown mb-1.5">准备时间(分钟)</label>
              <input
                type="number"
                value={prepTime}
                onChange={(e) => setPrepTime(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-warm-border text-warm-brown focus:outline-none focus:border-warm-orange transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-warm-brown mb-1.5">烹饪时间(分钟)</label>
              <input
                type="number"
                value={cookTime}
                onChange={(e) => setCookTime(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-warm-border text-warm-brown focus:outline-none focus:border-warm-orange transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-warm-brown mb-1.5">难度</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-warm-border text-warm-brown focus:outline-none focus:border-warm-orange transition-colors"
              >
                {difficulties.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="bg-warm-card rounded-2xl p-6 shadow-sm border border-warm-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl text-warm-brown">食材</h2>
              <button onClick={addIngredient} className="flex items-center gap-1 text-sm text-warm-orange-deep hover:text-warm-orange transition-colors">
                <Plus size={16} /> 添加食材
              </button>
            </div>
            <Droppable droppableId="ingredients" type="ingredient">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                  {ingredients.map((ing, index) => (
                    <Draggable key={ing.id} draggableId={ing.id} index={index}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} className="flex items-center gap-2 group">
                          <div {...provided.dragHandleProps} className="text-warm-gray cursor-grab active:cursor-grabbing">
                            <GripVertical size={18} />
                          </div>
                          <input
                            value={ing.name}
                            onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                            placeholder="食材名称"
                            className="flex-1 px-3 py-2 text-sm rounded-lg bg-cream border border-warm-border text-warm-brown placeholder-warm-gray focus:outline-none focus:border-warm-orange transition-colors"
                          />
                          <input
                            type="number"
                            value={ing.amount || ''}
                            onChange={(e) => updateIngredient(index, 'amount', Number(e.target.value))}
                            placeholder="用量"
                            className="w-20 px-3 py-2 text-sm rounded-lg bg-cream border border-warm-border text-warm-brown placeholder-warm-gray focus:outline-none focus:border-warm-orange transition-colors"
                          />
                          <input
                            value={ing.unit}
                            onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                            placeholder="单位"
                            className="w-16 px-3 py-2 text-sm rounded-lg bg-cream border border-warm-border text-warm-brown placeholder-warm-gray focus:outline-none focus:border-warm-orange transition-colors"
                          />
                          <button
                            onClick={() => removeIngredient(index)}
                            className="btn-ripple active:scale-95 transition-transform p-1.5 text-warm-gray hover:text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          <div className="bg-warm-card rounded-2xl p-6 shadow-sm border border-warm-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl text-warm-brown">步骤</h2>
              <button onClick={addStep} className="flex items-center gap-1 text-sm text-warm-orange-deep hover:text-warm-orange transition-colors">
                <Plus size={16} /> 添加步骤
              </button>
            </div>
            <Droppable droppableId="steps" type="step">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                  {steps.map((step, index) => (
                    <Draggable key={step.id} draggableId={step.id} index={index}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} className="flex gap-3 group">
                          <div className="flex flex-col items-center pt-2">
                            <div {...provided.dragHandleProps} className="text-warm-gray cursor-grab active:cursor-grabbing mb-1">
                              <GripVertical size={18} />
                            </div>
                            <div className="step-circle">{index + 1}</div>
                          </div>
                          <div className="flex-1 space-y-2">
                            <input
                              value={step.title}
                              onChange={(e) => updateStep(index, 'title', e.target.value)}
                              placeholder="步骤标题"
                              className="w-full px-3 py-2 text-sm rounded-lg bg-cream border border-warm-border text-warm-brown placeholder-warm-gray focus:outline-none focus:border-warm-orange transition-colors"
                            />
                            <textarea
                              value={step.content}
                              onChange={(e) => updateStep(index, 'content', e.target.value)}
                              placeholder="详细描述这一步的操作..."
                              rows={3}
                              className="w-full px-3 py-2 text-sm rounded-lg bg-cream border border-warm-border text-warm-brown placeholder-warm-gray focus:outline-none focus:border-warm-orange transition-colors resize-none"
                            />
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-warm-brown-light">计时(秒):</label>
                              <input
                                type="number"
                                value={step.timerSeconds || ''}
                                onChange={(e) => updateStep(index, 'timerSeconds', Number(e.target.value))}
                                placeholder="0"
                                className="w-24 px-3 py-1.5 text-sm rounded-lg bg-cream border border-warm-border text-warm-brown focus:outline-none focus:border-warm-orange transition-colors"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => removeStep(index)}
                            className="btn-ripple active:scale-95 transition-transform self-start mt-2 p-1.5 text-warm-gray hover:text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
