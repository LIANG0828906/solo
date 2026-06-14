import { useState } from 'react'
import { Trash2, RotateCcw, ShoppingCart, Coffee, Home, Car, Utensils, Gamepad2, Heart, Briefcase, CreditCard, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TransactionCategory =
  | 'shopping'
  | 'food'
  | 'coffee'
  | 'housing'
  | 'transport'
  | 'entertainment'
  | 'health'
  | 'salary'
  | 'other'

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'alipay' | 'wechat'

export interface Transaction {
  id: string
  amount: number
  type: 'income' | 'expense'
  category: TransactionCategory
  date: string
  description: string
  paymentMethod: PaymentMethod
}

const categoryIcons: Record<TransactionCategory, React.ElementType> = {
  shopping: ShoppingCart,
  food: Utensils,
  coffee: Coffee,
  housing: Home,
  transport: Car,
  entertainment: Gamepad2,
  health: Heart,
  salary: Briefcase,
  other: DollarSign,
}

const categoryColors: Record<TransactionCategory, string> = {
  shopping: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  food: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  coffee: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  housing: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  transport: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  entertainment: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  health: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  salary: 'bg-mint-100 text-mint-600 dark:bg-mint-900/30 dark:text-mint-400',
  other: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: '现金',
  card: '银行卡',
  transfer: '转账',
  alipay: '支付宝',
  wechat: '微信',
}

interface TransactionItemProps {
  transaction: Transaction
  onDelete: (id: string) => void
}

export default function TransactionItem({ transaction, onDelete }: TransactionItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showUndo, setShowUndo] = useState(false)
  const Icon = categoryIcons[transaction.category]

  const handleDelete = () => {
    setIsDeleting(true)
    setShowUndo(true)

    const timer = setTimeout(() => {
      onDelete(transaction.id)
    }, 3000)

    ;(handleDelete as any).timer = timer
  }

  const handleUndo = () => {
    if ((handleDelete as any).timer) {
      clearTimeout((handleDelete as any).timer)
    }
    setIsDeleting(false)
    setShowUndo(false)
  }

  const formatAmount = (amount: number) => {
    const sign = transaction.type === 'income' ? '+' : '-'
    return `${sign}¥${amount.toFixed(2)}`
  }

  return (
    <div
      className={cn(
        'group relative flex items-center gap-4 p-4 rounded-xl transition-all duration-300',
        'hover:bg-mint-50 dark:hover:bg-navy-500/50',
        'active:scale-[0.98]',
        isDeleting && 'animate-slide-out'
      )}
    >
      <div
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200',
          categoryColors[transaction.category],
          'group-hover:scale-110'
        )}
      >
        <Icon className="w-6 h-6" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {transaction.description}
          </p>
          <p
            className={cn(
              'font-semibold ml-2 shrink-0',
              transaction.type === 'income'
                ? 'text-mint-600 dark:text-mint-400'
                : 'text-red-500 dark:text-red-400'
            )}
          >
            {formatAmount(transaction.amount)}
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span>{transaction.date}</span>
          <span className="flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5" />
            {paymentMethodLabels[transaction.paymentMethod]}
          </span>
        </div>
      </div>

      {!showUndo ? (
        <button
          onClick={handleDelete}
          className={cn(
            'p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30',
            'opacity-0 group-hover:opacity-100 transition-all duration-200',
            'focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500/30'
          )}
          aria-label="删除交易"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      ) : (
        <button
          onClick={handleUndo}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mint-500 text-white text-sm font-medium animate-fade-in hover:bg-mint-600 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          撤销
        </button>
      )}
    </div>
  )
}
