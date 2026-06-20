import { useState } from 'react'
import {
  Square,
  CreditCard,
  Type,
  Navigation,
  Award,
  ChevronDown,
  ChevronRight,
  Code,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ComponentType } from '@/types'
import { useDesignStore } from '@/store/useDesignStore'
import { generateFullHtml } from '@/utils/codeGenerator'

interface ComponentPreset {
  type: ComponentType
  name: string
  icon: React.ReactNode
  defaults: Record<string, unknown>
}

const componentPresets: ComponentPreset[] = [
  {
    type: 'button',
    name: '按钮',
    icon: <Square className="w-5 h-5" />,
    defaults: {
      x: 50,
      y: 50,
      width: 120,
      height: 40,
      zIndex: 1,
      text: '按钮',
      variant: 'primary',
      size: 'md',
      disabled: false,
    },
  },
  {
    type: 'card',
    name: '卡片',
    icon: <CreditCard className="w-5 h-5" />,
    defaults: {
      x: 50,
      y: 50,
      width: 280,
      height: 200,
      zIndex: 1,
      title: '卡片标题',
      description: '这是卡片的描述文字，用于展示卡片内容。',
      imageUrl: '',
    },
  },
  {
    type: 'input',
    name: '输入框',
    icon: <Type className="w-5 h-5" />,
    defaults: {
      x: 50,
      y: 50,
      width: 240,
      height: 44,
      zIndex: 1,
      placeholder: '请输入内容',
      label: '标签',
      variant: 'default',
      required: false,
    },
  },
  {
    type: 'navbar',
    name: '导航栏',
    icon: <Navigation className="w-5 h-5" />,
    defaults: {
      x: 0,
      y: 0,
      width: 800,
      height: 60,
      zIndex: 100,
      brand: '品牌',
      links: [
        { label: '首页', href: '#' },
        { label: '产品', href: '#' },
        { label: '关于', href: '#' },
      ],
      theme: 'light',
    },
  },
  {
    type: 'badge',
    name: '徽章',
    icon: <Award className="w-5 h-5" />,
    defaults: {
      x: 50,
      y: 50,
      width: 60,
      height: 24,
      zIndex: 1,
      text: '标签',
      variant: 'primary',
    },
  },
]

function CodePreview() {
  const components = useDesignStore((state) => state.components)
  const code = generateFullHtml(components)

  return (
    <div className="p-4 border-t border-gray-200">
      <div className="mb-2 text-xs font-medium text-gray-500">生成的代码</div>
      <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-auto max-h-64 whitespace-pre-wrap break-all font-mono">
        <code>{code || '// 画布为空'}</code>
      </pre>
    </div>
  )
}

function ComponentPreview({ type }: { type: ComponentType }) {
  switch (type) {
    case 'button':
      return (
        <div className="w-full h-full flex items-center justify-center">
          <button className="bg-blue-500 text-white px-3 py-1.5 rounded-md text-xs font-medium">
            按钮
          </button>
        </div>
      )
    case 'card':
      return (
        <div className="w-full h-full bg-white border border-gray-200 rounded-lg p-2 overflow-hidden">
          <div className="h-6 bg-gray-100 rounded mb-1.5"></div>
          <div className="h-2 bg-gray-100 rounded mb-1"></div>
          <div className="h-2 bg