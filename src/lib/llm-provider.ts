// Unified LLM Provider Interface
// Supports both Ollama and llama.cpp backends

import type { ChatMessage } from "./ollama";

export type LLMProvider = "ollama" | "llamacpp";

export interface LLMConfig {
  provider: LLMProvider;
  ollamaUrl: string;
  llamacppUrl: string;
}

export interface LLMModel {
  name: string;
  modified_at?: string;
  size?: number;
  details?: any;
  provider?: LLMProvider; // Track which backend this model comes from
}

export interface LLMChatRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  images?: string[];
  signal?: AbortSignal;
  options?: {
    temperature?: number;
    num_predict?: number; // max tokens
    top_p?: number;
    top_k?: number;
    repeat_penalty?: number;
  };
}

// Get current provider config from localStorage
export function getLLMConfig(): LLMConfig {
  const provider =
    (localStorage.getItem("llm_provider") as LLMProvider) || "ollama";
  const ollamaUrl =
    localStorage.getItem("ollama_url") ||
    import.meta.env.VITE_OLLAMA_API_URL ||
    "http://localhost:11434";
  const llamacppUrl =
    localStorage.getItem("llamacpp_url") || "http://localhost:8080";

  return { provider, ollamaUrl, llamacppUrl };
}

// Save LLM config to localStorage
export function saveLLMConfig(config: Partial<LLMConfig>): void {
  if (config.provider) {
    localStorage.setItem("llm_provider", config.provider);
  }
  if (config.ollamaUrl) {
    localStorage.setItem("ollama_url", config.ollamaUrl);
  }
  if (config.llamacppUrl) {
    localStorage.setItem("llamacpp_url", config.llamacppUrl);
  }
}

// Get the current API base URL based on provider
export function getApiUrl(): string {
  const config = getLLMConfig();
  return config.provider === "ollama" ? config.ollamaUrl : config.llamacppUrl;
}

// List models from a specific provider
async function listModelsFromProvider(
  provider: LLMProvider,
  url: string
): Promise<LLMModel[]> {
  try {
    if (provider === "ollama") {
      const response = await fetch(`${url}/api/tags`, {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      if (!response.ok) throw new Error("Ollama not available");
      const data = await response.json();
      return (data.models || []).map((model: any) => ({
        ...model,
        provider: "ollama" as LLMProvider,
      }));
    } else {
      // llama.cpp - get currently loaded model
      const response = await fetch(`${url}/v1/models`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new Error("llama.cpp not available");
      const data = await response.json();

      // llama.cpp returns OpenAI-compatible format
      if (data.data && Array.isArray(data.data)) {
        return data.data.map((model: any) => {
          // Extract clean name from path like:
          // "/root/.cache/llama.cpp/ggml-org_gemma-3-1b-it-GGUF_gemma-3-1b-it-Q4_K_M.gguf"
          // -> "gemma-3-1b-it-Q4_K_M"
          let cleanName = model.id;

          // Get just the filename
          if (cleanName.includes("/")) {
            cleanName = cleanName.split("/").pop() || cleanName;
          }

          // Remove .gguf extension
          cleanName = cleanName.replace(".gguf", "");

          // If it has the pattern "repo_model_actual-name", extract the actual name
          const parts = cleanName.split("_");
          if (parts.length >= 3) {
            // Take everything after the second underscore
            cleanName = parts.slice(2).join("_");
          }

          return {
            name: cleanName,
            size: 0,
            modified_at: new Date().toISOString(),
            provider: "llamacpp" as LLMProvider,
            details: {
              active: true, // This is the currently loaded model
              fullPath: model.id, // Keep original for reference
            },
          };
        });
      }

      return [];
    }
  } catch (error) {
    // Provider not available, return empty array
    return [];
  }
}

// List models from ALL available providers
export async function listLLMModels(): Promise<LLMModel[]> {
  const config = getLLMConfig();
  const llamacppEnabled =
    typeof window !== "undefined" && window.localStorage
      ? localStorage.getItem("llamacpp_enabled") === "true"
      : false;

  // Get Ollama models (always enabled)
  const ollamaModels = await listModelsFromProvider("ollama", config.ollamaUrl);

  // Get llama.cpp models only if enabled
  const llamacppModels = llamacppEnabled
    ? await listModelsFromProvider("llamacpp", config.llamacppUrl)
    : [];

  // Combine models from both providers
  const allModels = [...ollamaModels, ...llamacppModels];

  // If no models found at all, show error
  if (allModels.length === 0) {
    console.warn("No models available from any provider");
  } else {
    console.log(
      `Found ${ollamaModels.length} Ollama models${
        llamacppEnabled ? ` and ${llamacppModels.length} llama.cpp models` : ""
      }`
    );
  }

  return allModels;
}

// Stream chat responses - auto-detect provider from model name or use configured default
export async function* llmChatStream(
  request: LLMChatRequest,
  modelProvider?: LLMProvider
): AsyncGenerator<string> {
  const config = getLLMConfig();

  // Use explicitly provided provider, or fall back to config
  const provider = modelProvider || config.provider;

  if (provider === "ollama") {
    yield* ollamaChatStream(request, config.ollamaUrl);
  } else {
    yield* llamacppChatStream(request, config.llamacppUrl);
  }
}

// Ollama chat stream
async function* ollamaChatStream(
  request: LLMChatRequest,
  baseUrl: string
): AsyncGenerator<string> {
  const { signal, options, ...requestBody } = request;

  const body: any = {
    ...requestBody,
    stream: true,
  };

  if (options) {
    body.options = options;
  }

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No reader available");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim()) {
          try {
            const json = JSON.parse(line);
            if (json.message?.content) {
              yield json.message.content;
            }
          } catch (e) {
            console.error("Failed to parse JSON:", e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// llama.cpp chat stream (OpenAI-compatible API)
async function* llamacppChatStream(
  request: LLMChatRequest,
  baseUrl: string
): AsyncGenerator<string> {
  const { signal, options } = request;

  // Convert to OpenAI format
  const body: any = {
    model: request.model || "default",
    messages: request.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    stream: true,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.num_predict ?? 2048,
    top_p: options?.top_p ?? 0.9,
  };

  // llama.cpp supports top_k and repeat_penalty in different params
  if (options?.top_k !== undefined) {
    body.top_k = options.top_k;
  }
  if (options?.repeat_penalty !== undefined) {
    body.repeat_penalty = options.repeat_penalty;
  }

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No reader available");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data: ")) {
          const data = trimmed.slice(6); // Remove 'data: ' prefix

          if (data === "[DONE]") {
            break;
          }

          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            // Ignore parse errors for SSE format
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// Non-streaming chat (for convenience)
export async function llmChat(request: LLMChatRequest): Promise<string> {
  let fullResponse = "";
  for await (const chunk of llmChatStream(request)) {
    fullResponse += chunk;
  }
  return fullResponse;
}
