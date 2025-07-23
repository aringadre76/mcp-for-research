const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Directory to save captures
const CAPTURES_DIR = path.join(__dirname, 'captures');

// Ensure captures directory exists
if (!fs.existsSync(CAPTURES_DIR)) {
  fs.mkdirSync(CAPTURES_DIR, { recursive: true });
}

// Create a viewer HTML file for better DOM display
function createViewerHTML(domContent, screenshotPath, timestamp) {
  const viewerPath = path.join(CAPTURES_DIR, `interactive-ui-viewer-${timestamp}.html`);
  const relativeScreenshotPath = path.basename(screenshotPath);
  
  const viewerHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Visual Feedback - Capture Viewer</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
      color: #333;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 20px;
    }
    h1 {
      margin-top: 0;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
      color: #444;
    }
    .timestamp {
      color: #888;
      font-size: 14px;
      margin-bottom: 20px;
    }
    .screenshot {
      margin: 20px 0;
      border: 1px solid #ddd;
      max-width: 100%;
      height: auto;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .tabs {
      display: flex;
      margin: 20px 0;
      border-bottom: 1px solid #ddd;
    }
    .tab {
      padding: 10px 20px;
      cursor: pointer;
      background-color: #f9f9f9;
      border: 1px solid #ddd;
      border-bottom: none;
      border-radius: 4px 4px 0 0;
      margin-right: 5px;
    }
    .tab.active {
      background-color: white;
      border-bottom-color: white;
      position: relative;
      top: 1px;
      font-weight: bold;
    }
    .tab-content {
      display: none;
      padding: 20px;
      border: 1px solid #ddd;
      border-top: none;
      background-color: white;
    }
    .tab-content.active {
      display: block;
    }
    .dom-tree {
      font-family: monospace;
      white-space: pre-wrap;
      line-height: 1.5;
      font-size: 14px;
      overflow: auto;
      max-height: 600px;
      padding: 10px;
      background-color: #f8f8f8;
      border-radius: 4px;
    }
    .html-tag {
      color: #0000ff;
    }
    .html-attribute {
      color: #008080;
    }
    .html-value {
      color: #dd1144;
    }
    .html-comment {
      color: #888;
      font-style: italic;
    }
    
    /* Collapsible tree styles */
    .tree-view ul {
      list-style-type: none;
      padding-left: 20px;
      margin: 0;
    }
    .tree-view li {
      margin: 2px 0;
      position: relative;
    }
    .tree-view .caret {
      cursor: pointer;
      user-select: none;
      display: inline-block;
      width: 16px;
      height: 16px;
      text-align: center;
      line-height: 16px;
      font-size: 12px;
      color: #666;
      margin-right: 4px;
    }
    .tree-view .caret:before {
      content: "▶";
    }
    .tree-view .caret-down:before {
      content: "▼";
    }
    .tree-view .nested {
      display: none;
    }
    .tree-view .active {
      display: block;
    }
    .tree-view .tag-name {
      color: #0000ff;
      font-weight: bold;
    }
    .tree-view .attribute-name {
      color: #008080;
    }
    .tree-view .attribute-value {
      color: #dd1144;
    }
    .tree-view .text-content {
      color: #333;
    }
    .tree-view .text-node {
      color: #333;
      font-style: italic;
      padding-left: 20px;
    }
    .tree-view .collapsed-indicator {
      color: #999;
      font-style: italic;
    }
    .tree-view .element-count {
      color: #999;
      font-size: 12px;
      margin-left: 5px;
    }
    
    /* Structure tab styles */
    .structure-section {
      margin-bottom: 20px;
      padding: 15px;
      border: 1px solid #eee;
      border-radius: 4px;
    }
    .structure-section h3 {
      margin-top: 0;
      color: #444;
      border-bottom: 1px solid #eee;
      padding-bottom: 8px;
    }
    .structure-item {
      margin: 8px 0;
    }
    .structure-heading {
      font-weight: bold;
      color: #0066cc;
    }
    .structure-subheading {
      font-weight: bold;
      color: #444;
      margin-top: 10px;
    }
    .nav-item {
      display: flex;
      margin: 5px 0;
    }
    .nav-text {
      margin-right: 10px;
    }
    .nav-href {
      color: #0066cc;
      font-family: monospace;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>AI Visual Feedback Capture</h1>
    <div class="timestamp">Captured on: ${new Date(timestamp).toLocaleString()}</div>
    
    <div class="tabs">
      <div class="tab active" onclick="switchTab('screenshot')">Screenshot</div>
      <div class="tab" onclick="switchTab('structure')">Page Structure</div>
      <div class="tab" onclick="switchTab('dom')">DOM Tree</div>
      <div class="tab" onclick="switchTab('raw')">Raw HTML</div>
    </div>
    
    <div id="screenshot" class="tab-content active">
      <img src="${relativeScreenshotPath}" alt="Page Screenshot" class="screenshot">
    </div>
    
    <div id="structure" class="tab-content">
      <div id="structure-content">Loading structure data...</div>
    </div>
    
    <div id="dom" class="tab-content">
      <div id="dom-tree-view" class="tree-view"></div>
    </div>
    
    <div id="raw" class="tab-content">
      <div class="dom-tree">${escapeHTML(domContent)}</div>
    </div>
  </div>

  <script>
    // Tab switching
    function switchTab(tabId) {
      // Hide all tab contents
      const tabContents = document.querySelectorAll('.tab-content');
      tabContents.forEach(tab => tab.classList.remove('active'));
      
      // Deactivate all tabs
      const tabs = document.querySelectorAll('.tab');
      tabs.forEach(tab => tab.classList.remove('active'));
      
      // Activate the selected tab and its content
      document.getElementById(tabId).classList.add('active');
      
      // Find the index of the tab
      const tabElements = Array.from(document.querySelectorAll('.tab'));
      const tabIndex = tabElements.findIndex(tab => tab.innerText.toLowerCase().includes(tabId));
      
      if (tabIndex !== -1) {
        tabElements[tabIndex].classList.add('active');
      }
      
      // Initialize content if needed
      if (tabId === 'dom' && !document.getElementById('dom-tree-view').innerHTML) {
        initDOMTreeView();
      }
      
      if (tabId === 'raw') {
        syntaxHighlight();
      }
      
      if (tabId === 'structure' && document.getElementById('structure-content').innerText === 'Loading structure data...') {
        initStructureView();
      }
    }
    
    // Syntax highlighting for raw HTML
    function syntaxHighlight() {
      const domTree = document.querySelector('.dom-tree');
      let html = domTree.textContent;
      
      // Basic syntax highlighting
      html = html.replace(/&lt;!--(.+?)--&gt;/g, '<span class="html-comment">&lt;!--$1--&gt;</span>');
      html = html.replace(/&lt;(\\/?)([\\w-]+)(\\s|&gt;)/g, '&lt;$1<span class="html-tag">$2</span>$3');
      html = html.replace(/(\\s)([\\w-]+)=(".*?"|'.*?')/g, '$1<span class="html-attribute">$2</span>=<span class="html-value">$3</span>');
      
      domTree.innerHTML = html;
    }
    
    // Create DOM tree view
    function initDOMTreeView() {
      const domTreeView = document.getElementById('dom-tree-view');
      const parser = new DOMParser();
      const doc = parser.parseFromString(document.querySelector('.dom-tree').textContent, 'text/html');
      
      // Create tree structure
      const treeRoot = document.createElement('ul');
      treeRoot.className = 'tree-view';
      
      // Process the HTML document
      processNode(doc.documentElement, treeRoot);
      
      domTreeView.appendChild(treeRoot);
      
      // Add event listeners to carets
      const carets = document.querySelectorAll('.caret');
      carets.forEach(caret => {
        caret.addEventListener('click', function() {
          this.parentElement.querySelector('.nested').classList.toggle('active');
          this.classList.toggle('caret-down');
        });
      });
      
      // Expand the first few levels by default
      const topLevelItems = treeRoot.querySelectorAll(':scope > li > .caret');
      topLevelItems.forEach(item => {
        item.click();
        
        // Expand second level for <head> and <body>
        const nestedList = item.parentElement.querySelector('.nested');
        if (nestedList) {
          const secondLevelItems = nestedList.querySelectorAll(':scope > li > .caret');
          secondLevelItems.forEach(secondItem => {
            secondItem.click();
          });
        }
      });
    }
    
    // Process a DOM node for the tree view
    function processNode(node, parentElement, depth = 0, maxDepth = 15) {
      if (depth > maxDepth) return; // Prevent infinite recursion
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const li = document.createElement('li');
        
        // Count child elements
        const childElements = Array.from(node.children).length;
        
        // Create element representation
        const elementSpan = document.createElement('span');
        
        // Add caret for elements with children
        if (node.hasChildNodes()) {
          const caret = document.createElement('span');
          caret.className = 'caret';
          elementSpan.appendChild(caret);
        }
        
        // Element tag
        const tagSpan = document.createElement('span');
        tagSpan.className = 'tag-name';
        tagSpan.textContent = node.tagName.toLowerCase();
        elementSpan.appendChild(tagSpan);
        
        // Add attributes
        if (node.attributes && node.attributes.length > 0) {
          Array.from(node.attributes).forEach(attr => {
            elementSpan.appendChild(document.createTextNode(' '));
            
            const attrNameSpan = document.createElement('span');
            attrNameSpan.className = 'attribute-name';
            attrNameSpan.textContent = attr.name;
            elementSpan.appendChild(attrNameSpan);
            
            elementSpan.appendChild(document.createTextNode('="'));
            
            const attrValueSpan = document.createElement('span');
            attrValueSpan.className = 'attribute-value';
            attrValueSpan.textContent = attr.value;
            elementSpan.appendChild(attrValueSpan);
            
            elementSpan.appendChild(document.createTextNode('"'));
          });
        }
        
        // Add child count if there are children
        if (childElements > 0) {
          const countSpan = document.createElement('span');
          countSpan.className = 'element-count';
          countSpan.textContent = '(' + childElements + ' child' + (childElements > 1 ? 'ren' : '') + ')';
          elementSpan.appendChild(countSpan);
        }
        
        li.appendChild(elementSpan);
        
        // Create nested list for children
        if (node.hasChildNodes()) {
          const ul = document.createElement('ul');
          ul.className = 'nested';
          
          // Process child nodes
          let textContent = '';
          Array.from(node.childNodes).forEach(childNode => {
            if (childNode.nodeType === Node.TEXT_NODE) {
              const text = childNode.textContent.trim();
              if (text) textContent += text + ' ';
            } else {
              processNode(childNode, ul, depth + 1, maxDepth);
            }
          });
          
          // Add text content as a separate item if it exists
          if (textContent.trim()) {
            const textLi = document.createElement('li');
            const textSpan = document.createElement('span');
            textSpan.className = 'text-node';
            textSpan.textContent = textContent.trim().substring(0, 100) + 
              (textContent.trim().length > 100 ? '...' : '');
            textLi.appendChild(textSpan);
            ul.appendChild(textLi);
          }
          
          li.appendChild(ul);
        }
        
        parentElement.appendChild(li);
      }
    }
    
    // Create structure view
    function initStructureView() {
      const structureContent = document.getElementById('structure-content');
      
      // This would normally come from the domStructure data
      // For this example, we'll create a placeholder
      let structureHTML = '';
      
      // Title section
      structureHTML += '<div class="structure-section">';
      structureHTML += '<h3>Page Information</h3>';
      structureHTML += '<div class="structure-item"><strong>Title:</strong> ' + document.title + '</div>';
      structureHTML += '</div>';
      
      // Navigation section
      structureHTML += '<div class="structure-section">';
      structureHTML += '<h3>Navigation</h3>';
      structureHTML += '<div id="navigation-items">Extracting navigation items...</div>';
      structureHTML += '</div>';
      
      // Headings section
      structureHTML += '<div class="structure-section">';
      structureHTML += '<h3>Page Structure</h3>';
      structureHTML += '<div id="page-headings">Analyzing page structure...</div>';
      structureHTML += '</div>';
      
      // Main content section
      structureHTML += '<div class="structure-section">';
      structureHTML += '<h3>Main Content</h3>';
      structureHTML += '<div id="main-content">Extracting main content...</div>';
      structureHTML += '</div>';
      
      structureContent.innerHTML = structureHTML;
      
      // In a real implementation, we would populate these sections
      // with data from the domStructure object
      setTimeout(() => {
        document.getElementById('navigation-items').innerHTML = '<div class="structure-item">Navigation data would be displayed here from the domStructure object.</div>';
        document.getElementById('page-headings').innerHTML = '<div class="structure-item">Heading structure would be displayed here from the domStructure object.</div>';
        document.getElementById('main-content').innerHTML = '<div class="structure-item">Main content sections would be displayed here from the domStructure object.</div>';
      }, 500);
    }
  </script>
</body>
</html>`;

  fs.writeFileSync(viewerPath, viewerHTML);
  return viewerPath;
}

// Create an AI-friendly JSON file combining screenshot and DOM
function createAIFriendlyOutput(domContent, screenshotBase64, timestamp, safeTimestamp) {
  // Parse the DOM to extract key information
  const parser = new DOMParser();
  const doc = parser.parseFromString(domContent, 'text/html');
  
  // Extract page title
  const titleElement = doc.querySelector('title');
  const title = titleElement && titleElement.textContent ? titleElement.textContent : 'Untitled Page';
  
  // Extract meta description
  const metaElement = doc.querySelector('meta[name="description"]');
  const metaDescription = metaElement && metaElement.getAttribute ? metaElement.getAttribute('content') || '' : '';
  
  // Extract main navigation items
  const navItems = Array.from(doc.querySelectorAll('nav a')).map(link => ({
    text: link.textContent.trim(),
    href: link.getAttribute('href')
  }));
  
  // Extract main content sections
  const mainSections = [];
  const sections = doc.querySelectorAll('section, main, article, div.content > *');
  sections.forEach(section => {
    const headings = section.querySelectorAll('h1, h2, h3');
    if (headings.length > 0) {
      mainSections.push({
        heading: headings[0].textContent.trim(),
        content: section.textContent.trim().substring(0, 200) + '...' // Truncate for brevity
      });
    }
  });
  
  // Get canonical URL if available
  const canonicalElement = doc.querySelector('link[rel="canonical"]');
  const canonicalUrl = canonicalElement && canonicalElement.getAttribute ? canonicalElement.getAttribute('href') || '' : '';
  
  // Create a structured JSON output
  const aiOutput = {
    timestamp: timestamp,
    pageInfo: {
      title,
      metaDescription,
      url: canonicalUrl
    },
    navigation: navItems,
    mainSections,
    fullDOM: domContent,
    screenshot: screenshotBase64
  };
  
  // Save the AI-friendly JSON
  const aiOutputPath = path.join(CAPTURES_DIR, `llm-structured-page-analysis-${safeTimestamp}.json`);
  fs.writeFileSync(aiOutputPath, JSON.stringify(aiOutput, null, 2));
  
  return aiOutputPath;
}

// Helper function to escape HTML
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// WebSocket connection
let ws = null;

// Connect to the bridge server
function connectToServer() {
  if (ws) return; // Already connected
  
  ws = new WebSocket('ws://localhost:8080');
  
  ws.onopen = () => {
    console.log('Connected to bridge server');
    // Identify as cursor extension
    ws.send(JSON.stringify({
      type: 'identify',
      client: 'cursor'
    }));
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'capture') {
        console.log('Received capture data from bridge server');
        
        // Save capture data
        const now = new Date();
        const timestamp = now.toISOString();
        const safeTimestamp = timestamp.replace(/[:.]/g, '-');
        
        // Save DOM
        let domPath = null;
        if (data.dom) {
          domPath = path.join(CAPTURES_DIR, `html-dom-source-${safeTimestamp}.html`);
          fs.writeFileSync(domPath, data.dom);
          console.log(`DOM saved to ${domPath}`);
        }
        
        // Save screenshot
        let screenshotPath = null;
        let screenshotBase64 = null;
        if (data.screenshot) {
          screenshotBase64 = data.screenshot.replace(/^data:image\/png;base64,/, '');
          screenshotPath = path.join(CAPTURES_DIR, `visual-screenshot-${safeTimestamp}.png`);
          fs.writeFileSync(screenshotPath, screenshotBase64, 'base64');
          console.log(`Screenshot saved to ${screenshotPath}`);
        }
        
        // Create viewer HTML
        if (domPath && screenshotPath) {
          const viewerPath = createViewerHTML(data.dom, screenshotPath, safeTimestamp);
          console.log(`Viewer created at ${viewerPath}`);
          console.log(`Open this file in a browser for an enhanced viewing experience`);
        }
        
        // Create AI-friendly output
        try {
          const aiOutputPath = createAIFriendlyOutput(data.dom, data.screenshot, timestamp, safeTimestamp);
          console.log(`AI-friendly output created at ${aiOutputPath}`);
          console.log(`This file combines the screenshot and structured DOM for LLM understanding`);
        } catch (error) {
          console.error('Error creating AI-friendly output:', error);
        }
      } else if (data.type === 'llm-extraction') {
        console.log('Received comprehensive LLM extraction data from bridge server');
        
        // Save the comprehensive LLM data
        const now = new Date();
        const timestamp = now.toISOString();
        const safeTimestamp = timestamp.replace(/[:.]/g, '-');
        
        // Save comprehensive LLM extraction data
        const llmDataPath = path.join(CAPTURES_DIR, `llm-complete-ui-analysis-${safeTimestamp}.json`);
        fs.writeFileSync(llmDataPath, JSON.stringify(data, null, 2));
        console.log(`Comprehensive LLM data saved to ${llmDataPath}`);
        
        // Save screenshot separately if present
        if (data.screenshot) {
          const screenshotBase64 = data.screenshot.replace(/^data:image\/png;base64,/, '');
          const screenshotPath = path.join(CAPTURES_DIR, `visual-screenshot-${safeTimestamp}.png`);
          fs.writeFileSync(screenshotPath, screenshotBase64, 'base64');
          console.log(`Screenshot saved to ${screenshotPath}`);
        }
        
        console.log(`Page: ${data.title || 'Untitled'}`);
        console.log(`URL: ${data.url || 'Unknown'}`);
        console.log(`Trigger: ${data.trigger || 'manual'}`);
        console.log(`Data includes: screenshot, page structure, visible text, and element tree`);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
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

// Mock DOMParser for Node.js environment
class DOMParser {
  parseFromString(text, type) {
    // This is a very simplified parser for extracting basic information
    // In a real implementation, you might want to use a library like jsdom
    const doc = {
      querySelector: (selector) => this.querySelector(text, selector),
      querySelectorAll: (selector) => this.querySelectorAll(text, selector)
    };
    return doc;
  }
  
  querySelector(text, selector) {
    // Very simplified implementation - just for basic extraction
    if (selector === 'title') {
      const match = text.match(/<title[^>]*>(.*?)<\/title>/i);
      return match ? { textContent: match[1] } : null;
    } else if (selector === 'meta[name="description"]') {
      const match = text.match(/<meta\s+name="description"\s+content="([^"]*)"[^>]*>/i);
      return match ? { getAttribute: () => match[1] } : null;
    } else if (selector === 'link[rel="canonical"]') {
      const match = text.match(/<link\s+rel="canonical"\s+href="([^"]*)"[^>]*>/i);
      return match ? { getAttribute: () => match[1] } : null;
    }
    return null;
  }
  
  querySelectorAll(text, selector) {
    // Very simplified implementation - just returns empty array for now
    // In a real implementation, you would parse the HTML and extract elements
    if (selector === 'nav a') {
      const results = [];
      const regex = /<a\s+[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const href = match[1];
        const content = match[2].replace(/<[^>]*>/g, ''); // Remove any HTML tags inside the link
        results.push({
          textContent: content,
          getAttribute: (attr) => attr === 'href' ? href : null
        });
      }
      return results;
    } else if (selector === 'section, main, article, div.content > *') {
      // This is a very simplified implementation
      return [];
    } else if (selector === 'h1, h2, h3') {
      // This is a very simplified implementation
      return [];
    }
    return [];
  }
}

// Try to connect on startup
connectToServer();

console.log('AI Visual Feedback Cursor Extension started');
console.log('Waiting for captures from browser extension...');
console.log(`Captures will be saved to: ${CAPTURES_DIR}`); 