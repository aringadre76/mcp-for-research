// WebSocket connection
let ws = null;

// Connect to the bridge server
function connectToServer() {
  if (ws) return; // Already connected
  
  ws = new WebSocket('ws://localhost:8080');
  
  ws.onopen = () => {
    console.log('Connected to bridge server');
    // Identify as browser extension
    ws.send(JSON.stringify({
      type: 'identify',
      client: 'browser'
    }));
  };
  
  ws.onclose = () => {
    console.log('Disconnected from bridge server');
    ws = null;
    // Try to reconnect after a delay
    setTimeout(connectToServer, 5000);
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

// Format data for LLM consumption
function formatForLLM(extractionData) {
  const { screenshot, outline, visibleText } = extractionData;
  
  // Create LLM-friendly structured data
  const llmData = {
    // Visual Context
    screenshot: screenshot,
    
    // Page Structure (Outline)
    pageStructure: {
      title: outline.title,
      url: outline.url,
      headings: outline.headings.map(h => `${'#'.repeat(h.level)} ${h.text}`).join('\n'),
      navigation: formatNavigation(outline.navigation),
      forms: formatForms(outline.forms),
      interactiveElements: formatInteractiveElements(outline.interactiveElements)
    },
    
    // Visible Text Content
    visibleText: visibleText.map(item => ({
      text: item.text,
      type: item.isHeading ? 'heading' : item.isLink ? 'link' : item.isButton ? 'button' : 'content',
      tag: item.tag
    })),
    
    // Hierarchical Structure
    elementTree: outline.structure,
    
    // Summary for quick understanding
    summary: generateSummary(outline, visibleText)
  };
  
  return llmData;
}

// Format navigation for LLM
function formatNavigation(navigation) {
  const formatted = {};
  
  if (navigation.mainNav.length > 0) {
    formatted.mainNavigation = navigation.mainNav.map(nav => ({
      role: nav.role,
      items: nav.items.map(item => ({
        text: item.text,
        href: item.href,
        isActive: item.isActive
      }))
    }));
  }
  
  if (navigation.breadcrumbs.length > 0) {
    formatted.breadcrumbs = navigation.breadcrumbs.map(breadcrumb => 
      breadcrumb.map(item => item.text).join(' > ')
    );
  }
  
  return formatted;
}

// Format forms for LLM
function formatForms(forms) {
  return forms.map(form => ({
    action: form.action,
    method: form.method,
    inputs: form.inputs.map(input => ({
      type: input.type,
      name: input.name,
      placeholder: input.placeholder,
      required: input.required,
      label: input.label
    }))
  }));
}

// Format interactive elements for LLM
function formatInteractiveElements(interactive) {
  return {
    buttons: interactive.buttons.map(btn => ({
      text: btn.text,
      type: btn.type,
      disabled: btn.disabled
    })),
    links: interactive.links.map(link => ({
      text: link.text,
      href: link.href,
      isExternal: link.isExternal
    })),
    inputs: interactive.inputs.map(input => ({
      type: input.type,
      name: input.name,
      placeholder: input.placeholder,
      required: input.required
    }))
  };
}

// Generate summary for quick LLM understanding
function generateSummary(outline, visibleText) {
  const summary = {
    pageType: determinePageType(outline, visibleText),
    mainContent: extractMainContent(visibleText),
    keyActions: extractKeyActions(outline.interactiveElements),
    structure: summarizeStructure(outline.structure)
  };
  
  return summary;
}

// Determine page type
function determinePageType(outline, visibleText) {
  const text = visibleText.map(item => item.text).join(' ').toLowerCase();
  const headings = outline.headings.map(h => h.text.toLowerCase()).join(' ');
  
  if (text.includes('login') || text.includes('sign in') || headings.includes('login')) {
    return 'login';
  } else if (text.includes('register') || text.includes('sign up') || headings.includes('register')) {
    return 'registration';
  } else if (text.includes('dashboard') || headings.includes('dashboard')) {
    return 'dashboard';
  } else if (text.includes('product') || text.includes('item') || headings.includes('product')) {
    return 'product';
  } else if (text.includes('form') || outline.forms.length > 0) {
    return 'form';
  } else if (text.includes('blog') || text.includes('article') || headings.includes('blog')) {
    return 'article';
  } else {
    return 'general';
  }
}

// Extract main content
function extractMainContent(visibleText) {
  const contentTexts = visibleText
    .filter(item => !item.isHeading && !item.isLink && !item.isButton)
    .map(item => item.text)
    .filter(text => text.length > 10);
  
  return contentTexts.slice(0, 5); // Top 5 content pieces
}

// Extract key actions
function extractKeyActions(interactiveElements) {
  const actions = [];
  
  // Add buttons
  interactiveElements.buttons.forEach(btn => {
    if (btn.text && !btn.disabled) {
      actions.push(`Button: ${btn.text}`);
    }
  });
  
  // Add important links
  interactiveElements.links
    .filter(link => link.text && !link.isExternal)
    .slice(0, 5)
    .forEach(link => {
      actions.push(`Link: ${link.text}`);
    });
  
  return actions;
}

// Summarize structure
function summarizeStructure(structure) {
  const summary = {
    sections: 0,
    interactiveElements: 0,
    contentBlocks: 0
  };
  
  function countElements(element) {
    if (!element) return;
    
    if (element.type === 'section' || element.type === 'main' || element.type === 'article') {
      summary.sections++;
    } else if (['button', 'a', 'input', 'select', 'textarea'].includes(element.type)) {
      summary.interactiveElements++;
    } else if (element.type === 'content' && element.text) {
      summary.contentBlocks++;
    }
    
    if (element.children) {
      element.children.forEach(countElements);
    }
  }
  
  countElements(structure);
  return summary;
}

// Clean up DOM for better readability and smaller size
function cleanupDOM(domString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(domString, 'text/html');
  
  // Remove all style tags
  const styles = doc.querySelectorAll('style');
  styles.forEach(style => style.remove());
  
  // Remove all script tags
  const scripts = doc.querySelectorAll('script');
  scripts.forEach(script => script.remove());
  
  // Remove all link tags (CSS, favicons, etc.)
  const links = doc.querySelectorAll('link');
  links.forEach(link => link.remove());
  
  // Remove all meta tags
  const metas = doc.querySelectorAll('meta');
  metas.forEach(meta => meta.remove());
  
  // Remove all inline styles
  const elementsWithStyle = doc.querySelectorAll('[style]');
  elementsWithStyle.forEach(el => el.removeAttribute('style'));
  
  // Remove data attributes
  const allElements = doc.querySelectorAll('*');
  allElements.forEach(el => {
    Array.from(el.attributes)
      .filter(attr => attr.name.startsWith('data-'))
      .forEach(attr => el.removeAttribute(attr.name));
  });
  
  // Remove event handlers (onclick, onload, etc.)
  allElements.forEach(el => {
    Array.from(el.attributes)
      .filter(attr => attr.name.startsWith('on'))
      .forEach(attr => el.removeAttribute(attr.name));
  });
  
  // Remove class attributes (often contain styling info)
  const elementsWithClass = doc.querySelectorAll('[class]');
  elementsWithClass.forEach(el => el.removeAttribute('class'));
  
  // Remove id attributes (except for important structural elements)
  const elementsWithId = doc.querySelectorAll('[id]');
  elementsWithId.forEach(el => {
    // Keep IDs on main structural elements
    if (!['main', 'header', 'footer', 'nav', 'sidebar', 'content'].includes(el.id)) {
      el.removeAttribute('id');
    }
  });
  
  // Remove aria attributes
  allElements.forEach(el => {
    Array.from(el.attributes)
      .filter(attr => attr.name.startsWith('aria-'))
      .forEach(attr => el.removeAttribute(attr.name));
  });
  
  // Remove empty attributes
  allElements.forEach(el => {
    Array.from(el.attributes)
      .filter(attr => attr.value === '')
      .forEach(attr => el.removeAttribute(attr.name));
  });
  
  // Remove hidden elements
  const hiddenElements = doc.querySelectorAll('[hidden], [style*="display: none"], [style*="visibility: hidden"]');
  hiddenElements.forEach(el => el.remove());
  
  return doc.documentElement.outerHTML;
}

// Extract DOM structure (legacy function - kept for compatibility)
function extractDOMStructure(domString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(domString, 'text/html');
  
  // Extract page title
  const title = doc.querySelector('title')?.textContent || 'Untitled Page';
  
  // Extract meta description
  const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
  
  // Extract headings to understand page structure
  const headings = Array.from(doc.querySelectorAll('h1, h2, h3')).map(h => ({
    level: parseInt(h.tagName.substring(1)),
    text: h.textContent.trim()
  }));
  
  // Extract navigation items
  const navItems = Array.from(doc.querySelectorAll('nav a, header a, .navigation a, .menu a, .nav a'))
    .map(link => ({
      text: link.textContent.trim(),
      href: link.getAttribute('href')
    }))
    .filter(item => item.text); // Filter out empty text items
  
  // Extract main content sections
  const mainSections = [];
  const sections = doc.querySelectorAll('section, main, article, [role="main"], .content, .main');
  sections.forEach(section => {
    const sectionHeading = section.querySelector('h1, h2, h3, h4')?.textContent.trim();
    const sectionText = section.textContent.trim().substring(0, 150) + (section.textContent.length > 150 ? '...' : '');
    
    if (sectionHeading || sectionText) {
      mainSections.push({
        heading: sectionHeading || 'Unnamed Section',
        content: sectionText
      });
    }
  });
  
  // Extract forms
  const forms = Array.from(doc.querySelectorAll('form')).map(form => {
    const inputs = Array.from(form.querySelectorAll('input, select, textarea'))
      .map(input => ({
        type: input.tagName.toLowerCase() === 'input' ? input.type : input.tagName.toLowerCase(),
        name: input.name || '',
        placeholder: input.placeholder || ''
      }));
    
    return {
      action: form.action || '',
      method: form.method || 'get',
      inputs
    };
  });
  
  return {
    title,
    metaDescription,
    headings,
    navItems,
    mainSections,
    forms
  };
}

// Listen for messages from popup and content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'capture') {
    console.log('Capture requested');
    
    // Try to connect to server if not connected
    connectToServer();
    
    // Capture visible tab
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const activeTab = tabs[0];
      
      // Check if the URL is valid for content script injection
      const url = activeTab.url;
      if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('edge://') || url.startsWith('about:') || url.startsWith('chrome-error://')) {
        console.error('Cannot capture this page:', url);
        chrome.runtime.sendMessage({
          action: 'capture-complete',
          success: false,
          error: `Cannot capture this page: ${url}. The extension can only capture regular web pages.`
        });
        return;
      }
      
      // Trigger the comprehensive extraction in content script
      chrome.tabs.sendMessage(activeTab.id, {action: 'extract'}, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error triggering extraction:', chrome.runtime.lastError.message || 'Cannot access this page');
          chrome.runtime.sendMessage({
            action: 'capture-complete',
            success: false,
            error: chrome.runtime.lastError.message || 'Cannot access this page. Make sure you are on a regular web page, not a browser page (chrome://, extension://, etc).'
          });
        } else {
          console.log('Extraction triggered successfully');
          // The result will be handled by the 'extract-complete' action
        }
      });
    });
  } else if (message.action === 'extract-complete') {
    console.log('Extraction completed');
    
    // Try to connect to server if not connected
    connectToServer();
    
    if (message.error) {
      console.error('Extraction error:', message.error);
      chrome.runtime.sendMessage({
        action: 'extract-complete',
        success: false,
        error: message.error
      });
      return;
    }
    
    // Format data for LLM
    const llmData = formatForLLM(message.data);
    
    // Send formatted data to bridge server if connected
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'llm-extraction',
        url: message.data.url,
        title: message.data.title,
        timestamp: message.data.timestamp,
        trigger: message.data.trigger,
        screenshot: message.data.screenshot,
        llmData: llmData
      }));
      
      chrome.runtime.sendMessage({
        action: 'extract-complete',
        success: true,
        data: {
          url: message.data.url,
          title: message.data.title,
          timestamp: message.data.timestamp,
          screenshot: message.data.screenshot,
          llmData: llmData
        }
      });
    } else {
      console.error('WebSocket not connected');
      chrome.runtime.sendMessage({
        action: 'extract-complete',
        success: false,
        error: 'WebSocket not connected'
      });
    }
  } else if (message.action === 'start-observing') {
    // Start observing DOM changes in active tab
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, {action: 'start-observing'});
    });
  } else if (message.action === 'stop-observing') {
    // Stop observing DOM changes in active tab
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, {action: 'stop-observing'});
    });
  }
});

// Try to connect on startup
connectToServer(); 