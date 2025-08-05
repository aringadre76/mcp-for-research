#!/usr/bin/env python3
"""
CLI tool for Local AI Bridge
"""

import asyncio
import json
import sys
import argparse
from typing import Optional
import aiohttp
from config import AIConfig

class LocalAICLI:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def health_check(self) -> bool:
        """Check if the server is running"""
        try:
            async with self.session.get(f"{self.base_url}/health") as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Server is healthy: {data}")
                    return True
                else:
                    print(f"❌ Server health check failed: {response.status}")
                    return False
        except Exception as e:
            print(f"❌ Cannot connect to server: {e}")
            return False
    
    async def list_models(self):
        """List available models"""
        try:
            async with self.session.get(f"{self.base_url}/models") as response:
                if response.status == 200:
                    data = await response.json()
                    print("\n🤖 Available Models:")
                    print("=" * 50)
                    for model_id, info in data['models'].items():
                        print(f"📦 {model_id}")
                        print(f"   Name: {info['name']}")
                        print(f"   Description: {info['description']}")
                        print(f"   Memory: {info['memory_usage']}")
                        print(f"   Speed: {info['speed']}")
                        print(f"   Recommended for: {', '.join(info['recommended_for'])}")
                        print()
                else:
                    print(f"❌ Failed to get models: {response.status}")
        except Exception as e:
            print(f"❌ Error listing models: {e}")
    
    async def list_tasks(self):
        """List available predefined tasks"""
        try:
            async with self.session.get(f"{self.base_url}/tasks") as response:
                if response.status == 200:
                    data = await response.json()
                    print("\n📋 Available Tasks:")
                    print("=" * 50)
                    for task_id, info in data['tasks'].items():
                        print(f"🎯 {task_id}")
                        print(f"   Name: {info['name']}")
                        print(f"   Description: {info['description']}")
                        print(f"   Recommended Model: {info['recommended_model']}")
                        print()
                else:
                    print(f"❌ Failed to get tasks: {response.status}")
        except Exception as e:
            print(f"❌ Error listing tasks: {e}")
    
    async def analyze_url(self, url: str, task_type: Optional[str] = None, 
                         custom_task: Optional[str] = None, model: Optional[str] = None):
        """Analyze a URL"""
        try:
            payload = {
                "url": url,
                "task_type": task_type,
                "task": custom_task,
                "model": model
            }
            
            # Remove None values
            payload = {k: v for k, v in payload.items() if v is not None}
            
            print(f"🤖 Analyzing {url}...")
            if task_type:
                print(f"📋 Task: {task_type}")
            if custom_task:
                print(f"📝 Custom task: {custom_task}")
            if model:
                print(f"🧠 Model: {model}")
            print()
            
            async with self.session.post(f"{self.base_url}/capture", json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    if data['success']:
                        result = data['data']
                        print("✅ Analysis completed!")
                        print("=" * 50)
                        print(f"URL: {result['url']}")
                        print(f"Task: {result['task']}")
                        print(f"Model: {result['model']}")
                        print(f"Timestamp: {result['timestamp']}")
                        print("\n📊 Analysis Results:")
                        print("-" * 30)
                        print(result['result'])
                    else:
                        print(f"❌ Analysis failed: {data['error']}")
                else:
                    print(f"❌ Request failed: {response.status}")
                    error_text = await response.text()
                    print(f"Error details: {error_text}")
        except Exception as e:
            print(f"❌ Error analyzing URL: {e}")
    
    async def get_config(self):
        """Get server configuration"""
        try:
            async with self.session.get(f"{self.base_url}/config") as response:
                if response.status == 200:
                    data = await response.json()
                    print("\n⚙️ Server Configuration:")
                    print("=" * 50)
                    print("Server:")
                    for key, value in data['server'].items():
                        print(f"  {key}: {value}")
                    print("\nBrowser:")
                    for key, value in data['browser'].items():
                        print(f"  {key}: {value}")
                else:
                    print(f"❌ Failed to get config: {response.status}")
        except Exception as e:
            print(f"❌ Error getting config: {e}")

async def main():
    parser = argparse.ArgumentParser(description="Local AI Bridge CLI")
    parser.add_argument("--url", "-u", help="Base URL of the server", default="http://localhost:8000")
    parser.add_argument("--health", action="store_true", help="Check server health")
    parser.add_argument("--models", action="store_true", help="List available models")
    parser.add_argument("--tasks", action="store_true", help="List available tasks")
    parser.add_argument("--config", action="store_true", help="Show server configuration")
    parser.add_argument("--analyze", help="URL to analyze")
    parser.add_argument("--task-type", help="Predefined task type to use")
    parser.add_argument("--custom-task", help="Custom task description")
    parser.add_argument("--model", help="Model to use for analysis")
    
    args = parser.parse_args()
    
    if not any([args.health, args.models, args.tasks, args.config, args.analyze]):
        parser.print_help()
        return
    
    async with LocalAICLI(args.url) as cli:
        if args.health:
            await cli.health_check()
        
        if args.models:
            await cli.list_models()
        
        if args.tasks:
            await cli.list_tasks()
        
        if args.config:
            await cli.get_config()
        
        if args.analyze:
            await cli.analyze_url(
                url=args.analyze,
                task_type=args.task_type,
                custom_task=args.custom_task,
                model=args.model
            )

if __name__ == "__main__":
    asyncio.run(main()) 