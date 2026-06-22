import { useState, KeyboardEvent } from 'react'
import { TaskBoard } from './TaskBoard'
import { useTaskStore } from './store'

export default function App() {
  const [inputValue, setInputValue] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const addTask = useTaskStore((state) => state.addTask)

  const handleAdd = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return

    setIsAdding(true)
    setTimeout(() => setIsAdding(false), 150)

    addTask(trimmed)
    setInputValue('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAdd()
    }
  }

  return (
    <>
      <div className="app">
        <div className="app__container">
          <h1 className="app__title">任务看板</h1>
          <div className="add-task">
            <input
              type="text"
              className="add-task__input"
              placeholder="输入任务描述..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.slice(0, 80))}
              onKeyDown={handleKeyDown}
              maxLength={80}
            />
            <button
              className={`add-task__button ${isAdding ? 'is-adding' : ''}`}
              onClick={handleAdd}
              aria-label="添加任务"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 5V19M5 12H19"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <TaskBoard />
        </div>
      </div>
      <style>{`
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
          background-color: #E2E8F0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        .app {
          min-height: 100vh;
          background-color: #E2E8F0;
          padding: 40px 20px;
        }
        .app__container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .app__title {
          text-align: center;
          font-size: 32px;
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 32px 0;
        }
        .add-task {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 32px;
        }
        .add-task__input {
          width: 400px;
          height: 48px;
          background: #F0F4F8;
          border: none;
          border-radius: 8px;
          padding: 0 16px;
          font-size: 16px;
          color: #334155;
          outline: none;
          transition: box-shadow 200ms ease;
        }
        .add-task__input:focus {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }
        .add-task__input::placeholder {
          color: #94A3B8;
        }
        .add-task__button {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #3B82F6;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 200ms ease, transform 150ms ease;
          padding: 0;
          flex-shrink: 0;
        }
        .add-task__button:hover {
          background: #2563EB;
        }
        .add-task__button.is-adding {
          transform: scale(0.95);
        }
        .add-task__button:active {
          transform: scale(0.95);
        }
      `}</style>
    </>
  )
}
