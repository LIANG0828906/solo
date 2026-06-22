import { useParams } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import UserProfile from '@/components/UserProfile'
import { User } from '@shared/types'

interface ProfileProps {
  users: User[]
}

export default function Profile({ users }: ProfileProps) {
  const { id } = useParams<{ id: string }>()
  const userId = id || 'user-1'
  const currentUser = users.find(u => u.id === userId) || null

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar user={currentUser} userId={userId} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar currentUserId={userId} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto">
          <UserProfile userId={userId} />
        </main>
      </div>
    </div>
  )
}
