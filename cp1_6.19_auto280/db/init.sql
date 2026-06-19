-- users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  avatar_color VARCHAR(7) NOT NULL DEFAULT '#F39C12',
  exchange_count INTEGER DEFAULT 0,
  trust_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(10) NOT NULL DEFAULT 'g',
  expiry_date DATE NOT NULL,
  image_url VARCHAR(500),
  category VARCHAR(50) NOT NULL,
  description TEXT,
  is_exchanged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- chats table (stores individual messages)
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id VARCHAR(100) NOT NULL,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- trust_marks table
CREATE TABLE IF NOT EXISTS trust_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ingredients_user_id ON ingredients(user_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);
CREATE INDEX IF NOT EXISTS idx_ingredients_created_at ON ingredients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingredients_is_exchanged ON ingredients(is_exchanged);
CREATE INDEX IF NOT EXISTS idx_chats_chat_id ON chats(chat_id);
CREATE INDEX IF NOT EXISTS idx_chats_sender_id ON chats(sender_id);
CREATE INDEX IF NOT EXISTS idx_chats_receiver_id ON chats(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at);
CREATE INDEX IF NOT EXISTS idx_trust_marks_to_user ON trust_marks(to_user_id);
