import Canvas from '@/components/Canvas'
import Panel from '@/components/Panel'
import Notification from '@/components/Notification'

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-8">
      <Canvas />
      <Panel />
      <Notification />
    </div>
  )
}
