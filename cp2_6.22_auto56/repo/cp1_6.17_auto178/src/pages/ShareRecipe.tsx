import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Minus } from 'lucide-react'
import { useRecipeStore } from '@/client/RecipeManager'

interface IngredientForm {
  name: string
  amount: string
  category: 'vegetable' | 'meat' | 'seasoning' | 'other'
}

interface StepForm {
  order: number
  description: string
}

export default function ShareRecipe() {
  const navigate = useNavigate()
  const addRecipe = useRecipeStore((s) => s.addRecipe)

  const [name, setName] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [prepTime, setPrepTime] = useState('')
  const [cookTime, setCookTime] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [cuisine, setCuisine] = useState<'chinese' | 'western' | 'japanese'>('chinese')
  const [ingredients, setIngredients] = useState<IngredientForm[]>([
    { name: '', amount: '', category: 'other' },
  ])
  const [steps, setSteps] = useState<StepForm[]>([{ order: 1, description: '' }])

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '', category: 'other' }])
  }

  const removeIngredient = (index: number) => {
    if (ingredients.length <= 1) return
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const updateIngredient = (index: number, field: keyof IngredientForm, value: string) => {
    const updated = [...ingredients]
    updated[index] = { ...updated[index], [field]: value }
    setIngredients(updated)
  }

  const addStep = () => {
    setSteps([...steps, { order: steps.length + 1, description: '' }])
  }

  const removeStep = (index: number) => {
    if (steps.length <= 1) return
    const filtered = steps.filter((_, i) => i !== index)
    setSteps(filtered.map((s, i) => ({ ...s, order: i + 1 })))
  }

  const updateStep = (index: number, description: string) => {
    const updated = [...steps]
    updated[index] = { ...updated[index], description }
    setSteps(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await addRecipe({
      name,
      coverImage,
      author: '匿名用户',
      prepTime,
      cookTime,
      difficulty,
      cuisine,
      ingredients,
      steps,
    })
    navigate('/')
  }

  const inputClass =
    'w-full rounded-lg border border-[#F4A460]/30 bg-white px-4 py-2.5 text-[#8B4513] outline-none transition-all focus:border-[#F4A460] focus:ring-2 focus:ring-[#F4A460]/20'

  return (
    <div className="min-h-screen bg-[#FFF8F0] p-6 md:p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold text-[#8B4513]">分享你的菜谱</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#8B4513]">菜谱名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="输入菜谱名称"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#8B4513]">封面图片URL</label>
            <input
              type="text"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className={inputClass}
              placeholder="输入图片链接"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#8B4513]">准备时间</label>
              <input
                type="text"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                className={inputClass}
                placeholder="如：15分钟"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#8B4513]">烹饪时间</label>
              <input
                type="text"
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
                className={inputClass}
                placeholder="如：20分钟"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#8B4513]">难度</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                className={inputClass}
              >
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#8B4513]">菜系</label>
              <select
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value as 'chinese' | 'western' | 'japanese')}
                className={inputClass}
              >
                <option value="chinese">中餐</option>
                <option value="western">西餐</option>
                <option value="japanese">日料</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#8B4513]">食材列表</label>
            <div className="space-y-3">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                    className={`${inputClass} flex-1`}
                    placeholder="食材名"
                  />
                  <input
                    type="text"
                    value={ing.amount}
                    onChange={(e) => updateIngredient(i, 'amount', e.target.value)}
                    className={`${inputClass} w-28`}
                    placeholder="用量"
                  />
                  <select
                    value={ing.category}
                    onChange={(e) => updateIngredient(i, 'category', e.target.value)}
                    className={`${inputClass} w-24`}
                  >
                    <option value="vegetable">蔬菜</option>
                    <option value="meat">肉类</option>
                    <option value="seasoning">调料</option>
                    <option value="other">其他</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeIngredient(i)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-400 transition-colors hover:bg-red-50"
                  >
                    <Minus size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addIngredient}
              className="mt-3 flex items-center gap-1 rounded-lg border border-[#F4A460]/30 px-4 py-2 text-sm text-[#F4A460] transition-colors hover:bg-[#F4A460]/10"
            >
              <Plus size={16} />
              添加食材
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#8B4513]">步骤说明</label>
            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-2.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F4A460] text-sm font-bold text-white">
                    {step.order}
                  </span>
                  <textarea
                    value={step.description}
                    onChange={(e) => updateStep(i, e.target.value)}
                    className={`${inputClass} min-h-[80px] flex-1 resize-y`}
                    placeholder="描述这一步的操作..."
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeStep(i)}
                    className="mt-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-400 transition-colors hover:bg-red-50"
                  >
                    <Minus size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addStep}
              className="mt-3 flex items-center gap-1 rounded-lg border border-[#F4A460]/30 px-4 py-2 text-sm text-[#F4A460] transition-colors hover:bg-[#F4A460]/10"
            >
              <Plus size={16} />
              添加步骤
            </button>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-[#F4A460] py-3.5 text-lg font-bold text-white shadow-md transition-transform hover:scale-[1.02] hover:bg-[#e09040] active:scale-95"
          >
            分享菜谱
          </button>
        </form>
      </div>
    </div>
  )
}
