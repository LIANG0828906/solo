import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import RecipeEditor from './components/RecipeEditor';
import IngredientScaler from './components/IngredientScaler';
import { Recipe, User, Ingredient, Step } from './types';
import './App.css';

const SOCKET_URL = 'http://localhost:3002';

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [nickname, setNickname] = useState('');
  const [shareCode, setShareCode] = useState('');
  const [recipeName, setRecipeName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userId] = useState(uuidv4());
  const [error, setError] = useState('');

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('room-state', (data: { recipe: Recipe; users: User[] }) => {
      setRecipe(data.recipe);
      setUsers(data.users);
    });

    newSocket.on('user-joined', (user: User) => {
      setUsers(prev => [...prev, user]);
    });

    newSocket.on('user-left', (userId: string) => {
      setUsers(prev => prev.filter(u => u.id !== userId));
    });

    newSocket.on('recipe-updated', (updatedRecipe: Recipe) => {
      setRecipe(updatedRecipe);
    });

    newSocket.on('error', (errorMsg: string) => {
      setError(errorMsg);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const createRoom = useCallback(() => {
    if (!nickname.trim() || !recipeName.trim()) {
      setError('请填写昵称和食谱名称');
      return;
    }
    setError('');
    socket?.emit('create-room', {
      userId,
      nickname: nickname.trim(),
      recipeName: recipeName.trim(),
    });
    setIsJoined(true);
  }, [socket, userId, nickname, recipeName]);

  const joinRoom = useCallback(() => {
    if (!nickname.trim() || !shareCode.trim()) {
      setError('请填写昵称和分享码');
      return;
    }
    setError('');
    socket?.emit('join-room', {
      userId,
      nickname: nickname.trim(),
      shareCode: shareCode.trim(),
    });
    setIsJoined(true);
  }, [socket, userId, nickname, shareCode]);

  const updateIngredients = useCallback(
    (ingredients: Ingredient[]) => {
      if (!socket || !recipe) return;
      const updatedRecipe = { ...recipe, ingredients };
      setRecipe(updatedRecipe);
      socket.emit('update-recipe', {
        shareCode: recipe.shareCode,
        recipe: updatedRecipe,
      });
    },
    [socket, recipe]
  );

  const updateSteps = useCallback(
    (steps: Step[]) => {
      if (!socket || !recipe) return;
      const updatedRecipe = { ...recipe, steps };
      setRecipe(updatedRecipe);
      socket.emit('update-recipe', {
        shareCode: recipe.shareCode,
        recipe: updatedRecipe,
      });
    },
    [socket, recipe]
  );

  const updateServings = useCallback(
    (servings: number) => {
      if (!socket || !recipe) return;
      const updatedRecipe = { ...recipe, servings };
      setRecipe(updatedRecipe);
      socket.emit('update-recipe', {
        shareCode: recipe.shareCode,
        recipe: updatedRecipe,
      });
    },
    [socket, recipe]
  );

  const copyShareCode = () => {
    if (recipe) {
      navigator.clipboard.writeText(recipe.shareCode);
    }
  };

  if (!isJoined) {
    return (
      <div className="app-container">
        <div className="welcome-card">
          <h1 className="app-title">🍳 食谱共创</h1>
          <p className="app-subtitle">与团队一起，创造美味食谱</p>

          {error && <div className="error-message">{error}</div>}

          <div className="input-group">
            <label>您的昵称</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="请输入昵称"
              maxLength={20}
            />
          </div>

          <div className="tab-container">
            <button className="tab-btn active">创建食谱</button>
          </div>

          <div className="input-group">
            <label>食谱名称</label>
            <input
              type="text"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              placeholder="例如：巧克力蛋糕"
              maxLength={50}
            />
          </div>

          <button className="primary-btn" onClick={createRoom}>
            创建房间
          </button>

          <div className="divider">
            <span>或</span>
          </div>

          <div className="input-group">
            <label>分享码</label>
            <input
              type="text"
              value={shareCode}
              onChange={(e) => setShareCode(e.target.value)}
              placeholder="输入8位分享码"
              maxLength={8}
            />
          </div>

          <button className="secondary-btn" onClick={joinRoom}>
            加入房间
          </button>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="app-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div>
          <h1 className="recipe-title">{recipe.name}</h1>
          <div className="share-code-row">
            <span>分享码：</span>
            <span className="share-code" onClick={copyShareCode}>
              {recipe.shareCode}
              <span className="copy-hint">点击复制</span>
            </span>
          </div>
        </div>
        <div className="users-list">
          <span className="users-count">👥 {users.length}/6</span>
          <div className="user-avatars">
            {users.map((user) => (
              <div key={user.id} className="user-avatar" title={user.nickname}>
                {user.nickname.charAt(0)}
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="main-content">
        <div className="editor-section">
          <RecipeEditor
            recipe={recipe}
            onIngredientsChange={updateIngredients}
            onStepsChange={updateSteps}
          />
        </div>
        <div className="scaler-section">
          <IngredientScaler recipe={recipe} onServingsChange={updateServings} />
        </div>
      </div>
    </div>
  );
}

export default App;
