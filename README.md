# SymChat - Advanced Ollama Chat UI

> **Privacy Focused:**  
> SymChat is designed with privacy as a core principle. All conversations and data are stored locally on your device—nothing is sent to external servers by default. Our goal is to empower users with full control of their AI experience, discourage unnecessary data collection, and ensure your interactions remain private and secure.

## Features

### Core Features

- 🎨 **Beautiful Modern UI** - Clean and intuitive interface with dark mode support
- 💬 **Real-time Chat** - Stream responses from Ollama models in real-time
- 🧠 **Memory System** - AI remembers your preferences and context across conversations
- 💾 **Local Database** - IndexedDB for fast, local-first data storage (no server needed!)
- 📝 **Conversation History** - Save and manage multiple chat conversations
- 📦 **Model Manager** - Download, view, and manage Ollama models from the UI
- 🤖 **Model Selection** - Choose from available Ollama models
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🌙 **Dark Mode** - Eye-friendly dark theme
- 📤 **Export/Import** - Backup and restore your data anytime

### Advanced Features

- 🔍 **Auto Web Search** - Intelligent web search that activates when needed (DuckDuckGo, SearxNG, Brave)
- 🧠 **Deep Research** - Multi-step web research with comprehensive analysis and synthesis
- 📚 **RAG (Document Manager)** - Upload documents (PDF, DOCX, XLSX, CSV, JSON, TXT, MD, HTML, XML) for AI context
- 👁️ **Vision/Multimodal Support** - Support for vision models (LLaVA, Llama 3.2 Vision, etc.) to analyze images
- 📸 **OCR (Image Text Extraction)** - Extract text from images using Tesseract OCR
- 🎯 **Code Preview** - Live preview for HTML, CSS, and JavaScript code in sandboxed iframe
- 📊 **Generation Settings** - Fine-tune AI parameters (temperature, max_tokens, top_p, top_k, repeat_penalty)
- ⚙️ **Custom System Prompts** - Override default AI behavior with custom instructions
- 📎 **File Attachments** - Support for multiple file types with visual previews
- 🎨 **Syntax Highlighting** - Beautiful code highlighting for 190+ programming languages (Python, Java, C++, Go, Rust, TypeScript, and many more)
- 🎯 **Markdown Support** - GitHub Flavored Markdown with tables, task lists, and strikethrough

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Ollama](https://ollama.ai/) installed and running

## Quick Start

### Option 1: Docker (Recommended) 🐳

The easiest way to run SymChat with Ollama:

**Linux/macOS:**

```bash
chmod +x docker-setup.sh
./docker-setup.sh
```

**Windows:**

```batch
docker-setup.bat
```

**Or manually:**

```bash
docker-compose up -d
```

Then open http://localhost:3000 and download a model via the Model Manager:

- Click **Settings** (⚙️) → **Model Manager**
- Choose a model and click **Download**

📍 **Access at:** http://localhost:3000

### Option 2: Local Development

#### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Ollama

Make sure Ollama is installed and running on your system. Install at least one model:

```bash
ollama pull llama2
# or
ollama pull mistral
# or
ollama pull codellama
```

### 3. Run the Development Server

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:3000`

## Using the Memory Feature

SymChat includes a powerful memory system that helps the AI remember important information across conversations:

### Adding Memories

1. Click the **Settings** icon in the sidebar
2. Select **"Manage Memories"**
3. Type your memory (e.g., "User prefers TypeScript over JavaScript")
4. Choose a category (User Info, Preference, Fact, or Context)
5. Set importance level (High, Medium, Low)
6. Click **"Add"**

### Memory Categories

- **User Info** 👤 - Personal information about you
- **Preference** ⚙️ - Your likes and preferences
- **Fact** 💡 - Important facts to remember
- **Context** 📄 - General context about projects

Memories are automatically included in conversations to provide better context!

📖 **For detailed documentation, see [MEMORY_FEATURE.md](MEMORY_FEATURE.md)**

## Local Database

SymChat uses **IndexedDB** (via Dexie.js) as its local, opensource database:

- ✅ **Fully Local** - All data stored in your browser
- ✅ **No Setup** - Works immediately, no configuration needed
- ✅ **Fast & Efficient** - Optimized for performance
- ✅ **Export/Import** - Backup your data anytime

### Managing Your Data

1. Click **Settings** → **Data Management**
2. View database statistics
3. Export data for backup
4. Import previously exported data
5. Clear all data if needed

📖 **For technical details, see [DATABASE.md](DATABASE.md)**

## Web Search

Search the web and use results as context for AI conversations!

**Features:**

- 🔍 **DuckDuckGo** - Free, no API key needed (default)
- 🔍 **SearxNG** - Opensource, self-hostable metasearch
- 🔍 **Brave Search** - Optional, free tier available
- 🔒 **Privacy-Focused** - No tracking, no ads

**How to Use:**

1. Toggle **"Auto Web Search"** ON (above message input)
2. Send your message normally
3. System analyzes if web search is needed
4. Automatically searches and adds results as context
5. AI responds with current web information!

**Smart Detection:**

- Detects questions about current info ("latest", "today", "2024")
- Extracts search queries automatically
- Only searches when helpful
- Toast notifications show search progress

**Configure:**

- Settings → Search Settings
- Choose provider (DuckDuckGo, SearxNG, Brave)
- No setup needed for DuckDuckGo!

📖 **For detailed guide, see [AUTO_SEARCH_GUIDE.md](AUTO_SEARCH_GUIDE.md)**

## Model Manager

Download and manage Ollama models directly from the UI!

**Features:**

- 📦 **One-Click Downloads** - Popular models with single click
- 🔍 **Search Models** - Find models by name, description, or tags
- 📊 **View Installed** - See all your downloaded models
- 🗑️ **Delete Models** - Free up disk space easily
- 📥 **Custom Downloads** - Pull any model from Ollama library
- 📈 **Progress Tracking** - Real-time download progress bars

**How to Use:**

1. Click **Settings** → **Model Manager**
2. Browse popular models or enter custom name
3. Click **"Download"** on any model
4. Watch progress bar (may take 2-10 minutes)
5. Model appears in chat selector when ready!

**Popular Models:**

- **llama3.2** - Latest from Meta (2GB)
- **mistral** - Fast and efficient (4.1GB)
- **codellama** - Specialized for code (3.8GB)
- **phi3** - Microsoft's compact (2.3GB)
- **gemma** - Google's lightweight (1.7GB)

📖 **[MODEL_MANAGER_QUICKSTART.md](MODEL_MANAGER_QUICKSTART.md)** | **[MODEL_MANAGER_GUIDE.md](MODEL_MANAGER_GUIDE.md)**

## Code Preview

Preview HTML, CSS, and JavaScript code directly in the chat!

**Features:**

- 👁️ **Live Preview** - Instant rendering in sandboxed iframe
- 🎨 **Auto-Detection** - Preview button appears for web code
- 🔒 **Secure** - Isolated sandbox for safe execution
- 📋 **Copy Code** - One-click copy to clipboard
- 🔄 **View Source** - Toggle between preview and generated HTML

**How to Use:**

1. Ask AI to generate HTML/CSS/JS code
2. Preview button appears below code blocks
3. Click **"Preview HTML/CSS/JS"**
4. Live preview opens in dialog
5. Copy code when satisfied!

**Example:**

```
You: "Create a gradient button"
AI: [Generates HTML/CSS]
→ [Preview Button] appears
→ Click to see live button
→ Test hover effects
→ Copy code when ready
```

📖 **[CODE_PREVIEW_QUICKSTART.md](CODE_PREVIEW_QUICKSTART.md)** | **[CODE_PREVIEW_GUIDE.md](CODE_PREVIEW_GUIDE.md)**

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory. You can serve them with any static file server.

## Project Structure

```
sympchat/
├── src/
│   ├── components/       # React components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── ChatMessage.tsx
│   │   ├── ChatInput.tsx
│   │   ├── Sidebar.tsx
│   │   └── ModelSelector.tsx
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and API clients
│   │   ├── ollama.ts    # Ollama API integration
│   │   ├── database.ts  # IndexedDB database service
│   │   └── utils.ts     # Helper functions
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles
├── public/              # Static assets
└── package.json         # Dependencies and scripts
```

## Technologies Used

### Frontend & UI

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **shadcn/ui** - Beautiful, accessible component library
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Unstyled, accessible component primitives

### AI & LLM

- **Ollama** - Local LLM inference
- **IndexedDB** - Local database (via Dexie.js)

### Document Processing

- **PDF.js** - PDF parsing and text extraction
- **Mammoth** - DOCX document parsing
- **ExcelJS** - Excel spreadsheet parsing
- **PapaParse** - CSV parsing

### Image & Vision

- **Tesseract.js** - OCR text extraction from images

### Web Search

- **DuckDuckGo** - Free web search API
- **SearxNG** - Self-hostable metasearch engine
- **Brave Search** - Privacy-focused search API

### Deployment

- **Docker** - Containerization and deployment
- **Nginx** - Production web server

## Deployment

### Docker Deployment (Recommended)

**Quick Commands:**

```bash
# Start services
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down

# Restart services
npm run docker:restart

# Clean up everything
npm run docker:clean
```

**Manual Control:**

```bash
# Build and start
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f frontend
docker-compose logs -f ollama

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

**GPU Support (NVIDIA):**

The docker-compose.yml includes GPU support configuration that is enabled by default. To use GPU acceleration with Ollama:

1. **Prerequisites:**

   - NVIDIA GPU with CUDA support
   - [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html) installed
   - Docker configured to use NVIDIA runtime

2. **Verify GPU is available:**

   ```bash
   docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi
   ```

3. **The GPU configuration is already enabled in docker-compose.yml:**

   ```yaml
   deploy:
     resources:
       reservations:
         devices:
           - driver: nvidia
             count: 1
             capabilities: [gpu]
   ```

4. **To disable GPU** (use CPU only), comment out the deploy section in docker-compose.yml:

   ```yaml
   # Uncomment below for GPU support (NVIDIA)
   # deploy:
   #   resources:
   #     reservations:
   #       devices:
   #         - driver: nvidia
   #           count: 1
   #           capabilities: [gpu]
   ```

5. **Verify GPU is being used:**

   ```bash
   # Check if Ollama detects GPU
   docker exec -it symchat-ollama nvidia-smi

   # Pull a model and it should use GPU
   docker exec -it symchat-ollama ollama pull llama3.2
   ```

**Note:** GPU support significantly speeds up model inference. If you don't have an NVIDIA GPU or encounter errors, disable the GPU configuration and use CPU mode instead.

**Using Local Ollama Instead of Docker:**

If you already have Ollama installed on your host machine and want to use it instead of the containerized version:

1. **Comment out the Ollama service** in docker-compose.yml:

   ```yaml
   services:
     # Ollama Service
     # ollama:
     #   image: ollama/ollama:latest
     #   container_name: symchat-ollama
     #   ... (comment out the entire ollama service)
   ```

2. **Remove the dependency** from the frontend service in docker-compose.yml:

   ```yaml
   frontend:
     build:
       context: .
       dockerfile: Dockerfile
     container_name: symchat-frontend
     restart: unless-stopped
     ports:
       - "3000:5173"
     environment:
       - VITE_OLLAMA_API_URL=http://localhost:11434
     networks:
       - symchat-network
   ```

3. **Make sure Ollama is running** on your host machine:

   ```bash
   ollama serve
   ```

4. **Start only the frontend container:**
   ```bash
   docker-compose up -d frontend
   ```

**Note:** When using local Ollama, the frontend container will connect to `http://localhost:11434` which resolves to your host machine's Ollama installation.

**Download Models:**

**Recommended: Use the Model Manager UI**

1. Open http://localhost:3000
2. Click **Settings** (⚙️) → **Model Manager**
3. Browse and download models with one click
   - Popular: llama3.2, mistral, codellama
   - Vision: llava, llama3.2-vision

**Alternative: CLI (for advanced users)**

```bash
docker exec -it symchat-ollama ollama pull llama3.2
docker exec -it symchat-ollama ollama pull mistral
```

### Traditional Deployment

**Build for production:**

```bash
npm run build
```

**Serve with any static file server:**

```bash
# Using serve
npx serve -s dist -p 3000

# Using nginx
# Copy dist/ contents to /usr/share/nginx/html/
```

**Make sure Ollama is accessible** at the configured API URL.

## Troubleshooting

### Ollama Connection Issues

If you can't connect to Ollama:

1. Make sure Ollama is running: `ollama serve`
2. Check that models are installed: `ollama list`
3. Verify the API URL in `.env` is correct (default: http://localhost:11434)

### CORS Issues

If you encounter CORS issues, you may need to configure Ollama to allow requests from your frontend:

Set the `OLLAMA_ORIGINS` environment variable:

```bash
# On macOS/Linux
export OLLAMA_ORIGINS="http://localhost:3000"

# On Windows
set OLLAMA_ORIGINS=http://localhost:3000
```

## License

MIT License - feel free to use this project however you'd like!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
