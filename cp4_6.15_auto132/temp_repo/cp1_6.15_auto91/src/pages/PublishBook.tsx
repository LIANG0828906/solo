import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { createBook, type CreateBookData } from '@/api'
import { useAppStore } from '@/store'

type BookCategory = 'novel' | 'documentary' | 'technology' | 'art' | 'life'
type TransactionType = 'exchange' | 'sale'

const categoryOptions: { value: BookCategory; label: string }[] = [
  { value: 'novel', label: '小说' },
  { value: 'documentary', label: '纪实' },
  { value: 'technology', label: '科技' },
  { value: 'art', label: '艺术' },
  { value: 'life', label: '生活' },
]

const MAX_DESCRIPTION_LENGTH = 200
const MAX_PRICE = 9999
const MIN_PRICE = 0

export default function PublishBook() {
  const navigate = useNavigate()
  const { addNotification } = useAppStore()

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    publishYear: '',
    description: '',
    coverUrl: '',
    category: '' as BookCategory | '',
    transactionType: '' as TransactionType | '',
    exchangeCategory: '' as BookCategory | '',
    price: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target

      if (name === 'coverUrl') {
        setCoverPreview(value || null)
      }

      setFormData((prev) => ({ ...prev, [name]: value }))
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    },
    []
  )

  const handleTransactionTypeChange = useCallback((type: TransactionType) => {
    setFormData((prev) => ({
      ...prev,
      transactionType: type,
      exchangeCategory: type === 'exchange' ? '' : prev.exchangeCategory,
      price: type === 'sale' ? '' : prev.price,
    }))
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors.exchangeCategory
      delete newErrors.price
      return newErrors
    })
  }, [])

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = '请输入书名'
    }

    if (!formData.author.trim()) {
      newErrors.author = '请输入作者'
    }

    if (!formData.publishYear.trim()) {
      newErrors.publishYear = '请输入出版年份'
    } else {
      const year = parseInt(formData.publishYear, 10)
      const currentYear = new Date().getFullYear()
      if (isNaN(year) || year < 1000 || year > currentYear) {
        newErrors.publishYear = `请输入有效的年份（1000-${currentYear}）`
      }
    }

    if (!formData.description.trim()) {
      newErrors.description = '请输入书籍简介'
    } else if (formData.description.length > MAX_DESCRIPTION_LENGTH) {
      newErrors.description = `简介不能超过${MAX_DESCRIPTION_LENGTH}字`
    }

    if (!formData.coverUrl.trim()) {
      newErrors.coverUrl = '请输入封面图片URL'
    }

    if (!formData.category) {
      newErrors.category = '请选择书籍类别'
    }

    if (!formData.transactionType) {
      newErrors.transactionType = '请选择交易方式'
    } else if (formData.transactionType === 'exchange') {
      if (!formData.exchangeCategory) {
        newErrors.exchangeCategory = '请选择期望交换的书籍类别'
      }
    } else if (formData.transactionType === 'sale') {
      if (!formData.price.trim()) {
        newErrors.price = '请输入价格'
      } else {
        const price = parseFloat(formData.price)
        if (isNaN(price) || price < MIN_PRICE || price > MAX_PRICE) {
          newErrors.price = `价格必须在${MIN_PRICE}-${MAX_PRICE}元之间`
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validateForm()) {
        addNotification('error', '请检查并完善表单信息')
        return
      }

      setIsSubmitting(true)

      try {
        const bookData: CreateBookData = {
          title: formData.title.trim(),
          author: formData.author.trim(),
          publishYear: parseInt(formData.publishYear, 10),
          description: formData.description.trim(),
          coverUrl: formData.coverUrl.trim(),
          category: formData.category as BookCategory,
          transactionType: formData.transactionType as TransactionType,
          ...(formData.transactionType === 'exchange' && {
            exchangeCategory: formData.exchangeCategory,
          }),
          ...(formData.transactionType === 'sale' && {
            price: parseFloat(formData.price),
          }),
        }

        const result = await createBook(bookData)
        addNotification('success', `《${result.title}》发布成功，等待审核`)

        setTimeout(() => {
          navigate('/')
        }, 1500)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '发布失败，请稍后重试'
        addNotification('error', errorMessage)
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, validateForm, addNotification, navigate]
  )

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container max-w-2xl">
        <div className="bg-card rounded-2xl shadow-lg border border-border-light overflow-hidden animate-card-unfold">
          <div className="bg-gradient-to-r from-wood-primary to-wood-secondary px-6 py-5">
            <h1 className="text-2xl font-serif font-bold text-wood-cream flex items-center gap-3">
              <span className="text-3xl">📚</span>
              发布书籍
            </h1>
            <p className="text-wood-cream/80 text-sm mt-1">分享你的好书，开启知识传递之旅</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-primary mb-2">
                  书名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="请输入书名"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-wood-primary/30',
                    errors.title
                      ? 'border-red-400 bg-red-50 focus:border-red-500'
                      : 'border-border-light bg-wood-cream/50 focus:border-wood-primary'
                  )}
                />
                {errors.title && <p className="mt-1.5 text-sm text-red-500">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  作者 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  placeholder="请输入作者"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-wood-primary/30',
                    errors.author
                      ? 'border-red-400 bg-red-50 focus:border-red-500'
                      : 'border-border-light bg-wood-cream/50 focus:border-wood-primary'
                  )}
                />
                {errors.author && <p className="mt-1.5 text-sm text-red-500">{errors.author}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  出版年份 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="publishYear"
                  value={formData.publishYear}
                  onChange={handleInputChange}
                  placeholder="如：2023"
                  min="1000"
                  max={new Date().getFullYear()}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-wood-primary/30',
                    errors.publishYear
                      ? 'border-red-400 bg-red-50 focus:border-red-500'
                      : 'border-border-light bg-wood-cream/50 focus:border-wood-primary'
                  )}
                />
                {errors.publishYear && (
                  <p className="mt-1.5 text-sm text-red-500">{errors.publishYear}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-primary mb-2">
                  书籍简介 <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="请简要介绍这本书的内容..."
                  rows={4}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border transition-all duration-200 resize-none',
                    'focus:outline-none focus:ring-2 focus:ring-wood-primary/30',
                    errors.description
                      ? 'border-red-400 bg-red-50 focus:border-red-500'
                      : 'border-border-light bg-wood-cream/50 focus:border-wood-primary'
                  )}
                />
                <div className="flex justify-between items-center mt-1.5">
                  {errors.description ? (
                    <p className="text-sm text-red-500">{errors.description}</p>
                  ) : (
                    <span className="text-sm text-muted">
                      简要介绍书籍内容，帮助读者了解
                    </span>
                  )}
                  <span
                    className={cn(
                      'text-sm font-medium',
                      formData.description.length > MAX_DESCRIPTION_LENGTH * 0.9
                        ? 'text-red-500'
                        : 'text-muted'
                    )}
                  >
                    {formData.description.length}/{MAX_DESCRIPTION_LENGTH}
                  </span>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-primary mb-2">
                  封面图片URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  name="coverUrl"
                  value={formData.coverUrl}
                  onChange={handleInputChange}
                  placeholder="请输入封面图片链接"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-wood-primary/30',
                    errors.coverUrl
                      ? 'border-red-400 bg-red-50 focus:border-red-500'
                      : 'border-border-light bg-wood-cream/50 focus:border-wood-primary'
                  )}
                />
                {coverPreview && (
                  <div className="mt-3">
                    <p className="text-sm text-muted mb-2">封面预览：</p>
                    <div className="w-32 h-44 rounded-lg overflow-hidden border-2 border-border-light shadow-md">
                      <img
                        src={coverPreview}
                        alt="封面预览"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                  </div>
                )}
                {errors.coverUrl && <p className="mt-1.5 text-sm text-red-500">{errors.coverUrl}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-primary mb-2">
                  书籍类别 <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border transition-all duration-200 appearance-none cursor-pointer',
                    'focus:outline-none focus:ring-2 focus:ring-wood-primary/30',
                    'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%238B7355\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")] bg-[length:24px_24px] bg-[right_12px_center] bg-no-repeat pr-10',
                    errors.category
                      ? 'border-red-400 bg-red-50 focus:border-red-500'
                      : 'border-border-light bg-wood-cream/50 focus:border-wood-primary'
                  )}
                >
                  <option value="">请选择书籍类别</option>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="mt-1.5 text-sm text-red-500">{errors.category}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-primary mb-3">
                  交易方式 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4 flex-wrap">
                  {[
                    { value: 'exchange' as TransactionType, label: '交换', icon: '🔄' },
                    { value: 'sale' as TransactionType, label: '出售', icon: '💰' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        'flex items-center gap-3 px-5 py-3 rounded-xl border-2 cursor-pointer transition-all duration-200',
                        formData.transactionType === option.value
                          ? 'border-wood-primary bg-wood-primary/10 shadow-md'
                          : 'border-border-light bg-wood-cream/30 hover:border-wood-secondary hover:bg-wood-light/50'
                      )}
                    >
                      <input
                        type="radio"
                        name="transactionType"
                        value={option.value}
                        checked={formData.transactionType === option.value}
                        onChange={() => handleTransactionTypeChange(option.value)}
                        className="sr-only"
                      />
                      <span className="text-xl">{option.icon}</span>
                      <span
                        className={cn(
                          'font-medium',
                          formData.transactionType === option.value
                            ? 'text-wood-primary'
                            : 'text-secondary'
                        )}
                      >
                        {option.label}
                      </span>
                      {formData.transactionType === option.value && (
                        <span className="w-5 h-5 rounded-full bg-wood-primary flex items-center justify-center text-wood-cream text-xs">
                          ✓
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                {errors.transactionType && (
                  <p className="mt-2 text-sm text-red-500">{errors.transactionType}</p>
                )}
              </div>

              {formData.transactionType === 'exchange' && (
                <div className="md:col-span-2 animate-list-fade">
                  <label className="block text-sm font-medium text-primary mb-2">
                    期望交换的书籍类别 <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="exchangeCategory"
                    value={formData.exchangeCategory}
                    onChange={handleInputChange}
                    className={cn(
                      'w-full px-4 py-3 rounded-xl border transition-all duration-200 appearance-none cursor-pointer',
                      'focus:outline-none focus:ring-2 focus:ring-wood-primary/30',
                      'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%238B7355\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")] bg-[length:24px_24px] bg-[right_12px_center] bg-no-repeat pr-10',
                      errors.exchangeCategory
                        ? 'border-red-400 bg-red-50 focus:border-red-500'
                        : 'border-border-light bg-wood-cream/50 focus:border-wood-primary'
                    )}
                  >
                    <option value="">请选择期望交换的书籍类别</option>
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.exchangeCategory && (
                    <p className="mt-1.5 text-sm text-red-500">{errors.exchangeCategory}</p>
                  )}
                </div>
              )}

              {formData.transactionType === 'sale' && (
                <div className="md:col-span-2 animate-list-fade">
                  <label className="block text-sm font-medium text-primary mb-2">
                    价格（元） <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-medium">
                      ¥
                    </span>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="请输入价格"
                      min={MIN_PRICE}
                      max={MAX_PRICE}
                      step="0.01"
                      className={cn(
                        'w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-wood-primary/30',
                        errors.price
                          ? 'border-red-400 bg-red-50 focus:border-red-500'
                          : 'border-border-light bg-wood-cream/50 focus:border-wood-primary'
                      )}
                    />
                  </div>
                  <p className="mt-1.5 text-sm text-muted">
                    价格范围：{MIN_PRICE} - {MAX_PRICE} 元
                  </p>
                  {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
                </div>
              )}
            </div>

            <div className="border-t border-border-light pt-6 mt-8">
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="btn btn-outline px-8 flex-1 sm:flex-none"
                  disabled={isSubmitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn btn-primary px-10 flex-1 sm:flex-none"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner w-5 h-5" />
                      发布中...
                    </>
                  ) : (
                    <>
                      <span>📖</span>
                      发布书籍
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
