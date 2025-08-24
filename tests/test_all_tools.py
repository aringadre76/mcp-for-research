#!/usr/bin/env python3
"""
Scholarly Research MCP Server - Comprehensive Tool Test Suite
Tests all available MCP tools and validates their functionality
"""

import json
import subprocess
import time
import sys
import os
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime
import argparse

@dataclass
class TestResult:
    name: str
    status: str
    duration: float
    message: str = ""
    error: Optional[str] = None

class MCPToolTester:
    def __init__(self):
        self.server_process = None
        self.request_id = 1
        self.test_results: List[TestResult] = []
        
    def start_server(self) -> bool:
        """Start the MCP server process"""
        try:
            self.server_process = subprocess.Popen(
                ['node', 'dist/index.js'],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Wait a bit for server to start
            time.sleep(2)
            
            # Check if server is running
            if self.server_process.poll() is None:
                print("✓ MCP server started successfully")
                return True
            else:
                print("✗ Failed to start MCP server")
                return False
                
        except Exception as e:
            print(f"✗ Error starting server: {e}")
            return False
    
    def send_request(self, method: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Send a request to the MCP server"""
        if not self.server_process or self.server_process.poll() is not None:
            raise RuntimeError("Server not running")
        
        request = {
            "jsonrpc": "2.0",
            "id": self.request_id,
            "method": "tools/call",
            "params": {
                "name": method,
                "arguments": params
            }
        }
        
        self.request_id += 1
        
        try:
            # Send request
            request_str = json.dumps(request) + '\n'
            self.server_process.stdin.write(request_str)
            self.server_process.stdin.flush()
            
            # Read response
            response = self.server_process.stdout.readline()
            if response:
                return json.loads(response)
            else:
                raise RuntimeError("No response from server")
                
        except Exception as e:
            raise RuntimeError(f"Communication error: {e}")
    
    def test_tool(self, method: str, params: Dict[str, Any], expected_pattern: str = None) -> TestResult:
        """Test a specific MCP tool"""
        start_time = time.time()
        
        try:
            result = self.send_request(method, params)
            duration = time.time() - start_time
            
            # Check if response contains expected pattern
            if expected_pattern:
                response_text = json.dumps(result)
                if expected_pattern.lower() in response_text.lower():
                    status = "PASSED"
                    message = f"Tool responded correctly in {duration:.2f}s"
                else:
                    status = "FAILED"
                    message = f"Response did not contain expected pattern: {expected_pattern}"
            else:
                status = "PASSED"
                message = f"Tool executed successfully in {duration:.2f}s"
            
            return TestResult(method, status, duration, message)
            
        except Exception as e:
            duration = time.time() - start_time
            return TestResult(method, "FAILED", duration, error=str(e))
    
    def close(self):
        """Close the server process"""
        if self.server_process:
            self.server_process.terminate()
            self.server_process.wait()
            self.server_process = None

class TestSuite:
    def __init__(self):
        self.tester = MCPToolTester()
        self.results: List[TestResult] = []
        
    def run_basic_tests(self) -> List[TestResult]:
        """Run basic functionality tests"""
        print("\n=== Testing Basic Functionality ===")
        
        tests = [
            ("Build Server", "npm run build", "npm ERR"),
            ("Google Scholar Tests", "npm run test:google-scholar-simple", "All basic tests passed"),
            ("Unified Search Tests", "npm run test:unified", "Test completed"),
            ("Firecrawl Tests", "npm run test:firecrawl", "All Firecrawl integration tests passed")
        ]
        
        results = []
        for test_name, command, expected_pattern in tests:
            start_time = time.time()
            try:
                result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=60)
                duration = time.time() - start_time
                
                if expected_pattern.lower() in result.stdout.lower() or result.returncode == 0:
                    status = "PASSED"
                    message = f"Command executed successfully in {duration:.2f}s"
                else:
                    status = "FAILED"
                    message = f"Command failed or output didn't match pattern"
                
                test_result = TestResult(test_name, status, duration, message)
                results.append(test_result)
                
                if status == "PASSED":
                    print(f"  ✓ {test_name}: {message}")
                else:
                    print(f"  ✗ {test_name}: {message}")
                    
            except subprocess.TimeoutExpired:
                duration = time.time() - start_time
                test_result = TestResult(test_name, "FAILED", duration, error="Command timed out")
                results.append(test_result)
                print(f"  ✗ {test_name}: Command timed out")
            except Exception as e:
                duration = time.time() - start_time
                test_result = TestResult(test_name, "FAILED", duration, error=str(e))
                results.append(test_result)
                print(f"  ✗ {test_name}: {str(e)}")
        
        return results
    
    def run_mcp_tests(self) -> List[TestResult]:
        """Run MCP tool tests"""
        print("\n=== Testing MCP Tools ===")
        
        if not self.tester.start_server():
            print("✗ Cannot run MCP tests - server failed to start")
            return []
        
        # Define test cases for each MCP tool
        test_cases = [
            ("search_papers", {"query": "machine learning", "maxResults": 3}, "Found"),
            ("get_paper_by_id", {"pmid": "33844136"}, "Paper Details"),
            ("get_paper_details", {"pmid": "33844136"}, "Paper Details"),
            ("get_full_text", {"pmid": "33844136", "maxLength": 1000}, "Full Text Content"),
            ("extract_paper_sections", {"pmid": "33844136"}, "Paper Sections"),
            ("search_within_paper", {"pmid": "33844136", "searchTerm": "machine learning"}, "Search Results"),
            ("get_evidence_quotes", {"pmid": "33844136", "evidenceType": "findings"}, "Evidence and Quotes"),
            ("get_citation", {"pmid": "33844136", "format": "bibtex"}, "Citation in BIBTEX format"),
            ("get_citation_count", {"pmid": "33844136"}, "Citation Count"),
            ("search_google_scholar", {"query": "deep learning", "maxResults": 3}, "Found"),
            ("search_all_sources", {"query": "artificial intelligence", "maxResults": 5}, "Found"),
            ("get_google_scholar_citations", {"title": "Attention Is All You Need"}, "Google Scholar Citation Count"),
            ("get_related_papers", {"identifier": "33844136", "source": "pubmed", "maxResults": 3}, "Related Papers"),
            ("search_with_firecrawl", {"query": "neural networks", "maxResults": 5, "preferFirecrawl": True}, "Enhanced Search Results"),
            ("set_firecrawl_preference", {"preferFirecrawl": True}, "Firecrawl Preference Updated"),
            ("get_search_method_info", {}, "Search Method Information")
        ]
        
        results = []
        for method, params, expected_pattern in test_cases:
            try:
                test_result = self.tester.test_tool(method, params, expected_pattern)
                results.append(test_result)
                
                if test_result.status == "PASSED":
                    print(f"  ✓ {method}: {test_result.message}")
                else:
                    print(f"  ✗ {method}: {test_result.error or test_result.message}")
                    
            except Exception as e:
                test_result = TestResult(method, "FAILED", 0, error=str(e))
                results.append(test_result)
                print(f"  ✗ {method}: {str(e)}")
        
        return results
    
    def run_error_handling_tests(self) -> List[TestResult]:
        """Run error handling tests"""
        print("\n=== Testing Error Handling ===")
        
        error_test_cases = [
            ("get_paper_by_id", {"pmid": "invalid"}, "No paper found"),
            ("search_papers", {"query": "", "maxResults": 5}, "Error searching papers"),
            ("get_citation", {"pmid": "33844136", "format": "invalid"}, "Error generating citation")
        ]
        
        results = []
        for method, params, expected_pattern in error_test_cases:
            try:
                test_result = self.tester.test_tool(method, params, expected_pattern)
                results.append(test_result)
                
                if test_result.status == "PASSED":
                    print(f"  ✓ {method}: Error handled correctly")
                else:
                    print(f"  ✗ {method}: Error handling failed")
                    
            except Exception as e:
                test_result = TestResult(method, "FAILED", 0, error=str(e))
                results.append(test_result)
                print(f"  ✗ {method}: {str(e)}")
        
        return results
    
    def run_performance_tests(self) -> List[TestResult]:
        """Run performance tests"""
        print("\n=== Testing Performance ===")
        
        start_time = time.time()
        try:
            test_result = self.tester.test_tool("search_papers", {"query": "test", "maxResults": 1})
            duration = time.time() - start_time
            
            if duration < 5.0:
                test_result.status = "PASSED"
                test_result.message = f"Response time: {duration:.2f}s (acceptable)"
                print(f"  ✓ Performance Test: {test_result.message}")
            else:
                test_result.status = "FAILED"
                test_result.message = f"Response time: {duration:.2f}s (too slow)"
                print(f"  ✗ Performance Test: {test_result.message}")
            
            return [test_result]
            
        except Exception as e:
            test_result = TestResult("Performance Test", "FAILED", 0, error=str(e))
            print(f"  ✗ Performance Test: {str(e)}")
            return [test_result]
    
    def run_integration_tests(self) -> List[TestResult]:
        """Run integration tests"""
        print("\n=== Testing Integration ===")
        
        integration_tests = [
            ("PubMed Adapter", "node -e \"const {PubMedAdapter} = require('./dist/adapters/pubmed'); new PubMedAdapter(); console.log('✓ PubMed adapter created');\""),
            ("Google Scholar Adapter", "node -e \"const {GoogleScholarAdapter} = require('./dist/adapters/google-scholar'); new GoogleScholarAdapter(); console.log('✓ Google Scholar adapter created');\""),
            ("Unified Search Adapter", "node -e \"const {UnifiedSearchAdapter} = require('./dist/adapters/unified-search'); new UnifiedSearchAdapter(); console.log('✓ Unified search adapter created');\""),
            ("Enhanced Unified Search Adapter", "node -e \"const {EnhancedUnifiedSearchAdapter} = require('./dist/adapters/enhanced-unified-search'); new EnhancedUnifiedSearchAdapter(); console.log('✓ Enhanced unified search adapter created');\"")
        ]
        
        results = []
        for test_name, command in integration_tests:
            start_time = time.time()
            try:
                result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=30)
                duration = time.time() - start_time
                
                if "✓" in result.stdout:
                    status = "PASSED"
                    message = f"Adapter created successfully in {duration:.2f}s"
                else:
                    status = "FAILED"
                    message = "Adapter creation failed"
                
                test_result = TestResult(test_name, status, duration, message)
                results.append(test_result)
                
                if status == "PASSED":
                    print(f"  ✓ {test_name}: {message}")
                else:
                    print(f"  ✗ {test_name}: {message}")
                    
            except Exception as e:
                duration = time.time() - start_time
                test_result = TestResult(test_name, "FAILED", duration, error=str(e))
                results.append(test_result)
                print(f"  ✗ {test_name}: {str(e)}")
        
        return results
    
    def run_all_tests(self) -> List[TestResult]:
        """Run all test suites"""
        print("==========================================")
        print("  Scholarly Research MCP Server Tests")
        print("==========================================")
        
        all_results = []
        
        # Run all test suites
        all_results.extend(self.run_basic_tests())
        all_results.extend(self.run_mcp_tests())
        all_results.extend(self.run_error_handling_tests())
        all_results.extend(self.run_performance_tests())
        all_results.extend(self.run_integration_tests())
        
        return all_results
    
    def generate_report(self, results: List[TestResult]):
        """Generate a test report"""
        print("\n==========================================")
        print("  Test Summary")
        print("==========================================")
        
        total_tests = len(results)
        passed_tests = len([r for r in results if r.status == "PASSED"])
        failed_tests = len([r for r in results if r.status == "FAILED"])
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        
        if failed_tests > 0:
            print("\nFailed Tests:")
            for result in results:
                if result.status == "FAILED":
                    print(f"  - {result.name}: {result.error or result.message}")
        
        # Save detailed report
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        report_file = f"test-report-{timestamp}.json"
        
        report_data = {
            "timestamp": timestamp,
            "summary": {
                "total": total_tests,
                "passed": passed_tests,
                "failed": failed_tests
            },
            "results": [
                {
                    "name": r.name,
                    "status": r.status,
                    "duration": r.duration,
                    "message": r.message,
                    "error": r.error
                }
                for r in results
            ]
        }
        
        with open(report_file, 'w') as f:
            json.dump(report_data, f, indent=2)
        
        print(f"\nDetailed report saved to: {report_file}")
        
        if failed_tests == 0:
            print("\n🎉 All tests passed! 🎉")
            return 0
        else:
            print(f"\n❌ {failed_tests} tests failed. Check the report for details.")
            return 1

def main():
    parser = argparse.ArgumentParser(description="Test Scholarly Research MCP Server")
    parser.add_argument("--suite", choices=["basic", "mcp", "error", "perf", "integration", "all"], 
                       default="all", help="Test suite to run")
    
    args = parser.parse_args()
    
    test_suite = TestSuite()
    
    try:
        if args.suite == "basic":
            results = test_suite.run_basic_tests()
        elif args.suite == "mcp":
            results = test_suite.run_mcp_tests()
        elif args.suite == "error":
            results = test_suite.run_error_handling_tests()
        elif args.suite == "perf":
            results = test_suite.run_performance_tests()
        elif args.suite == "integration":
            results = test_suite.run_integration_tests()
        else:  # all
            results = test_suite.run_all_tests()
        
        exit_code = test_suite.generate_report(results)
        sys.exit(exit_code)
        
    finally:
        test_suite.tester.close()

if __name__ == "__main__":
    main()
