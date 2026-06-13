/**
 * Express 应用配置模块
 * 配置中间件（JSON解析、CORS、Session）、路由挂载、404和错误处理
 * 被 api/server.ts (本地开发) 和 api/index.ts (Vercel部署) 引用
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import session from 'express-session'
import