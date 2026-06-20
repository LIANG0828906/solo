import { Canvas } from '@react-three/fiber'
import { Scene } from '@/components/Scene'
import { Controls } from '@/components/Controls'
import { useStore } from '@/store/useStore'

function App() {
  const params = useStore((state) => state.params)
  const isPlaying = useStore((state) => state.isPlaying)

  return (
    <div className="app-container">
      <Canvas
        camera={{ position: [5, 5, 5], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
        style={{ background: '#0A0B1E' }}
      >
        <color attach="background" args={['#0A0B1E']} />
        <fog attach="fog" args={['#0A0B1E', 15, 30]} />
        <Scene params={params} isPlaying={isPlaying} />
      </Canvas>
      <Controls />

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body, #root {
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
            'Helvetica Neue', Arial, sans-serif;
          background: #0A0B1E;
          color: #ffffff;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .app-container {
          width: 100vw;
          height: 100vh;
          position: relative;
        }

        .app-container canvas {
          display: block;
        }

        button {
          font-family: inherit;
        }

        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
        }

        input[type="range"]:focus {
          outline: none;
        }

        input[type="range"]::-ms-track {
          background: #4A4A6E;
          border-color: transparent;
          color: transparent;
        }
      `}</style>
    </div>
  )
}

export default App
