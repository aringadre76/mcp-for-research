#!/bin/bash

echo "Running ArXiv Integration Tests..."
echo "=================================="

# Build the project first
echo "1. Building project..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi
echo "✅ Build successful"

# Test build integrity
echo -e "\n2. Testing build integrity..."
npm run test:build
if [ $? -ne 0 ]; then
    echo "❌ Build test failed!"
    exit 1
fi
echo "✅ Build test passed"

# Test basic ArXiv adapter
echo -e "\n3. Testing basic ArXiv adapter..."
npm run test:arxiv
if [ $? -ne 0 ]; then
    echo "❌ Basic ArXiv adapter test failed!"
    exit 1
fi
echo "✅ Basic ArXiv adapter test passed"

# Test unified search with ArXiv
echo -e "\n4. Testing unified search with ArXiv..."
npm run test:unified-arxiv
if [ $? -ne 0 ]; then
    echo "❌ Unified search with ArXiv test failed!"
    exit 1
fi
echo "✅ Unified search with ArXiv test passed"

# Test Firecrawl with ArXiv
echo -e "\n5. Testing Firecrawl with ArXiv..."
npm run test:firecrawl-arxiv
if [ $? -ne 0 ]; then
    echo "❌ Firecrawl with ArXiv test failed!"
    exit 1
fi
echo "✅ Firecrawl with ArXiv test passed"

# Test comprehensive ArXiv functionality
echo -e "\n6. Testing comprehensive ArXiv functionality..."
npm run test:arxiv-comprehensive
if [ $? -ne 0 ]; then
    echo "❌ Comprehensive ArXiv test failed!"
    exit 1
fi
echo "✅ Comprehensive ArXiv test passed"

# Test simple ArXiv functionality
echo -e "\n7. Testing simple ArXiv functionality..."
npm run test:arxiv-simple
if [ $? -ne 0 ]; then
    echo "❌ Simple ArXiv test failed!"
    exit 1
fi
echo "✅ Simple ArXiv test passed"

echo -e "\n🎉 All ArXiv integration tests passed!"
echo -e "\nSummary:"
echo "- ✅ Build and build tests"
echo "- ✅ Basic ArXiv adapter"
echo "- ✅ Unified search integration"
echo "- ✅ Firecrawl integration"
echo "- ✅ Comprehensive functionality"
echo "- ✅ Simple functionality"
echo -e "\nArXiv integration is working correctly!"
