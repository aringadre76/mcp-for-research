# LLM-Friendly Frontend Data Format

This document explains how the AI Visual Feedback Bridge extracts and formats frontend data to help LLMs "see what you see" in your web applications.

## What LLMs Need to Understand Frontend UIs

### 1. **Visual Context (Screenshot)**
- **Why**: LLMs with vision capabilities can see the actual layout, colors, spacing, and visual bugs
- **Format**: Base64-encoded PNG image
- **Usage**: Reference in prompts like "Here's a screenshot of my app..."

### 2. **Hierarchical Page Structure (Outline)**
- **Why**: LLMs are better at reasoning about pages with a structured outline
- **Format**: Tree-like structure with headings, sections, and navigation
- **Usage**: Helps LLM "map" the screenshot to logical structure

### 3. **Visible Text Content**
- **Why**: Matches text in screenshot to DOM, understanding what's visible and important
- **Format**: Clean, filtered text with element type annotations
- **Usage**: Provides context for what users actually read

### 4. **Key UI Elements and Relationships**
- **Why**: LLMs need to know what's interactive and how elements are grouped
- **Format**: Categorized interactive elements (buttons, links, forms, inputs)
- **Usage**: Understands user interactions and page functionality

## Data Structure Example

```json
{
  "screenshot": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  
  "pageStructure": {
    "title": "My Awesome App",
    "url": "https://example.com/dashboard",
    "headings": "# Dashboard\n## Recent Activity\n## Quick Actions",
    "navigation": {
      "mainNavigation": [
        {
          "role": "navigation",
          "items": [
            {"text": "Dashboard", "href": "/dashboard", "isActive": true},
            {"text": "Projects", "href": "/projects", "isActive": false}
          ]
        }
      ]
    },
    "forms": [
      {
        "action": "/api/search",
        "method": "get",
        "inputs": [
          {"type": "text", "name": "q", "placeholder": "Search...", "required": false}
        ]
      }
    ],
    "interactiveElements": {
      "buttons": [
        {"text": "Create Project", "type": "button", "disabled": false}
      ],
      "links": [
        {"text": "View All", "href": "/projects", "isExternal": false}
      ],
      "inputs": [
        {"type": "email", "name": "email", "placeholder": "Enter email", "required": true}
      ]
    }
  },
  
  "visibleText": [
    {"text": "Welcome back, John!", "type": "heading", "tag": "h1"},
    {"text": "You have 3 new notifications", "type": "content", "tag": "p"},
    {"text": "Create Project", "type": "button", "tag": "button"}
  ],
  
  "elementTree": {
    "tag": "body",
    "type": "content",
    "text": "",
    "children": [
      {
        "tag": "header",
        "type": "header",
        "text": "My Awesome App",
        "children": [
          {
            "tag": "nav",
            "type": "navigation",
            "text": "",
            "children": [
              {
                "tag": "a",
                "type": "a",
                "text": "Dashboard",
                "href": "/dashboard"
              }
            ]
          }
        ]
      }
    ]
  },
  
  "summary": {
    "pageType": "dashboard",
    "mainContent": [
      "Welcome back, John!",
      "You have 3 new notifications",
      "Recent activity shows increased engagement"
    ],
    "keyActions": [
      "Button: Create Project",
      "Link: View All Projects",
      "Link: Settings"
    ],
    "structure": {
      "sections": 3,
      "interactiveElements": 8,
      "contentBlocks": 12
    }
  }
}
```

## How to Use This Data with LLMs

### Example Prompt Structure

```
Here's a screenshot of my app and structured data about the UI:

**Screenshot**: [screenshot data]

**Page Structure**:
- Title: {pageStructure.title}
- URL: {pageStructure.url}
- Headings: {pageStructure.headings}
- Navigation: {pageStructure.navigation}
- Forms: {pageStructure.forms}
- Interactive Elements: {pageStructure.interactiveElements}

**Visible Text**: {visibleText}

**Summary**: {summary}

Please help me:
1. Identify any visual bugs or layout issues
2. Suggest improvements to the user interface
3. Fix any accessibility problems
4. Optimize the user experience
```

### Benefits for Different Use Cases

#### **Visual Bug Detection**
- LLM can compare screenshot with DOM structure
- Identifies misaligned elements, broken layouts
- Suggests CSS fixes based on visual evidence

#### **Accessibility Audits**
- Analyzes heading hierarchy and navigation structure
- Identifies missing alt text, ARIA labels
- Suggests improvements for screen readers

#### **UX Optimization**
- Understands user flow through interactive elements
- Identifies confusing navigation or unclear CTAs
- Suggests better information architecture

#### **Code Generation**
- Generates HTML/CSS based on visual requirements
- Creates accessible markup with proper structure
- Implements responsive design patterns

## Page Type Detection

The system automatically categorizes pages:

- **login**: Authentication pages
- **registration**: Sign-up forms
- **dashboard**: Admin/control panels
- **product**: E-commerce product pages
- **form**: Data entry forms
- **article**: Content/blog pages
- **general**: Other page types

This helps LLMs provide context-appropriate suggestions.

## Real-time Updates

The system can capture changes in real-time:
- DOM mutations trigger automatic re-extraction
- Debounced updates prevent excessive processing
- Maintains context across page changes

## Privacy and Security

- All data stays local by default
- Screenshots and DOM data are not sent to external services
- User controls what gets captured and shared
- Sensitive information can be filtered out 