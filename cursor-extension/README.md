# 🚀 LocalLook Autonomous AI - Cursor Extension

**Enables Cursor AI to autonomously develop frontend applications through real-time browser context and automation.**

---

## 🎯 What This Extension Does

This Cursor extension bridges Cursor AI with our Context Bridge service to enable:

- **👁️ Get Frontend Context** - Captures complete DOM structure, screenshots, and performance data
- **⚡ Quick Analysis** - Fast analysis optimized for rapid iteration
- **🧪 Test Current Frontend** - Automated browser testing with interactions
- **🤖 Start Autonomous Development** - Begin goal-oriented autonomous development cycles

---

## 📋 Commands Available

Once installed, use `Cmd+Shift+P` (or `Ctrl+Shift+P`) and search for:

### **👁️ LocalLook: Get Frontend Context**
Captures complete frontend state and displays it for Cursor AI to analyze:
- DOM structure with semantic elements
- Full-page screenshot (base64)
- Performance metrics (load times, errors)
- Accessibility analysis
- Interactive elements mapping
- Console logs and warnings

### **⚡ LocalLook: Quick Analysis**
Fast analysis perfect for rapid development cycles:
- Quick element count and structure overview
- Console error detection
- Basic interactivity validation
- Performance summary

### **🧪 LocalLook: Test Current Frontend**
Automated browser testing:
- Performs basic interactions (clicking, typing)
- Tests responsive behavior
- Validates form functionality
- Reports interaction results

### **🤖 LocalLook: Start Autonomous Development**
Goal-oriented autonomous development:
- Prompts for development goal
- Captures current frontend state
- Provides comprehensive context to Cursor AI
- Enables iterative development cycles

---

## 🛠️ Installation

### Prerequisites
1. **Context Bridge Running**: Make sure the Context Bridge is running:
   ```bash
   cd context-bridge
   python3 main.py
   ```

2. **Frontend App Running**: Your frontend should be running (e.g., `localhost:3000`)

### Install the Extension

1. **Package the Extension**:
   ```bash
   cd cursor-extension
   npm install -g vsce
   vsce package
   ```

2. **Install in Cursor**:
   - Open Cursor IDE
   - `Cmd+Shift+P` → "Extensions: Install from VSIX..."
   - Select the generated `.vsix` file
   - Reload Cursor

### Alternative: Development Installation

If you're developing/testing:
```bash
cd cursor-extension
npm install
npm run compile
```

Then in Cursor:
- `Cmd+Shift+P` → "Developer: Reload Window"
- The extension should activate automatically

---

## ⚙️ Configuration

The extension can be configured in Cursor settings:

```json
{
  "localook.contextBridgeUrl": "http://127.0.0.1:8080",
  "localook.frontendUrl": "http://localhost:3000", 
  "localook.autoAnalyze": false,
  "localook.debugMode": false
}
```

### Settings Explained:
- **contextBridgeUrl**: Where the Context Bridge service is running
- **frontendUrl**: Your frontend application URL (will prompt to confirm)
- **autoAnalyze**: Automatically analyze frontend on file saves (experimental)
- **debugMode**: Enable detailed logging in output channel

---

## 🎮 How to Use

### **Basic Workflow**

1. **Start Context Bridge**:
   ```bash
   cd context-bridge && python3 main.py
   ```

2. **Start Your Frontend**:
   ```bash
   npm start  # or your frontend start command
   ```

3. **Use in Cursor**:
   - `Cmd+Shift+P` → "LocalLook: Get Frontend Context"
   - Enter your frontend URL (e.g., `http://localhost:3000`)
   - Review the captured context in the opened document
   - Use this context to inform Cursor AI about your application state

### **Autonomous Development Workflow**

1. **Start Development Session**:
   - `Cmd+Shift+P` → "LocalLook: Start Autonomous Development"
   - Enter your goal (e.g., "Make this page responsive" or "Add a contact form")

2. **Let Cursor AI Work**:
   - The extension captures current frontend state
   - Provides comprehensive context to Cursor AI
   - Cursor AI analyzes and begins implementing changes

3. **Iterate and Test**:
   - Use "Test Current Frontend" to validate changes
   - Use "Get Frontend Context" to see updated state
   - Continue until goal is achieved

---

## 🔧 Troubleshooting

### Extension Not Working
1. Check if Context Bridge is running: `curl http://127.0.0.1:8080/health`
2. Check Cursor Developer Console: `Help` → `Toggle Developer Tools`
3. Check extension logs: `View` → `Output` → Select "LocalLook"

### Context Bridge Connection Issues
- Ensure Context Bridge is running on port 8080
- Check firewall settings
- Verify Python dependencies are installed

### Frontend Not Accessible
- Ensure your frontend is running and accessible
- Check the URL format (include `http://`)
- Verify CORS settings if needed

### Commands Not Appearing
- Reload Cursor: `Cmd+Shift+P` → "Developer: Reload Window"
- Check if extension is installed: `Extensions` panel
- Verify installation from VSIX completed successfully

---

## 📊 What Cursor AI Receives

When you use the extension, Cursor AI gets rich context including:

```markdown
# Frontend Context Analysis

## Page Overview
- URL: http://localhost:3000
- Title: My React App
- Viewport: 1280x720
- Captured: 2024-01-01T12:00:00

## Structure Summary
- Total Elements: 45
- Forms: 2
- Buttons: 8
- Links: 12
- Interactive Elements: 15

## Quality Metrics
### Performance
- Load Time: 1.2s
- Errors: 0
- Warnings: 2

### Accessibility
- Score: 85/100
- Issues Found: 3

## Key DOM Elements
- h1 #main-title: Welcome to My App
- button .submit-btn: Submit Form
- form #contact-form: Contact form with 4 inputs

## Screenshot Available
✅ Full-page screenshot captured and available
```

This gives Cursor AI complete visibility into your running application!

---

## 🚀 Advanced Usage

### Custom Frontend URLs
The extension will prompt for your frontend URL each time, but you can set a default in settings.

### Multiple Projects
Each workspace can have its own settings for different frontend URLs and Context Bridge instances.

### Debug Mode
Enable debug mode to see detailed logs of all extension operations in the Output panel.

---

## 🎊 The Result

With this extension, Cursor AI can:
- **See** your running frontend application
- **Understand** the complete DOM structure and layout
- **Test** interactions and user flows
- **Analyze** performance and accessibility
- **Make informed decisions** about code changes
- **Iterate autonomously** toward development goals

**This enables truly autonomous AI development cycles!**

---

## 📋 Next Steps

1. Install and test the extension
2. Try the "Get Frontend Context" command
3. Experiment with "Start Autonomous Development"
4. Use the rich context to guide Cursor AI in making better decisions
5. Iterate and improve your frontend with AI assistance

**Welcome to the future of AI-assisted frontend development!** 🌟
