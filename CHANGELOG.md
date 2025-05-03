# Changelog

## Version 0.6 - Extension Refactoring and Keyboard Shortcut Fixes

### Major Changes

1. **Refactored Code Structure**
   - Created a proper module system with clear separation of concerns
   - Moved utility functions into dedicated modules in utils/common/
   - Improved error handling across the codebase

2. **Fixed Command+X (Custom Title) Functionality**
   - Simplified the toggle logic for custom title mode
   - Improved state tracking using storage-based approach
   - Removed unnecessary storage checks for faster popup opening
   - Added direct detection of custom title mode

3. **Fixed Command+Shift+P (Close Popup) Functionality**
   - Implemented multiple robust methods to ensure popup closes properly
   - Added global keyboard event listener in popup.js
   - Added background script support for closing popup
   - Fixed key detection issues (case sensitivity)

4. **Improved State Management**
   - Created a unified stateManager module for consistent state handling
   - Added reliable methods to check custom title mode
   - Removed direct manipulation of global variables for state tracking

5. **Performance Optimizations**
   - Reduced latency in Command+X operation
   - Implemented proper async/await patterns for cleaner code
   - Improved error handling and user feedback

### Module Breakdown

- **window_utils.js**: Handles popup opening/closing and keyboard shortcuts
- **storage_utils.js**: Manages all state and storage operations
- **notification_utils.js**: Handles UI notifications and updates
- **error_utils.js**: Provides consistent error handling

### Technical Improvements

- Updated manifest to support ES modules
- Converted callback-based code to cleaner Promise/async-await patterns
- Added better error messages and handling
- Improved keyboard shortcut reliability

### Known Issues

- None currently identified. All keyboard shortcuts should now function properly. 