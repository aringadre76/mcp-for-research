#!/usr/bin/env python3
"""
Working Local AI Bridge Server with Ollama integration
"""

import asyncio
import json
import logging
import subprocess
import tempfile
import os
from typing import Dict, Any, Optional
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from config import AIConfig

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Local AI Bridge Working Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CaptureRequest(BaseModel):
    url: str
    task: Optional[str] = None
    model: str = AIConfig.SERVER_CONFIG['default_model']
    task_type: Optional[str] = None

class CaptureResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "capture":
                await handle_capture_request(websocket, message)
            elif message.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)

async def handle_capture_request(websocket: WebSocket, message: Dict[str, Any]):
    try:
        url = message.get("url")
        task_type = message.get("task_type")
        custom_task = message.get("task")
        model = message.get("model", AIConfig.SERVER_CONFIG['default_model'])
        
        # Use predefined task if task_type is provided
        if task_type and AIConfig.validate_task(task_type):
            task = AIConfig.get_task_prompt(task_type)
            if not AIConfig.validate_model(model):
                model = AIConfig.get_recommended_model_for_task(task_type)
        else:
            task = custom_task or "Analyze this webpage and provide insights about the UI and any potential issues"
        
        await websocket.send_text(json.dumps({
            "type": "status",
            "message": f"Starting AI analysis with {model}..."
        }))
        
        # Generate analysis using Ollama
        result = await analyze_with_ollama(url, task, model)
        
        await websocket.send_text(json.dumps({
            "type": "capture_result",
            "data": result
        }))
        
    except Exception as e:
        logger.error(f"Error handling capture request: {e}")
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": str(e)
        }))

async def analyze_with_ollama(url: str, task: str, model: str) -> Dict[str, Any]:
    """Analyze using Ollama with real AI model"""
    
    # Create a comprehensive prompt for the AI
    prompt = f"""
You are an expert web developer and UI/UX analyst. Please analyze the following webpage and provide detailed insights.

URL: {url}
Task: {task}

Please provide a comprehensive analysis including:
1. Visual assessment and layout analysis
2. User experience evaluation
3. Potential issues and improvements
4. Specific recommendations
5. Overall score out of 100

Format your response with clear sections, emojis for visual appeal, and actionable recommendations.
"""
    
    try:
        # Run Ollama command
        result = subprocess.run(
            ["ollama", "run", model, prompt],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode == 0:
            analysis_result = result.stdout.strip()
        else:
            analysis_result = f"Analysis completed with some issues. Error: {result.stderr}"
        
        return {
            "url": url,
            "task": task,
            "model": model,
            "result": analysis_result,
            "timestamp": asyncio.get_event_loop().time()
        }
        
    except subprocess.TimeoutExpired:
        return {
            "url": url,
            "task": task,
            "model": model,
            "result": "Analysis timed out. The model took too long to respond.",
            "timestamp": asyncio.get_event_loop().time()
        }
    except Exception as e:
        logger.error(f"Error in Ollama analysis: {e}")
        return {
            "url": url,
            "task": task,
            "model": model,
            "result": f"Analysis failed: {str(e)}",
            "timestamp": asyncio.get_event_loop().time()
        }

@app.get("/health")
async def health_check():
    # Check if Ollama is available
    try:
        result = subprocess.run(["ollama", "--version"], capture_output=True, text=True)
        ollama_status = "available" if result.returncode == 0 else "not available"
    except:
        ollama_status = "not available"
    
    return {
        "status": "healthy", 
        "service": "local-ai-bridge-working", 
        "message": "Working server with Ollama integration",
        "ollama": ollama_status
    }

@app.post("/capture")
async def capture_endpoint(request: CaptureRequest):
    try:
        # Use predefined task if task_type is provided
        if request.task_type and AIConfig.validate_task(request.task_type):
            task = AIConfig.get_task_prompt(request.task_type)
            if not AIConfig.validate_model(request.model):
                request.model = AIConfig.get_recommended_model_for_task(request.task_type)
        else:
            task = request.task or "Analyze this webpage and provide insights about the UI and any potential issues"
        
        result = await analyze_with_ollama(request.url, task, request.model)
        return CaptureResponse(success=True, data=result)
    except Exception as e:
        return CaptureResponse(success=False, error=str(e))

@app.get("/models")
async def list_models():
    """List all available models"""
    return {
        "models": AIConfig.MODELS,
        "default_model": AIConfig.SERVER_CONFIG['default_model']
    }

@app.get("/tasks")
async def list_tasks():
    """List all available predefined tasks"""
    return {
        "tasks": AIConfig.TASKS
    }

@app.get("/config")
async def get_config():
    """Get server configuration"""
    return {
        "server": AIConfig.SERVER_CONFIG,
        "browser": AIConfig.BROWSER_CONFIG
    }

@app.get("/ollama-models")
async def list_ollama_models():
    """List available Ollama models"""
    try:
        result = subprocess.run(["ollama", "list"], capture_output=True, text=True)
        if result.returncode == 0:
            return {"models": result.stdout.strip()}
        else:
            return {"error": "Failed to list Ollama models"}
    except Exception as e:
        return {"error": f"Error listing models: {str(e)}"}

if __name__ == "__main__":
    print("🚀 Starting Local AI Bridge Working Server...")
    print("📡 Server will be available at:")
    print("   - WebSocket: ws://localhost:8000/ws")
    print("   - HTTP API: http://localhost:8000")
    print("   - Health check: http://localhost:8000/health")
    print("   - Models: http://localhost:8000/models")
    print("   - Tasks: http://localhost:8000/tasks")
    print("   - Ollama Models: http://localhost:8000/ollama-models")
    print("\n🤖 This server uses real Ollama models for AI analysis!")
    print("   Make sure you have models installed: ollama pull llama3.2:3b")
    
    uvicorn.run(app, host="127.0.0.1", port=8000) 