import { useState, useEffect } from 'react'
import { Star, User as UserIcon, BookOpen, TrendingUp } from 'lucide-react'
import { User, Loan, Book } from '@shared/types'
import axios from 'axios'
import { cn } from '@/lib/utils'
import LoanRecordItem from './LoanRecordItem'

interface UserProfileProps {
  userId: string
}

export default function UserProfile({ userId }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loans, setLoans] = useState<Loan[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'borrowed' | 'lent'>('borrowed')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, loansRes, booksRes] = await Promise.all([
          axios.get(`/api/users/${userId}`),
          axios.get(`/api/loans/user/${userId}`),
          axios.get('/api/books')
        ])
        setUser(userRes.data)
        setLoans(loansRes.data)
        setBooks(booksRes.data)
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [userId])

  const getBookById = (bookId: string) => books.find(b => b.id === bookId)

  const borrowedLoans = loans
    .filter(loan => loan.borrowerId === userId)
    .sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime())
    .map(loan => ({
      ...loan,
      book: getBookById(loan.bookId)!
    }))
    .filter(loan => loan.book)

  const lentLoans = loans
    .filter(loan => loan.lenderId === userId)
    .sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime())
    .map(loan => ({
      ...loan,
      book: getBookById(loan.bookId)!
    }))
    .filter(loan => loan.book)

  const handleRate = async (loanId: string, rating: number) => {
    try {
      await axios.post(`/api/loans/${loanId}/rate`, {
        rating,
        raterId: userId,
        type: activeTab === 'borrowed' ? 'lender' : 'borrower'
      })
      setLoans(prev => prev.map(loan =>
        loan.id === loanId
          ? { ...loan, [activeTab === 'borrowed' ? 'lenderRating' : 'borrowerRating']: rating }
          : loan
      ))
    } catch (error) {
      console.error('Failed to rate:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <UserIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
        <p className="text-slate-500">用户不存在</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover shadow-md"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
              <UserIcon className="w-12 h-12 text-violet-400" />
            </div>
          )}

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">{user.name}</h1>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6">
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-amber-50 px-3 py-1.5 rounded-full">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400 mr-1" />
                  <span className="font-semibold text-amber-700">{user.reputation.toFixed(1)}</span>
                </div>
                <span className="text-sm text-slate-500">信誉分</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-violet-50 px-3 py-1.5 rounded-full">
                  <TrendingUp className="w-5 h-5 text-violet-500 mr-1" />
                  <span className="font-semibold text-violet-700">{user.ratingCount}</span>
                </div>
                <span className="text-sm text-slate-500">评分人数</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-green-50 px-3 py-1.5 rounded-full">
                  <BookOpen className="w-5 h-5 text-green-500 mr-1" />
                  <span className="font-semibold text-green-700">{lentLoans.length}</span>
                </div>
                <span className="text-sm text-slate-500">借出</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-blue-50 px-3 py-1.5 rounded-full">
                  <BookOpen className="w-5 h-5 text-blue-500 mr-1" />
                  <span className="font-semibold text-blue-700">{borrowedLoans.length}</span>
                </div>
                <span className="text-sm text-slate-500">借入</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('borrowed')}
            className={cn(
              'flex-1 px-6 py-3 text-sm font-medium transition-colors',
              activeTab === 'borrowed'
                ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            )}
          >
            借入记录 ({borrowedLoans.length})
          </button>
          <button
            onClick={() => setActiveTab('lent')}
            className={cn(
              'flex-1 px-6 py-3 text-sm font-medium transition-colors',
              activeTab === 'lent'
                ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            )}
          >
            借出记录 ({lentLoans.length})
          </button>
        </div>

        <div className="p-4 space-y-3">
          {(activeTab === 'borrowed' ? borrowedLoans : lentLoans).length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">
                暂无{activeTab === 'borrowed' ? '借入' : '借出'}记录
              </p>
            </div>
          ) : (
            (activeTab === 'borrowed' ? borrowedLoans : lentLoans).map((loan, index) => (
              <div
                key={loan.id}
                style={{ animationDelay: `${index * 50}ms` }}
                className="animate-fade-in-up opacity-0"
              >
                <LoanRecordItem
                  loan={loan}
                  type={activeTab}
                  onRate={handleRate}
                  userRating={activeTab === 'borrowed' ? loan.lenderRating : loan.borrowerRating}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
