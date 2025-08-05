#!/bin/bash

echo "🚀 Starting Local AI Bridge - All Services"
echo "=========================================="
echo ""

# Function to check if a process is running
is_running() {
    pgrep -f "$1" > /dev/null
}

# Function to check if a port is in use
port_in_use() {
    lsof -ti:$1 > /dev/null 2>&1
}

# Check if Ollama is available
echo "🤖 Checking Ollama..."
if command -v ollama &> /dev/null; then
    echo "✅ Ollama is available"
    if is_running "ollama"; then
        echo "✅ Ollama service is running"
    else
        echo "⚠️  Ollama service is not running (this is normal)"
    fi
else
    echo "❌ Ollama is not installed"
    echo "   Install with: curl -fsSL https://ollama.ai/install.sh | sh"
    exit 1
fi

# Check if port 8000 is free
echo ""
echo "🔌 Checking port 8000..."
if port_in_use 8000; then
    echo "❌ Port 8000 is already in use"
    echo "   Run './stop-all.sh' first to stop existing services"
    exit 1
else
    echo "✅ Port 8000 is free"
fi

# Create logs directory first
mkdir -p logs

# Start the AI Bridge Server
echo ""
echo "🐍 Starting AI Bridge Server..."
cd ai-bridge
if [ -f "working-server.py" ]; then
    echo "🚀 Starting working server with real AI analysis..."
    nohup python3 working-server.py > ../logs/ai-bridge.log 2>&1 &
    AI_BRIDGE_PID=$!
    echo "✅ AI Bridge Server started (PID: $AI_BRIDGE_PID)"
else
    echo "❌ working-server.py not found"
    exit 1
fi
cd ..

# Wait for server to start
echo ""
echo "⏳ Waiting for server to start..."
sleep 5

# Test if server is responding
echo "🔍 Testing server health..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Server is responding"
else
    echo "❌ Server is not responding"
    echo "   Check logs/ai-bridge.log for errors"
    exit 1
fi

# Skip Cursor Extension - removed for simplicity
echo ""
echo "⚠️  Cursor extension removed for simplified setup"

# Logs directory already created above

# Save PID to file for easy stopping
echo "$AI_BRIDGE_PID" > logs/ai-bridge.pid

echo ""
echo "🎉 All services started successfully!"
echo ""
echo "📊 Service Status:"
echo "=================="
echo "🤖 AI Bridge Server: http://localhost:8000"
echo "📝 Logs: logs/ai-bridge.log"
echo ""
echo "🧪 Test the system:"
echo "   ./bin/ai-bridge test"
echo ""
echo "🛑 Stop services:"
echo "   ./bin/ai-bridge stop"
echo ""
echo "💡 Quick commands:"
echo "   • ./bin/ai-bridge status"
echo "   • ./bin/ai-bridge analyze https://example.com"
echo "   • ./bin/ai-bridge health" 