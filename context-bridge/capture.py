"""
Browser capture and analysis functionality using Playwright
"""

import asyncio
import base64
import json
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from urllib.parse import urljoin, urlparse
import time

from playwright.async_api import async_playwright, Browser, Page, BrowserContext
from bs4 import BeautifulSoup
from PIL import Image
import io

from models import (
    FrontendContext, DOMElement, FormElement, InteractiveElement,
    PerformanceMetrics, AccessibilityIssue, InteractionResult,
    InteractionAction
)

logger = logging.getLogger(__name__)


class FrontendCapture:
    """Main class for capturing and analyzing frontend applications"""
    
    def __init__(self):
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.startup_time = time.time()
    
    async def initialize(self):
        """Initialize Playwright and browser"""
        try:
            self.playwright = await async_playwright().start()
            
            # Launch browser with optimal settings for automation
            self.browser = await self.playwright.chromium.launch(
                headless=True,  # Run headless for performance
                args=[
                    "--no-sandbox",
                    "--disable-dev-shm-usage", 
                    "--disable-blink-features=AutomationControlled",
                    "--disable-web-security",  # For localhost testing
                    "--allow-running-insecure-content",
                    "--disable-features=TranslateUI",
                    "--disable-ipc-flooding-protection"
                ]
            )
            
            # Create persistent context for consistent sessions
            self.context = await self.browser.new_context(
                viewport={"width": 1280, "height": 720},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            
            logger.info("Frontend capture system initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize capture system: {e}")
            raise
    
    async def cleanup(self):
        """Cleanup resources"""
        try:
            if self.context:
                await self.context.close()
            if self.browser:
                await self.browser.close()
            if self.playwright:
                await self.playwright.stop()
            logger.info("Capture system cleaned up")
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
    
    async def capture_frontend(
        self, 
        url: str, 
        options: Dict[str, bool] = None,
        viewport: Dict[str, int] = None
    ) -> FrontendContext:
        """Capture complete frontend context"""
        
        if options is None:
            options = {
                "screenshot": True,
                "dom_analysis": True,
                "performance": True,
                "accessibility": True,
                "responsive": False,
                "console_logs": True
            }
        
        # Note: viewport will be set per page, not per context
        
        page = await self.context.new_page()
        
        # Set viewport size if specified
        if viewport:
            await page.set_viewport_size(viewport)
        
        try:
            # Setup console logging
            console_logs = []
            page.on("console", lambda msg: console_logs.append(f"{msg.type}: {msg.text}"))
            
            # Navigate and wait for page to load
            start_time = time.time()
            await page.goto(url, wait_until="networkidle", timeout=30000)
            load_time = time.time() - start_time
            
            # Get basic page info
            title = await page.title()
            current_url = page.url
            viewport_size = page.viewport_size
            
            # Initialize context object
            context = FrontendContext(
                timestamp=datetime.now(),
                url=current_url,
                title=title,
                viewport={"width": viewport_size["width"], "height": viewport_size["height"]},
                console_logs=console_logs
            )
            
            # Capture screenshot
            if options.get("screenshot", True):
                context.screenshot = await self._capture_screenshot(page)
            
            # Analyze DOM structure
            if options.get("dom_analysis", True):
                await self._analyze_dom(page, context)
            
            # Performance metrics
            if options.get("performance", True):
                context.performance = await self._analyze_performance(page, load_time)
            
            # Accessibility analysis
            if options.get("accessibility", True):
                context.accessibility = await self._analyze_accessibility(page)
            
            # Responsive testing
            if options.get("responsive", False):
                context.responsive = await self._test_responsive(page)
            
            # Interactive elements testing
            await self._analyze_interactions(page, context)
            
            logger.info(f"Successfully captured context for {url}")
            return context
            
        except Exception as e:
            logger.error(f"Error capturing frontend context: {e}")
            raise
        finally:
            await page.close()
    
    async def _capture_screenshot(self, page: Page) -> str:
        """Capture full page screenshot"""
        try:
            screenshot = await page.screenshot(
                full_page=True,
                type="png"
            )
            return base64.b64encode(screenshot).decode('utf-8')
        except Exception as e:
            logger.error(f"Screenshot capture failed: {e}")
            return ""
    
    async def _analyze_dom(self, page: Page, context: FrontendContext):
        """Analyze DOM structure and extract elements"""
        try:
            # Get HTML content
            html_content = await page.content()
            context.raw_html = html_content
            
            # Parse with BeautifulSoup
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Extract different types of elements
            context.elements = await self._extract_dom_elements(page, soup)
            context.forms = await self._extract_forms(page, soup)
            context.buttons = await self._extract_buttons(page, soup)
            context.links = await self._extract_links(page, soup)
            context.inputs = await self._extract_inputs(page, soup)
            context.interactive = await self._extract_interactive_elements(page)
            
        except Exception as e:
            logger.error(f"DOM analysis failed: {e}")
    
    async def _extract_dom_elements(self, page: Page, soup: BeautifulSoup) -> List[DOMElement]:
        """Extract basic DOM elements"""
        elements = []
        
        try:
            # Capture comprehensive DOM structure
            important_tags = [
                # Semantic structure
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span', 'section', 'article', 'nav', 'header', 'footer', 'main', 'aside',
                # Interactive elements  
                'button', 'input', 'textarea', 'select', 'option', 'label', 'form', 'a', 'img', 'video', 'audio', 'canvas', 'svg',
                # Lists and tables
                'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
                # Content elements
                'blockquote', 'pre', 'code', 'strong', 'em', 'small', 'mark', 'del', 'ins', 'sub', 'sup'
            ]
            
            for tag_name in important_tags:
                for element in soup.find_all(tag_name):
                    try:
                        elem = DOMElement(
                            tag=tag_name,
                            id=element.get('id'),
                            classes=element.get('class', []),
                            text=element.get_text(strip=True)[:200] if element.get_text(strip=True) else None,
                            attributes={k: str(v) for k, v in element.attrs.items() if k not in ['class']},
                            children_count=len(element.find_all()),
                        )
                        
                        # Generate CSS selector if possible
                        if elem.id:
                            elem.selector = f"#{elem.id}"
                        elif elem.classes:
                            elem.selector = f"{tag_name}.{'.'.join(elem.classes)}"
                        
                        elements.append(elem)
                        
                        if len(elements) >= 100:  # Increased limit for richer analysis
                            break
                    except Exception as e:
                        logger.debug(f"Error processing element {tag_name}: {e}")
                        continue
        
        except Exception as e:
            logger.error(f"Error extracting DOM elements: {e}")
        
        return elements[:100]  # Return max 100 elements for richer analysis
    
    async def _extract_forms(self, page: Page, soup: BeautifulSoup) -> List[FormElement]:
        """Extract form elements"""
        forms = []
        
        try:
            for form in soup.find_all('form'):
                inputs = []
                submit_buttons = []
                
                # Find inputs in this form
                for input_elem in form.find_all(['input', 'textarea', 'select']):
                    inputs.append(DOMElement(
                        tag=input_elem.name,
                        id=input_elem.get('id'),
                        attributes={k: str(v) for k, v in input_elem.attrs.items()},
                        selector=f"#{input_elem.get('id')}" if input_elem.get('id') else None
                    ))
                
                # Find submit buttons
                for button in form.find_all(['button', 'input']):
                    if button.get('type') in ['submit', 'button'] or button.name == 'button':
                        submit_buttons.append(DOMElement(
                            tag=button.name,
                            text=button.get_text(strip=True) or button.get('value'),
                            attributes={k: str(v) for k, v in button.attrs.items()}
                        ))
                
                forms.append(FormElement(
                    action=form.get('action'),
                    method=form.get('method', 'GET').upper(),
                    inputs=inputs,
                    submit_buttons=submit_buttons
                ))
        
        except Exception as e:
            logger.error(f"Error extracting forms: {e}")
        
        return forms
    
    async def _extract_buttons(self, page: Page, soup: BeautifulSoup) -> List[DOMElement]:
        """Extract button elements"""
        buttons = []
        
        try:
            for button in soup.find_all(['button', 'input']):
                if button.name == 'input' and button.get('type') not in ['button', 'submit']:
                    continue
                
                buttons.append(DOMElement(
                    tag=button.name,
                    id=button.get('id'),
                    classes=button.get('class', []),
                    text=button.get_text(strip=True) or button.get('value'),
                    attributes={k: str(v) for k, v in button.attrs.items()},
                    selector=f"#{button.get('id')}" if button.get('id') else None
                ))
        
        except Exception as e:
            logger.error(f"Error extracting buttons: {e}")
        
        return buttons[:20]  # Limit to 20 buttons
    
    async def _extract_links(self, page: Page, soup: BeautifulSoup) -> List[DOMElement]:
        """Extract link elements"""
        links = []
        
        try:
            for link in soup.find_all('a', href=True):
                links.append(DOMElement(
                    tag='a',
                    id=link.get('id'),
                    classes=link.get('class', []),
                    text=link.get_text(strip=True),
                    attributes={'href': link.get('href')},
                    selector=f"#{link.get('id')}" if link.get('id') else None
                ))
        
        except Exception as e:
            logger.error(f"Error extracting links: {e}")
        
        return links[:30]  # Limit to 30 links
    
    async def _extract_inputs(self, page: Page, soup: BeautifulSoup) -> List[DOMElement]:
        """Extract input elements"""
        inputs = []
        
        try:
            for input_elem in soup.find_all(['input', 'textarea', 'select']):
                inputs.append(DOMElement(
                    tag=input_elem.name,
                    id=input_elem.get('id'),
                    classes=input_elem.get('class', []),
                    attributes={k: str(v) for k, v in input_elem.attrs.items()},
                    selector=f"#{input_elem.get('id')}" if input_elem.get('id') else None
                ))
        
        except Exception as e:
            logger.error(f"Error extracting inputs: {e}")
        
        return inputs
    
    async def _extract_interactive_elements(self, page: Page) -> List[InteractiveElement]:
        """Extract all interactive elements using Playwright"""
        interactive = []
        
        try:
            # Find all clickable elements
            clickable_selectors = [
                'button',
                'a[href]', 
                'input[type="button"]',
                'input[type="submit"]',
                '[onclick]',
                '[role="button"]'
            ]
            
            for selector in clickable_selectors:
                try:
                    elements = await page.query_selector_all(selector)
                    for elem in elements[:10]:  # Limit per selector
                        try:
                            text_content = await elem.text_content()
                            is_visible = await elem.is_visible()
                            
                            interactive.append(InteractiveElement(
                                type="clickable",
                                text=text_content.strip() if text_content else None,
                                selector=selector,
                                clickable=True,
                                visible=is_visible
                            ))
                        except Exception:
                            continue
                except Exception:
                    continue
        
        except Exception as e:
            logger.error(f"Error extracting interactive elements: {e}")
        
        return interactive[:30]  # Limit total interactive elements
    
    async def _analyze_performance(self, page: Page, load_time: float) -> PerformanceMetrics:
        """Analyze page performance"""
        try:
            # Get basic performance metrics
            performance_data = await page.evaluate("""
                () => {
                    const navigation = performance.getEntriesByType('navigation')[0];
                    const paint = performance.getEntriesByType('paint');
                    
                    return {
                        domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
                        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
                        largestContentfulPaint: null // Would need additional setup
                    };
                }
            """)
            
            return PerformanceMetrics(
                load_time=load_time,
                dom_content_loaded=performance_data.get('domContentLoaded'),
                first_contentful_paint=performance_data.get('firstContentfulPaint'),
                errors=[],  # Console errors captured separately
                warnings=[]
            )
        
        except Exception as e:
            logger.error(f"Performance analysis failed: {e}")
            return PerformanceMetrics(load_time=load_time, errors=[], warnings=[])
    
    async def _analyze_accessibility(self, page: Page) -> Dict[str, Any]:
        """Basic accessibility analysis"""
        try:
            # Basic accessibility checks using JavaScript
            a11y_data = await page.evaluate("""
                () => {
                    const issues = [];
                    
                    // Check for images without alt text
                    const images = document.querySelectorAll('img');
                    images.forEach((img, index) => {
                        if (!img.alt && !img.getAttribute('aria-label')) {
                            issues.push({
                                type: 'missing_alt_text',
                                severity: 'medium',
                                description: 'Image missing alternative text',
                                element: `img:nth-child(${index + 1})`
                            });
                        }
                    });
                    
                    // Check for form inputs without labels
                    const inputs = document.querySelectorAll('input, textarea, select');
                    inputs.forEach((input, index) => {
                        const id = input.id;
                        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
                        const hasAriaLabel = input.getAttribute('aria-label');
                        
                        if (!hasLabel && !hasAriaLabel) {
                            issues.push({
                                type: 'missing_form_label',
                                severity: 'high',
                                description: 'Form input missing label',
                                element: input.tagName.toLowerCase() + (id ? `#${id}` : `:nth-child(${index + 1})`)
                            });
                        }
                    });
                    
                    // Check for proper heading hierarchy
                    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
                    let lastLevel = 0;
                    headings.forEach((heading) => {
                        const level = parseInt(heading.tagName.substring(1));
                        if (level > lastLevel + 1) {
                            issues.push({
                                type: 'heading_hierarchy',
                                severity: 'medium',
                                description: 'Improper heading hierarchy',
                                element: heading.tagName.toLowerCase()
                            });
                        }
                        lastLevel = level;
                    });
                    
                    return {
                        issues: issues,
                        score: Math.max(0, 100 - (issues.length * 10))
                    };
                }
            """)
            
            return a11y_data
        
        except Exception as e:
            logger.error(f"Accessibility analysis failed: {e}")
            return {"issues": [], "score": 0}
    
    async def _test_responsive(self, page: Page) -> Dict[str, Any]:
        """Test responsive design across different viewports"""
        responsive_data = {"breakpoints": [], "issues": []}
        
        try:
            breakpoints = [
                {"name": "mobile", "width": 375, "height": 667},
                {"name": "tablet", "width": 768, "height": 1024},
                {"name": "desktop", "width": 1280, "height": 720}
            ]
            
            for bp in breakpoints:
                await page.set_viewport_size({"width": bp["width"], "height": bp["height"]})
                await page.wait_for_timeout(1000)  # Wait for reflow
                
                # Check for horizontal scrollbars (potential overflow issues)
                overflow_check = await page.evaluate("""
                    () => {
                        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
                    }
                """)
                
                responsive_data["breakpoints"].append({
                    "name": bp["name"],
                    "width": bp["width"],
                    "height": bp["height"],
                    "has_horizontal_scroll": overflow_check
                })
                
                if overflow_check:
                    responsive_data["issues"].append({
                        "breakpoint": bp["name"],
                        "issue": "horizontal_overflow",
                        "description": f"Page has horizontal overflow at {bp['name']} viewport"
                    })
        
        except Exception as e:
            logger.error(f"Responsive testing failed: {e}")
        
        return responsive_data
    
    async def _analyze_interactions(self, page: Page, context: FrontendContext):
        """Analyze interactive elements and capabilities"""
        interactions = {
            "clickable_count": 0,
            "focusable_count": 0,
            "form_count": len(context.forms),
            "navigation_links": [],
            "can_scroll": False
        }
        
        try:
            # Count clickable elements
            clickable = await page.query_selector_all('button, a[href], input[type="button"], input[type="submit"], [onclick], [role="button"]')
            interactions["clickable_count"] = len(clickable)
            
            # Count focusable elements
            focusable = await page.query_selector_all('input, textarea, select, button, a[href], [tabindex]:not([tabindex="-1"])')
            interactions["focusable_count"] = len(focusable)
            
            # Check if page is scrollable
            scroll_height = await page.evaluate("document.documentElement.scrollHeight")
            client_height = await page.evaluate("document.documentElement.clientHeight")
            interactions["can_scroll"] = scroll_height > client_height
            
            # Extract navigation links
            nav_links = await page.query_selector_all('nav a[href], header a[href], .nav a[href], .navigation a[href]')
            for link in nav_links[:10]:  # Limit to 10
                try:
                    href = await link.get_attribute('href')
                    text = await link.text_content()
                    if href and text:
                        interactions["navigation_links"].append({
                            "text": text.strip(),
                            "href": href
                        })
                except Exception:
                    continue
        
        except Exception as e:
            logger.error(f"Interaction analysis failed: {e}")
        
        context.interactions = interactions
    
    async def interact_with_page(self, url: str, actions: List[InteractionAction]) -> List[InteractionResult]:
        """Perform a series of interactions with the page"""
        results = []
        page = await self.context.new_page()
        
        try:
            # Navigate to the page
            await page.goto(url, wait_until="networkidle", timeout=30000)
            
            for action in actions:
                result = InteractionResult(
                    action=action.type,
                    success=False,
                    timestamp=datetime.now()
                )
                
                try:
                    if action.type == "click":
                        if action.selector:
                            await page.click(action.selector, timeout=5000)
                        elif action.coordinates:
                            await page.mouse.click(action.coordinates["x"], action.coordinates["y"])
                        result.success = True
                    
                    elif action.type == "fill":
                        if action.selector and action.value:
                            await page.fill(action.selector, action.value, timeout=5000)
                            result.success = True
                    
                    elif action.type == "wait":
                        duration = action.duration or 1000
                        await page.wait_for_timeout(duration)
                        result.success = True
                    
                    elif action.type == "scroll":
                        if action.coordinates:
                            await page.mouse.wheel(action.coordinates["x"], action.coordinates["y"])
                        else:
                            await page.keyboard.press("PageDown")
                        result.success = True
                    
                    elif action.type == "navigate":
                        if action.url:
                            await page.goto(action.url, wait_until="networkidle")
                            result.success = True
                    
                    else:
                        result.error = f"Unknown action type: {action.type}"
                
                except Exception as e:
                    result.error = str(e)
                    logger.error(f"Action {action.type} failed: {e}")
                
                results.append(result)
                
                # Small delay between actions
                await page.wait_for_timeout(500)
        
        except Exception as e:
            logger.error(f"Interaction session failed: {e}")
        finally:
            await page.close()
        
        return results
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get health status of the capture system"""
        return {
            "browser_ready": self.browser is not None and self.browser.is_connected(),
            "uptime_seconds": time.time() - self.startup_time,
            "context_ready": self.context is not None
        }
