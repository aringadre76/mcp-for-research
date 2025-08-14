#!/usr/bin/env python3
"""
Simple test script for the Context Bridge

This script tests the basic functionality of the Context Bridge to ensure
it's working properly before integrating with Cursor.
"""

import asyncio
import requests
import json
import time
import sys
from datetime import datetime


class ContextBridgeTest:
    def __init__(self, base_url="http://127.0.0.1:8080"):
        self.base_url = base_url
        self.tests_passed = 0
        self.tests_failed = 0
    
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def test_health_check(self):
        """Test the health endpoint"""
        self.log("Testing health check...")
        
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log("✅ Health check passed", "SUCCESS")
                    self.tests_passed += 1
                    return True
                else:
                    self.log(f"❌ Health check failed: {data}", "ERROR")
                    self.tests_failed += 1
                    return False
            else:
                self.log(f"❌ Health check returned {response.status_code}", "ERROR")
                self.tests_failed += 1
                return False
                
        except requests.exceptions.RequestException as e:
            self.log(f"❌ Health check failed: {e}", "ERROR")
            self.tests_failed += 1
            return False
    
    def test_quick_analyze(self):
        """Test quick analysis with a simple website"""
        self.log("Testing quick analyze...")
        
        try:
            # Test with a reliable website
            url = "https://example.com"
            response = requests.post(
                f"{self.base_url}/quick-analyze",
                params={"url": url, "focus": "general"},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                summary = data.get("summary", {})
                
                if summary.get("title") and summary.get("elements_found", 0) > 0:
                    self.log(f"✅ Quick analyze passed: Found {summary['elements_found']} elements", "SUCCESS")
                    self.log(f"   Title: {summary['title']}", "INFO")
                    self.log(f"   Buttons: {summary['buttons']}, Forms: {summary['forms']}", "INFO")
                    self.tests_passed += 1
                    return True
                else:
                    self.log(f"❌ Quick analyze returned incomplete data: {summary}", "ERROR")
                    self.tests_failed += 1
                    return False
            else:
                self.log(f"❌ Quick analyze returned {response.status_code}: {response.text}", "ERROR")
                self.tests_failed += 1
                return False
                
        except requests.exceptions.RequestException as e:
            self.log(f"❌ Quick analyze failed: {e}", "ERROR")
            self.tests_failed += 1
            return False
    
    def test_full_capture(self):
        """Test full context capture"""
        self.log("Testing full capture...")
        
        try:
            # Use a simple, reliable website
            capture_request = {
                "url": "https://httpbin.org/html",
                "options": {
                    "screenshot": True,
                    "dom_analysis": True,
                    "performance": True,
                    "accessibility": True,
                    "responsive": False,  # Skip for speed
                    "console_logs": True
                },
                "viewport": {"width": 1280, "height": 720}
            }
            
            response = requests.post(
                f"{self.base_url}/capture",
                json=capture_request,
                timeout=45
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ["timestamp", "url", "title", "elements"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log("✅ Full capture passed", "SUCCESS")
                    self.log(f"   Elements: {len(data.get('elements', []))}", "INFO")
                    self.log(f"   Buttons: {len(data.get('buttons', []))}", "INFO")
                    self.log(f"   Links: {len(data.get('links', []))}", "INFO")
                    self.log(f"   Screenshot: {'Yes' if data.get('screenshot') else 'No'}", "INFO")
                    
                    if data.get('performance'):
                        self.log(f"   Load time: {data['performance'].get('load_time', 'N/A')}s", "INFO")
                    
                    self.tests_passed += 1
                    return True
                else:
                    self.log(f"❌ Full capture missing fields: {missing_fields}", "ERROR")
                    self.tests_failed += 1
                    return False
            else:
                self.log(f"❌ Full capture returned {response.status_code}: {response.text}", "ERROR")
                self.tests_failed += 1
                return False
                
        except requests.exceptions.RequestException as e:
            self.log(f"❌ Full capture failed: {e}", "ERROR")
            self.tests_failed += 1
            return False
    
    def test_interact(self):
        """Test browser interactions"""
        self.log("Testing browser interactions...")
        
        try:
            interact_request = {
                "url": "https://httpbin.org/forms/post",
                "actions": [
                    {"type": "wait", "duration": 1000},
                    {"type": "click", "selector": "input[name='custname']"},
                    {"type": "fill", "selector": "input[name='custname']", "value": "Test User"}
                ],
                "capture_after": True
            }
            
            response = requests.post(
                f"{self.base_url}/interact",
                json=interact_request,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") and data.get("interactions_performed", 0) > 0:
                    self.log(f"✅ Interactions passed: {data['interactions_performed']} actions performed", "SUCCESS")
                    
                    # Check if we got updated context
                    if data.get("updated_context"):
                        self.log("   Updated context captured after interactions", "INFO")
                    
                    self.tests_passed += 1
                    return True
                else:
                    self.log(f"❌ Interactions failed: {data}", "ERROR")
                    self.tests_failed += 1
                    return False
            else:
                self.log(f"❌ Interactions returned {response.status_code}: {response.text}", "ERROR")
                self.tests_failed += 1
                return False
                
        except requests.exceptions.RequestException as e:
            self.log(f"❌ Interactions failed: {e}", "ERROR")
            self.tests_failed += 1
            return False
    
    def test_service_info(self):
        """Test service info endpoint"""
        self.log("Testing service info...")
        
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("service") == "LocalLook Context Bridge":
                    self.log("✅ Service info passed", "SUCCESS")
                    self.log(f"   Version: {data.get('version')}", "INFO")
                    self.log(f"   Uptime: {data.get('uptime_seconds', 0):.1f}s", "INFO")
                    self.tests_passed += 1
                    return True
                else:
                    self.log(f"❌ Service info unexpected: {data}", "ERROR")
                    self.tests_failed += 1
                    return False
            else:
                self.log(f"❌ Service info returned {response.status_code}", "ERROR")
                self.tests_failed += 1
                return False
                
        except requests.exceptions.RequestException as e:
            self.log(f"❌ Service info failed: {e}", "ERROR")
            self.tests_failed += 1
            return False
    
    def run_all_tests(self):
        """Run all tests"""
        self.log("=" * 60)
        self.log("Starting Context Bridge Test Suite")
        self.log("=" * 60)
        
        # Check if service is running
        self.log("Checking if Context Bridge is running...")
        try:
            response = requests.get(f"{self.base_url}/", timeout=5)
            if response.status_code != 200:
                self.log("❌ Context Bridge is not running!", "ERROR")
                self.log("Please start it with: python main.py", "INFO")
                return False
        except requests.exceptions.RequestException:
            self.log("❌ Context Bridge is not running!", "ERROR")
            self.log("Please start it with: python main.py", "INFO")
            return False
        
        self.log("✅ Context Bridge is running", "SUCCESS")
        self.log("")
        
        # Run tests
        tests = [
            ("Service Info", self.test_service_info),
            ("Health Check", self.test_health_check),
            ("Quick Analyze", self.test_quick_analyze),
            ("Full Capture", self.test_full_capture),
            ("Browser Interactions", self.test_interact)
        ]
        
        for test_name, test_func in tests:
            self.log(f"Running: {test_name}")
            test_func()
            self.log("")
        
        # Results
        self.log("=" * 60)
        self.log("TEST RESULTS")
        self.log("=" * 60)
        
        total_tests = self.tests_passed + self.tests_failed
        
        if self.tests_failed == 0:
            self.log(f"🎉 ALL TESTS PASSED! ({self.tests_passed}/{total_tests})", "SUCCESS")
            self.log("")
            self.log("Context Bridge is working perfectly!")
            self.log("Ready for Cursor integration.")
        else:
            self.log(f"⚠️  SOME TESTS FAILED ({self.tests_passed}/{total_tests} passed)", "ERROR")
            self.log("")
            self.log("Please check the errors above and ensure:")
            self.log("1. Context Bridge is running (python main.py)")
            self.log("2. All dependencies are installed (pip install -r requirements.txt)")
            self.log("3. Playwright browsers are installed (playwright install chromium)")
        
        return self.tests_failed == 0


def main():
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    else:
        base_url = "http://127.0.0.1:8080"
    
    print("🧪 Context Bridge Test Suite")
    print(f"Testing service at: {base_url}")
    print()
    
    tester = ContextBridgeTest(base_url)
    success = tester.run_all_tests()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
