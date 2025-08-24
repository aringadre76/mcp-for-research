# Scholarly Research Tool

A powerful tool that helps you find and analyze academic research papers from PubMed, Google Scholar, and JSTOR.

[![NPM](https://img.shields.io/badge/npm-published-orange)](https://www.npmjs.com/package/scholarly-research-mcp)
[![GitHub](https://img.shields.io/badge/github-repo-blue)](https://github.com/aringadre76/mcp-for-research)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## What This Tool Does

This tool helps you:
- **Find research papers** on any topic from multiple academic databases
- **Read full papers** when available (not just abstracts)
- **Extract key information** like quotes, statistics, and findings
- **Get citations** in the format you need for your work
- **Search within papers** to find specific information
- **Organize research** with customizable preferences

## Project Structure

This tool is organized into several key components:

### **Core Components**
```
src/
├── index.ts                           # Main server entry point
├── adapters/                          # Data source connectors
│   ├── pubmed.ts                      # PubMed API integration
│   ├── google-scholar.ts              # Google Scholar web scraping
│   ├── google-scholar-firecrawl.ts    # Firecrawl integration
│   ├── unified-search.ts              # Basic multi-source search
│   ├── enhanced-unified-search.ts     # Advanced multi-source search
│   └── preference-aware-unified-search.ts # User preference integration
├── preferences/                       # User preference management
│   └── user-preferences.ts            # Preference storage and retrieval
└── models/                            # Data structures and interfaces
    ├── paper.ts                       # Paper data models
    ├── search.ts                      # Search parameter models
    └── preferences.ts                 # Preference models
```

### **Documentation**
```
docs/
├── ARCHITECTURE.md                    # Technical system design
├── API_REFERENCE.md                   # Complete API documentation
├── DATA_MODELS.md                     # Data structure definitions
├── DEVELOPMENT.md                     # Developer setup guide
└── TROUBLESHOOTING.md                 # Problem-solving guide
```

### **Testing**
```
tests/
├── test-preferences.js                # Preference system tests
├── test-all-tools-simple.sh           # Bash test runner
├── test_all_tools.py                  # Python test runner
└── test-all-tools.js                  # JavaScript test runner
```

### **Configuration**
```
├── package.json                       # Project dependencies and scripts
├── tsconfig.json                      # TypeScript configuration
├── .env.example                       # Environment variables template
└── README.md                          # This file
```

### **Key Features**
- **24 MCP Tools**: Complete set of research tools
- **Multi-Source Search**: PubMed, Google Scholar, and JSTOR
- **User Preferences**: Customizable search and display settings
- **Content Extraction**: Full-text paper access and analysis
- **Citation Management**: Multiple citation format support
- **Error Handling**: Robust fallback mechanisms

## Quick Start

### Option 1: Use Through AI Assistants (Easiest - No Setup Required)
If you're not comfortable with technical setup, you can use this tool through AI assistants like:
- **Claude** (Anthropic)
- **ChatGPT** (OpenAI) 
- **Cursor** (Code editor with AI)

These assistants can use this tool to help you find research papers without any setup on your part.

### Option 2: Set Up MCP on Your Computer (For Advanced Users)
This option lets you use the tool directly with AI assistants on your computer. It's like giving your AI assistant a special tool to find research papers.

## Setting Up MCP (Model Context Protocol)

MCP is like a "language" that lets AI assistants talk to tools on your computer. Think of it like installing a special app that your AI assistant can use.

### What You Need
- **A computer** (Windows, Mac, or Linux)
- **An AI assistant** that supports MCP (like Claude Desktop, Cursor, or others)
- **Basic computer skills** (downloading files, running programs)

### Step-by-Step Setup

#### Step 1: Install Node.js
Node.js is like the "engine" that runs the research tool.

**For Windows:**
1. Go to [nodejs.org](https://nodejs.org)
2. Click the big green "LTS" button to download
3. Run the downloaded file and follow the installation steps
4. Restart your computer

**For Mac:**
1. Go to [nodejs.org](https://nodejs.org)
2. Click the big green "LTS" button to download
3. Open the downloaded file and follow the installation steps

**For Linux:**
```bash
sudo apt update
sudo apt install nodejs npm
```

**Check if it worked:**
- Open Command Prompt (Windows) or Terminal (Mac/Linux)
- Type: `node --version`
- You should see a version number like "v18.17.0"

#### Step 2: Install the Research Tool
This downloads the research tool to your computer.

1. Open Command Prompt (Windows) or Terminal (Mac/Linux)
2. Type this command and press Enter:
   ```bash
   npm install -g scholarly-research-mcp
   ```
3. Wait for it to finish (it might take a few minutes)
4. You'll see a success message when it's done

#### Step 3: Set Up Your AI Assistant
Now you need to tell your AI assistant where to find the research tool.

**For Claude Desktop:**
1. Open Claude Desktop
2. Go to Settings (gear icon)
3. Find "MCP Servers" or "Tools"
4. Click "Add Server"
5. Choose "Custom"
6. Set the path to: `scholarly-research-mcp`
7. Save and restart Claude

**For Cursor:**
1. Open Cursor
2. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
3. Type "MCP" and select "MCP: Add Server"
4. Choose "Custom"
5. Set the path to: `scholarly-research-mcp`
6. Restart Cursor

**For Other AI Assistants:**
Look for settings related to "MCP", "Tools", "Servers", or "Custom Tools" in your AI assistant's settings.

#### Step 4: Test It Out
1. Restart your AI assistant
2. Ask it: "Can you help me find research papers about climate change?"
3. If it works, you'll see the AI assistant using the research tool to find papers for you!

### Troubleshooting Setup

**Problem: "Node.js is not recognized"**
- Solution: Restart your computer after installing Node.js

**Problem: "npm is not recognized"**
- Solution: Restart your computer after installing Node.js

**Problem: "Permission denied" when installing**
- **Windows**: Run Command Prompt as Administrator
- **Mac/Linux**: Add `sudo` before the command:
  ```bash
  sudo npm install -g scholarly-research-mcp
  ```

**Problem: AI assistant can't find the tool**
- Make sure you typed the path exactly: `scholarly-research-mcp`
- Try restarting your AI assistant
- Check if the tool installed correctly by typing: `scholarly-research-mcp --version`

### What Happens After Setup

Once everything is working:
- Your AI assistant will have access to 24 research tools
- You can ask it to find papers, get citations, extract content, and more
- The tool will remember your preferences and settings
- You can search across PubMed, Google Scholar, and JSTOR

### Getting Help with Setup

If you're stuck:
1. **Check the error message** - it usually tells you what's wrong
2. **Make sure Node.js is installed** - type `node --version` to check
3. **Try restarting your computer** - this fixes many setup issues
4. **Ask for help** - open an issue on GitHub with your error message

## How to Use

### Basic Search
Tell the tool what you're looking for:
- "Find papers about climate change"
- "Search for research on machine learning in healthcare"
- "Get papers about COVID-19 vaccines published in 2023"

### Get Paper Details
Once you find a paper you're interested in:
- Get the full abstract and author information
- Read the complete paper text (when available)
- Extract specific sections like Introduction, Methods, Results
- Find quotes and statistics for your research

### Save Your Preferences
The tool remembers your settings:
- Which databases to search (PubMed, Google Scholar, JSTOR)
- How many results you want to see
- How you want results displayed
- Your preferred search order

## What You Can Search

### **PubMed** (Medical and Life Sciences)
- Medical research papers
- Biology and chemistry studies
- Clinical trials and reviews
- Free access to many papers

### **Google Scholar** (All Academic Fields)
- Papers from all academic disciplines
- Books and theses
- Citation information
- Related research suggestions

### **JSTOR** (Humanities and Social Sciences)
- History and literature papers
- Social science research
- Economics and political science
- Arts and culture studies

## Examples of What You Can Do

### For Students
- Find sources for your research papers
- Get proper citations in APA, MLA, or other formats
- Extract key quotes and statistics
- Understand complex research through section breakdowns

### For Researchers
- Discover related work in your field
- Find supporting evidence for your arguments
- Track citation counts and impact
- Access full-text papers when available

### For Writers and Journalists
- Fact-check claims with academic sources
- Find expert opinions and research
- Build comprehensive bibliographies
- Access primary research sources

## Getting Help

### If Something Doesn't Work
1. **Check your internet connection** - The tool needs internet to search databases
2. **Try different search terms** - Sometimes specific terms work better than general ones
3. **Check if papers are available** - Not all papers have free full-text access
4. **Contact support** - Open an issue on GitHub if you need help

### Common Questions
**Q: Why can't I read the full paper?**
A: Some papers require subscriptions or institutional access. The tool shows you what's available for free.

**Q: How do I cite a paper I found?**
A: Use the citation tools to get the paper in the format you need (APA, MLA, etc.).

**Q: Can I save my search results?**
A: Yes! The tool remembers your preferences and can export results for you.

## For Developers

If you're a developer and want to contribute or integrate this tool:

```bash
# Get the code
git clone https://github.com/aringadre76/mcp-for-research.git
cd mcp-for-research

# Set it up
npm install
npm run build

# Run tests
npm run test:all-tools-bash
```

## Support

- **GitHub Issues**: Report problems or request features
- **Documentation**: See PROJECT_STRUCTURE.md for technical details
- **Contributing**: Help improve the tool for everyone

## License

This tool is free to use under the MIT License.
