/// <reference types="vite/client" />

// For CSS modules
declare module '*.module.css' {
  const classes: { [key: string]: string }
  export default classes
}

// For CSS
declare module '*.css' {
  const content: string
  export default content
}

// For images
declare module '*.png'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.gif'
declare module '*.svg' {
  import * as React from 'react'
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>
  const src: string
  export default src
}

declare module '*.webp'
declare module '*.ico'
declare module '*.bmp'

// Environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test'
    readonly VITE_API_URL: string
  }
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
