# Changelog

All notable changes to the Scholarly Research MCP Server project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/latest/),
and this project follows standard release practices.

## [Unreleased]

### Planned
- JSTOR integration
- Enhanced analytics and insights
- Performance optimization
- Additional data source adapters

## Recent Releases

### Latest Release - 2024-12-19

#### Added
- **Google Scholar Integration**: Full web scraping support for Google Scholar search and paper details
- **Firecrawl MCP Integration**: Professional web scraping service for enhanced reliability
- **Unified Search Interface**: Combined search across PubMed and Google Scholar with deduplication
- **Enhanced Citation Tracking**: Google Scholar citation counts and related paper discovery
- **Multi-Source Paper Retrieval**: Access papers from both PubMed and Google Scholar simultaneously
- **Advanced Sorting Options**: Sort by relevance, date, or citation count across all sources
- **Dual Scraping Methods**: Choose between Firecrawl (recommended) and Puppeteer with automatic fallback
- **Comprehensive Test Suites**: Bash, Python, and JavaScript test runners with 13/13 tests passing
- **Enhanced MCP Tools**: 16 comprehensive tools for scholarly research

#### Changed
- **Enhanced Unified Search**: Improved adapter with configurable scraping preferences
- **Better Error Handling**: Automatic fallback between scraping methods
- **Improved Documentation**: Comprehensive README and project structure documentation
- **Test Coverage**: Expanded testing to cover all new functionality

#### Dependencies
- Added Puppeteer for Google Scholar web scraping
- Added Cheerio for HTML parsing
- Added TypeScript types for Puppeteer and Cheerio

#### Technical
- **Node.js Compatibility**: Ensured compatibility with Node.js 18+
- **Type Safety**: Enhanced TypeScript definitions and type checking
- **Build Process**: Improved TypeScript compilation and bundling
- **Package Structure**: Optimized NPM package contents and exclusions

### Previous Release - 2024-12-18

#### Fixed
- **PMC URL Issues**: Corrected PubMed Central URL handling for reliable full-text access
- **Enhanced Full Text Retrieval**: Increased default text length from 5,000 to 50,000 characters
- **Improved Section Extraction**: Better algorithms for identifying and organizing paper sections
- **Dual URL Support**: Now supports both PMCID and PMID formats for accessing papers
- **Better Content Processing**: Enhanced HTML cleaning and text extraction from PMC sources

#### Changed
- **Default Text Length**: Increased from 5,000 to 50,000 characters for better content coverage
- **URL Handling**: Improved fallback logic between PMCID and PMID access methods
- **Content Processing**: Enhanced HTML cleaning and text extraction algorithms

#### Technical
- **Error Handling**: Better fallback mechanisms for URL resolution
- **Content Extraction**: Improved algorithms for section detection and organization
- **Performance**: Optimized content processing and text extraction

### Earlier Releases

#### Initial Release - 2024-12-15
- **Basic PubMed Integration**: Search and fetch papers using NCBI's E-utilities API
- **MCP Server Framework**: Model Context Protocol server implementation
- **TypeScript Support**: Full TypeScript implementation with type definitions
- **Full Text Extraction**: Access to complete paper content when available
- **Section Analysis**: Extract and organize paper sections (Introduction, Methods, Results, etc.)
- **Evidence Mining**: Find specific quotes, statistics, findings, and conclusions
- **Content Search**: Search within papers for specific terms and phrases
- **Citation Support**: Generate citations in various formats (BibTeX, EndNote, APA, MLA)
- **Rate Limiting**: Built-in rate limiting to respect API constraints

#### Technical
- **MCP Protocol**: Standard interface for AI assistants and tools
- **PubMed Integration**: NCBI E-utilities API integration
- **PMC Support**: Direct access to PubMed Central full-text articles
- **TypeScript**: Full TypeScript support with strict type checking
- **Project Structure**: Initial project setup and configuration
- **Build System**: TypeScript compilation and bundling
- **Dependencies**: Core MCP SDK and utility libraries

---

## Release History Summary

| Date | Major Features | Status |
|------|----------------|---------|
| 2024-12-19 | Google Scholar, Firecrawl, Unified Search | Released |
| 2024-12-18 | PMC URL fixes, Enhanced text extraction | Released |
| 2024-12-17 | Initial PubMed integration, MCP server | Released |
| 2024-12-16 | Basic framework, TypeScript support | Released |
| 2024-12-15 | Project initialization | Released |

## Migration Guide

### Upgrading from Previous Releases

The latest release introduces significant new functionality:

1. **New Dependencies**: Ensure Node.js 18+ and install new packages
2. **Google Scholar**: New scraping capabilities require Puppeteer dependencies
3. **Enhanced Search**: New unified search interface with multiple sources
4. **Test Suites**: Comprehensive testing framework for validation

### Breaking Changes

- **Current Release**: Latest release
- **LTS Release**: Latest release (Long-term support)
- **End of Life**: No releases currently end-of-life
- **Security Updates**: All releases receive security updates

## Support

For detailed information about specific releases or migration assistance, please open an issue on GitHub.
