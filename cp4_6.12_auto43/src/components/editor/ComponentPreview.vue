<script setup lang="ts">
import { ref, watch, defineComponent, onMounted, h } from 'vue'
import { compile } from 'vue/compiler-sfc'
import type { RegisteredComponent } from '@/types'

interface Props {
  component: RegisteredComponent
  propsValues: Record<string, any>
}

const props = defineProps<Props>()

const errorMsg = ref<string>('')
const previewKey = ref<number>(0)
const DynamicComponent = ref<any>(null)

const parseSFC = (source: string): { template: string; script: string } => {
  const templateMatch = source.match(/<template>([\s\S]*?)<\/template>/)
  const scriptMatch = source.match(/<script[^>]*>([\s\S]*?)<\/script>/)
  return {
    template: templateMatch ? templateMatch[1].trim() : '',
    script: scriptMatch ? scriptMatch[1].trim() : ''
  }
}

const compileComponent = () => {
  try {
    errorMsg.value = ''
    const { template, script } = parseSFC(props.component.sourceCode)

    if (!template) {
      errorMsg.value = '组件缺少 template 标签'
      return
    }

    const compiled = compile(`<template>${template}</template>`, {
      filename: `${props.component.name}.vue`
    })

    let scriptSetup: Record<string, any> = {}
    if (script) {
      try {
        const fn = new Function('return (async () => { ' + script + ' })()')
        scriptSetup = fn() || {}
      } catch (e) {
        console.warn('Script 解析警告:', e)
      }
    }

    DynamicComponent.value = defineComponent({
      name: 'DynamicPreview',
      props: Object.keys(props.propsValues).reduce((acc: Record<string, any>, key) => {
        acc[key] = { type: null, default: props.propsValues[key] }
        return acc
      }, {}),
      setup(compProps) {
        return () => {
          try {
            const render = new Function('Vue', 'props', compiled.code.replace(
              'return function render',
              'return function render'
            ))
            return render({ h }, compProps)
          } catch (e) {
            return h('div', { style: { color: 'var(--color-danger)', padding: '16px' } }, `渲染错误: ${(e as Error).message