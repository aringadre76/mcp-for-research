#!/usr/bin/env python3
"""
Test server for Local AI Bridge (simplified version without browser-use)
"""

import asyncio
import json
import logging
from typing import Dict, Any, Optional
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from config import AIConfig

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Local AI Bridge Test Server")

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
            "message": f"Starting browser capture with {model}..."
        }))
        
        # Simulate processing time
        await asyncio.sleep(2)
        
        await websocket.send_text(json.dumps({
            "type": "status",
            "message": "Analyzing webpage content..."
        }))
        
        await asyncio.sleep(1)
        
        # Generate mock analysis result
        result = await simulate_analysis(url, task, model)
        
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

async def simulate_analysis(url: str, task: str, model: str) -> Dict[str, Any]:
    """Simulate AI analysis for testing purposes"""
    
    # Mock analysis based on task type
    if "accessibility" in task.lower():
        analysis_result = f"""
Accessibility Analysis for {url}:

🔍 Key Findings:
1. Color Contrast Issues: Some text elements may have insufficient contrast ratios
2. Keyboard Navigation: All interactive elements are keyboard accessible
3. Screen Reader Support: Most elements have proper ARIA labels
4. Focus Management: Focus indicators are visible and logical
5. Semantic HTML: Good use of semantic elements like <nav>, <main>, <section>

📋 Recommendations:
- Add alt text to decorative images
- Ensure color contrast meets WCAG AA standards
- Test with screen readers for better compatibility
- Add skip navigation links for better accessibility

✅ Overall Accessibility Score: 85/100
"""
    elif "performance" in task.lower():
        analysis_result = f"""
Performance Analysis for {url}:

⚡ Performance Metrics:
1. Page Load Time: Estimated 2.3 seconds
2. First Contentful Paint: 1.1 seconds
3. Largest Contentful Paint: 2.8 seconds
4. Cumulative Layout Shift: 0.05 (Good)
5. First Input Delay: 45ms (Excellent)

🔧 Optimization Opportunities:
- Optimize image sizes and formats
- Implement lazy loading for below-the-fold content
- Minify CSS and JavaScript files
- Use CDN for static assets
- Enable browser caching

📊 Performance Score: 78/100
"""
    elif "ui" in task.lower() or "bug" in task.lower():
        analysis_result = f"""
UI Analysis for {url}:

🎨 Visual Assessment:
1. Layout Consistency: Good overall structure
2. Responsive Design: Works well on different screen sizes
3. Typography: Clear and readable font choices
4. Color Scheme: Consistent color palette
5. Spacing: Adequate whitespace and padding

🐛 Potential Issues:
- Minor alignment issues in mobile view
- Some buttons could benefit from hover states
- Consider adding loading states for better UX
- Form validation feedback could be more prominent

💡 Improvement Suggestions:
- Add micro-interactions for better user feedback
- Implement skeleton loading states
- Consider dark mode option
- Add smooth transitions between states

✅ UI Quality Score: 82/100
"""
    else:
        analysis_result = f"""
General Analysis for {url}:

📊 Overall Assessment:
This webpage demonstrates good design principles with room for improvement in specific areas.

🎯 Strengths:
- Clean and modern design
- Good user flow and navigation
- Responsive layout
- Fast loading times

🔧 Areas for Improvement:
- Enhanced accessibility features
- Performance optimizations
- Better error handling
- More engaging user interactions

📈 Recommendations:
1. Implement comprehensive accessibility testing
2. Optimize images and assets
3. Add progressive enhancement features
4. Consider A/B testing for key user flows

✅ Overall Score: 80/100
"""
    
    return {
        "url": url,
        "task": task,
        "model": model,
        "result": analysis_result.strip(),
        "timestamp": asyncio.get_event_loop().time()
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "local-ai-bridge-test", "message": "Test server running successfully"}

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
        
        result = await simulate_analysis(request.url, task, request.model)
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

if __name__ == "__main__":
    print("🚀 Starting Local AI Bridge Test Server...")
    print("📡 Server will be available at:")
    print("   - WebSocket: ws://localhost:8000/ws")
    print("   - HTTP API: http://localhost:8000")
    print("   - Health check: http://localhost:8000/health")
    print("   - Models: http://localhost:8000/models")
    print("   - Tasks: http://localhost:8000/tasks")
    print("\n💡 This is a test server with simulated AI analysis")
    print("   Install Ollama and browser-use for full functionality")
    
    uvicorn.run(app, host="127.0.0.1", port=8000) 