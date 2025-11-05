#!/bin/bash

# SymChat Setup Script
# This script helps you quickly set up SymChat for development

set -e

echo "🚀 SymChat Setup Script"
echo "======================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm $(npm -v) detected"
echo ""

# Check if Ollama is installed
echo "Checking for Ollama..."
if ! command -v ollama &> /dev/null; then
    echo "⚠️  Ollama is not installed."
    echo "   Please install Ollama from: https://ollama.ai/"
    echo "   Then install a model: ollama pull llama2"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ Ollama detected"
    
    # Check if any models are installed
    MODELS=$(ollama list 2>/dev/null | tail -n +2 | wc -l)
    if [ "$MODELS" -eq 0 ]; then
        echo "⚠️  No Ollama models found."
        echo "   Install a model with: ollama pull llama2"
        echo ""
        read -p "Would you like to install llama2 now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "Installing llama2..."
            ollama pull llama2
        fi
    else
        echo "✅ Found $MODELS Ollama model(s)"
    fi
fi

echo ""
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ Created .env file (you can edit it later)"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. (Optional) Edit .env file to configure Supabase"
echo "2. Make sure Ollama is running"
echo "3. Start the dev server:"
echo "   npm run dev"
echo ""
echo "The app will be available at: http://localhost:3000"
echo ""
echo "For more information, see README.md"
echo ""

