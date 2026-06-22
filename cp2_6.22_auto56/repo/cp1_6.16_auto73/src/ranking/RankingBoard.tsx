import { useAppState } from '../store/AppState'
import UserCard from './UserCard'

export default function RankingBoard() {
  const { sortedUsers } = useAppState()

  if (sortedUsers.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 200,
        color: '#8B95A5',
        fontSize: 14
      }}>
        正在加载自习室数据...
      </div>
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
      gap: 16,
      width: '100%',
      padding: '0 8px',
      ['@media (max-width: 768px)' as any]: {
        gridTemplateColumns: '1fr',
        gap: 12
      }
    } as React.CSSProperties}>
      {sortedUsers.map((user, index) => (
        <UserCard key={user.id} user={user} rank={index + 1} />
      ))}
    </div>
  )
}
