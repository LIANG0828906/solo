import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Swords, Calendar, Users, ChevronRight } from 'lucide-react'
import type { ReplayMeta } from '@/types/replay'

export default function ReplayList() {
  const [replays, setReplays] = useState<ReplayMeta[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    axios
      .get<ReplayMeta[]>('/api/replays')
      .then((res) => setReplays(res.data))
      .catch(() => setReplays([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-dungeon-bg p-6">
        <h1 className="mb-6 text-2xl font-bold text-dungeon-text">Battle Replays</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg bg-dungeon-panel p-5">
              <div className="mb-3 h-5 w-3/4 rounded bg-dungeon-border" />
              <div className="mb-2 h-4 w-1/2 rounded bg-dungeon-border" />
              <div className="h-4 w-2/3 rounded bg-dungeon-border" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dungeon-bg p-6 scrollbar-dark">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-3">
          <Swords className="h-8 w-8 text-dungeon-accent" />
          <h1 className="text-2xl font-bold text-dungeon-text">Battle Replays</h1>
        </div>

        {replays.length === 0 ? (
          <p className="text-dungeon-text-muted">No replays found.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {replays.map((replay) => (
              <button
                key={replay.id}
                onClick={() => navigate(`/replay/${replay.id}`)}
                className="group relative rounded-lg border border-dungeon-border bg-dungeon-panel p-5 text-left
                  transition-all duration-300 hover:-translate-y-1 hover:border-dungeon-accent hover:shadow-lg
                  hover:shadow-dungeon-accent/20"
              >
                <div className="mb-3 flex items-start justify-between">
                  <h2 className="text-lg font-semibold text-dungeon-text group-hover:text-dungeon-accent transition-colors">
                    {replay.name}
                  </h2>
                  <ChevronRight className="h-5 w-5 text-dungeon-text-muted transition-transform group-hover:translate-x-1 group-hover:text-dungeon-accent" />
                </div>

                <div className="space-y-2 text-sm text-dungeon-text-muted">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(replay.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Swords className="h-4 w-4" />
                    <span>Team Level {replay.teamLevel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{replay.teamComposition.join(', ')}</span>
                  </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 h-0.5 rounded-b-lg bg-dungeon-accent scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
