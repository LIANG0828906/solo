import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">FusionSim</h1>
        <p className="text-gray-400 mb-6">核聚变等离子体3D可视化模拟器</p>
        <Link
          to="/"
          className="px-6 py-3 bg-pink rounded-lg text-white font-medium hover:brightness-110 transition-all"
        >
          进入模拟
        </Link>
      </div>
    </div>
  )
}