/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OLLAMA_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

