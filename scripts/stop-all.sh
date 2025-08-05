#!/bin/bash

echo "🛑 Stopping Local AI Bridge - All Services"
echo "=========================================="
echo ""

# Function to check if a process is running
is_running() {
    pgrep -f "$1" > /dev/null
}

# Function to stop processes with a message
stop_process() {
    local pattern="$1"
    local name="$2"
    
    if is_running "$pattern"; then
        echo "🔄 Stopping $name..."
        pkill -f "$pattern"
        sleep 1
        
        # Check if still running and force kill if needed
        if is_running "$pattern"; then
            echo "⚠️  Force stopping $name..."
            pkill -9 -f "$pattern"
            sleep 1
        fi
        
        if is_running "$pattern"; then
            echo "❌ Failed to stop $name"
        else
            echo "✅ Stopped $name"
        fi
    else
        echo "ℹ️  $name is not running"
    fi
}

# Stop all Python servers
echo "🐍 Stopping Python servers..."
stop_process "python3.*working-server.py" "Working AI Bridge Server"
stop_process "python3.*test-server.py" "Test AI Bridge Server"
stop_process "python3.*main.py" "Main AI Bridge Server"
stop_process "uvicorn.*8000" "Uvicorn Server"

# Stop Node.js processes
echo ""
echo "🟢 Stopping Node.js processes..."
stop_process "node.*test.js" "Test Script"

# Stop any remaining processes on port 8000
echo ""
echo "🔌 Checking port 8000..."
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "🔄 Stopping processes on port 8000..."
    lsof -ti:8000 | xargs kill -9
    echo "✅ Port 8000 cleared"
else
    echo "ℹ️  Port 8000 is free"
fi

# Stop any remaining processes on port 8080 (old port)
echo ""
echo "🔌 Checking port 8080..."
if lsof -ti:8080 > /dev/null 2>&1; then
    echo "🔄 Stopping processes on port 8080..."
    lsof -ti:8080 | xargs kill -9
    echo "✅ Port 8080 cleared"
else
    echo "ℹ️  Port 8080 is free"
fi

# Stop Ollama if running (optional)
echo ""
echo "🤖 Checking Ollama..."
if is_running "ollama"; then
    echo "🔄 Stopping Ollama..."
    pkill -f "ollama"
    sleep 2
    if is_running "ollama"; then
        echo "⚠️  Ollama is still running (this is normal for the service)"
    else
        echo "✅ Ollama stopped"
    fi
else
    echo "ℹ️  Ollama is not running"
fi

# Final cleanup
echo ""
echo "🧹 Final cleanup..."
sleep 2

# Check if anything is still running
echo ""
echo "📊 Final Status Check:"
echo "======================"

if is_running "python3.*server"; then
    echo "❌ Python servers still running"
else
    echo "✅ All Python servers stopped"
fi

if is_running "node.*"; then
    echo "❌ Node.js processes still running"
else
    echo "✅ All Node.js processes stopped"
fi

if lsof -ti:8000 > /dev/null 2>&1; then
    echo "❌ Port 8000 still in use"
else
    echo "✅ Port 8000 is free"
fi

if lsof -ti:8080 > /dev/null 2>&1; then
    echo "❌ Port 8080 still in use"
else
    echo "✅ Port 8080 is free"
fi

echo ""
echo "🎉 Stop script completed!"
echo ""
echo "💡 To restart services:"
echo "   • Start: ./bin/ai-bridge start"
echo "   • Test: ./bin/ai-bridge test" 