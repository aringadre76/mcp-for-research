# Integrating AI Visual Feedback Bridge with LLMs

This guide explains how to use the AI Visual Feedback Bridge with Large Language Models (LLMs) to enable AI-powered visual debugging and frontend assistance.

## The AI-Friendly Output Format

When you capture a page using the browser extension, the cursor extension now generates an AI-friendly JSON file (`ai-friendly-[timestamp].json`) that combines:

1. **Screenshot** - Base64-encoded PNG image of the page
2. **DOM Structure** - Cleaned HTML without unnecessary scripts and styles
3. **Structured Data** - Key information extracted from the page:
   - Page title and meta description
   - Navigation items
   - Main content sections
   - URL information

This combined format provides LLMs with both visual and structural context in a single file.

## Example JSON Structure

```json
{
  "timestamp": "2025-07-22T23:47:09.425Z",
  "pageInfo": {
    "title": "Arin Gadre",
    "metaDescription": "Building the future, one line of code at a time",
    "url": "http://localhost:1313/"
  },
  "navigation": [
    { "text": "About", "href": "/about/" },
    { "text": "Projects", "href": "/projects/" },
    { "text": "Experience", "href": "/experience/" },
    { "text": "Contact", "href": "/contact/" },
    { "text": "Resume", "href": "/resume.pdf" }
  ],
  "mainSections": [
    {
      "heading": "Arin Gadre",
      "content": "Full Stack Engineer | UCSC Student"
    }
  ],
  "fullDOM": "<!DOCTYPE html><html>...</html>",
  "screenshot": "data:image/png;base64,..."
}
```

## Integration Methods

### 1. Direct API Integration

For direct integration with OpenAI, Anthropic, or other LLM APIs:

```python
import json
import requests

# Load the AI-friendly data
with open('ai-friendly-20250722T234709425Z.json', 'r') as f:
    data = json.load(f)

# Prepare the prompt
prompt = f"""
I'm looking at a webpage with the following information:
- Title: {data['pageInfo']['title']}
- Description: {data['pageInfo']['metaDescription']}
- URL: {data['pageInfo']['url']}

Navigation menu items: {', '.join([item['text'] for item in data['navigation']])}

The screenshot of this page is included as a base64 image.

I'm having an issue with the layout. The navigation menu items are not properly aligned. 
Can you analyze the DOM structure and suggest a fix?

DOM Structure:
{data['fullDOM'][:1000]}... (truncated)
"""

# Call the LLM API
response = requests.post(
    'https://api.openai.com/v1/chat/completions',
    headers={
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    },
    json={
        'model': 'gpt-4-vision-preview',
        'messages': [
            {
                'role': 'user',
                'content': [
                    {'type': 'text', 'text': prompt},
                    {'type': 'image_url', 'image_url': {'url': data['screenshot']}}
                ]
            }
        ],
        'max_tokens': 1000
    }
)

print(response.json()['choices'][0]['message']['content'])
```

### 2. Cursor IDE Integration

To integrate with Cursor IDE:

1. Install the Cursor extension as described in the setup guide
2. When you need AI assistance, run:

```bash
cd cursor-extension
node llm-integration.js --file=captures/ai-friendly-[timestamp].json
```

This will:
- Load the AI-friendly JSON file
- Format it for the Cursor AI
- Send it to the Cursor API
- Display the response in the Cursor panel

### 3. Local LLM Integration

For local LLMs like Ollama:

```bash
# Run Ollama with the Llava model (supports images)
ollama run llava

# Then in another terminal
python scripts/ollama_integration.py --file=cursor-extension/captures/ai-friendly-[timestamp].json
```

## Best Practices

1. **Provide Clear Context**: When asking the LLM for help, be specific about what you're trying to fix or understand.

2. **Reference Visual Elements**: Refer to specific parts of the screenshot: "the navbar at the top" or "the form in the center."

3. **Use for Specific Tasks**:
   - Layout debugging
   - CSS troubleshooting
   - Responsive design issues
   - Accessibility improvements
   - UI/UX suggestions

4. **Combine with Code Context**: For best results, provide both the visual feedback and relevant code files.

## Future Improvements

In future versions, we plan to:

1. Add automatic element highlighting and labeling in screenshots
2. Include computed CSS styles for key elements
3. Capture responsive views at multiple viewport sizes
4. Add interactive elements to the viewer for better debugging
5. Integrate directly with popular LLM APIs

## Example Integration Scripts

Example integration scripts for various LLMs and platforms are available in the `scripts/` directory:

- `openai_integration.py` - For OpenAI GPT-4 Vision
- `anthropic_integration.py` - For Anthropic Claude 3
- `cursor_integration.js` - For Cursor IDE
- `ollama_integration.py` - For local Ollama models
- `browser_extension.js` - For direct integration with the browser extension 