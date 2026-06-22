import { motion } from 'framer-motion'
import { usePhotoStore } from '../store/photoStore'

export const Navbar = () => {
  const { openUpload } = usePhotoStore()

  return (
    <nav
      style={{
        height: '50px',
        backgroundColor: '#4A3728',
        color: '#EAE0C8',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <span
          style={{
            fontSize: '20px',
          }}
        >
          📷
        </span>
        <span
          style={{
            fontSize: '16px',
            fontWeight: 600,
            letterSpacing: '1px',
          }}
        >
          光影日记
        </span>
      </div>

      <div style={{ flex: 1 }} />

      <motion.button
        onClick={openUpload}
        whileHover={{ backgroundColor: '#3A2718' }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        style={{
          padding: '8px 20px',
          borderRadius: '8px',
          backgroundColor: '#5D4636',
          color: '#EAE0C8',
          fontSize: '13px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span>+</span>
        <span>上传照片</span>
      </motion.button>
    </nav>
  )
}
