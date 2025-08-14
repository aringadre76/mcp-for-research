"""
Context Bridge - FastAPI server for frontend context capture and browser automation

This is the main service that provides rich frontend context to Cursor AI.
"""

import asyncio
import logging
import time
from datetime import datetime
from typing import Dict, Any

import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from models import (
    CaptureRequest, InteractRequest, TestFlowRequest, HealthResponse,
    FrontendContext, InteractionResult
)
from capture import FrontendCapture

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="LocalLook Context Bridge",
    description="Provides rich frontend context and browser automation for Cursor AI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware to allow Cursor extension to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global capture instance
capture_system: FrontendCapture = None
startup_time = time.time()


@app.on_event("startup")
async def startup_event():
    """Initialize the capture system on startup"""
    global capture_system
    
    try:
        logger.info("Starting Context Bridge...")
        capture_system = FrontendCapture()
        await capture_system.initialize()
        logger.info("Context Bridge started successfully!")
        
    except Exception as e:
        logger.error(f"Failed to start Context Bridge: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    global capture_system
    
    if capture_system:
        await capture_system.cleanup()
        logger.info("Context Bridge shutdown complete")


@app.get("/", response_model=Dict[str, Any])
async def root():
    """Root endpoint with service information"""
    return {
        "service": "LocalLook Context Bridge",
        "version": "1.0.0", 
        "description": "Provides rich frontend context and browser automation for Cursor AI",
        "status": "running",
        "uptime_seconds": time.time() - startup_time,
        "endpoints": {
            "capture": "POST /capture - Capture frontend context",
            "interact": "POST /interact - Perform browser interactions",
            "test-flow": "POST /test-flow - Test user flows",
            "health": "GET /health - Health check",
            "docs": "GET /docs - API documentation"
        },
        "features": [
            "Complete DOM structure analysis",
            "Full-page screenshot capture",
            "Interactive element detection",
            "Performance metrics collection",
            "Accessibility auditing",
            "Browser automation (click, type, scroll)",
            "Responsive design testing"
        ]
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    if not capture_system:
        raise HTTPException(status_code=503, detail="Capture system not initialized")
    
    health_data = capture_system.get_health_status()
    
    return HealthResponse(
        status="healthy" if health_data["browser_ready"] else "degraded",
        timestamp=datetime.now(),
        browser_ready=health_data["browser_ready"],
        uptime_seconds=health_data["uptime_seconds"]
    )


@app.post("/capture", response_model=FrontendContext)
async def capture_frontend(request: CaptureRequest):
    """
    Capture complete frontend context for a given URL
    
    This is the main endpoint that Cursor will use to get rich context about
    the running frontend application.
    """
    if not capture_system:
        raise HTTPException(status_code=503, detail="Capture system not initialized")
    
    try:
        logger.info(f"Capturing frontend context for: {request.url}")
        
        # Capture the frontend context
        context = await capture_system.capture_frontend(
            url=request.url,
            options=request.options,
            viewport=request.viewport
        )
        
        logger.info(f"Successfully captured context for {request.url}")
        logger.debug(f"Context includes: {len(context.elements)} elements, {len(context.buttons)} buttons, {len(context.forms)} forms")
        
        return context
        
    except Exception as e:
        logger.error(f"Failed to capture frontend context: {e}")
        raise HTTPException(status_code=500, detail=f"Capture failed: {str(e)}")


@app.post("/interact", response_model=Dict[str, Any])
async def interact_with_frontend(request: InteractRequest):
    """
    Perform browser interactions (click, type, scroll, etc.)
    
    This endpoint allows Cursor AI to test the frontend by performing
    actual user interactions.
    """
    if not capture_system:
        raise HTTPException(status_code=503, detail="Capture system not initialized")
    
    try:
        logger.info(f"Performing {len(request.actions)} interactions on: {request.url}")
        
        # Perform the interactions
        interaction_results = await capture_system.interact_with_page(
            url=request.url,
            actions=request.actions
        )
        
        # Optionally capture updated context after interactions
        updated_context = None
        if request.capture_after:
            updated_context = await capture_system.capture_frontend(
                url=request.url,
                options={
                    "screenshot": True,
                    "dom_analysis": True,
                    "performance": False,  # Skip heavy analysis after interactions
                    "accessibility": False,
                    "responsive": False,
                    "console_logs": True
                }
            )
        
        response = {
            "success": True,
            "interactions_performed": len(interaction_results),
            "results": [result.dict() for result in interaction_results],
            "updated_context": updated_context.dict() if updated_context else None
        }
        
        logger.info(f"Successfully performed interactions on {request.url}")
        return response
        
    except Exception as e:
        logger.error(f"Failed to perform interactions: {e}")
        raise HTTPException(status_code=500, detail=f"Interaction failed: {str(e)}")


@app.post("/test-flow", response_model=Dict[str, Any])
async def test_user_flow(request: TestFlowRequest):
    """
    Test predefined user flows (e.g., checkout, signup, navigation)
    
    This endpoint provides higher-level testing scenarios that Cursor AI
    can use to validate complex user journeys.
    """
    if not capture_system:
        raise HTTPException(status_code=503, detail="Capture system not initialized")
    
    try:
        logger.info(f"Testing user flow '{request.flow_name}' on: {request.url}")
        
        # For now, implement basic flow testing
        # In the future, this could be expanded with predefined flow templates
        
        flow_results = {
            "flow_name": request.flow_name,
            "url": request.url,
            "steps_tested": len(request.steps),
            "results": [],
            "success": True,
            "issues_found": []
        }
        
        # Capture initial state
        initial_context = await capture_system.capture_frontend(
            url=request.url,
            options={
                "screenshot": True,
                "dom_analysis": True,
                "performance": True,
                "accessibility": True,
                "responsive": False,
                "console_logs": True
            }
        )
        
        flow_results["initial_context"] = initial_context.dict()
        
        # Basic flow analysis
        # Check for common flow elements
        if "signup" in request.flow_name.lower():
            # Look for signup-related elements
            signup_indicators = ["email", "password", "sign up", "register", "create account"]
            found_indicators = []
            
            for button in initial_context.buttons:
                if button.text and any(indicator in button.text.lower() for indicator in signup_indicators):
                    found_indicators.append(button.text)
            
            for form in initial_context.forms:
                for input_elem in form.inputs:
                    input_type = input_elem.attributes.get("type", "")
                    if input_type in ["email", "password"]:
                        found_indicators.append(f"{input_type} input")
            
            flow_results["results"].append({
                "step": "signup_elements_check",
                "found_elements": found_indicators,
                "success": len(found_indicators) > 0
            })
        
        elif "checkout" in request.flow_name.lower():
            # Look for checkout-related elements
            checkout_indicators = ["checkout", "cart", "buy", "purchase", "order", "payment"]
            found_indicators = []
            
            for button in initial_context.buttons:
                if button.text and any(indicator in button.text.lower() for indicator in checkout_indicators):
                    found_indicators.append(button.text)
            
            flow_results["results"].append({
                "step": "checkout_elements_check", 
                "found_elements": found_indicators,
                "success": len(found_indicators) > 0
            })
        
        logger.info(f"Successfully tested flow '{request.flow_name}'")
        return flow_results
        
    except Exception as e:
        logger.error(f"Failed to test user flow: {e}")
        raise HTTPException(status_code=500, detail=f"Flow testing failed: {str(e)}")


@app.post("/quick-analyze", response_model=Dict[str, Any])
async def quick_analyze(url: str, focus: str = "general"):
    """
    Quick analysis endpoint for fast feedback
    
    This provides a simplified analysis that's faster than full capture,
    useful for rapid iteration cycles.
    """
    if not capture_system:
        raise HTTPException(status_code=503, detail="Capture system not initialized")
    
    try:
        logger.info(f"Quick analysis of {url} (focus: {focus})")
        
        # Optimized capture for speed
        options = {
            "screenshot": True,
            "dom_analysis": True,
            "performance": focus == "performance",
            "accessibility": focus == "accessibility", 
            "responsive": focus == "responsive",
            "console_logs": True
        }
        
        context = await capture_system.capture_frontend(
            url=url,
            options=options,
            viewport={"width": 1280, "height": 720}
        )
        
        # Generate quick summary
        summary = {
            "url": url,
            "title": context.title,
            "elements_found": len(context.elements),
            "interactive_elements": len(context.interactive),
            "forms": len(context.forms),
            "buttons": len(context.buttons),
            "links": len(context.links),
            "console_errors": len([log for log in context.console_logs if "error" in log.lower()]),
            "has_screenshot": bool(context.screenshot),
            "analysis_focus": focus,
            "timestamp": context.timestamp
        }
        
        if focus == "accessibility" and context.accessibility:
            summary["accessibility_score"] = context.accessibility.get("score", 0)
            summary["accessibility_issues"] = len(context.accessibility.get("issues", []))
        
        if focus == "performance" and context.performance:
            summary["load_time"] = context.performance.load_time
            summary["performance_errors"] = len(context.performance.errors)
        
        response = {
            "summary": summary,
            "full_context": context.dict()
        }
        
        logger.info(f"Quick analysis complete for {url}")
        return response
        
    except Exception as e:
        logger.error(f"Quick analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "error": "Endpoint not found",
            "message": "The requested endpoint does not exist",
            "available_endpoints": [
                "GET /",
                "GET /health", 
                "POST /capture",
                "POST /interact",
                "POST /test-flow",
                "POST /quick-analyze",
                "GET /docs"
            ]
        }
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Internal server error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred",
            "suggestion": "Check the server logs for more details"
        }
    )


if __name__ == "__main__":
    print("🌉 Starting LocalLook Context Bridge")
    print("🎯 Providing rich frontend context for autonomous AI development")
    print("🔗 Ready for Cursor AI integration")
    print()
    
    # Run the server
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8080,
        log_level="info",
        reload=False,  # Disable reload for production-like behavior
        access_log=True
    )
