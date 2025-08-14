#!/usr/bin/env python3
"""
Integration Test for LocalLook Cursor-Centric Architecture

Tests the complete integration between:
1. Context Bridge (Phase 1) 
2. Cursor Extension (Phase 2)
3. End-to-end workflow

This validates that everything works together for autonomous AI development.
"""

import asyncio
import requests
import json
import subprocess
import time
from datetime import datetime


class IntegrationTester:
    def __init__(self):
        self.context_bridge_url = "http://127.0.0.1:8080"
        self.test_frontend_url = "https://example.com"  # Simple test site
        self.tests_passed = 0
        self.tests_failed = 0

    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def test_context_bridge_health(self):
        """Test that Context Bridge is running and healthy"""
        self.log("Testing Context Bridge health...")
        
        try:
            response = requests.get(f"{self.context_bridge_url}/health", timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy" and data.get("browser_ready"):
                    self.log("✅ Context Bridge is healthy and ready", "SUCCESS")
                    self.tests_passed += 1
                    return True
                else:
                    self.log(f"❌ Context Bridge unhealthy: {data}", "ERROR")
                    self.tests_failed += 1
                    return False
            else:
                self.log(f"❌ Context Bridge returned {response.status_code}", "ERROR")
                self.tests_failed += 1
                return False
                
        except requests.exceptions.RequestException as e:
            self.log(f"❌ Context Bridge not accessible: {e}", "ERROR")
            self.tests_failed += 1
            return False

    def test_full_context_capture(self):
        """Test full context capture like the Cursor extension would do"""
        self.log("Testing full context capture (Cursor extension workflow)...")
        
        try:
            # Simulate the exact request the Cursor extension makes
            capture_request = {
                "url": self.test_frontend_url,
                "options": {
                    "screenshot": True,
                    "dom_analysis": True,
                    "performance": True,
                    "accessibility": True,
                    "responsive": False,
                    "console_logs": True
                },
                "viewport": {"width": 1280, "height": 720}
            }
            
            response = requests.post(
                f"{self.context_bridge_url}/capture",
                json=capture_request,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate the response has all expected fields
                required_fields = [
                    "timestamp", "url", "title", "viewport", "elements", 
                    "forms", "buttons", "links", "inputs", "interactive",
                    "interactions", "console_logs"
                ]
                
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    # Check if we got meaningful data
                    elements_count = len(data.get("elements", []))
                    has_screenshot = bool(data.get("screenshot"))
                    
                    self.log(f"✅ Full context captured successfully", "SUCCESS")
                    self.log(f"   Elements: {elements_count}, Screenshot: {has_screenshot}", "INFO")
                    self.log(f"   Title: {data.get('title', 'Unknown')}", "INFO")
                    
                    self.tests_passed += 1
                    return True
                else:
                    self.log(f"❌ Context missing fields: {missing_fields}", "ERROR")
                    self.tests_failed += 1
                    return False
            else:
                self.log(f"❌ Context capture failed: {response.status_code}", "ERROR")
                self.tests_failed += 1
                return False
                
        except requests.exceptions.RequestException as e:
            self.log(f"❌ Context capture failed: {e}", "ERROR")
            self.tests_failed += 1
            return False

    def test_quick_analysis(self):
        """Test quick analysis endpoint like Cursor extension"""
        self.log("Testing quick analysis workflow...")
        
        try:
            response = requests.post(
                f"{self.context_bridge_url}/quick-analyze",
                params={"url": self.test_frontend_url, "focus": "general"},
                timeout=20
            )
            
            if response.status_code == 200:
                data = response.json()
                summary = data.get("summary", {})
                
                if summary.get("url") and "elements_found" in summary:
                    self.log(f"✅ Quick analysis successful", "SUCCESS")
                    self.log(f"   Found {summary['elements_found']} elements", "INFO")
                    self.log(f"   Interactive: {summary.get('interactive_elements', 0)}", "INFO")
                    
                    self.tests_passed += 1
                    return True
                else:
                    self.log(f"❌ Quick analysis incomplete data: {summary}", "ERROR")
                    self.tests_failed += 1
                    return False
            else:
                self.log(f"❌ Quick analysis failed: {response.status_code}", "ERROR")
                self.tests_failed += 1
                return False
                
        except requests.exceptions.RequestException as e:
            self.log(f"❌ Quick analysis failed: {e}", "ERROR")
            self.tests_failed += 1
            return False

    def test_browser_interactions(self):
        """Test browser interaction capabilities"""
        self.log("Testing browser interactions...")
        
        try:
            interact_request = {
                "url": self.test_frontend_url,
                "actions": [
                    {"type": "wait", "duration": 1000},
                    {"type": "scroll", "coordinates": {"x": 0, "y": 300}},
                    {"type": "wait", "duration": 1000}
                ],
                "capture_after": True
            }
            
            response = requests.post(
                f"{self.context_bridge_url}/interact",
                json=interact_request,
                timeout=25
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") and data.get("interactions_performed", 0) > 0:
                    self.log(f"✅ Browser interactions successful", "SUCCESS")
                    self.log(f"   Performed {data['interactions_performed']} actions", "INFO")
                    
                    if data.get("updated_context"):
                        self.log("   Updated context captured after interactions", "INFO")
                    
                    self.tests_passed += 1
                    return True
                else:
                    self.log(f"❌ Browser interactions failed: {data}", "ERROR")
                    self.tests_failed += 1
                    return False
            else:
                self.log(f"❌ Browser interactions failed: {response.status_code}", "ERROR")
                self.tests_failed += 1
                return False
                
        except requests.exceptions.RequestException as e:
            self.log(f"❌ Browser interactions failed: {e}", "ERROR")
            self.tests_failed += 1
            return False

    def test_cursor_extension_compilation(self):
        """Test that Cursor extension compiled correctly"""
        self.log("Testing Cursor extension compilation...")
        
        try:
            import os
            
            # Check if extension compiled output exists
            extension_path = "/home/robot/localook/cursor-extension"
            out_path = os.path.join(extension_path, "out")
            
            if not os.path.exists(out_path):
                self.log("❌ Extension output directory not found", "ERROR")
                self.tests_failed += 1
                return False
            
            # Check for key compiled files
            required_files = ["extension.js", "commands.js"]
            missing_files = []
            
            for file in required_files:
                file_path = os.path.join(out_path, file)
                if not os.path.exists(file_path):
                    missing_files.append(file)
            
            if missing_files:
                self.log(f"❌ Extension missing compiled files: {missing_files}", "ERROR")
                self.tests_failed += 1
                return False
            
            # Check package.json is valid
            package_path = os.path.join(extension_path, "package.json")
            try:
                with open(package_path, 'r') as f:
                    package_data = json.load(f)
                
                # Verify key extension properties
                if package_data.get("name") != "localook-autonomous-ai":
                    self.log("❌ Extension package.json has wrong name", "ERROR")
                    self.tests_failed += 1
                    return False
                
                # Check commands are defined
                commands = package_data.get("contributes", {}).get("commands", [])
                expected_commands = [
                    "localook.getContext",
                    "localook.quickAnalyze", 
                    "localook.testCurrent",
                    "localook.startAutonomous"
                ]
                
                actual_commands = [cmd.get("command") for cmd in commands]
                missing_commands = [cmd for cmd in expected_commands if cmd not in actual_commands]
                
                if missing_commands:
                    self.log(f"❌ Extension missing commands: {missing_commands}", "ERROR")
                    self.tests_failed += 1
                    return False
                
                self.log("✅ Cursor extension compiled and configured correctly", "SUCCESS")
                self.log(f"   Commands available: {len(actual_commands)}", "INFO")
                self.tests_passed += 1
                return True
                
            except json.JSONDecodeError as e:
                self.log(f"❌ Extension package.json invalid: {e}", "ERROR")
                self.tests_failed += 1
                return False
                
        except Exception as e:
            self.log(f"❌ Extension compilation test failed: {e}", "ERROR")
            self.tests_failed += 1
            return False

    def test_integration_data_flow(self):
        """Test the complete data flow from Context Bridge to Cursor format"""
        self.log("Testing integration data flow...")
        
        try:
            # Capture context like Cursor extension would
            response = requests.post(f"{self.context_bridge_url}/capture", json={
                "url": self.test_frontend_url,
                "options": {
                    "screenshot": True,
                    "dom_analysis": True,
                    "performance": True,
                    "accessibility": True
                }
            }, timeout=30)
            
            if response.status_code != 200:
                self.log("❌ Failed to capture context for data flow test", "ERROR")
                self.tests_failed += 1
                return False
            
            context_data = response.json()
            
            # Simulate the formatting that Cursor extension does
            formatted_context = self.format_context_for_ai_test(context_data)
            
            # Verify the formatted context has the expected structure
            expected_sections = [
                "# Frontend Context Analysis",
                "## Page Overview",
                "## Structure Summary", 
                "## Quality Metrics",
                "## Key DOM Elements"
            ]
            
            missing_sections = [section for section in expected_sections if section not in formatted_context]
            
            if missing_sections:
                self.log(f"❌ Formatted context missing sections: {missing_sections}", "ERROR")
                self.tests_failed += 1
                return False
            
            # Check if context contains meaningful data
            if len(formatted_context) < 500:  # Should be substantial
                self.log("❌ Formatted context too short, likely missing data", "ERROR")
                self.tests_failed += 1
                return False
            
            self.log("✅ Integration data flow successful", "SUCCESS")
            self.log(f"   Formatted context length: {len(formatted_context)} chars", "INFO")
            self.log(f"   Contains {len(expected_sections)} expected sections", "INFO")
            
            self.tests_passed += 1
            return True
            
        except Exception as e:
            self.log(f"❌ Integration data flow test failed: {e}", "ERROR")
            self.tests_failed += 1
            return False

    def format_context_for_ai_test(self, context):
        """Simplified version of the Cursor extension's formatting logic"""
        elements_count = len(context.get("elements", []))
        forms_count = len(context.get("forms", []))
        buttons_count = len(context.get("buttons", []))
        
        return f"""# Frontend Context Analysis

## Page Overview
- **URL**: {context.get('url')}
- **Title**: {context.get('title')}
- **Captured**: {context.get('timestamp')}

## Structure Summary
- **Total Elements**: {elements_count}
- **Forms**: {forms_count}
- **Buttons**: {buttons_count}

## Quality Metrics
### Performance
- **Load Time**: {context.get('performance', {}).get('load_time', 'Unknown')}s

## Key DOM Elements
{chr(10).join([f"- **{el.get('tag')}**: {el.get('text', 'No text')[:50]}" for el in context.get('elements', [])[:5]])}

This context provides complete visibility into the running application state."""

    def run_all_tests(self):
        """Run the complete integration test suite"""
        self.log("=" * 60)
        self.log("LocalLook Integration Test Suite")
        self.log("Testing Phase 1 + Phase 2 Integration")
        self.log("=" * 60)
        
        tests = [
            ("Context Bridge Health", self.test_context_bridge_health),
            ("Full Context Capture", self.test_full_context_capture),
            ("Quick Analysis", self.test_quick_analysis),
            ("Browser Interactions", self.test_browser_interactions),
            ("Cursor Extension Compilation", self.test_cursor_extension_compilation),
            ("Integration Data Flow", self.test_integration_data_flow)
        ]
        
        for test_name, test_func in tests:
            self.log(f"\n{'='*20} {test_name} {'='*20}")
            try:
                test_func()
            except Exception as e:
                self.log(f"❌ {test_name}: EXCEPTION - {e}", "ERROR")
                self.tests_failed += 1
            
            time.sleep(1)  # Brief pause between tests
        
        # Results summary
        self.log(f"\n{'='*60}")
        self.log("INTEGRATION TEST RESULTS")
        self.log(f"{'='*60}")
        
        total_tests = self.tests_passed + self.tests_failed
        success_rate = (self.tests_passed / total_tests * 100) if total_tests > 0 else 0
        
        self.log(f"Tests Passed: {self.tests_passed}")
        self.log(f"Tests Failed: {self.tests_failed}")
        self.log(f"Success Rate: {success_rate:.1f}%")
        
        if self.tests_failed == 0:
            self.log("\n🎉 ALL INTEGRATION TESTS PASSED!", "SUCCESS")
            self.log("LocalLook Cursor-Centric Architecture is working perfectly!")
            self.log("\n✅ Ready for Phase 3 and end-to-end autonomous development!")
        else:
            self.log(f"\n⚠️  {self.tests_failed} test(s) failed", "ERROR")
            self.log("Please check the errors above and ensure all services are running")
        
        return self.tests_failed == 0


def main():
    print("🧪 LocalLook Integration Tester")
    print("Testing Cursor-Centric Architecture (Phase 1 + Phase 2)")
    print()
    
    tester = IntegrationTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🚀 Integration test successful!")
        print("The LocalLook autonomous AI development system is ready!")
        print("\nNext steps:")
        print("1. Install Cursor extension")
        print("2. Test with your React application")
        print("3. Try autonomous development workflows")
    else:
        print("\n❌ Integration test failed.")
        print("Please fix the issues above before proceeding.")
    
    return 0 if success else 1


if __name__ == "__main__":
    exit(main())
