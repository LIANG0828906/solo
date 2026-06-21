import { useState } from 'react'
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'

interface NumberInputProps {
  label: string
  value: number
  onChange: (val: number) => void
  step?: number
}

function NumberInput({ label, value, onChange, step = 1 }: NumberInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-slate-400 font-medium">{label}</label>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-9 px-3 rounded-lg bg-slate-700 text-white text-sm border border-slate-600
          focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
          transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  )
}

interface ColorInputProps {
  label: string
  value: string
  onChange: (val: string) => void
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-slate-400 font-medium">{label}</label>
      <div className="flex items-center gap-2 h-9 rounded-lg bg-slate-700 border border-slate-600
        focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500
        transition-all duration-200 overflow-hidden">
        <input
          type="color"
          value={value.startsWith('#') ? value : '#FFFFFF'}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-full border-none bg-transparent cursor-pointer p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-full bg-transparent text-white text-sm px-2 outline-none"
        />
      </div>
    </div>
  )
}

interface TextInputProps {
  label: string
  value: string
  onChange: (val: string) => void
  placeholder?: string
}

function TextInput({ label, value, onChange, placeholder }: TextInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-slate-400 font-medium">{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 px-3 rounded-lg bg-slate-700 text-white text-sm border border-slate-600
          focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
          transition-all duration-200 placeholder:text-slate-500"
      />
    </div>
  )
}

interface SectionProps {
  title: string
  children: React.ReactNode
}

function Section({ title, children }: SectionProps) {
  return (
    <div className="pb-4 mb-4 border-b border-slate-700 last:border-b-0 last:mb-0 last:pb-0">
      <h3 className="text-sm font-semibold text-white mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  )
}

export default function PropertyPanel() {
  const [collapsed, setCollapsed] = useState(false)
  const { components, selectedId, updateComponent, updateComponentStyle, removeComponent } = useStore()
  const selected = components.find((c) => c.id === selectedId) ?? null

  return (
    <aside
      className={cn(
        'flex flex-col shrink-0 transition-all duration-300 ease-out',
        collapsed ? 'w-[72px]' : 'w-[300px] lg:w-[300px]'
      )}
      style={{
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: collapsed ? 12 : 20,
      }}
    >
      <div className="flex items-center justify-between mb-4 shrink-0">
        {!collapsed && (
          <h2 className="text-white font-semibold text-lg select-none">属性面板</h2>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center justify-center rounded-lg transition-colors',
            'hover:bg-slate-700 text-slate-400 hover:text-white',
            collapsed ? 'w-full h-10' : 'w-8 h-8'
          )}
          title={collapsed ? '展开面板' : '折叠面板'}
        >
          {collapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      {collapsed ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-xs font-medium">
            {selected ? '✓' : '?'}
          </div>
        </div>
      ) : !selected ? (
        <div className="flex-1 flex items-center justify-center px-4 text-center">
          <p style={{ color: '#94A3B8' }} className="text-sm leading-relaxed">
            请在画布中选择一个组件以编辑其属性
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-1 -mr-1">
          <Section title="布局">
            <NumberInput label="X" value={selected.x} onChange={(v) => updateComponent(selected.id, { x: v })} />
            <NumberInput label="Y" value={selected.y} onChange={(v) => updateComponent(selected.id, { y: v })} />
            <NumberInput label="宽度" value={selected.width} onChange={(v) => updateComponent(selected.id, { width: v })} />
            <NumberInput label="高度" value={selected.height} onChange={(v) => updateComponent(selected.id, { height: v })} />
          </Section>

          <Section title="外观">
            <ColorInput label="背景色" value={selected.style.backgroundColor} onChange={(v) => updateComponentStyle(selected.id, { backgroundColor: v })} />
            <ColorInput label="文字色" value={selected.style.color} onChange={(v) => updateComponentStyle(selected.id, { color: v })} />
            <div className="col-span-2">
              <NumberInput label="字号 (px)" value={selected.style.fontSize} onChange={(v) => updateComponentStyle(selected.id, { fontSize: v })} />
            </div>
          </Section>

          <Section title="边框">
            <ColorInput label="颜色" value={selected.style.borderColor} onChange={(v) => updateComponentStyle(selected.id, { borderColor: v })} />
            <NumberInput label="宽度 (px)" value={selected.style.borderWidth} onChange={(v) => updateComponentStyle(selected.id, { borderWidth: v })} />
            <div className="col-span-2">
              <NumberInput label="圆角 (px)" value={selected.style.borderRadius} onChange={(v) => updateComponentStyle(selected.id, { borderRadius: v })} />
            </div>
          </Section>

          <Section title="阴影">
            <div className="col-span-2">
              <TextInput
                label="阴影 CSS"
                value={selected.style.boxShadow}
                placeholder="例如: 0 2px 8px rgba(0,0,0,0.15)"
                onChange={(v) => updateComponentStyle(selected.id, { boxShadow: v })}
              />
            </div>
          </Section>

          <Section title="内容">
            {(selected.type === 'button' || selected.type === 'text') && (
              <div className="col-span-2">
                <TextInput
                  label="文字内容"
                  value={selected.content ?? ''}
                  placeholder="请输入文字内容"
                  onChange={(v) => updateComponent(selected.id, { content: v })}
                />
              </div>
            )}
            {selected.type === 'input' && (
              <div className="col-span-2">
                <TextInput
                  label="占位符"
                  value={selected.placeholder ?? ''}
                  placeholder="请输入占位符文字"
                  onChange={(v) => updateComponent(selected.id, { placeholder: v })}
                />
              </div>
            )}
            {selected.type === 'image' && (
              <div className="col-span-2">
                <TextInput
                  label="图片 URL"
                  value={selected.src ?? ''}
                  placeholder="请输入图片地址"
                  onChange={(v) => updateComponent(selected.id, { src: v })}
                />
              </div>
            )}
            {selected.type === 'container' && (
              <div className="col-span-2">
                <p className="text-xs text-slate-500 leading-relaxed">
                  容器组件可通过布局和样式自定义外观，将组件拖拽到容器内部即可嵌套。
                </p>
              </div>
            )}
          </Section>

          <div className="mt-6 pt-4 border-t border-slate-700">
            <button
              onClick={() => removeComponent(selected.id)}
              className="w-full h-10 flex items-center justify-center gap-2 rounded-lg
                bg-red-600 hover:bg-red-700 active:bg-red-800
                text-white text-sm font-medium transition-colors duration-200"
            >
              <Trash2 className="w-4 h-4" />
              删除组件
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
