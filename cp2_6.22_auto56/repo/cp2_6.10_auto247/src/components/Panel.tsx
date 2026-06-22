import { useState } from 'react'
import { motion } from 'framer-motion'
import { useCalcStore, COLORS } from '../store/useCalcStore'

export function LeftPanel() {
  const {
    selectedColor,
    setSelectedColor,
    clearPoints,
    loadSampleData,
    points
  } = useCalcStore()

  return (
    <motion.div
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        left: '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '200px',
        padding: '24px',
        background: 'rgba(245, 245, 240, 0.95)',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(58, 58, 58, 0.15)',
        border: '1px solid rgba(58, 58, 58, 0.1)',
        backdropFilter: 'blur(10px)',
        zIndex: 10
      }}
    >
      <h3 style={{
        fontSize: '20px',
        color: '#3a3a3a',
        marginBottom: '20px',
        fontWeight: 'bold',
        letterSpacing: '2px',
        borderBottom: '2px solid #4a7c59',
        paddingBottom: '10px'
      }}>
        运筹帷幄
      </h3>

      <div style={{ marginBottom: '24px' }}>
        <div style={{
          fontSize: '14px',
          color: '#3a3a3a',
          marginBottom: '12px',
          fontWeight: '500'
        }}>
          算筹颜色
        </div>
        <div style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          {COLORS.map((color, index) => (
            <motion.div
              key={color}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedColor(color)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: color,
                cursor: 'pointer',
                border: selectedColor === color
                  ? '3px solid #3a3a3a'
                  : '2px solid rgba(58, 58, 58, 0.2)',
                boxShadow: selectedColor === color
                  ? `0 0 10px ${color}`
                  : 'none',
                transition: 'all 0.2s ease'
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontSize: '14px',
          color: '#3a3a3a',
          marginBottom: '8px',
          fontWeight: '500'
        }}>
          当前点数: <span style={{ color: '#c0392b' }}>{points.length}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={loadSampleData}
          style={{
            padding: '12px 16px',
            fontSize: '14px',
            fontFamily: 'inherit',
            color: '#f5f5f0',
            background: '#4a7c59',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            letterSpacing: '1px',
            boxShadow: '0 2px 8px rgba(74, 124, 89, 0.3)',
            transition: 'all 0.2s ease'
          }}
        >
          导入示例数据
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={clearPoints}
          style={{
            padding: '12px 16px',
            fontSize: '14px',
            fontFamily: 'inherit',
            color: '#f5f5f0',
            background: '#c0392b',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            letterSpacing: '1px',
            boxShadow: '0 2px 8px rgba(192, 57, 43, 0.3)',
            transition: 'all 0.2s ease'
          }}
        >
          清空算筹
        </motion.button>
      </div>

      <div style={{
        marginTop: '24px',
        paddingTop: '16px',
        borderTop: '1px dashed rgba(58, 58, 58, 0.2)',
        fontSize: '12px',
        color: 'rgba(58, 58, 58, 0.6)',
        lineHeight: '1.8'
      }}>
        <p>• 点击画布放置算筹</p>
        <p>• 拖拽算筹调整位置</p>
        <p>• 双击算筹编辑数值</p>
        <p>• 右键算筹删除</p>
      </div>
    </motion.div>
  )
}

export function RightPanel() {
  const { degree, setDegree, fitResult, points } = useCalcStore()

  const degreeNames = ['线性', '二次', '三次', '四次', '五次']

  return (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        right: '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '280px',
        padding: '24px',
        background: 'rgba(245, 245, 240, 0.95)',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(58, 58, 58, 0.15)',
        border: '1px solid rgba(58, 58, 58, 0.1)',
        backdropFilter: 'blur(10px)',
        zIndex: 10
      }}
    >
      <h3 style={{
        fontSize: '20px',
        color: '#3a3a3a',
        marginBottom: '20px',
        fontWeight: 'bold',
        letterSpacing: '2px',
        borderBottom: '2px solid #c0392b',
        paddingBottom: '10px'
      }}>
        拟合结果
      </h3>

      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <span style={{ fontSize: '14px', color: '#3a3a3a', fontWeight: '500' }}>
            多项式阶数
          </span>
          <span style={{
            fontSize: '16px',
            color: '#c0392b',
            fontWeight: 'bold',
            fontFamily: 'serif'
          }}>
            {degreeNames[degree - 1]}
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="5"
          value={degree}
          onChange={(e) => setDegree(parseInt(e.target.value))}
          style={{
            width: '100%',
            height: '6px',
            appearance: 'none',
            background: 'linear-gradient(to right, #4a7c59, #c0392b)',
            borderRadius: '3px',
            outline: 'none',
            cursor: 'pointer'
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '4px',
          fontSize: '11px',
          color: 'rgba(58, 58, 58, 0.5)'
        }}>
          <span>1次</span>
          <span>2次</span>
          <span>3次</span>
          <span>4次</span>
          <span>5次</span>
        </div>
      </div>

      {fitResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          key={fitResult.equation + points.length}
          style={{ marginBottom: '24px' }}
        >
          <div style={{
            marginBottom: '20px',
            padding: '16px',
            background: 'rgba(58, 58, 58, 0.03)',
            borderRadius: '8px',
            borderLeft: '3px solid #4a7c59'
          }}>
            <div style={{
              fontSize: '12px',
              color: 'rgba(58, 58, 58, 0.6)',
              marginBottom: '8px'
            }}>
              拟合方程
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                fontSize: '16px',
                color: '#3a3a3a',
                fontWeight: 'bold',
                fontFamily: 'serif',
                wordBreak: 'break-all',
                lineHeight: '1.5'
              }}
            >
              {fitResult.equation}
            </motion.div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px'
              }}>
                <span style={{ fontSize: '13px', color: '#3a3a3a' }}>
                  R² 决定系数
                </span>
                <span style={{
                  fontSize: '15px',
                  color: '#4a7c59',
                  fontWeight: 'bold',
                  fontFamily: 'serif'
                }}>
                  {fitResult.rSquared.toFixed(4)}
                </span>
              </div>
              <div style={{
                height: '6px',
                background: 'rgba(58, 58, 58, 0.1)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, fitResult.rSquared * 100)}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    background: 'linear-gradient(to right, #4a7c59, #7db68e)',
                    borderRadius: '3px'
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px'
              }}>
                <span style={{ fontSize: '13px', color: '#3a3a3a' }}>
                  均方误差 (MSE)
                </span>
                <span style={{
                  fontSize: '15px',
                  color: '#c0392b',
                  fontWeight: 'bold',
                  fontFamily: 'serif'
                }}>
                  {fitResult.mse.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {points.length > 0 && (
        <div style={{
          paddingTop: '16px',
          borderTop: '1px dashed rgba(58, 58, 58, 0.2)'
        }}>
          <div style={{
            fontSize: '13px',
            color: 'rgba(58, 58, 58, 0.7)',
            marginBottom: '8px',
            fontWeight: '500'
          }}>
            数据点列表
          </div>
          <div style={{
            maxHeight: '150px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            {points.map((point, index) => (
              <PointRow key={point.id} point={point} index={index} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

function PointRow({ point, index }: { point: { id: string; x: number; y: number; color: string }; index: number }) {
  const { deletePoint, setEditingPointId, editingPointId } = useCalcStore()
  const isEditing = editingPointId === point.id

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 10px',
        background: 'rgba(255, 255, 255, 0.5)',
        borderRadius: '6px',
        fontSize: '12px'
      }}
    >
      <div style={{
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: point.color,
        flexShrink: 0
      }} />
      <span style={{
        color: 'rgba(58, 58, 58, 0.5)',
        width: '20px'
      }}>
        {index + 1}.
      </span>
      {isEditing ? (
        <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
          <EditableValue point={point} />
        </div>
      ) : (
        <>
          <span style={{ flex: 1, fontFamily: 'serif', color: '#3a3a3a' }}>
            ({point.x.toFixed(1)}, {point.y.toFixed(1)})
          </span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setEditingPointId(point.id)}
            style={{
              padding: '2px 6px',
              fontSize: '10px',
              background: 'rgba(74, 124, 89, 0.1)',
              color: '#4a7c59',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            编辑
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => deletePoint(point.id)}
            style={{
              padding: '2px 6px',
              fontSize: '10px',
              background: 'rgba(192, 57, 43, 0.1)',
              color: '#c0392b',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            删除
          </motion.button>
        </>
      )}
    </motion.div>
  )
}

function EditableValue({ point }: { point: { id: string; x: number; y: number; color: string } }) {
  const { updatePoint, setEditingPointId } = useCalcStore()
  const [xValue, setXValue] = useState(point.x.toString())
  const [yValue, setYValue] = useState(point.y.toString())

  const handleSave = () => {
    const x = parseFloat(xValue)
    const y = parseFloat(yValue)
    if (!isNaN(x) && !isNaN(y)) {
      updatePoint(point.id, x, y)
    }
    setEditingPointId(null)
  }

  return (
    <>
      <input
        type="number"
        value={xValue}
        onChange={(e) => setXValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        style={{
          width: '50px',
          padding: '2px 4px',
          fontSize: '11px',
          border: '1px solid #4a7c59',
          borderRadius: '4px',
          fontFamily: 'serif'
        }}
        step="0.1"
        autoFocus
      />
      <input
        type="number"
        value={yValue}
        onChange={(e) => setYValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        style={{
          width: '50px',
          padding: '2px 4px',
          fontSize: '11px',
          border: '1px solid #4a7c59',
          borderRadius: '4px',
          fontFamily: 'serif'
        }}
        step="0.1"
      />
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleSave}
        style={{
          padding: '2px 6px',
          fontSize: '10px',
          background: '#4a7c59',
          color: '#f5f5f0',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontFamily: 'inherit'
        }}
      >
        ✓
      </motion.button>
    </>
  )
}
