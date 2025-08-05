import os
from typing import Dict, List, Optional

class AIConfig:
    """Configuration for Local AI Bridge models and tasks"""
    
    # Available models optimized for RTX 4070 Super
    MODELS = {
        'llama3.2:3b': {
            'name': 'Llama 3.2 3B',
            'description': 'Fast, good for basic analysis',
            'recommended_for': ['quick_checks', 'ui_bugs', 'basic_analysis'],
            'memory_usage': '~2GB VRAM',
            'speed': 'fast'
        },
        'codellama:7b': {
            'name': 'Code Llama 7B',
            'description': 'Excellent for code and UI analysis',
            'recommended_for': ['code_review', 'ui_analysis', 'accessibility'],
            'memory_usage': '~4GB VRAM',
            'speed': 'medium'
        },
        'mistral:7b': {
            'name': 'Mistral 7B',
            'description': 'Good balance of speed and quality',
            'recommended_for': ['general_analysis', 'performance', 'ux_review'],
            'memory_usage': '~4GB VRAM',
            'speed': 'medium'
        },
        'llama3.1:8b': {
            'name': 'Llama 3.1 8B',
            'description': 'Higher quality, slightly slower',
            'recommended_for': ['comprehensive_analysis', 'detailed_reports'],
            'memory_usage': '~6GB VRAM',
            'speed': 'slow'
        }
    }
    
    # Predefined analysis tasks
    TASKS = {
        'ui_bug_detection': {
            'name': 'UI Bug Detection',
            'description': 'Find visual bugs and layout issues',
            'prompt': """Analyze this webpage and identify:
1. Any visual bugs or layout issues
2. Broken elements or missing content
3. Responsive design problems
4. Inconsistent styling
5. User experience issues

Provide specific recommendations for fixes with actionable steps.""",
            'recommended_model': 'llama3.2:3b'
        },
        
        'accessibility_audit': {
            'name': 'Accessibility Audit',
            'description': 'Check for WCAG compliance and accessibility issues',
            'prompt': """Perform a comprehensive accessibility audit:
1. Color contrast issues
2. Keyboard navigation problems
3. Screen reader compatibility
4. ARIA label issues
5. Focus management problems
6. Semantic HTML structure
7. Alternative text for images
8. Form accessibility

Provide specific WCAG compliance recommendations with priority levels.""",
            'recommended_model': 'codellama:7b'
        },
        
        'performance_analysis': {
            'name': 'Performance Analysis',
            'description': 'Identify performance bottlenecks and optimization opportunities',
            'prompt': """Analyze this webpage for performance issues:
1. Slow loading elements
2. Large resource sizes
3. Render-blocking resources
4. Layout shift issues
5. Memory leaks
6. Optimization opportunities
7. Core Web Vitals impact
8. Resource loading patterns

Provide specific performance recommendations with estimated impact.""",
            'recommended_model': 'mistral:7b'
        },
        
        'code_quality_review': {
            'name': 'Code Quality Review',
            'description': 'Review code structure and suggest improvements',
            'prompt': """Review this page structure and suggest improvements:
1. Code organization and architecture
2. Best practices violations
3. Maintainability issues
4. Security concerns
5. Performance optimizations
6. Accessibility improvements
7. SEO considerations
8. Modern web standards compliance

Provide specific code recommendations with examples.""",
            'recommended_model': 'codellama:7b'
        },
        
        'ux_review': {
            'name': 'User Experience Review',
            'description': 'Evaluate user experience and suggest improvements',
            'prompt': """Evaluate the user experience of this webpage:
1. User flow and navigation
2. Information architecture
3. Visual hierarchy
4. Call-to-action effectiveness
5. Content readability
6. Mobile responsiveness
7. Loading states and feedback
8. Error handling

Provide specific UX recommendations with user journey considerations.""",
            'recommended_model': 'llama3.1:8b'
        },
        
        'seo_analysis': {
            'name': 'SEO Analysis',
            'description': 'Check SEO optimization and suggest improvements',
            'prompt': """Analyze this webpage for SEO optimization:
1. Meta tags and descriptions
2. Heading structure
3. Image optimization
4. Internal linking
5. Page speed impact
6. Mobile-friendliness
7. Schema markup
8. Content quality and relevance

Provide specific SEO recommendations with priority levels.""",
            'recommended_model': 'llama3.2:3b'
        }
    }
    
    # Server configuration
    SERVER_CONFIG = {
        'host': os.getenv('HOST', '127.0.0.1'),
        'port': int(os.getenv('PORT', 8000)),
        'debug': os.getenv('DEBUG', 'false').lower() == 'true',
        'default_model': os.getenv('DEFAULT_MODEL', 'llama3.2:3b'),
        'max_concurrent_requests': int(os.getenv('MAX_CONCURRENT_REQUESTS', 3))
    }
    
    # Browser configuration
    BROWSER_CONFIG = {
        'headless': os.getenv('BROWSER_HEADLESS', 'false').lower() == 'true',
        'viewport': {
            'width': int(os.getenv('BROWSER_WIDTH', 1920)),
            'height': int(os.getenv('BROWSER_HEIGHT', 1080))
        },
        'user_agent': os.getenv('BROWSER_USER_AGENT', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'),
        'timeout': int(os.getenv('BROWSER_TIMEOUT', 30000))
    }
    
    @classmethod
    def get_model_info(cls, model_name: str) -> Optional[Dict]:
        """Get information about a specific model"""
        return cls.MODELS.get(model_name)
    
    @classmethod
    def get_task_info(cls, task_name: str) -> Optional[Dict]:
        """Get information about a specific task"""
        return cls.TASKS.get(task_name)
    
    @classmethod
    def list_models(cls) -> List[str]:
        """List all available models"""
        return list(cls.MODELS.keys())
    
    @classmethod
    def list_tasks(cls) -> List[str]:
        """List all available tasks"""
        return list(cls.TASKS.keys())
    
    @classmethod
    def get_recommended_model_for_task(cls, task_name: str) -> str:
        """Get the recommended model for a specific task"""
        task = cls.get_task_info(task_name)
        if task:
            return task['recommended_model']
        return cls.SERVER_CONFIG['default_model']
    
    @classmethod
    def get_task_prompt(cls, task_name: str) -> str:
        """Get the prompt for a specific task"""
        task = cls.get_task_info(task_name)
        if task:
            return task['prompt']
        return "Analyze this webpage and provide insights about the UI and any potential issues."
    
    @classmethod
    def validate_model(cls, model_name: str) -> bool:
        """Validate if a model is supported"""
        return model_name in cls.MODELS
    
    @classmethod
    def validate_task(cls, task_name: str) -> bool:
        """Validate if a task is supported"""
        return task_name in cls.TASKS 