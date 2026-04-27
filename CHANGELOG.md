# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

#### API & Backend
- **REST APIs**: Comprehensive REST API endpoints for vendors, bills, and reference data (subsidiaries, accounts, payment-terms)
  - Vendors: list, detail, create, update operations
  - Bills: list, detail, create, update operations with ERP reference tracking
  - Reference data: read-only endpoints for subsidiaries, accounts, payment-terms
- **Bill Status Transitions**: Dedicated endpoints for approve, cancel, and post-to-ERP workflows
- **Server Infrastructure**: Supabase client setup with API key authentication
- **API Security**: Server-only guards, fail-fast auth validation, hardened error handling (NaN guards, proper 404 vs 500 responses, JSON parse guards)
- **Test Infrastructure**: Vitest configuration with server-only mocks and Supabase test helpers

#### Frontend Features
- **Edit Pages**: New edit pages for vendors, bills, and subsidiaries
  - Load data from backend
  - Pre-populate forms with existing values (including line items for bills)
  - Update via API with validation
- **Navigation**: Smart redirects for edit page routing

#### Business Logic
- **Bill Posting Constraint**: Restrict bill posting to Open status only, enforcing approve-first workflow
- **API Filtering**: Fixed filter ordering (before range filter) in bill list queries
- **Status Management**: Proper status stripping on bill creation and inactive account filtering

### Fixed
- Bill status handling in PATCH operations (PGRST116 error handling)
- Bill creation properly strips invalid status field
- Reference data filtering for inactive items

### Tests
- **API Tests**: Full coverage for vendors, bills, and auth routes
- **Auth Tests**: Unit tests for API authentication logic (P0 priority)
- **Bill State Machine**: Tests for approve, cancel, and post-to-ERP transitions (P0 priority)
- **Reference Data**: Tests for all reference data endpoints

### Documentation
- Vendor edit page design specification
- Vendor edit page implementation plan
- Bill and subsidiary edit page implementation plan
- Session context and memory setup for development continuity
