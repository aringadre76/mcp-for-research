#!/bin/bash

# Scholarly Research MCP Server - Simple Test Suite
# Tests basic functionality without complex pattern matching

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a simple test
run_simple_test() {
    local test_name="$1"
    local test_command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "\n${BLUE}Testing: ${test_name}${NC}"
    
    if eval "$test_command" >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓ PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "  ${RED}✗ FAILED${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Function to test basic functionality
test_basic_functionality() {
    echo -e "\n${YELLOW}=== Testing Basic Functionality ===${NC}"
    
    # Test if the server builds
    run_simple_test "Build Server" "npm run build"
    
    # Test if tests can run
    run_simple_test "Run Google Scholar Tests" "npm run test:google-scholar-simple"
    run_simple_test "Run Unified Search Tests" "npm run test:unified"
    run_simple_test "Run Firecrawl Tests" "npm run test:firecrawl"
}

# Function to test adapters
test_adapters() {
    echo -e "\n${YELLOW}=== Testing Adapters ===${NC}"
    
    # Test that all adapters can be instantiated
    run_simple_test "PubMed Adapter Creation" "node -e \"const {PubMedAdapter} = require('./dist/adapters/pubmed'); new PubMedAdapter(); console.log('✓ PubMed adapter created');\""
    
    run_simple_test "Google Scholar Adapter Creation" "node -e \"const {GoogleScholarAdapter} = require('./dist/adapters/google-scholar'); new GoogleScholarAdapter(); console.log('✓ Google Scholar adapter created');\""
    
    run_simple_test "Unified Search Adapter Creation" "node -e \"const {UnifiedSearchAdapter} = require('./dist/adapters/unified-search'); new UnifiedSearchAdapter(); console.log('✓ Unified search adapter created');\""
    
    run_simple_test "Enhanced Unified Search Adapter Creation" "node -e \"const {EnhancedUnifiedSearchAdapter} = require('./dist/adapters/enhanced-unified-search'); new EnhancedUnifiedSearchAdapter(); console.log('✓ Enhanced unified search adapter created');\""
}

# Function to test data validation
test_data_validation() {
    echo -e "\n${YELLOW}=== Testing Data Validation ===${NC}"
    
    # Test that the built files exist
    run_simple_test "Check dist/index.js exists" "test -f dist/index.js"
    run_simple_test "Check PubMed adapter exists" "test -f dist/adapters/pubmed.js"
    run_simple_test "Check Google Scholar adapter exists" "test -f dist/adapters/google-scholar.js"
    run_simple_test "Check Unified Search adapter exists" "test -f dist/adapters/unified-search.js"
    run_simple_test "Check Enhanced Unified Search adapter exists" "test -f dist/adapters/enhanced-unified-search.js"
}

# Function to run all tests
run_all_tests() {
    echo -e "${BLUE}==========================================${NC}"
    echo -e "${BLUE}  Scholarly Research MCP Server Tests${NC}"
    echo -e "${BLUE}==========================================${NC}"
    
    test_basic_functionality
    test_adapters
    test_data_validation
    
    # Print summary
    echo -e "\n${YELLOW}==========================================${NC}"
    echo -e "${YELLOW}  Test Summary${NC}"
    echo -e "${YELLOW}==========================================${NC}"
    echo -e "Total Tests: ${TOTAL_TESTS}"
    echo -e "${GREEN}Passed: ${PASSED_TESTS}${NC}"
    echo -e "${RED}Failed: ${FAILED_TESTS}${NC}"
    
    if [[ $FAILED_TESTS -eq 0 ]]; then
        echo -e "\n${GREEN}🎉 All tests passed! 🎉${NC}"
        exit 0
    else
        echo -e "\n${RED}❌ Some tests failed.${NC}"
        exit 1
    fi
}

# Function to show help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --help, -h     Show this help message"
    echo "  --basic        Run only basic functionality tests"
    echo "  --adapters     Run only adapter tests"
    echo "  --data         Run only data validation tests"
    echo "  --all          Run all tests (default)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run all tests"
    echo "  $0 --basic           # Run only basic tests"
    echo "  $0 --adapters --data # Run adapter and data tests"
}

# Main execution
case "${1:---all}" in
    --help|-h)
        show_help
        exit 0
        ;;
    --basic)
        test_basic_functionality
        ;;
    --adapters)
        test_adapters
        ;;
    --data)
        test_data_validation
        ;;
    --all)
        run_all_tests
        ;;
    *)
        echo "Unknown option: $1"
        show_help
        exit 1
        ;;
esac

# Print summary for partial test runs
if [[ "$1" != "--all" ]]; then
    echo -e "\n${YELLOW}==========================================${NC}"
    echo -e "${YELLOW}  Partial Test Summary${NC}"
    echo -e "${YELLOW}==========================================${NC}"
    echo -e "Total Tests: ${TOTAL_TESTS}"
    echo -e "${GREEN}Passed: ${PASSED_TESTS}${NC}"
    echo -e "${RED}Failed: ${FAILED_TESTS}${NC}"
    
    if [[ $FAILED_TESTS -eq 0 ]]; then
        echo -e "\n${GREEN}✓ All selected tests passed!${NC}"
    else
        echo -e "\n${RED}✗ Some selected tests failed.${NC}"
    fi
fi
