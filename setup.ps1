# SymChat Setup Script for Windows
# This script helps you quickly set up SymChat for development

Write-Host "🚀 SymChat Setup Script" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    
    if ($versionNumber -lt 18) {
        Write-Host "❌ Node.js version must be 18 or higher. Current version: $nodeVersion" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js v18 or higher." -ForegroundColor Red
    Write-Host "   Visit: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm $npmVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if Ollama is installed
Write-Host "Checking for Ollama..."
try {
    $ollamaVersion = ollama --version 2>$null
    Write-Host "✅ Ollama detected" -ForegroundColor Green
    
    # Check if any models are installed
    $models = ollama list 2>$null | Select-Object -Skip 1
    if ($models.Count -eq 0) {
        Write-Host "⚠️  No Ollama models found." -ForegroundColor Yellow
        Write-Host "   Install a model with: ollama pull llama2" -ForegroundColor Yellow
        Write-Host ""
        
        $response = Read-Host "Would you like to install llama2 now? (y/n)"
        if ($response -eq 'y' -or $response -eq 'Y') {
            Write-Host "Installing llama2..."
            ollama pull llama2
        }
    } else {
        Write-Host "✅ Found Ollama models" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Ollama is not installed." -ForegroundColor Yellow
    Write-Host "   Please install Ollama from: https://ollama.ai/" -ForegroundColor Yellow
    Write-Host "   Then install a model: ollama pull llama2" -ForegroundColor Yellow
    Write-Host ""
    
    $response = Read-Host "Continue anyway? (y/n)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        exit 1
    }
}

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install

# Create .env file if it doesn't exist
if (-not (Test-Path .env)) {
    Write-Host ""
    Write-Host "📝 Creating .env file..." -ForegroundColor Cyan
    Copy-Item .env.example .env
    Write-Host "✅ Created .env file (you can edit it later)" -ForegroundColor Green
}

Write-Host ""
Write-Host "✨ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. (Optional) Edit .env file to configure Supabase"
Write-Host "2. Make sure Ollama is running"
Write-Host "3. Start the dev server:"
Write-Host "   npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "The app will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "For more information, see README.md"
Write-Host ""

