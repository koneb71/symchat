// Check if a model supports vision/images
export function isVisionModel(modelName: string): boolean {
  const visionKeywords = [
    'vision',
    'llava',
    'bakllava',
    'moondream',
    'cogvlm',
    'qwen-vl',
    'qwen2-vl',
    'qwen3-vl',
    'minicpm-v',
    'internvl',
    'phi-3-vision',
    'llama3.2-vision',
    'llama3-vision',
  ]
  
  const lowerName = modelName.toLowerCase()
  return visionKeywords.some(keyword => lowerName.includes(keyword))
}

// Convert image file to base64
export async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64Data = base64.split(',')[1]
      resolve(base64Data)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Get list of popular vision models
export const VISION_MODELS = [
  {
    name: 'llama3.2-vision',
    description: 'Meta\'s Llama 3.2 with vision capabilities',
    size: '7.9GB',
  },
  {
    name: 'llava',
    description: 'LLaVA - Visual instruction tuning',
    size: '4.7GB',
  },
  {
    name: 'bakllava',
    description: 'BakLLaVA - Improved vision model',
    size: '4.7GB',
  },
  {
    name: 'llava-phi3',
    description: 'LLaVA with Phi-3 - Compact vision',
    size: '2.9GB',
  },
  {
    name: 'moondream',
    description: 'Moondream - Fast vision model',
    size: '1.7GB',
  },
]

