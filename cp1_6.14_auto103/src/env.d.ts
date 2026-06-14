/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '@tweenjs/tween.js' {
  export * from '@tweenjs/tween.js/dist/tween.esm.js'
}
