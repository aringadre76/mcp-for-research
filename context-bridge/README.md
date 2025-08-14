# 🌉 Context Bridge

**Provides rich frontend context and browser automation for Cursor AI autonomous development.**

---

## 🎯 What It Does

The Context Bridge is a lightweight Python service that gives Cursor AI "eyes and hands" to:

- **SEE** your running frontend (DOM structure, screenshots, interactions)
- **TEST** your application (click buttons, fill forms, navigate)
- **ANALYZE** the results (performance, accessibility, responsive design)

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Chrome/Chromium browser

### Installation
```bash
cd context-bridge
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium
```

### Start the Service
```bash
python main.py
```

The service will start on `http://127.0.0.1:8080`

---

## 📡 API Endpoints

### `POST /capture` - Capture Frontend Context
Get complete context about a running frontend application.

```python
{
  "url": "http://localhost:3000",
  "options": {
    "screenshot": true,
    "dom_analysis": true,
    "performance": true,
    "accessibility": true,
    "responsive": false
  },
  "viewport": {"width": 1280, "height": 720}
}
```

**Returns**: Complete `FrontendContext` object with:
- Screenshots (base64)
- DOM structure (elements, forms, buttons, links)
- Interactive elements
- Performance metrics
- Accessibility analysis
- Console logs

### `POST /interact` - Browser Automation
Perform interactions with the frontend.

```python
{
  "url": "http://localhost:3000",
  "actions": [
    {"type": "click", "selector": "button.submit"},
    {"type": "fill", "selector": "input[name='email']", "value": "test@example.com"},
    {"type": "wait", "duration": 2000}
  ],
  "capture_after": true
}
```

**Returns**: Interaction results + updated context

### `POST /test-flow` - User Flow Testing
Test complete user journeys.

```python
{
  "url": "http://localhost:3000",
  "flow_name": "signup_flow",
  "steps": ["find_signup_form", "test_validation", "submit_form"]
}
```

### `POST /quick-analyze` - Fast Analysis
Quick analysis optimized for speed.

```python
# Simple POST with URL param
url=http://localhost:3000&focus=accessibility
```

### `GET /health` - Health Check
Check if the service is running properly.

---

## 🧪 Testing the Service

### Test with curl
```bash
# Health check
curl http://127.0.0.1:8080/health

# Quick analysis
curl -X POST "http://127.0.0.1:8080/quick-analyze?url=https://example.com"

# Full capture
curl -X POST http://127.0.0.1:8080/capture \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "options": {"screenshot": true, "dom_analysis": true}}'
```

### Test with Python
```python
import requests

# Capture frontend context
response = requests.post("http://127.0.0.1:8080/capture", json={
    "url": "http://localhost:3000",
    "options": {
        "screenshot": True,
        "dom_analysis": True,
        "performance": True
    }
})

context = response.json()
print(f"Found {len(context['elements'])} elements")
print(f"Found {len(context['buttons'])} buttons")
print(f"Screenshot captured: {bool(context['screenshot'])}")
```

---

## 📊 Response Format

### FrontendContext Object
```typescript
{
  // Meta
  "timestamp": "2024-01-01T12:00:00",
  "url": "http://localhost:3000",
  "title": "My App",
  "viewport": {"width": 1280, "height": 720},
  
  // Visual
  "screenshot": "base64_encoded_image_data",
  
  // Structure
  "elements": [...],     // DOM elements
  "forms": [...],        // Form elements
  "buttons": [...],      // Button elements
  "links": [...],        // Link elements
  "inputs": [...],       // Input elements
  "interactive": [...],  // Interactive elements
  
  // Testing Results
  "interactions": {
    "clickable_count": 15,
    "focusable_count": 8,
    "form_count": 2,
    "can_scroll": true
  },
  
  // Quality Metrics
  "performance": {
    "load_time": 1.2,
    "errors": [],
    "warnings": []
  },
  
  "accessibility": {
    "score": 85,
    "issues": [...]
  },
  
  "console_logs": [...]
}
```

---

## 🔧 Configuration

### Environment Variables
```bash
# Optional: Custom port
export CONTEXT_BRIDGE_PORT=8080

# Optional: Log level
export LOG_LEVEL=INFO

# Optional: Browser executable path
export CHROME_EXECUTABLE_PATH=/usr/bin/chromium
```

### Performance Tuning
For faster responses, disable expensive analysis:
```python
{
  "options": {
    "screenshot": true,      # Fast
    "dom_analysis": true,    # Fast
    "performance": false,    # Medium
    "accessibility": false,  # Medium
    "responsive": false      # Slow
  }
}
```

---

## 🐛 Troubleshooting

### Browser Issues
```bash
# Install browsers
playwright install chromium

# Check browser installation
playwright doctor

# Kill existing browser processes
pkill -f chromium
```

### Permission Issues
```bash
# Fix permissions for WSL
export DISPLAY=:0
```

### Service Not Starting
```bash
# Check port availability
lsof -i :8080

# Check Python version
python --version  # Should be 3.11+

# Check dependencies
pip list | grep fastapi
pip list | grep playwright
```

### Performance Issues
- Use `headless=True` (default) for better performance
- Limit DOM analysis with smaller element counts
- Disable heavy analysis options for faster responses
- Consider viewport size impact on screenshot generation

---

## 🔮 Integration with Cursor

The Context Bridge is designed to work seamlessly with the Cursor extension:

1. **Cursor Extension** makes HTTP requests to Context Bridge
2. **Context Bridge** captures rich frontend context
3. **Context** is streamed to Cursor AI
4. **Cursor AI** makes autonomous decisions based on context

---

## 📋 API Documentation

Full interactive API documentation available at:
- **Swagger UI**: http://127.0.0.1:8080/docs
- **ReDoc**: http://127.0.0.1:8080/redoc

---

**This Context Bridge enables Cursor AI to see, test, and understand your frontend applications for truly autonomous development.**
