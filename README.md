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

## Quick Start

### Option 1: Use the Online Version (Easiest)
If you're not comfortable with technical setup, you can use this tool through AI assistants like:
- **Claude** (Anthropic)
- **ChatGPT** (OpenAI) 
- **Cursor** (Code editor with AI)

These assistants can use this tool to help you find research papers.

### Option 2: Install on Your Computer
If you want to run it yourself:

```bash
# Install the tool
npm install -g scholarly-research-mcp

# Start using it
scholarly-research-mcp
```

**Note**: This requires Node.js to be installed on your computer.

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
