#!/bin/bash

# SymChat Docker Setup Script
# This script helps you quickly set up SymChat with Docker

set -e

echo "🚀 SymChat Docker Setup"
echo "======================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first:"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running. Please start Docker."
    exit 1
fi

echo "✅ Docker daemon is running"
echo ""

# Build and start services
echo "📦 Building and starting services..."
echo ""

docker-compose up -d --build

echo ""
echo "⏳ Waiting for services to be healthy..."
echo ""

# Wait for services to be healthy
MAX_WAIT=60
WAIT_TIME=0

while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    if docker-compose ps | grep -q "healthy"; then
        echo "✅ Services are healthy!"
        break
    fi
    echo "   Still waiting... ($WAIT_TIME/$MAX_WAIT seconds)"
    sleep 5
    WAIT_TIME=$((WAIT_TIME + 5))
done

if [ $WAIT_TIME -ge $MAX_WAIT ]; then
    echo "⚠️  Services took too long to become healthy. Check logs with:"
    echo "   docker-compose logs"
    exit 1
fi

echo ""
echo "✅ SymChat is ready!"
echo ""
echo "📍 Access the application at: http://localhost:3000"
echo "📍 Ollama API available at: http://localhost:11434"
echo ""
echo "🎯 Next steps:"
echo ""
echo "1. Download a model:"
echo "   - Open http://localhost:3000 in your browser"
echo "   - Click Settings (⚙️) in the sidebar"
echo "   - Select 'Model Manager'"
echo "   - Choose a model and click 'Download' (e.g., llama3.2, mistral)"
echo ""
echo "2. View logs:"
echo "   docker-compose logs -f"
echo ""
echo "3. Stop services:"
echo "   docker-compose down"
echo ""
echo "💡 Tip: The Model Manager provides a user-friendly way to download and manage models!"
echo ""

