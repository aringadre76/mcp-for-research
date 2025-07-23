// Content script for comprehensive UI extraction
// This script runs in the context of web pages to extract visual and structural data

class UIExtractor {
  constructor() {
    this.observer = null;
    this.isObserving = false;
  }

  // Capture screenshot of the current viewport
  async captureScreenshot() {
    try {
      console.log('Attempting to capture screenshot...');
      
      // Check if html2canvas is available
      if (!window.html2canvas && !await this.loadHtml2Canvas()) {
        console.error('Failed to load html2canvas library');
        throw new Error('Failed to load screenshot capture library');
      }
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      // Set canvas size to viewport
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Use html2canvas for screenshot
      console.log('Using html2canvas for screenshot...');
      const screenshot = await window.html2canvas(document.body, {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        useCORS: true,
        allowTaint: true,
        logging: false,
        removeContainer: true
      });
      
      console.log('Screenshot captured successfully');
      return screenshot.toDataURL('image/png');
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      throw new Error(`Failed to capture screenshot: ${error.message || 'Unknown error'}`);
    }
  }

  // Load html2canvas library dynamically
  async loadHtml2Canvas() {
    try {
      console.log('Loading html2canvas...');
      
      if (window.html2canvas) {
        console.log('html2canvas already loaded');
        return window.html2canvas;
      }
      
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        // Use the local copy of html2canvas from the extension
        script.src = chrome.runtime.getURL('lib/html2canvas.min.js');
        script.onload = () => {
          console.log('html2canvas loaded successfully');
          if (window.html2canvas) {
            resolve(window.html2canvas);
          } else {
            reject(new Error('html2canvas not found after loading'));
          }
        };
        script.onerror = (e) => {
          console.error('Failed to load html2canvas:', e);
          reject(new Error('Failed to load html2canvas library'));
        };
        
        // Set a timeout to prevent hanging if script doesn't load
        const timeout = setTimeout(() => {
          reject(new Error('Timeout loading html2canvas'));
        }, 5000);
        
        script.onload = () => {
          clearTimeout(timeout);
          console.log('html2canvas loaded successfully');
          if (window.html2canvas) {
            resolve(window.html2canvas);
          } else {
            reject(new Error('html2canvas not found after loading'));
          }
        };
        
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error('Error in loadHtml2Canvas:', error);
      throw error;
    }
  }

  // Extract hierarchical page structure (outline)
  extractPageOutline() {
    const outline = {
      title: this.getPageTitle(),
      url: window.location.href,
      structure: this.buildElementTree(document.body),
      headings: this.extractHeadings(),
      navigation: this.extractNavigation(),
      forms: this.extractForms(),
      interactiveElements: this.extractInteractiveElements()
    };
    
    return outline;
  }

  // Get page title
  getPageTitle() {
    return document.title || 'Untitled Page';
  }

  // Build hierarchical element tree
  buildElementTree(element, depth = 0, maxDepth = 4) {
    if (depth > maxDepth || !element || !element.children) {
      return null;
    }

    const tree = {
      tag: element.tagName.toLowerCase(),
      type: this.getElementType(element),
      text: this.getVisibleText(element),
      children: []
    };

    // Add important attributes
    if (element.id) tree.id = element.id;
    if (element.className) tree.className = element.className;
    if (element.role) tree.role = element.role;
    if (element.ariaLabel) tree.ariaLabel = element.ariaLabel;

    // Process children
    for (const child of element.children) {
      if (this.isVisibleElement(child)) {
        const childTree = this.buildElementTree(child, depth + 1, maxDepth);
        if (childTree) {
          tree.children.push(childTree);
        }
      }
    }

    return tree;
  }

  // Determine element type for better categorization
  getElementType(element) {
    const tag = element.tagName.toLowerCase();
    const role = element.getAttribute('role');
    
    if (role) return role;
    
    const interactiveTags = ['button', 'a', 'input', 'select', 'textarea', 'label'];
    if (interactiveTags.includes(tag)) return tag;
    
    const structuralTags = ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer'];
    if (structuralTags.includes(tag)) return tag;
    
    const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    if (headingTags.includes(tag)) return 'heading';
    
    return 'content';
  }

  // Get visible text content
  getVisibleText(element) {
    if (!element) return '';
    
    // Check if element is visible
    if (!this.isVisibleElement(element)) return '';
    
    // Get text content
    let text = element.textContent || '';
    
    // Clean up text
    text = text.replace(/\s+/g, ' ').trim();
    
    // Limit length
    if (text.length > 200) {
      text = text.substring(0, 200) + '...';
    }
    
    return text;
  }

  // Check if element is visible
  isVisibleElement(element) {
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    const isHidden = style.display === 'none' || 
                    style.visibility === 'hidden' || 
                    style.opacity === '0' ||
                    element.hidden ||
                    element.offsetParent === null;
    
    return !isHidden;
  }

  // Extract headings hierarchy
  extractHeadings() {
    const headings = [];
    const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    headingElements.forEach(heading => {
      if (this.isVisibleElement(heading)) {
        headings.push({
          level: parseInt(heading.tagName.substring(1)),
          text: heading.textContent.trim(),
          id: heading.id || null
        });
      }
    });
    
    return headings;
  }

  // Extract navigation elements
  extractNavigation() {
    const navigation = {
      mainNav: [],
      breadcrumbs: [],
      pagination: []
    };
    
    // Main navigation
    const navElements = document.querySelectorAll('nav, [role="navigation"], .nav, .navigation, .menu');
    navElements.forEach(nav => {
      const links = nav.querySelectorAll('a');
      const navItems = Array.from(links)
        .filter(link => this.isVisibleElement(link))
        .map(link => ({
          text: link.textContent.trim(),
          href: link.href,
          isActive: link.classList.contains('active') || link.getAttribute('aria-current') === 'page'
        }));
      
      if (navItems.length > 0) {
        navigation.mainNav.push({
          role: nav.getAttribute('role') || 'navigation',
          items: navItems
        });
      }
    });
    
    // Breadcrumbs
    const breadcrumbElements = document.querySelectorAll('[role="breadcrumb"], .breadcrumb, .breadcrumbs');
    breadcrumbElements.forEach(breadcrumb => {
      const links = breadcrumb.querySelectorAll('a');
      const items = Array.from(links)
        .filter(link => this.isVisibleElement(link))
        .map(link => ({
          text: link.textContent.trim(),
          href: link.href
        }));
      
      if (items.length > 0) {
        navigation.breadcrumbs.push(items);
      }
    });
    
    return navigation;
  }

  // Extract forms and form elements
  extractForms() {
    const forms = [];
    const formElements = document.querySelectorAll('form');
    
    formElements.forEach(form => {
      if (!this.isVisibleElement(form)) return;
      
      const inputs = Array.from(form.querySelectorAll('input, select, textarea, button'))
        .filter(input => this.isVisibleElement(input))
        .map(input => {
          const inputData = {
            type: input.type || input.tagName.toLowerCase(),
            name: input.name || '',
            placeholder: input.placeholder || '',
            required: input.required || false
          };
          
          // Add label if available
          if (input.id) {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (label) {
              inputData.label = label.textContent.trim();
            }
          }
          
          return inputData;
        });
      
      forms.push({
        action: form.action || '',
        method: form.method || 'get',
        inputs
      });
    });
    
    return forms;
  }

  // Extract interactive elements
  extractInteractiveElements() {
    const interactive = {
      buttons: [],
      links: [],
      inputs: [],
      other: []
    };
    
    // Buttons
    const buttons = document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]');
    buttons.forEach(button => {
      if (this.isVisibleElement(button)) {
        interactive.buttons.push({
          text: button.textContent.trim() || button.value || '',
          type: button.type || 'button',
          disabled: button.disabled || false
        });
      }
    });
    
    // Links
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      if (this.isVisibleElement(link) && link.href && !link.href.startsWith('javascript:')) {
        interactive.links.push({
          text: link.textContent.trim(),
          href: link.href,
          isExternal: link.hostname !== window.location.hostname
        });
      }
    });
    
    // Inputs
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (this.isVisibleElement(input)) {
        interactive.inputs.push({
          type: input.type || input.tagName.toLowerCase(),
          name: input.name || '',
          placeholder: input.placeholder || '',
          required: input.required || false
        });
      }
    });
    
    return interactive;
  }

  // Extract all visible text content
  extractVisibleText() {
    const textElements = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent || !this.isVisibleElement(parent)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          const text = node.textContent.trim();
          if (!text) {
            return NodeFilter.FILTER_REJECT;
          }
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    
    let node;
    while (node = walker.nextNode()) {
      const parent = node.parentElement;
      const tag = parent.tagName.toLowerCase();
      
      // Skip script and style content
      if (tag === 'script' || tag === 'style') continue;
      
      const text = node.textContent.trim();
      if (text) {
        textElements.push({
          text,
          tag,
          isHeading: /^h[1-6]$/.test(tag),
          isLink: tag === 'a',
          isButton: tag === 'button' || parent.getAttribute('role') === 'button'
        });
      }
    }
    
    return textElements;
  }

  // Check if the page can be captured
  canCapturePage() {
    // Check if we're in a frame
    if (window !== window.top) {
      console.warn('Cannot capture content in an iframe');
      return false;
    }
    
    // Check if the page has a body
    if (!document.body) {
      console.warn('Page has no body element');
      return false;
    }
    
    // Check if the document is in a ready state
    if (document.readyState !== 'complete' && document.readyState !== 'interactive') {
      console.warn('Document is not ready yet');
      return false;
    }
    
    return true;
  }

  // Start observing DOM changes for real-time updates
  startObserving() {
    if (this.isObserving) return;
    
    this.observer = new MutationObserver((mutations) => {
      const hasSignificantChanges = mutations.some(mutation => {
        return mutation.type === 'childList' || 
               (mutation.type === 'attributes' && 
                (mutation.attributeName === 'class' || 
                 mutation.attributeName === 'style'));
      });
      
      if (hasSignificantChanges) {
        this.onDOMChange();
      }
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
    
    this.isObserving = true;
  }

  // Stop observing DOM changes
  stopObserving() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.isObserving = false;
  }

  // Handle DOM changes
  onDOMChange() {
    // Debounce rapid changes
    clearTimeout(this.changeTimeout);
    this.changeTimeout = setTimeout(() => {
      this.extractAndSendData('dom-change');
    }, 500);
  }

  // Extract all data and send to background script
  async extractAndSendData(trigger = 'manual') {
    try {
      console.log(`Starting extraction (trigger: ${trigger})`);
      
      // Check if we can capture this page
      if (!this.canCapturePage()) {
        throw new Error('Cannot capture this page. The page might not be fully loaded.');
      }
      
      // Get page metadata
      const title = this.getPageTitle();
      const url = window.location.href;
      
      // Capture screenshot
      console.log('Capturing screenshot...');
      const screenshot = await this.captureScreenshot();
      if (!screenshot) {
        throw new Error('Failed to capture screenshot');
      }
      
      // Extract page structure
      console.log('Extracting page structure...');
      const outline = this.extractPageOutline();
      
      // Extract visible text
      console.log('Extracting visible text...');
      const visibleText = this.extractVisibleText();
      
      // Prepare data
      const data = {
        trigger,
        timestamp: new Date().toISOString(),
        url,
        title,
        screenshot,
        outline,
        visibleText
      };
      
      // Send to background script
      console.log('Sending data to background script...');
      chrome.runtime.sendMessage({
        action: 'extract-complete',
        data
      });
      
      console.log('Extraction complete!');
    } catch (error) {
      console.error('Extraction failed:', error);
      chrome.runtime.sendMessage({
        action: 'extract-complete',
        error: error.message || 'Unknown error during extraction'
      });
    }
  }
}

// Initialize extractor
const extractor = new UIExtractor();

// Make extractor available globally for background script access
window.uiExtractor = extractor;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'extract':
      extractor.extractAndSendData('manual');
      break;
      
    case 'start-observing':
      extractor.startObserving();
      sendResponse({success: true});
      break;
      
    case 'stop-observing':
      extractor.stopObserving();
      sendResponse({success: true});
      break;
      
    case 'get-current-state':
      extractor.extractAndSendData('state-request');
      break;
  }
});

// Auto-start observing when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    extractor.startObserving();
  });
} else {
  extractor.startObserving();
} 