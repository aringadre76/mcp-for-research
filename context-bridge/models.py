"""
Data models for the Context Bridge API
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, HttpUrl
from datetime import datetime


class DOMElement(BaseModel):
    tag: str
    id: Optional[str] = None
    classes: List[str] = []
    text: Optional[str] = None
    attributes: Dict[str, str] = {}
    children_count: int = 0
    xpath: Optional[str] = None
    selector: Optional[str] = None


class FormElement(BaseModel):
    action: Optional[str] = None
    method: str = "GET"
    inputs: List[DOMElement] = []
    submit_buttons: List[DOMElement] = []
    selector: Optional[str] = None


class InteractiveElement(BaseModel):
    type: str  # button, link, input, etc.
    text: Optional[str] = None
    href: Optional[str] = None
    selector: str
    clickable: bool = False
    focusable: bool = False
    visible: bool = True


class PerformanceMetrics(BaseModel):
    load_time: float
    first_contentful_paint: Optional[float] = None
    largest_contentful_paint: Optional[float] = None
    dom_content_loaded: Optional[float] = None
    errors: List[str] = []
    warnings: List[str] = []


class AccessibilityIssue(BaseModel):
    type: str
    severity: str  # low, medium, high, critical
    description: str
    element_selector: Optional[str] = None
    recommendation: str


class ResponsiveIssue(BaseModel):
    breakpoint: str  # mobile, tablet, desktop
    issue_type: str
    description: str
    element_selector: Optional[str] = None


class InteractionResult(BaseModel):
    action: str
    success: bool
    error: Optional[str] = None
    result_data: Optional[Dict[str, Any]] = None
    timestamp: datetime


class FrontendContext(BaseModel):
    # Meta Information
    timestamp: datetime
    url: str
    title: str
    viewport: Dict[str, int]  # width, height
    
    # Visual Data
    screenshot: Optional[str] = None  # base64 encoded
    
    # DOM Structure
    elements: List[DOMElement] = []
    forms: List[FormElement] = []
    buttons: List[DOMElement] = []
    links: List[DOMElement] = []
    inputs: List[DOMElement] = []
    interactive: List[InteractiveElement] = []
    
    # Testing Results
    interactions: Dict[str, Any] = {}
    
    # Quality Metrics
    performance: Optional[PerformanceMetrics] = None
    accessibility: Dict[str, Any] = {}
    responsive: Dict[str, Any] = {}
    
    # Raw Data (for debugging)
    raw_html: Optional[str] = None
    console_logs: List[str] = []


class CaptureRequest(BaseModel):
    url: str
    options: Dict[str, bool] = {
        "screenshot": True,
        "dom_analysis": True,
        "performance": True,
        "accessibility": True,
        "responsive": False,  # Can be expensive
        "console_logs": True
    }
    viewport: Optional[Dict[str, int]] = {"width": 1280, "height": 720}


class InteractionAction(BaseModel):
    type: str  # click, fill, wait, scroll, navigate
    selector: Optional[str] = None
    value: Optional[str] = None
    coordinates: Optional[Dict[str, int]] = None
    duration: Optional[int] = None  # for wait actions
    url: Optional[str] = None  # for navigate actions


class InteractRequest(BaseModel):
    url: str
    actions: List[InteractionAction]
    capture_after: bool = True


class TestFlowRequest(BaseModel):
    url: str
    flow_name: str
    steps: List[str]
    custom_actions: Optional[Dict[str, List[InteractionAction]]] = None


class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    browser_ready: bool
    version: str = "1.0.0"
    uptime_seconds: float
