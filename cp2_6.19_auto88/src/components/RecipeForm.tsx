import { useState, useCallback } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from 'react-beautiful-dnd';
import { Plus, Trash2, GripVertical, Upload, Link2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import type {
  RecipeCreateData,
  Recipe,
  Ingredient,
  Step,
} from '../types';

interface RecipeFormProps {
  initialData?: Recipe;
  onSubmit: (data: RecipeCreateData) => void;
  onCancel: () => void;
}

interface FormIngredient {
  id: string;
  name: string;
  quantity: string;
}

interface FormStep {
  id: string;
  order: number;
  description: string;
}

interface FormErrors {
  title?: boolean;
  ingredients?: boolean;
  steps?: boolean;
}

export default function RecipeForm({
  initialData,
  onSubmit,
  onCancel,
}: RecipeFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || '');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [ingredients, setIngredients] = useState<FormIngredient[]>(
    initialData?.ingredients?.map((ing) => ({ ...ing })) || [
      { id: uuidv4(), name: '', quantity: '' },
    ]
  );
  const [steps, setSteps] = useState<FormStep[]>(
    initialData?.steps?.map((step) => ({ ...step })) || [
      { id: uuidv4(), order: 1, description: '' },
    ]
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [shakeFields, setShakeFields] = useState<Set<string>>(new Set());

  const triggerShake = useCallback((field: string) => {
    setShakeFields((prev) => new Set(prev).add(field));
    setTimeout(() => {
      setShakeFields((prev) => {
        const next = new Set(prev);
        next.delete(field);
        return next;
      });
    }, 400);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCoverImage(result);
        setCoverImageUrl('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrlSubmit = () => {
    if (coverImageUrl.trim()) {
      setCoverImage(coverImageUrl.trim());
      setCoverImageUrl('');
    }
  };

  const addIngredient = () => {
    const newIngredient: FormIngredient = {
      id: uuidv4(),
      name: '',
      quantity: '',
    };
    setIngredients([...ingredients, newIngredient]);
  };

  const removeIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((ing) => ing.id !== id));
    }
  };

  const updateIngredient = (id: string, field: 'name' | 'quantity', value: string) => {
    setIngredients(
      ingredients.map((ing) =>
        ing.id === id ? { ...ing, [field]: value } : ing
      )
    );
  };

  const addStep = () => {
    const newStep: FormStep = {
      id: uuidv4(),
      order: steps.length + 1,
      description: '',
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (id: string) => {
    if (steps.length > 1) {
      const filtered = steps.filter((step) => step.id !== id);
      setSteps(
        filtered.map((step, index) => ({ ...step, order: index + 1 }))
      );
    }
  };

  const updateStep = (id: string, description: string) => {
    setSteps(
      steps.map((step) =>
        step.id === id ? { ...step, description } : step
      )
    );
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === 'ingredient') {
      const items = Array.from(ingredients);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);
      setIngredients(items);
    } else if (type === 'step') {
      const items = Array.from(steps);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);
      setSteps(
        items.map((item, index) => ({ ...item, order: index + 1 }))
      );
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const validIngredients = ingredients.filter(
      (ing) => ing.name.trim() && ing.quantity.trim()
    );
    const validSteps = steps.filter((step) => step.description.trim());

    if (!title.trim()) {
      newErrors.title = true;
      triggerShake('title');
    }
    if (validIngredients.length === 0) {
      newErrors.ingredients = true;
      triggerShake('ingredients');
    }
    if (validSteps.length === 0) {
      newErrors.steps = true;
      triggerShake('steps');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const validIngredients = ingredients
      .filter((ing) => ing.name.trim() && ing.quantity.trim())
      .map(({ id: _id, ...rest }) => rest);

    const validSteps = steps
      .filter((step) => step.description.trim())
      .map(({ id: _id, ...rest }) => rest);

    const data: RecipeCreateData = {
      title: title.trim(),
      description: description.trim(),
      coverImage: coverImage,
      ingredients: validIngredients,
      steps: validSteps,
      cookingTime: initialData?.cookingTime || 30,
      servings: initialData?.servings || 2,
      difficulty: initialData?.difficulty || 'medium',
      authorId: initialData?.authorId || 'default-user',
      authorName: initialData?.authorName || '美食家',
    };

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          标题 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) {
              setErrors({ ...errors, title: false });
            }
          }}
          placeholder="给你的食谱起个名字"
          className={cn(
            'input',
            errors.title && 'error',
            shakeFields.has('title') && 'input-error'
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          简介
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="简单介绍一下这道菜..."
          className="textarea"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          封面图片
        </label>
        {coverImage ? (
          <div className="relative">
            <img
              src={coverImage}
              alt="封面预览"
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={() => setCoverImage('')}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <label className="flex-1">
                <div className="flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-500">上传图片</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="或粘贴图片URL"
                className="input flex-1"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleImageUrlSubmit())}
              />
              <button
                type="button"
                onClick={handleImageUrlSubmit}
                className="btn btn-primary"
              >
                <Link2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={cn(shakeFields.has('ingredients') && 'input-error')}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          食材 <span className="text-red-500">*</span>
        </label>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="ingredients" type="ingredient">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {ingredients.map((ingredient, index) => (
                  <Draggable
                    key={ingredient.id}
                    draggableId={ingredient.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          'flex items-center gap-2 p-2 bg-white rounded-lg border transition',
                          snapshot.isDragging && 'shadow-lg',
                          errors.ingredients && 'border-red-500 bg-red-50'
                        )}
                        style={{
                          ...provided.draggableProps.style,
                          animation:
                            index === ingredients.length - 1
                              ? 'slideInFromBottom 300ms ease-out'
                              : undefined,
                        }}
                      >
                        <div {...provided.dragHandleProps}>
                          <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
                        </div>
                        <input
                          type="text"
                          value={ingredient.name}
                          onChange={(e) => {
                            updateIngredient(ingredient.id, 'name', e.target.value);
                            if (errors.ingredients) {
                              setErrors({ ...errors, ingredients: false });
                            }
                          }}
                          placeholder="食材名称"
                          className="input flex-1"
                        />
                        <input
                          type="text"
                          value={ingredient.quantity}
                          onChange={(e) => {
                            updateIngredient(ingredient.id, 'quantity', e.target.value);
                            if (errors.ingredients) {
                              setErrors({ ...errors, ingredients: false });
                            }
                          }}
                          placeholder="用量"
                          className="input w-32"
                        />
                        <button
                          type="button"
                          onClick={() => removeIngredient(ingredient.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition"
                          disabled={ingredients.length === 1}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <button
          type="button"
          onClick={addIngredient}
          className="mt-2 flex items-center gap-1 text-primary hover:text-secondary transition"
        >
          <Plus className="w-4 h-4" />
          添加食材
        </button>
      </div>

      <div className={cn(shakeFields.has('steps') && 'input-error')}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          步骤 <span className="text-red-500">*</span>
          <span className="text-xs text-gray-400 ml-2">(支持 Markdown)</span>
        </label>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="steps" type="step">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3"
              >
                {steps.map((step, index) => (
                  <Draggable
                    key={step.id}
                    draggableId={step.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          'p-3 bg-white rounded-lg border transition',
                          snapshot.isDragging && 'shadow-lg',
                          errors.steps && 'border-red-500 bg-red-50'
                        )}
                        style={{
                          ...provided.draggableProps.style,
                          animation:
                            index === steps.length - 1
                              ? 'slideInFromBottom 300ms ease-out'
                              : undefined,
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <div {...provided.dragHandleProps} className="mt-2">
                            <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-500 mb-1">
                              步骤 {step.order}
                            </div>
                            <textarea
                              value={step.description}
                              onChange={(e) => {
                                updateStep(step.id, e.target.value);
                                if (errors.steps) {
                                  setErrors({ ...errors, steps: false });
                                }
                              }}
                              placeholder="描述这一步怎么做..."
                              className="textarea"
                              rows={3}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeStep(step.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition"
                            disabled={steps.length === 1}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <button
          type="button"
          onClick={addStep}
          className="mt-2 flex items-center gap-1 text-primary hover:text-secondary transition"
        >
          <Plus className="w-4 h-4" />
          添加步骤
        </button>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="btn"
          style={{ backgroundColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          取消
        </button>
        <button type="submit" className="btn btn-primary">
          {initialData ? '更新食谱' : '创建食谱'}
        </button>
      </div>
    </form>
  );
}
