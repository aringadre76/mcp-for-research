// Popup script for AI Visual Feedback Bridge

class PopupController {
  constructor() {
    this.isObserving = false;
    this.initializeElements();
    this.bindEvents();
    this.loadSettings();
  }

  initializeElements() {
    this.captureBtn = document.getElementById('capture-btn');
    this.extractBtn = document.getElementById('extract-btn');
    this.startObservingBtn = document.getElementById('start-observing-btn');
    this.stopObservingBtn = document.getElementById('stop-observing-btn');
    this.autoCaptureToggle = document.getElementById('auto-capture-toggle');
    this.statusDiv = document.getElementById('status');
  }

  bindEvents() {
    this.captureBtn.addEventListener('click', () => this.capturePage());
    this.extractBtn.addEventListener('click', () => this.extractUIStructure());
    this.startObservingBtn.addEventListener('click', () => this.startObserving());
    this.stopObservingBtn.addEventListener('click', () => this.stopObserving());
    this.autoCaptureToggle.addEventListener('change', (e) => this.toggleAutoCapture(e.target.checked));
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message) => this.handleMessage(message));
  }

  loadSettings() {
    chrome.storage.local.get(['autoCapture', 'isObserving'], (result) => {
      if (result.autoCapture) {
        this.autoCaptureToggle.checked = result.autoCapture;
      }
      if (result.isObserving) {
        this.isObserving = result.isObserving;
        this.updateObservingUI();
      }
    });
  }

  async capturePage() {
    this.showStatus('📸 Capturing page...', 'info');
    this.disableButtons();
    
    try {
      chrome.runtime.sendMessage({ action: 'capture' });
    } catch (error) {
      this.showStatus(`❌ Error: ${error.message}`, 'error');
      this.enableButtons();
    }
  }

  async extractUIStructure() {
    this.showStatus('🔍 Extracting UI structure...', 'info');
    this.disableButtons();
    
    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Send message to content script to extract data
      chrome.tabs.sendMessage(tab.id, { action: 'extract' });
    } catch (error) {
      this.showStatus(`❌ Error: ${error.message}`, 'error');
      this.enableButtons();
    }
  }

  async startObserving() {
    this.showStatus('▶️ Starting auto-capture...', 'info');
    
    try {
      chrome.runtime.sendMessage({ action: 'start-observing' });
      this.isObserving = true;
      this.updateObservingUI();
      
      // Save state
      chrome.storage.local.set({ isObserving: true });
      
      this.showStatus('✅ Auto-capture started!', 'success');
    } catch (error) {
      this.showStatus(`❌ Error: ${error.message}`, 'error');
    }
  }

  async stopObserving() {
    this.showStatus('⏹️ Stopping auto-capture...', 'info');
    
    try {
      chrome.runtime.sendMessage({ action: 'stop-observing' });
      this.isObserving = false;
      this.updateObservingUI();
      
      // Save state
      chrome.storage.local.set({ isObserving: false });
      
      this.showStatus('✅ Auto-capture stopped!', 'success');
    } catch (error) {
      this.showStatus(`❌ Error: ${error.message}`, 'error');
    }
  }

  toggleAutoCapture(enabled) {
    chrome.storage.local.set({ autoCapture: enabled });
    
    if (enabled && !this.isObserving) {
      this.startObserving();
    } else if (!enabled && this.isObserving) {
      this.stopObserving();
    }
  }

  updateObservingUI() {
    if (this.isObserving) {
      this.startObservingBtn.style.display = 'none';
      this.stopObservingBtn.style.display = 'block';
      this.autoCaptureToggle.checked = true;
    } else {
      this.startObservingBtn.style.display = 'block';
      this.stopObservingBtn.style.display = 'none';
      this.autoCaptureToggle.checked = false;
    }
  }

  handleMessage(message) {
    switch (message.action) {
      case 'capture-complete':
        this.handleCaptureComplete(message);
        break;
        
      case 'extract-complete':
        this.handleExtractComplete(message);
        break;
    }
  }

  handleCaptureComplete(message) {
    this.enableButtons();
    
    if (message.success) {
      this.showStatus('✅ Capture sent to Cursor!', 'success');
    } else {
      const errorMessage = message.error || 'Unknown error';
      console.error('Capture failed:', errorMessage);
      
      // Format the error message for better display
      let displayError = errorMessage;
      if (errorMessage.includes('Cannot capture this page')) {
        displayError = 'Cannot capture this page. The extension only works on regular web pages.';
      } else if (errorMessage.includes('Cannot access this page')) {
        displayError = 'Cannot access page content. Try refreshing the page first.';
      }
      
      this.showStatus(`❌ Capture failed: ${displayError}`, 'error');
    }
  }

  handleExtractComplete(message) {
    this.enableButtons();
    
    if (message.success) {
      const data = message.data;
      
      // Check if we have the data in the expected format
      if (data && data.llmData && data.llmData.summary) {
        const summary = data.llmData.summary;
        this.showStatus(`✅ UI extracted! Page type: ${summary.pageType}`, 'success');
        
        // Log extraction details for debugging
        console.log('Extraction completed:', {
          url: data.url,
          title: data.title,
          pageType: summary.pageType,
          sections: summary.structure ? summary.structure.sections : 'N/A',
          interactiveElements: summary.structure ? summary.structure.interactiveElements : 'N/A',
          contentBlocks: summary.structure ? summary.structure.contentBlocks : 'N/A'
        });
      } else {
        this.showStatus(`✅ UI extracted successfully!`, 'success');
        console.log('Extraction data:', data);
      }
    } else {
      const errorMessage = message.error || 'Unknown error';
      console.error('Extraction failed:', errorMessage);
      
      // Format the error message for better display
      let displayError = errorMessage;
      if (errorMessage.includes('Cannot capture this page')) {
        displayError = 'Cannot capture this page. The extension only works on regular web pages.';
      } else if (errorMessage.includes('Cannot access this page')) {
        displayError = 'Cannot access page content. Try refreshing the page first.';
      } else if (errorMessage.includes('Failed to capture screenshot')) {
        displayError = 'Failed to capture screenshot. Try refreshing the page.';
      }
      
      this.showStatus(`❌ Extraction failed: ${displayError}`, 'error');
    }
  }

  showStatus(message, type = 'info') {
    this.statusDiv.textContent = message;
    this.statusDiv.className = `status ${type}`;
    this.statusDiv.style.display = 'block';
    
    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
      setTimeout(() => {
        this.statusDiv.style.display = 'none';
      }, 3000);
    }
  }

  disableButtons() {
    this.captureBtn.disabled = true;
    this.extractBtn.disabled = true;
    this.startObservingBtn.disabled = true;
    this.stopObservingBtn.disabled = true;
  }

  enableButtons() {
    this.captureBtn.disabled = false;
    this.extractBtn.disabled = false;
    this.startObservingBtn.disabled = false;
    this.stopObservingBtn.disabled = false;
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
}); 