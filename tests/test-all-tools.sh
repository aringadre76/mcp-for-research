#!/bin/bash

# Scholarly Research MCP Server - Comprehensive Tool Test Suite
# Tests all available MCP tools and validates their functionality

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

# Test results log
LOG_FILE="test-results-$(date +%Y%m%d-%H%M%S).log"
echo "Scholarly Research MCP Server - Test Results" > "$LOG_FILE"
echo "Generated: $(date)" >> "$LOG_FILE"
echo "==========================================" >> "$LOG_FILE"

# Function to log test results
log_test() {
    local test_name="$1"
    local status="$2"
    local message="$3"
    
    echo -e "${test_name}: ${status}" >> "$LOG_FILE"
    if [[ -n "$message" ]]; then
        echo "  ${message}" >> "$LOG_FILE"
    fi
}

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "\n${BLUE}Testing: ${test_name}${NC}"
    
    if eval "$test_command" 2>/dev/null | grep -q "$expected_pattern"; then
        echo -e "  ${GREEN}✓ PASSED${NC}"
        log_test "$test_name" "PASSED"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "  ${RED}✗ FAILED${NC}"
        log_test "$test_name" "FAILED" "Expected pattern: $expected_pattern"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Function to test MCP tool with JSON input
test_mcp_tool() {
    local tool_name="$1"
    local json_input="$2"
    local expected_pattern="$3"
    
    local test_name="MCP Tool: $tool_name"
    local test_command="echo '$json_input' | node scripts/test-mcp-tool.js $tool_name"
    
    run_test "$test_name" "$test_command" "$expected_pattern"
}

# Function to test basic functionality
test_basic_functionality() {
    echo -e "\n${YELLOW}=== Testing Basic Functionality ===${NC}"
    
    # Test if the server builds
    run_test "Build Server" "npm run build" "npm ERR"
    
    # Test if tests can run
    run_test "Run Google Scholar Tests" "npm run test:google-scholar-simple" "All basic tests passed"
    run_test "Run Unified Search Tests" "npm run test:unified" "Test completed"
    run_test "Run Firecrawl Tests" "npm run test:firecrawl" "All Firecrawl integration tests passed"
}

# Function to test MCP tools
test_mcp_tools() {
    echo -e "\n${YELLOW}=== Testing MCP Tools ===${NC}"
    
    # Test search_papers tool
    test_mcp_tool "search_papers" '{"query": "machine learning", "maxResults": 3}' "Found.*papers"
    
    # Test get_paper_by_id tool
    test_mcp_tool "get_paper_by_id" '{"pmid": "33844136"}' "Paper Details"
    
    # Test get_paper_details tool
    test_mcp_tool "get_paper_details" '{"pmid": "33844136"}' "Paper Details"
    
    # Test get_full_text tool
    test_mcp_tool "get_full_text" '{"pmid": "33844136", "maxLength": 1000}' "Full Text Content"
    
    # Test extract_paper_sections tool
    test_mcp_tool "extract_paper_sections" '{"pmid": "33844136"}' "Paper Sections"
    
    # Test search_within_paper tool
    test_mcp_tool "search_within_paper" '{"pmid": "33844136", "searchTerm": "machine learning"}' "Search Results"
    
    # Test get_evidence_quotes tool
    test_mcp_tool "get_evidence_quotes" '{"pmid": "33844136", "evidenceType": "findings"}' "Evidence and Quotes"
    
    # Test get_citation tool
    test_mcp_tool "get_citation" '{"pmid": "33844136", "format": "bibtex"}' "Citation in BIBTEX format"
    
    # Test get_citation_count tool
    test_mcp_tool "get_citation_count" '{"pmid": "33844136"}' "Citation Count"
    
    # Test search_google_scholar tool
    test_mcp_tool "search_google_scholar" '{"query": "deep learning", "maxResults": 3}' "Found.*papers on Google Scholar"
    
    # Test search_all_sources tool
    test_mcp_tool "search_all_sources" '{"query": "artificial intelligence", "maxResults": 5}' "Found.*papers across all sources"
    
    # Test get_google_scholar_citations tool
    test_mcp_tool "get_google_scholar_citations" '{"title": "Attention Is All You Need"}' "Google Scholar Citation Count"
    
    # Test get_related_papers tool
    test_mcp_tool "get_related_papers" '{"identifier": "33844136", "source": "pubmed", "maxResults": 3}' "Related Papers from pubmed"
    
    # Test search_with_firecrawl tool
    test_mcp_tool "search_with_firecrawl" '{"query": "neural networks", "maxResults": 5, "preferFirecrawl": true}' "Enhanced Search Results"
    
    # Test set_firecrawl_preference tool
    test_mcp_tool "set_firecrawl_preference" '{"preferFirecrawl": true}' "Firecrawl Preference Updated"
    
    # Test get_search_method_info tool
    test_mcp_tool "get_search_method_info" '{}' "Search Method Information"
}

# Function to test error handling
test_error_handling() {
    echo -e "\n${YELLOW}=== Testing Error Handling ===${NC}"
    
    # Test invalid PMID
    test_mcp_tool "get_paper_by_id" '{"pmid": "invalid"}' "No paper found"
    
    # Test invalid search query
    test_mcp_tool "search_papers" '{"query": "", "maxResults": 5}' "Error searching papers"
    
    # Test invalid citation format
    test_mcp_tool "get_citation" '{"pmid": "33844136", "format": "invalid"}' "Error generating citation"
}

# Function to test performance
test_performance() {
    echo -e "\n${YELLOW}=== Testing Performance ===${NC}"
    
    # Test search response time
    local start_time=$(date +%s.%N)
    if echo '{"query": "test", "maxResults": 1}' | node scripts/test-mcp-tool.js search_papers >/dev/null 2>&1; then
        local end_time=$(date +%s.%N)
        local duration=$(echo "$end_time - $start_time" | bc -l)
        
        if (( $(echo "$duration < 5.0" | bc -l) )); then
            echo -e "  ${GREEN}✓ Performance Test PASSED (${duration}s)${NC}"
            log_test "Performance Test" "PASSED" "Response time: ${duration}s"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "  ${RED}✗ Performance Test FAILED (${duration}s)${NC}"
            log_test "Performance Test" "FAILED" "Response time: ${duration}s (expected < 5s)"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
    else
        echo -e "  ${RED}✗ Performance Test FAILED (tool execution failed)${NC}"
        log_test "Performance Test" "FAILED" "Tool execution failed"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
    fi
}

# Function to test data validation
test_data_validation() {
    echo -e "\n${YELLOW}=== Testing Data Validation ===${NC}"
    
    # Test that search results contain required fields
    local search_output=$(echo '{"query": "machine learning", "maxResults": 1}' | node scripts/test-mcp-tool.js search_papers 2>/dev/null)
    
    if echo "$search_output" | grep -q "title\|authors\|journal\|publicationDate"; then
        echo -e "  ${GREEN}✓ Data Validation PASSED${NC}"
        log_test "Data Validation" "PASSED"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "  ${RED}✗ Data Validation FAILED${NC}"
        log_test "Data Validation" "FAILED" "Missing required fields in search results"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Function to test integration
test_integration() {
    echo -e "\n${YELLOW}=== Testing Integration ===${NC}"
    
    # Test that all adapters can be instantiated
    run_test "PubMed Adapter Creation" "node -e \"const {PubMedAdapter} = require('./dist/adapters/pubmed'); new PubMedAdapter(); console.log('✓ PubMed adapter created');\"" "✓ PubMed adapter created"
    
    run_test "Google Scholar Adapter Creation" "node -e \"const {GoogleScholarAdapter} = require('./dist/adapters/google-scholar'); new GoogleScholarAdapter(); console.log('✓ Google Scholar adapter created');\"" "✓ Google Scholar adapter created"
    
    run_test "Unified Search Adapter Creation" "node -e \"const {UnifiedSearchAdapter} = require('./dist/adapters/unified-search'); new UnifiedSearchAdapter(); console.log('✓ Unified search adapter created');\"" "✓ Unified search adapter created"
    
    run_test "Enhanced Unified Search Adapter Creation" "node -e \"const {EnhancedUnifiedSearchAdapter} = require('./dist/adapters/enhanced-unified-search'); new EnhancedUnifiedSearchAdapter(); console.log('✓ Enhanced unified search adapter created');\"" "✓ Enhanced unified search adapter created"
}

# Function to run all tests
run_all_tests() {
    echo -e "${BLUE}==========================================${NC}"
    echo -e "${BLUE}  Scholarly Research MCP Server Tests${NC}"
    echo -e "${BLUE}==========================================${NC}"
    
    test_basic_functionality
    test_mcp_tools
    test_error_handling
    test_performance
    test_data_validation
    test_integration
    
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
        echo -e "\n${RED}❌ Some tests failed. Check the log: $LOG_FILE${NC}"
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
    echo "  --mcp          Run only MCP tool tests"
    echo "  --error        Run only error handling tests"
    echo "  --perf         Run only performance tests"
    echo "  --data         Run only data validation tests"
    echo "  --integration  Run only integration tests"
    echo "  --all          Run all tests (default)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run all tests"
    echo "  $0 --basic           # Run only basic tests"
    echo "  $0 --mcp --error     # Run MCP and error tests"
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
    --mcp)
        test_mcp_tools
        ;;
    --error)
        test_error_handling
        ;;
    --perf)
        test_performance
        ;;
    --data)
        test_data_validation
        ;;
    --integration)
        test_integration
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
