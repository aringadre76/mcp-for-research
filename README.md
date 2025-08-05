# 🤖 AI Bridge - Local AI Frontend Analysis

A simple, local AI-powered tool for analyzing frontend applications using your own hardware. No API keys required!

## ✨ Features

- **🏠 Local AI**: Uses Ollama to run AI models on your RTX 4070 Super
- **🔍 Frontend Analysis**: Analyze websites for UI bugs, accessibility, performance, etc.
- **🚀 Simple Setup**: One command to start everything
- **🛠️ Easy CLI**: Simple command-line interface
- **📊 Multiple Tasks**: UI bugs, accessibility audits, performance analysis, and more

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Install Python dependencies
pip3 install -r requirements.txt

# Install Playwright browser
python3 -m playwright install chromium --with-deps

# Download AI model
ollama pull llama3.2:3b
```

### 2. Start the AI Bridge

```bash
./bin/ai-bridge start
```

### 3. Test the System

```bash
./bin/ai-bridge test
```

### 4. Analyze a Website

```bash
./bin/ai-bridge analyze https://example.com ui_bug_detection
```

## 📋 Available Commands

```bash
./bin/ai-bridge start                     # Start the AI Bridge server
./bin/ai-bridge stop                      # Stop the AI Bridge server
./bin/ai-bridge status                    # Show service status
./bin/ai-bridge test                      # Run system test
./bin/ai-bridge health                    # Check server health
./bin/ai-bridge models                    # List available AI models
./bin/ai-bridge tasks                     # List available analysis tasks
./bin/ai-bridge analyze <url> [task]      # Analyze a webpage
```

## 🎯 Analysis Tasks

- **ui_bug_detection** - Find visual bugs and layout issues
- **accessibility_audit** - WCAG compliance and accessibility issues
- **performance_analysis** - Performance bottlenecks and optimization
- **code_quality_review** - Code structure and best practices
- **ux_review** - User experience evaluation
- **seo_analysis** - Search engine optimization

## 📁 Project Structure

```
ai-bridge/
├── bin/
│   ├── ai-bridge              # Main CLI command
│   └── test.js               # System test script
├── scripts/
│   ├── start-all.sh          # Start services
│   ├── stop-all.sh           # Stop services
│   └── status.sh             # Check status
├── ai-bridge/
│   ├── working-server.py     # Main AI Bridge server
│   ├── cli.py               # Python CLI tool
│   ├── config.py            # Configuration and tasks
│   └── test-server.py       # Test server (for development)
├── logs/                     # Log files
└── requirements.txt          # Python dependencies
```

## 🔧 Examples

### Analyze Your Local Development Server
```bash
./bin/ai-bridge analyze http://localhost:3000 ui_bug_detection
```

### Check Accessibility of a Website
```bash
./bin/ai-bridge analyze https://github.com accessibility_audit
```

### Performance Analysis
```bash
./bin/ai-bridge analyze https://example.com performance_analysis
```

### Using the Python CLI Directly
```bash
python3 ai-bridge/cli.py --analyze https://example.com --task-type ui_bug_detection
```

## 🛠️ Troubleshooting

### Server Won't Start
```bash
./bin/ai-bridge stop    # Stop any running services
./bin/ai-bridge start   # Start fresh
```

### Check What's Running
```bash
./bin/ai-bridge status
```

### View Logs
```bash
tail -f logs/ai-bridge.log
```

### Ollama Issues
```bash
ollama --version        # Check Ollama is installed
ollama list             # Check available models
ollama pull llama3.2:3b # Download model if missing
```

## 🚀 Performance

With your RTX 4070 Super:
- **Analysis Time**: 5-10 seconds per request
- **Model**: llama3.2:3b (2GB VRAM usage)
- **Quality**: Detailed AI analysis with actionable recommendations

## 📊 System Requirements

- **GPU**: RTX 4070 Super (or similar with 8GB+ VRAM)
- **RAM**: 8GB+ recommended
- **OS**: Linux, macOS, or Windows with WSL
- **Python**: 3.8+
- **Node.js**: 14+ (for testing)

## 🎉 Benefits

- **No API Keys**: Everything runs locally
- **Privacy**: Your data never leaves your machine
- **Cost-Free**: No usage fees or token limits
- **Fast**: Optimized for your hardware
- **Customizable**: Add your own analysis tasks

---

**Ready to analyze your frontend with local AI power! 🎯**