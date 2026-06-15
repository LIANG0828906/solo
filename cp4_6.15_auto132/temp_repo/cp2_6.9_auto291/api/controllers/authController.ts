import { Request, Response } from 'express';
import User from '../models/User';
import { v4 as uuidv4 } from 'uuid';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: '用户名和密码不能为空' });
      return;
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.status(400).json({ message: '用户名已存在' });
      return;
    }

    const user = new User({
      username,
      password
    });

    await user.save();

    const token = uuidv4();

    res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: '注册失败' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: '用户名和密码不能为空' });
      return;
    }

    const user = await User.findOne({ username });
    if (!user) {
      res.status(401).json({ message: '用户名或密码错误' });
      return;
    }

    if (user.password !== password) {
      res.status(401).json({ message: '用户名或密码错误' });
      return;
    }

    const token = uuidv4();

    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '登录失败' });
  }
};
