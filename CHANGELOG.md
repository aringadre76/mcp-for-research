# Changelog

All notable changes to the Scholarly Research MCP Server project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- JSTOR integration
- Enhanced analytics and insights
- Performance optimization
- Additional data source adapters

## [1.4.0] - 2024-12-19

### Added
- **Google Scholar Integration**: Full web scraping support for Google Scholar search and paper details
- **Firecrawl MCP Integration**: Professional web scraping service for enhanced reliability
- **Unified Search Interface**: Combined search across PubMed and Google Scholar with deduplication
- **Enhanced Citation Tracking**: Google Scholar citation counts and related paper discovery
- **Multi-Source Paper Retrieval**: Access papers from both PubMed and Google Scholar simultaneously
- **Advanced Sorting Options**: Sort by relevance, date, or citation count across all sources
- **Dual Scraping Methods**: Choose between Firecrawl (recommended) and Puppeteer with automatic fallback
- **Comprehensive Test Suites**: Bash, Python, and JavaScript test runners with 13/13 tests passing
- **Enhanced MCP Tools**: 16 comprehensive tools for scholarly research

### Changed
- **Enhanced Unified Search**: Improved adapter with configurable scraping preferences
- **Better Error Handling**: Automatic fallback between scraping methods
- **Improved Documentation**: Comprehensive README and project structure documentation
- **Test Coverage**: Expanded testing to cover all new functionality

### Dependencies
- Added `puppeteer@19.11.1` for Google Scholar web scraping
- Added `cheerio@1.0.0-rc.12` for HTML parsing
- Added `@types/puppeteer` and `@types/cheerio` for TypeScript support

### Technical
- **Node.js Compatibility**: Ensured compatibility with Node.js 18+
- **Type Safety**: Enhanced TypeScript definitions and type checking
- **Build Process**: Improved TypeScript compilation and bundling
- **Package Structure**: Optimized NPM package contents and exclusions

## [1.3.0] - 2024-12-18

### Fixed
- **PMC URL Issues**: Corrected PubMed Central URL handling for reliable full-text access
- **Enhanced Full Text Retrieval**: Increased default text length from 5,000 to 50,000 characters
- **Improved Section Extraction**: Better algorithms for identifying and organizing paper sections
- **Dual URL Support**: Now supports both PMCID and PMID formats for accessing papers
- **Better Content Processing**: Enhanced HTML cleaning and text extraction from PMC sources

### Changed
- **Default Text Length**: Increased from 5,000 to 50,000 characters for better content coverage
- **URL Handling**: Improved fallback logic between PMCID and PMID access methods
- **Content Processing**: Enhanced HTML cleaning and text extraction algorithms

### Technical
- **Error Handling**: Better fallback mechanisms for URL resolution
- **Content Extraction**: Improved algorithms for section detection and organization
- **Performance**: Optimized content processing and text extraction

## [1.2.3] - 2024-12-17

### Added
- **Initial Release**: Basic PubMed integration with MCP server
- **Full Text Extraction**: Access to complete paper content when available
- **Section Analysis**: Extract and organize paper sections (Introduction, Methods, Results, etc.)
- **Evidence Mining**: Find specific quotes, statistics, findings, and conclusions
- **Content Search**: Search within papers for specific terms and phrases
- **Citation Support**: Generate citations in various formats (BibTeX, EndNote, APA, MLA)
- **Rate Limiting**: Built-in rate limiting to respect API constraints

### Technical
- **MCP Protocol**: Standard interface for AI assistants and tools
- **PubMed Integration**: NCBI E-utilities API integration
- **PMC Support**: Direct access to PubMed Central full-text articles
- **TypeScript**: Full TypeScript support with strict type checking

## [1.2.0] - 2024-12-16

### Added
- **Basic PubMed Integration**: Search and fetch papers using NCBI's E-utilities API
- **MCP Server Framework**: Model Context Protocol server implementation
- **TypeScript Support**: Full TypeScript implementation with type definitions

### Technical
- **Project Structure**: Initial project setup and configuration
- **Build System**: TypeScript compilation and bundling
- **Dependencies**: Core MCP SDK and utility libraries

## [1.0.0] - 2024-12-15

### Added
- **Project Initialization**: Initial repository setup and structure
- **Basic Configuration**: Package.json, TypeScript config, and project files
- **Documentation**: Initial README and project documentation

---

## Version History Summary

| Version | Date | Major Features | Status |
|---------|------|----------------|---------|
| 1.4.0 | 2024-12-19 | Google Scholar, Firecrawl, Unified Search | ✅ Released |
| 1.3.0 | 2024-12-18 | PMC URL fixes, Enhanced text extraction | ✅ Released |
| 1.2.3 | 2024-12-17 | Initial PubMed integration, MCP server | ✅ Released |
| 1.2.0 | 2024-12-16 | Basic framework, TypeScript support | ✅ Released |
| 1.0.0 | 2024-12-15 | Project initialization | ✅ Released |

## Migration Guide

### Upgrading from 1.3.x to 1.4.0

The 1.4.0 release introduces significant new functionality:

1. **New Dependencies**: Ensure Node.js 18+ and install new packages
2. **Google Scholar**: New scraping capabilities require Puppeteer dependencies
3. **Enhanced Search**: New unified search interface with multiple sources
4. **Test Suites**: Comprehensive testing framework for validation

### Upgrading from 1.2.x to 1.3.0

The 1.3.0 release focuses on stability and improvements:

1. **URL Handling**: Improved PMC access with better fallback logic
2. **Content Processing**: Enhanced text extraction and section detection
3. **Performance**: Better algorithms for content processing

### Upgrading from 1.0.x to 1.2.x

The 1.2.x releases introduce core functionality:

1. **PubMed Integration**: Full NCBI E-utilities API support
2. **MCP Server**: Complete Model Context Protocol implementation
3. **TypeScript**: Full type safety and modern JavaScript features

## Breaking Changes

### Version 1.4.0
- **New Dependencies**: Added Puppeteer and Cheerio requirements
- **Node.js Version**: Minimum Node.js 18+ required
- **API Changes**: Enhanced unified search interface

### Version 1.3.0
- **URL Changes**: PMC URL handling improvements
- **Text Length**: Default text length increased to 50,000 characters

### Version 1.2.x
- **Initial Release**: No breaking changes from previous versions

## Deprecation Notices

### Version 1.4.0
- **Basic Unified Search**: The basic unified search adapter is superseded by the enhanced version
- **Direct Google Scholar**: Direct Puppeteer usage is replaced by configurable Firecrawl integration

## Support

- **Current Version**: 1.4.0
- **LTS Version**: 1.4.0 (Long-term support)
- **End of Life**: No versions currently end-of-life
- **Security Updates**: All versions receive security updates

---

For detailed information about each release, see the [GitHub releases page](https://github.com/aringadre76/mcp-for-research/releases).
