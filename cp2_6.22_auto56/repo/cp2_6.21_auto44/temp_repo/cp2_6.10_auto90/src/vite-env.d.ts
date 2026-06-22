/// <reference types="vite/client" />

declare module '*.glsl' {
  const content: string
  export default content
}

declare module '*.hdr' {
  const content: string
  export default content
}

declare module '*.env' {
  const content: string
  export default content
}
