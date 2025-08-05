#!/bin/bash

echo "📊 Local AI Bridge - Service Status"
echo "==================================="
echo ""

# Function to check if a process is running
is_running() {
    pgrep -f "$1" > /dev/null
}

# Function to check if a port is in use
port_in_use() {
    lsof -ti:$1 > /dev/null 2>&1
}

# Function to get process info
get_process_info() {
    local pattern="$1"
    local name="$2"
    
    if is_running "$pattern"; then
        local pid=$(pgrep -f "$pattern" | head -1)
        local mem=$(ps -o rss= -p $pid 2>/dev/null | awk '{print $1/1024 " MB"}' 2>/dev/null || echo "N/A")
        echo "✅ $name (PID: $pid, Memory: $mem)"
    else
        echo "❌ $name (not running)"
    fi
}

# Check Ollama
echo "🤖 Ollama Status:"
if command -v ollama &> /dev/null; then
    if is_running "ollama"; then
        echo "✅ Ollama is running"
        echo "📦 Available models:"
        ollama list 2>/dev/null | head -5 || echo "   (checking models...)"
    else
        echo "⚠️  Ollama installed but not running"
    fi
else
    echo "❌ Ollama not installed"
fi

echo ""

# Check Python servers
echo "🐍 Python Servers:"
get_process_info "python3.*working-server.py" "Working AI Bridge Server"
get_process_info "python3.*test-server.py" "Test AI Bridge Server"
get_process_info "python3.*main.py" "Main AI Bridge Server"

echo ""

# Check Node.js processes
echo "🟢 Node.js Processes:"
get_process_info "node.*test.js" "Test Script"

echo ""

# Check ports
echo "🔌 Port Status:"
if port_in_use 8000; then
    pid=$(lsof -ti:8000 | head -1)
    echo "✅ Port 8000 in use (PID: $pid)"
else
    echo "❌ Port 8000 free"
fi

if port_in_use 8080; then
    pid=$(lsof -ti:8080 | head -1)
    echo "✅ Port 8080 in use (PID: $pid)"
else
    echo "❌ Port 8080 free"
fi

echo ""

# Check server health
echo "🏥 Server Health:"
if port_in_use 8000; then
    if curl -s http://localhost:8000/health > /dev/null; then
        echo "✅ Server responding on http://localhost:8000"
        echo "📊 Health response:"
        curl -s http://localhost:8000/health | python3 -m json.tool 2>/dev/null || echo "   (checking health...)"
    else
        echo "❌ Server not responding on http://localhost:8000"
    fi
else
    echo "❌ No server running on port 8000"
fi

echo ""

# Check logs
echo "📝 Log Files:"
if [ -f "logs/ai-bridge.log" ]; then
    size=$(du -h logs/ai-bridge.log | cut -f1)
    echo "✅ AI Bridge log: logs/ai-bridge.log ($size)"
else
    echo "❌ AI Bridge log: not found"
fi

# Cursor extension removed for simplicity

echo ""

# Quick actions
echo "🚀 Quick Actions:"
echo "   • Start: ./bin/ai-bridge start"
echo "   • Stop: ./bin/ai-bridge stop"
echo "   • Test: ./bin/ai-bridge test"
echo "   • Analyze: ./bin/ai-bridge analyze <url>"
echo "   • View logs: tail -f logs/ai-bridge.log" 